import contextlib
import json

from apps.core.seo import breadcrumb_jsonld, jsonld_script, market_jsonld
from django.core.exceptions import ValidationError
from django.http import Http404, HttpResponsePermanentRedirect
from django.shortcuts import render

from .models import Market

def malls_directory_view(request):
    province_filter = request.GET.get('province')
    market_type_filter = request.GET.get('type')
    query = request.GET.get('q')

    markets_qs = Market.objects.all()
    if province_filter:
        markets_qs = markets_qs.filter(province__iexact=province_filter)
    if market_type_filter:
        markets_qs = markets_qs.filter(market_type=market_type_filter)
    if query:
        markets_qs = markets_qs.filter(name__icontains=query)

    # High-speed indexed query with in-memory deduplication
    candidates = list(
        markets_qs.select_related('parent_market')
        .order_by('-stall_capacity')[:120]
    )
    unique_malls = []
    seen_names = set()
    for m in candidates:
        base_name = m.name.split('#')[0].strip().lower()
        if base_name not in seen_names:
            seen_names.add(base_name)
            unique_malls.append(m)
        if len(unique_malls) >= 60:
            break

    markets_list = unique_malls

    # Build Map Points JSON — only malls with real coordinates are plotted
    # (no invented positions).
    map_points = []
    for m in markets_list:
        lat = float(m.latitude) if m.latitude else None
        lng = float(m.longitude) if m.longitude else None

        if not lat or not lng:
            continue

        map_points.append({
            'name': m.name,
            'slug': m.canonical_slug,
            'province': m.province or 'Gauteng',
            'metro': m.metro or 'South Africa',
            'type': str(m.get_market_type_display() if hasattr(m, 'get_market_type_display') else m.market_type),
            'lat': lat,
            'lng': lng,
            'stall_capacity': m.stall_capacity or 50,
            'address': m.street_address or f"{m.name}, {m.province or 'South Africa'}",
        })

    # Fast province distribution (real counts from the database)
    provinces = [
        'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
        'Mpumalanga', 'Limpopo', 'Free State', 'North West', 'Northern Cape'
    ]
    from django.db.models import Count

    real_counts = dict(
        Market.objects.exclude(province='')
        .values('province')
        .annotate(n=Count('id'))
        .values_list('province', 'n')
    )
    province_counts = {p: int(real_counts.get(p, 0)) for p in provinces}
    for p, n in real_counts.items():
        if p and p not in province_counts:
            province_counts[p] = int(n)

    context = {
        'markets': markets_list,
        'map_points_json': json.dumps(map_points),
        'selected_province': province_filter,
        'selected_type': market_type_filter,
        'province_counts': province_counts,
        'provinces': provinces,
        'query': query,
        'total_malls_count': Market.objects.count(),
    }
    return render(request, 'markets/malls_page.html', context)


def market_detail_view(request, slug_or_id):
    market = Market.objects.filter(canonical_slug=slug_or_id).first()
    resolved_other_way = False
    if not market:
        try:
            market = Market.objects.filter(id=slug_or_id).first()
        except ValidationError:
            market = None
        resolved_other_way = market is not None
    if not market:
        market = Market.objects.filter(name__icontains=slug_or_id.replace('-', ' ')).first()
        resolved_other_way = market is not None
    if not market:
        raise Http404("Market not found")
    if resolved_other_way:
        return HttpResponsePermanentRedirect(f'/markets/{market.canonical_slug}/')

    # Fetch merchants and deduplicate by storefront name
    m_candidates = list(market.merchants.select_related('market').order_by('-trust_score')[:60])
    unique_merchants = []
    seen_stores = set()
    for m in m_candidates:
        store_name = m.name.split('#')[0].strip().lower()
        if store_name not in seen_stores:
            seen_stores.add(store_name)
            unique_merchants.append(m)
        if len(unique_merchants) >= 30:
            break

    sub_markets = list(market.sub_markets.all()[:20])
    crumbs = [
        ('Home', '/'),
        ('Malls', '/malls/'),
        (market.province, f'/malls/?province={market.province}'),
        (market.name, None),
    ]
    default_description = (
        f'{market.get_market_type_display()} in {market.locality or market.metro or market.province}, '
        f'{market.name} lists {market.active_merchants_count or len(unique_merchants)} tracked trader'
        f'{"s" if (market.active_merchants_count or len(unique_merchants)) != 1 else ""} on the Shoppage grid.'
    )

    context = {
        'market': market,
        'merchants': unique_merchants,
        'sub_markets': sub_markets,
        'jsonld': jsonld_script(market_jsonld(market, request)),
        'breadcrumb_jsonld': jsonld_script(breadcrumb_jsonld(crumbs, request)),
        'breadcrumbs': crumbs,
        'page_title': market.meta_title or f'{market.name} — Stores, Hours & Directory | Shoppage',
        'meta_description': market.meta_description or default_description[:155],
        'canonical_path': f'/markets/{market.canonical_slug}/',
        'og_image_url': market.public_image_url or '',
        'og_image_alt': market.name,
        'og_type': 'place',
    }
    return render(request, 'markets/market_detail.html', context)
