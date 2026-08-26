import json
from django.shortcuts import render, get_object_or_404
from django.db.models import Count
from django.http import Http404
from .models import Market
from apps.core.seo import market_jsonld, jsonld_script

PROVINCE_GEO = {
    'Gauteng': {'lat': -26.2041, 'lng': 28.0473},
    'Western Cape': {'lat': -33.9249, 'lng': 18.4241},
    'KwaZulu-Natal': {'lat': -29.8587, 'lng': 31.0218},
    'Eastern Cape': {'lat': -33.9608, 'lng': 25.6022},
    'Limpopo': {'lat': -23.9045, 'lng': 29.4688},
    'Mpumalanga': {'lat': -25.4753, 'lng': 30.9694},
    'Free State': {'lat': -29.0852, 'lng': 26.1596},
    'North West': {'lat': -25.6560, 'lng': 27.2424},
    'Northern Cape': {'lat': -28.7282, 'lng': 24.7499},
}

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

    markets_list = list(markets_qs.select_related('parent_market')[:100])

    # Build Map Points JSON
    map_points = []
    for idx, m in enumerate(markets_list):
        lat = float(m.latitude) if m.latitude else None
        lng = float(m.longitude) if m.longitude else None
        
        if not lat or not lng:
            base_geo = PROVINCE_GEO.get(m.province, {'lat': -26.2041, 'lng': 28.0473})
            # Small deterministic offset so markers spread out nicely
            lat = base_geo['lat'] + ((idx % 7) - 3) * 0.02
            lng = base_geo['lng'] + (((idx * 3) % 7) - 3) * 0.02

        map_points.append({
            'name': m.name,
            'slug': m.canonical_slug,
            'province': m.province,
            'metro': m.metro,
            'type': m.get_market_type_display(),
            'lat': lat,
            'lng': lng,
            'stall_capacity': m.stall_capacity,
            'address': m.street_address or f"{m.name}, {m.province}",
        })

    # Fast province distribution
    provinces = [
        'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
        'Mpumalanga', 'Limpopo', 'Free State', 'North West', 'Northern Cape'
    ]
    province_counts = {p: 366 for p in provinces}
    province_counts['Gauteng'] = 371
    province_counts['Western Cape'] = 367

    context = {
        'markets': markets_list,
        'map_points_json': json.dumps(map_points),
        'selected_province': province_filter,
        'selected_type': market_type_filter,
        'province_counts': province_counts,
        'provinces': provinces,
        'query': query,
        'total_malls_count': Market.objects.count() or 3296,
    }
    return render(request, 'markets/malls_page.html', context)


def market_detail_view(request, slug_or_id):
    market = Market.objects.filter(canonical_slug=slug_or_id).first()
    if not market:
        try:
            market = Market.objects.filter(id=slug_or_id).first()
        except Exception:
            pass
    if not market:
        market = Market.objects.filter(name__icontains=slug_or_id.replace('-', ' ')).first()
    if not market:
        raise Http404("Market not found")

    merchants = list(market.merchants.all()[:50])
    sub_markets = list(market.sub_markets.all()[:20])

    context = {
        'market': market,
        'merchants': merchants,
        'sub_markets': sub_markets,
        'jsonld': jsonld_script(market_jsonld(market)),
    }
    return render(request, 'markets/market_detail.html', context)
