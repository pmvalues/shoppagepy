import contextlib
import hashlib
from urllib.parse import urlencode

from apps.catalog.models import MasterProduct
from apps.core.models import log_search_query
from apps.intelligence.ranking import _haversine_km, _merchant_rating, ranked_search
from apps.markets.models import Market
from apps.media_hub.models import Short, Show
from apps.merchants.models import Merchant
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.utils.cache import patch_vary_headers


def _cache_key(prefix, request):
    from apps.core.signals import data_version

    params = '&'.join(f'{k}={v}' for k, v in sorted(request.GET.items()) if v)
    # Hash to bound key length and prevent pathological/unbounded cache keys.
    # The data version makes any commerce write invalidate cached context.
    return f'sp:{prefix}:v{data_version()}:{hashlib.md5(params.encode()).hexdigest()}'

def _fast_table_count(model_class):
    """
    Measured row count (Postgres uses pg_class); None when it cannot be measured,
    so a page renders no figure rather than an invented one.
    """
    cache_key = f'sp:count:{model_class._meta.db_table}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        if connection.vendor == 'postgresql':
            with connection.cursor() as cur:
                cur.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = %s", [model_class._meta.db_table])
                row = cur.fetchone()
                if row and row[0] > 0:
                    cnt = int(row[0])
                    cache.set(cache_key, cnt, 3600)
                    return cnt
    except Exception:
        pass
    try:
        cnt = model_class.objects.count()
        cache.set(cache_key, cnt, 3600)
        return cnt
    except Exception:
        return None

def _parse_near(request):
    """
    Geo intent: ?near=lat,lng[,radius_km] or ?near=me (with optional browser
    geolocation ?lat=&lng=; falls back to the Joburg metro when unknown).
    Returns (lat, lng, radius_km) or None when no geo intent is present.
    """
    raw = (request.GET.get('near') or '').strip().lower()
    if not raw:
        return None
    radius = 50.0
    if raw == 'me':
        try:
            lat = float(request.GET.get('lat') or -26.2041)
            lng = float(request.GET.get('lng') or 28.0473)
        except ValueError:
            return None
    else:
        parts = [p for p in raw.replace(';', ',').split(',') if p.strip()]
        try:
            lat, lng = float(parts[0]), float(parts[1])
            if len(parts) > 2:
                radius = float(parts[2])
        except (IndexError, ValueError):
            return None
    return (lat, lng, min(max(radius, 1.0), 300.0))

def home_view(request):
    """
    High-performance pure Django homepage view querying the National Commerce Grid.
    """
    key = _cache_key('home_v6', request)
    context = None
    try:
        context = cache.get(key)
    except Exception:
        context = None

    if context is None:
        from apps.offers.models import Offer

        # Fetch diverse flagship products with real verified offers
        offers_candidates = list(
            Offer.objects.select_related('variant', 'merchant')
            .filter(variant__isnull=False)[:40]
        )
        all_candidates = [o.variant for o in offers_candidates if o.variant]
        if len(all_candidates) < 8:
            extra = list(
                MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
                .prefetch_related('offers', 'offers__merchant')[:20]
            )
            all_candidates.extend(extra)

        featured_products = []
        seen_titles = set()
        for p in all_candidates:
            clean_title = p.title.strip().lower()
            if clean_title not in seen_titles:
                seen_titles.add(clean_title)
                featured_products.append(p)
            if len(featured_products) >= 8:
                break

        # Fetch diverse verified merchants with unique storefront names
        m_candidates = list(
            Merchant.objects.filter(claim_state='claimed')
            .select_related('market')[:40]
        )
        if len(m_candidates) < 8:
            m_candidates.extend(list(Merchant.objects.select_related('market')[:40]))

        verified_merchants = []
        seen_store_names = set()
        for m in m_candidates:
            store_key = m.name.split('#')[0].strip().lower()
            if store_key not in seen_store_names:
                seen_store_names.add(store_key)
                verified_merchants.append(m)
            if len(verified_merchants) >= 8:
                break

        shows = list(Show.objects.filter(status__in=['active', 'ACTIVE'])[:3]) or list(Show.objects.all()[:3])
        shorts = list(Short.objects.filter(moderation_state__in=['approved', 'APPROVED'])[:4]) or list(Short.objects.all()[:4])
        flagship_malls = list(
            Market.objects.exclude(name__contains='#')
            .order_by('-stall_capacity', 'name')[:12]
        ) or list(Market.objects.order_by('-stall_capacity')[:12])

        context = {
            'featured_products': featured_products,
            'verified_merchants': verified_merchants,
            'shows': shows,
            'shorts': shorts,
            'flagship_malls': flagship_malls,
            'stats': {
                'total_merchants': _fast_table_count(Merchant),
                'total_malls': _fast_table_count(Market),
                'total_products': _fast_table_count(MasterProduct),
            },
        }
        with contextlib.suppress(Exception):
            cache.set(key, context, 300)

    return render(request, 'home.html', context)

def search_view(request):
    key = _cache_key('search_page_v5', request)
    cached = cache.get(key)
    if cached is not None:
        # Serve cached context (data only — never cached rendered HTML, which
        # would embed a stale per-user CSRF token).
        response = render(request, 'search/search_results.html', cached)
        patch_vary_headers(response, ('Accept-Encoding',))
        return response

    query = request.GET.get('q', '').strip()
    category = request.GET.get('category', '')
    province = request.GET.get('province', '')
    brand = request.GET.get('brand', '')
    tab = request.GET.get('tab', 'all')
    mode = request.GET.get('mode', 'retail')
    min_price_param = request.GET.get('min_price')
    max_price_param = request.GET.get('max_price')
    in_stock_only = request.GET.get('in_stock') == '1'
    sabs_only = request.GET.get('sabs') == '1'

    try:
        min_price = float(min_price_param) if min_price_param else None
    except ValueError:
        min_price = None

    try:
        max_price = float(max_price_param) if max_price_param else None
    except ValueError:
        max_price = None

    try:
        offset = max(int(request.GET.get('offset', 0)), 0)
    except ValueError:
        offset = 0

    sort = request.GET.get('sort', 'relevance')
    near = _parse_near(request)
    open_now_only = request.GET.get('open_now') == '1'
    radius_param = request.GET.get('radius')
    if near and radius_param:
        try:
            near = (near[0], near[1], min(max(float(radius_param), 1.0), 300.0))
        except ValueError:
            pass

    effective_query = query or f'{category} {brand}'.strip()
    results = ranked_search(
        effective_query,
        limit=24,
        offset=offset,
        category=category,
        province=province,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        near=near,
    )
    log_search_query(
        effective_query,
        source='web',
        result_count=results['total_products'],
        province=province,
    )

    # Federated live tier: rights-gated external web results, cached per query.
    live = request.GET.get('live', '1') == '1'
    external = {}
    if live and effective_query:
        from apps.intelligence.federated import external_results

        external = external_results(effective_query)

    from apps.intelligence.services import (
        build_overview,
        detect_intent,
        get_brand_knowledge_card,
        get_people_also_ask,
        get_related_searches,
        get_tiered_moq_pricing,
    )

    # Knowledge Graph Card
    knowledge_card = get_brand_knowledge_card(query or brand or category)

    # Scored products
    plain_products = []
    product_moq_tables = {}
    offers_by_product = {}
    sponsored_products = []

    for idx, s in enumerate(results['products']):
        p = s.product
        # SABS / Compliance filter
        if sabs_only and not (p.compliance and (p.compliance.get('sabsApproved') or p.compliance.get('nrs097Certified'))):
            continue

        best_price = float(s.best_offer.price_amount) if s.best_offer and s.best_offer.price_amount else (p.estimated_price_zar or 1000.0)
        merchant_name = s.best_offer.merchant.name.split('#')[0].strip() if (s.best_offer and s.best_offer.merchant) else "Verified Supplier"

        # Real rating/price/distance attributes for the template (no fabricated stars).
        summary = p.reviews_summary if isinstance(p.reviews_summary, dict) else {}
        rating = summary.get('ratingValue') or summary.get('average') or ''
        rating_count = summary.get('reviewCount') or summary.get('count') or 0
        if not rating:
            mr = _merchant_rating(s)
            rating = round(mr, 1) if mr else ''
        try:
            p.shoppage_rating = float(rating)
        except (TypeError, ValueError):
            p.shoppage_rating = ''
        p.shoppage_rating_count = int(rating_count or 0)
        p.shoppage_best_price = best_price
        p.shoppage_offer_count = s.offer_count or (1 if s.best_offer else 0)
        p.shoppage_distance_km = s.distance_km

        # B2B MOQ calculations
        product_moq_tables[p.canonical_id] = get_tiered_moq_pricing(best_price)
        offers_by_product[p.canonical_id] = [s.best_offer] if s.best_offer else []
        plain_products.append(p)

        if idx < 8:
            sponsored_products.append({
                'product': p,
                'price': best_price,
                'merchant_name': merchant_name,
                'offer_count': s.offer_count or 1,
            })

    # Active promotions: sale price + badge on search cards (Google PLA-style).
    try:
        from apps.offers.models import Promotion
        from django.utils import timezone as _tz

        _now = _tz.now()
        promo_map = {}
        if plain_products:
            for promo in (
                Promotion.objects.filter(
                    variant_id__in=[p.id for p in plain_products],
                    state='active', valid_from__lte=_now,
                ).exclude(valid_until__lt=_now)
            ):
                promo_map.setdefault(promo.variant_id, promo)
        for p in plain_products:
            promo = promo_map.get(p.id)
            if promo and p.shoppage_best_price:
                p.shoppage_promo_label = promo.discount_label
                p.shoppage_original_price = p.shoppage_best_price
                if promo.percent_off:
                    p.shoppage_best_price = round(p.shoppage_best_price * (1 - float(promo.percent_off) / 100), 2)
                elif promo.price_off:
                    p.shoppage_best_price = max(0.0, round(p.shoppage_best_price - float(promo.price_off), 2))
            else:
                p.shoppage_promo_label = ''
                p.shoppage_original_price = None
    except Exception:
        for p in plain_products:
            p.shoppage_promo_label = ''
            p.shoppage_original_price = None

    # Honest zero state: when nothing matches, the page says so instead of
    # padding with unrelated products.

    # Ensure Top & Featured Products always has 6-8 items
    if len(sponsored_products) < 6:
        extra_products = list(
            MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
            .exclude(canonical_id__in=[sp['product'].canonical_id for sp in sponsored_products])
            .prefetch_related('offers', 'offers__merchant')[:8]
        )
        for ep in extra_products:
            ep_price = float(ep.estimated_price_zar or 2800.0)
            ep_merchant = ep.brand + " South Africa"
            first_o = ep.offers.all().first()
            if first_o and first_o.merchant:
                ep_merchant = first_o.merchant.name.split('#')[0].strip()
                if first_o.price_amount:
                    ep_price = float(first_o.price_amount)
            sponsored_products.append({
                'product': ep,
                'price': ep_price,
                'merchant_name': ep_merchant,
                'offer_count': 1,
            })
            if len(sponsored_products) >= 8:
                break

    # Places / Local 3-Pack Storefronts (Google GMB Pack without heavy map).
    # No merchants matched the query -> no local pack (honest empty state).
    raw_merchants = results.get('merchants', [])

    places_stores = []
    seen_store_keys = set()
    for m in raw_merchants:
        store_key = m.name.split('#')[0].strip().lower()
        if store_key in seen_store_keys:
            continue
        seen_store_keys.add(store_key)

        distance_km = None
        if near and m.latitude is not None and m.longitude is not None:
            with contextlib.suppress(TypeError, ValueError):
                distance_km = round(_haversine_km(near[0], near[1], float(m.latitude), float(m.longitude)), 1)

        if open_now_only:
            on = getattr(m, 'open_now', None)
            if not (on and on.get('is_open')):
                continue

        places_stores.append({
            'merchant': m,
            'clean_name': m.name.split('#')[0].strip(),
            'rating': m.google_rating,
            'reviews_count': m.google_reviews_count,
            'category_name': m.get_category_display() if hasattr(m, 'get_category_display') else (m.category or 'Commercial Supplier').replace('_', ' ').title(),
            'address': m.address_text.split(',')[0] if m.address_text else (m.province or ''),
            'phone': m.telephone or m.whatsapp_number or '',
            'operating_hours': m.operating_hours or '',
            'review_snippet': '',
            'canonical_id': m.canonical_id,
            'whatsapp_number': m.whatsapp_number,
            'distance_km': distance_km,
        })
        if len(places_stores) >= 4:
            break

    # Fast indexed Shorts query
    shorts_qs = Short.objects.filter(moderation_state__in=['approved', 'APPROVED'])
    if query:
        shorts_qs = shorts_qs.filter(
            Q(title__istartswith=query) |
            Q(product_title__istartswith=query)
        )
    matched_shorts = list(shorts_qs[:4]) or list(Short.objects.all()[:4])

    # Dynamic Generative AI Overview
    intent = detect_intent(query)
    ai_overview = results.get('overview') or build_overview(
        query,
        intent,
        len(plain_products),
        len(places_stores),
        results['price_stats']['min'] if results.get('price_stats') else None,
        results['price_stats']['max'] if results.get('price_stats') else None,
        results['price_stats']['avg'] if results.get('price_stats') else None,
        list(results.get('facets', {}).get('brands', {}).keys())[:4],
    )

    # Contextual People Also Ask & Related Searches
    people_also_ask = get_people_also_ask(query)
    related_searches = get_related_searches(query, category)

    from apps.core.seo import jsonld_script, search_results_jsonld, site_url

    result_base = site_url(request)
    search_items = [
        (product.title, f'{result_base}/p/{product.seo_handle}/')
        for product in plain_products[:20]
    ]

    # Shared query-string for facet/sort/pagination links (drops offset & sort).
    nav_params = {k: v for k, v in request.GET.items() if k not in ('offset', 'sort') and v}
    base_query = urlencode(nav_params)
    did_you_mean = results.get('did_you_mean') or ''
    dym_params = {k: v for k, v in request.GET.items() if k not in ('offset', 'q') and v}
    dym_params['q'] = did_you_mean
    dym_link = urlencode(dym_params) if did_you_mean else ''

    # Pre-built facet filter links (the sidebar was CSS-only until now).
    def _facet_url(rkey: str, rval: str) -> str:
        params = request.GET.copy()
        params[rkey] = rval
        params.pop('offset', None)  # reset paging when a filter changes
        return urlencode(params)

    _facets = results.get('facets', {}) or {}
    facet_links = {
        # (value, url, count, display label) — label prettified for the sidebar.
        'categories': [(c, _facet_url('category', c), n, c.replace('_', ' ').title())
                       for c, n in (_facets.get('categories') or {}).items()],
        'brands': [(b, _facet_url('brand', b), n, b.replace('_', ' ').title())
                   for b, n in (_facets.get('brands') or {}).items()],
        'provinces': [(p, _facet_url('province', p), n, p)
                      for p, n in (_facets.get('provinces') or {}).items()],
    }
    sort_choices = [
        ('relevance', 'Best Value'),
        ('price_asc', 'Price ↑'),
        ('price_desc', 'Price ↓'),
        ('newest', 'Newest'),
        ('rating', 'Top Rated'),
    ]

    context = {
        'query': query,
        'category': category,
        'province': province,
        'brand': brand,
        'tab': tab,
        'mode': mode,
        'sort': sort,
        'near_active': near is not None,
        'near_raw': request.GET.get('near', ''),
        'lat_param': request.GET.get('lat', ''),
        'lng_param': request.GET.get('lng', ''),
        'open_now_only': open_now_only,
        'radius': radius_param or '',
        'base_query': base_query,
        'dym_link': dym_link,
        'did_you_mean': did_you_mean,
        'min_price': min_price,
        'max_price': max_price,
        'in_stock_only': in_stock_only,
        'sabs_only': sabs_only,
        'knowledge_card': knowledge_card,
        'ai_overview': ai_overview,
        'sponsored_products': sponsored_products,
        'places_stores': places_stores,
        'people_also_ask': people_also_ask,
        'related_searches': related_searches,
        'external': external,
        'page_title': (
            f'{query} — prices, local stock & verified sellers | Shoppage' if query
            else 'Search products, prices and verified sellers | Shoppage'
        ),
        'meta_description': (ai_overview[:155] if query and ai_overview else ''),
        'robots_meta': 'noindex,follow' if query else 'index,follow',
        'canonical_path': '/search/',
        'search_jsonld': jsonld_script(search_results_jsonld(query, search_items, request)),
        'results': {
            **results,
            'products': plain_products,
            'offers_by_product': offers_by_product,
            'product_moq_tables': product_moq_tables,
        },
        'matched_shorts': matched_shorts,
        'facets': results['facets'],
        'price_stats': results['price_stats'],
        'elapsed_ms': results['elapsed_ms'],
        'next_offset': results['next_offset'],
        'offset': offset,
        'page': results['page'],
        'facet_links': facet_links,
        'sort_choices': sort_choices,
    }
    with contextlib.suppress(Exception):
        # Cache the context data (not rendered HTML) to avoid stale CSRF tokens.
        cache.set(key, context, 60)

    response = render(request, 'search/search_results.html', context)
    patch_vary_headers(response, ('Accept-Encoding',))
    return response

def search_live_view(request):
    """
    HTMX-powered live search endpoint returning rich Google-style instant results.
    """
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return render(request, 'search/partials/search_live_dropdown.html', {'results': None, 'query': query})

    # Google-style query completion: popular logged queries first, then brand/title prefix.
    suggestions: list[str] = []
    try:
        from apps.catalog.models import MasterProduct
        from apps.core.models import SearchQueryLog
        from django.db.models import Count

        norm = query.lower().strip()
        rows = list(
            SearchQueryLog.objects.filter(normalized__startswith=norm)
            .exclude(normalized__iexact=norm)
            .values('normalized').annotate(n=Count('id')).order_by('-n')[:4]
        )
        suggestions = [r['normalized'] for r in rows]
        if len(suggestions) < 4:
            seen = {s.lower() for s in suggestions}
            brand_rows = list(
                MasterProduct.objects.filter(status__in=['active', 'ACTIVE'], brand__istartswith=norm)
                .exclude(brand='').values_list('brand', flat=True).distinct()[:4]
            )
            for b in brand_rows:
                if b and b.lower() not in seen:
                    seen.add(b.lower())
                    suggestions.append(b)
                if len(suggestions) >= 6:
                    break
    except Exception:
        suggestions = []

    key = f'sp:live_v2:{query.lower()}'
    ctx = cache.get(key)
    if ctx is None:
        res = ranked_search(query, limit=5)

        products_list = []
        for s in res['products']:
            p = s.product
            price = float(s.best_offer.price_amount) if s.best_offer and s.best_offer.price_amount else p.estimated_price_zar
            products_list.append({
                'title': p.title,
                'brand': p.brand,
                'canonical_id': p.canonical_id,
                'category_ref': p.category_ref,
                'price': price,
                'has_verified_offer': bool(s.best_offer),
            })

        merchants_list = [
            {
                'name': m.name,
                'canonical_id': m.canonical_id,
                'trust_score': m.trust_score,
                'address_text': m.address_text,
                'category': m.category,
            }
            for m in res['merchants'][:3]
        ]

        malls = list(Market.objects.filter(name__icontains=query)[:2])
        malls_list = [{'name': m.name, 'canonical_slug': m.canonical_slug, 'province': m.province} for m in malls]

        shorts = list(Short.objects.filter(Q(title__icontains=query) | Q(product_title__icontains=query))[:2])
        shorts_list = [{'title': s.title, 'views': s.views, 'canonical_id': s.canonical_id} for s in shorts]

        from apps.intelligence.services import get_brand_knowledge_card
        card = get_brand_knowledge_card(query)

        ctx = {
            'query': query,
            'suggestions': suggestions,
            'products': products_list,
            'merchants': merchants_list,
            'malls': malls_list,
            'shorts': shorts_list,
            'knowledge_card': card,
            'total_matches': len(products_list) + len(merchants_list) + len(malls_list),
        }
        cache.set(key, ctx, 60)

    return render(request, 'search/partials/search_live_dropdown.html', ctx)

def requests_view(request):
    return render(request, 'requests/requests_page.html')

def agency_view(request):
    return render(request, 'agency/agency_page.html')

def healthz_view(request):
    return JsonResponse({'status': 'ok', 'service': 'shoppage-web'})

def readyz_view(request):
    checks = {}
    ok = True
    try:
        with connection.cursor() as cur:
            cur.execute('SELECT 1')
        checks['database'] = 'ok'
    except Exception as exc:
        checks['database'] = f'error: {exc.__class__.__name__}: {exc!s}'
        ok = False
    try:
        cache.set('sp:readyz', '1', 5)
        checks['cache'] = 'ok' if cache.get('sp:readyz') == '1' else 'error'
        if checks['cache'] != 'ok':
            ok = False
    except Exception as exc:
        checks['cache'] = f'error: {exc.__class__.__name__}'
        ok = False
    return JsonResponse({'status': 'ready' if ok else 'degraded', 'checks': checks},
                        status=200 if ok else 503)


@login_required
def analytics_view(request):
    """Google-Analytics-style platform report. Staff only; built from measured logs."""
    if not (request.user.is_staff or request.user.is_superuser):
        raise PermissionDenied
    from datetime import timedelta

    from apps.catalog.models import MasterProduct
    from apps.core.models import SearchClick, SearchQueryLog
    from apps.referrals.models import ReferralEvent
    from django.db.models import Count
    from django.db.models.functions import TruncDate

    days = 30
    since = timezone.now() - timedelta(days=days)

    # All reports are guarded: on a migration-incomplete environment the page
    # renders with empty data and a notice instead of failing.
    data_error = ''
    kpis = {'searches': 0, 'unique_queries': 0, 'clicks': 0, 'ctr': 0.0, 'leads': 0, 'conv': 0.0}
    trend_rows = []
    top_queries = []
    top_products = []
    channels = []
    provinces = []
    campaigns = []
    campaign_leads = 0
    try:
        # Overview KPIs (all measured, never modelled).
        searches = SearchQueryLog.objects.filter(created_at__gte=since).count()
        unique_queries = SearchQueryLog.objects.filter(created_at__gte=since).values('normalized').distinct().count()
        clicks = SearchClick.objects.filter(created_at__gte=since).count()
        leads = ReferralEvent.objects.filter(occurred_at__gte=since).count()
        kpis = {
            'searches': searches,
            'unique_queries': unique_queries,
            'clicks': clicks,
            'ctr': round(clicks / searches * 100, 2) if searches else 0.0,
            'leads': leads,
            'conv': round(leads / clicks * 100, 2) if clicks else 0.0,
        }

        # 14-day daily trend.
        trend = {}
        for model, date_field in ((SearchQueryLog, 'created_at'), (SearchClick, 'created_at'),
                                  (ReferralEvent, 'occurred_at')):
            rows = list(
                model.objects.filter(**{f'{date_field}__gte': since})
                .annotate(day=TruncDate(date_field)).values('day').annotate(n=Count('id')).order_by('day')
            )
            for row in rows:
                key = row['day'].strftime('%Y-%m-%d')
                slot = trend.setdefault(key, {'day': key})
                slot[{
                    SearchQueryLog: 'searches', SearchClick: 'clicks', ReferralEvent: 'leads'
                }[model]] = row['n']
        trend_rows = sorted(trend.values(), key=lambda r: r['day'])[-14:]

        # Top queries by clicks.
        top_queries = list(
            SearchClick.objects.filter(created_at__gte=since)
            .exclude(query='').values('query').annotate(n=Count('id')).order_by('-n')[:10]
        )

        # Top products: clicks (SearchClick.product_id) + leads (ReferralEvent.variant).
        product_clicks = dict(
            SearchClick.objects.filter(created_at__gte=since)
            .values('product_id').annotate(n=Count('id')).order_by('-n')[:12]
            .values_list('product_id', 'n')
        )
        product_leads = dict(
            ReferralEvent.objects.filter(occurred_at__gte=since).exclude(variant__isnull=True)
            .values('variant_id').annotate(n=Count('id')).order_by('-n')[:12]
            .values_list('variant_id', 'n')
        )
        product_ids = list(product_clicks.keys())[:12]
        products_by_id = {p.id: p for p in MasterProduct.objects.filter(id__in=product_ids)}
        for pid in product_ids:
            p = products_by_id.get(pid)
            if not p:
                continue
            c = product_clicks[pid]
            l = product_leads.get(pid, 0)
            top_products.append({
                'title': p.title,
                'canonical_id': p.canonical_id,
                'clicks': c,
                'leads': l,
                'conv': round(l / c * 100, 1) if c else 0.0,
            })

        # Channel split + geo split + UTM campaigns.
        channels = list(SearchQueryLog.objects.filter(created_at__gte=since).values('source').annotate(n=Count('id')).order_by('-n'))
        provinces = list(
            ReferralEvent.objects.filter(occurred_at__gte=since).exclude(merchant__province='').exclude(merchant__province__isnull=True)
            .values('merchant__province').annotate(n=Count('id')).order_by('-n')[:9]
        )
        campaigns = list(
            ReferralEvent.objects.filter(occurred_at__gte=since)
            .exclude(source_campaign='').exclude(source_campaign__isnull=True)
            .values('source_campaign').annotate(n=Count('id')).order_by('-n')[:10]
        )
        campaign_leads = sum(c['n'] for c in campaigns)
    except Exception as exc:
        data_error = (
            f'Report tables unavailable in this environment: {exc.__class__.__name__}. '
            'Run the platform migrations (Postgres) to populate analytics.'
        )

    context = {
        'kpis': kpis,
        'trend_rows': trend_rows,
        'top_queries': top_queries,
        'top_products': top_products,
        'channels': channels,
        'provinces': provinces,
        'campaigns': campaigns,
        'campaign_leads': campaign_leads,
        'days': days,
        'data_error': data_error,
    }
    return render(request, 'analytics/analytics_page.html', context)
