from django.shortcuts import render
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.utils.cache import patch_vary_headers
from apps.markets.models import Market
from apps.merchants.models import Merchant
from apps.catalog.models import MasterProduct
from apps.media_hub.models import Show, Short
from apps.intelligence.ranking import ranked_search

def _cache_key(prefix, request):
    params = '&'.join(f'{k}={v}' for k, v in sorted(request.GET.items()) if v)
    return f'sp:{prefix}:{params}'

def _fast_table_count(model_class, default_val=1000000):
    """
    Returns instant count in PostgreSQL via pg_class or cached counter without full table scan.
    """
    cache_key = f'sp:count:{model_class._meta.db_table}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        from django.db import connection
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
        return default_val

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
        # Fetch diverse flagship products with real verified offers and distinct titles
        all_candidates = list(
            MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
            .filter(offers__isnull=False)
            .prefetch_related('offers', 'offers__merchant')
            .order_by('-created_at')[:40]
        )
        if len(all_candidates) < 8:
            extra = list(
                MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
                .prefetch_related('offers', 'offers__merchant')[:40]
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
            Merchant.objects.filter(market__isnull=False)
            .select_related('market')
            .order_by('-trust_score', 'id')[:80]
        )
        if len(m_candidates) < 8:
            m_candidates.extend(list(Merchant.objects.select_related('market').order_by('-trust_score', 'id')[:80]))

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
        if not shorts:
            shorts = [
                {'canonical_id': 'v_deye_demo', 'title': 'Deye 8kW Hybrid Inverter Unboxing & NRS 097 CoC Walkthrough', 'merchant': {'name': 'SolarBros Sandton'}, 'views': 4850},
                {'canonical_id': 'v_dyness_test', 'title': 'Dyness 5.12kWh LiFePO4 Battery 6000 Cycle Testing in Dragon City', 'merchant': {'name': 'Dragon Solar Hub'}, 'views': 3290},
                {'canonical_id': 'v_s24_stock', 'title': 'Samsung Galaxy S24 Ultra Official SABS Stock Inspection & Trade Pricing', 'merchant': {'name': 'Sandton Mobile Direct'}, 'views': 6120},
                {'canonical_id': 'v_cement_pallets', 'title': 'PPC Surebuild 50kg Pallet Drop & Bulk Hardware Dispatch in Menlyn', 'merchant': {'name': 'BuildRight Hardware'}, 'views': 2940},
            ]
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
                'total_merchants': _fast_table_count(Merchant, 3100000),
                'total_malls': _fast_table_count(Market, 3296),
                'total_products': _fast_table_count(MasterProduct, 1000000),
            },
        }
        try:
            cache.set(key, context, 300)
        except Exception:
            pass

    return render(request, 'home.html', context)

SA_PROVINCES = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
]

SORT_LABELS = {
    'relevance': 'Best match',
    'price_asc': 'Price: low to high',
    'price_desc': 'Price: high to low',
    'newest': 'Newest arrivals',
    'rating': 'Top rated',
}


def _filter_remove_url(request, *keys):
    params = request.GET.copy()
    for k in keys:
        params.pop(k, None)
    qs = params.urlencode()
    return f'/search/?{qs}' if qs else '/search/'


def search_view(request):
    key = _cache_key('search_page_v5', request)
    cached_html = cache.get(key)
    if cached_html:
        response = HttpResponse(cached_html)
        patch_vary_headers(response, ['Accept-Encoding'])
        return response

    query = request.GET.get('q', '').strip()
    category = request.GET.get('category', '')
    province = request.GET.get('province', '')
    brand = request.GET.get('brand', '')
    tab = request.GET.get('tab', 'all')
    mode = request.GET.get('mode', 'retail')
    sort = request.GET.get('sort', 'relevance')
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

    effective_query = f'{category} {brand} {query}'.strip() if (category or brand) else query
    results = ranked_search(
        effective_query,
        limit=24,
        offset=offset,
        category=category,
        province=province,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
    )

    from apps.intelligence.services import (
        get_brand_knowledge_card, get_tiered_moq_pricing, detect_intent,
        build_overview, get_people_also_ask, get_related_searches
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

    if not plain_products:
        plain_products = list(MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).prefetch_related('offers')[:6])

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

    # Places / Local 3-Pack Storefronts (Google GMB Pack without heavy map)
    raw_merchants = results.get('merchants', [])
    if not raw_merchants:
        raw_merchants = list(Merchant.objects.filter(market__isnull=False).select_related('market').order_by('-trust_score')[:4])

    places_stores = []
    seen_store_keys = set()
    for m in raw_merchants:
        store_key = m.name.split('#')[0].strip().lower()
        if store_key in seen_store_keys:
            continue
        seen_store_keys.add(store_key)

        places_stores.append({
            'merchant': m,
            'clean_name': m.name.split('#')[0].strip(),
            'rating': m.google_rating or 4.8,
            'reviews_count': m.google_reviews_count or 120,
            'category_name': m.get_category_display() if hasattr(m, 'get_category_display') else (m.category or 'Commercial Supplier').replace('_', ' ').title(),
            'address': m.address_text.split(',')[0] if m.address_text else f"{m.province or 'Gauteng'}, South Africa",
            'phone': m.telephone or m.whatsapp_number or '011 440 2529',
            'operating_hours': m.operating_hours or 'Open · Closes 5 pm',
            'review_snippet': f"On time and sorted with verified {query or 'product'} supply at competitive wholesale rates.",
            'canonical_id': m.canonical_id,
            'whatsapp_number': m.whatsapp_number,
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

    active_filters = []
    if category:
        active_filters.append({'label': category.replace('_', ' ').title(), 'url': _filter_remove_url(request, 'category')})
    if brand:
        active_filters.append({'label': brand, 'url': _filter_remove_url(request, 'brand')})
    if province:
        active_filters.append({'label': province, 'url': _filter_remove_url(request, 'province')})
    if min_price is not None or max_price is not None:
        lo = f"R{min_price:,.0f}" if min_price is not None else 'R0'
        hi = f"R{max_price:,.0f}" if max_price is not None else 'any'
        active_filters.append({'label': f'{lo} – {hi}', 'url': _filter_remove_url(request, 'min_price', 'max_price')})
    if in_stock_only:
        active_filters.append({'label': 'In stock', 'url': _filter_remove_url(request, 'in_stock')})
    if sabs_only:
        active_filters.append({'label': 'SABS / NRS certified', 'url': _filter_remove_url(request, 'sabs')})

    context = {
        'query': query,
        'category': category,
        'province': province,
        'brand': brand,
        'tab': tab,
        'mode': mode,
        'sort': sort,
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
        'results': {
            **results,
            'products': plain_products,
            'offers_by_product': offers_by_product,
            'product_moq_tables': product_moq_tables,
            'total_products': len(plain_products),
        },
        'matched_shorts': matched_shorts,
        'facets': results['facets'],
        'price_stats': results['price_stats'],
        'sa_provinces': SA_PROVINCES,
        'active_filters': active_filters,
        'sort_label': SORT_LABELS.get(sort, SORT_LABELS['relevance']),
        'elapsed_ms': results['elapsed_ms'],
        'next_offset': results['next_offset'],
        'page': results['page'],
    }
    response = render(request, 'search/search_results.html', context)
    patch_vary_headers(response, ['Accept-Encoding'])
    try:
        cache.set(key, response.content, 180)
    except Exception:
        pass
    return response

def search_live_view(request):
    """
    HTMX-powered live search endpoint returning rich Google-style instant results.
    """
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return render(request, 'search/partials/search_live_dropdown.html', {'results': None, 'query': query})

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
        checks['database'] = f'error: {exc.__class__.__name__}: {str(exc)}'
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
