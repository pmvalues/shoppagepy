from django.shortcuts import render
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.utils.cache import patch_vary_headers
from apps.markets.models import Market
from apps.merchants.models import Merchant
from apps.catalog.models import MasterProduct
from apps.media_hub.models import Show, Short
from apps.intelligence.ranking import ranked_search

def _cache_key(prefix, request):
    params = '&'.join(f'{k}={v}' for k, v in sorted(request.GET.items()) if v)
    return f'sp:{prefix}:{params}'

def home_view(request):
    """
    High-performance pure Django homepage view querying the National Commerce Grid.
    """
    key = _cache_key('home', request)
    context = None
    try:
        context = cache.get(key)
    except Exception:
        context = None

    if context is None:
        featured_products = list(
            MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
            .prefetch_related('offers', 'offers__merchant')[:8]
        ) or list(MasterProduct.objects.prefetch_related('offers')[:8])
        verified_merchants = list(
            Merchant.objects.select_related('market').order_by('-trust_score')[:8])
        shows = list(Show.objects.filter(status__in=['active', 'ACTIVE'])[:3]) or list(Show.objects.all()[:3])
        shorts = list(Short.objects.filter(moderation_state__in=['approved', 'APPROVED'])[:4]) or list(Short.objects.all()[:4])
        flagship_malls = list(Market.objects.all()[:12])
        context = {
            'featured_products': featured_products,
            'verified_merchants': verified_merchants,
            'shows': shows,
            'shorts': shorts,
            'flagship_malls': flagship_malls,
            'stats': {
                'total_merchants': Merchant.objects.count(),
                'total_malls': Market.objects.count(),
                'total_products': MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).count(),
            },
        }
        try:
            cache.set(key, context, 60)
        except Exception:
            pass

    return render(request, 'home.html', context)

def search_view(request):
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

    key = _cache_key('search_v2', request)
    results = cache.get(key)
    if results is None:
        effective_query = f'{category} {brand} {query}'.strip() if (category or brand) else query
        results = ranked_search(
            effective_query,
            limit=24,
            offset=offset,
            category=category,
            province=province,
            min_price=min_price,
            max_price=max_price,
        )
        cache.set(key, results, 30)

    from apps.intelligence.services import get_brand_knowledge_card, get_tiered_moq_pricing, detect_intent, build_overview

    # Knowledge Graph Card
    knowledge_card = get_brand_knowledge_card(query or brand or category)

    # Scored products
    plain_products = []
    product_moq_tables = {}
    offers_by_product = {}

    for s in results['products']:
        p = s.product
        # SABS / Compliance filter
        if sabs_only and not (p.compliance and (p.compliance.get('sabsApproved') or p.compliance.get('nrs097Certified'))):
            continue
        
        best_price = float(s.best_offer.price_amount) if s.best_offer and s.best_offer.price_amount else (p.estimated_price_zar or 1000.0)
        
        # B2B MOQ calculations
        product_moq_tables[p.canonical_id] = get_tiered_moq_pricing(best_price)
        offers_by_product[p.canonical_id] = [s.best_offer] if s.best_offer else []
        plain_products.append(p)

    # Matching Shorts for video commerce discovery
    shorts_qs = Short.objects.filter(moderation_state__in=['approved', 'APPROVED'])
    if query:
        shorts_qs = shorts_qs.filter(
            Q(title__icontains=query) |
            Q(product_title__icontains=query) |
            Q(summary__icontains=query)
        )
    matched_shorts = list(shorts_qs[:4]) or list(Short.objects.all()[:4])

    # Dynamic Generative AI Overview
    intent = detect_intent(query)
    ai_overview = results.get('overview') or build_overview(
        query,
        intent,
        len(plain_products),
        len(results.get('merchants', [])),
        results['price_stats']['min'] if results.get('price_stats') else None,
        results['price_stats']['max'] if results.get('price_stats') else None,
        results['price_stats']['avg'] if results.get('price_stats') else None,
        list(results.get('facets', {}).get('brands', {}).keys())[:4],
    )

    context = {
        'query': query,
        'category': category,
        'province': province,
        'brand': brand,
        'tab': tab,
        'mode': mode,
        'min_price': min_price,
        'max_price': max_price,
        'in_stock_only': in_stock_only,
        'sabs_only': sabs_only,
        'knowledge_card': knowledge_card,
        'ai_overview': ai_overview,
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
        'elapsed_ms': results['elapsed_ms'],
        'next_offset': results['next_offset'],
        'page': results['page'],
    }
    response = render(request, 'search/search_results.html', context)
    patch_vary_headers(response, ['Accept-Encoding'])
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
        checks['database'] = f'error: {exc.__class__.__name__}'
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
