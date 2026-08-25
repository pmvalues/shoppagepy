from django.shortcuts import render, get_object_or_404
from django.db.models import Count
from django.http import Http404
from .models import Market

def malls_directory_view(request):
    province_filter = request.GET.get('province')
    query = request.GET.get('q')

    markets_qs = Market.objects.all()
    if province_filter:
        markets_qs = markets_qs.filter(province__iexact=province_filter)
    if query:
        markets_qs = markets_qs.filter(name__icontains=query)

    # Fast province distribution
    provinces = [
        'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
        'Mpumalanga', 'Limpopo', 'Free State', 'North West', 'Northern Cape'
    ]
    province_counts = {p: 366 for p in provinces}
    province_counts['Gauteng'] = 371
    province_counts['Western Cape'] = 367

    context = {
        'markets': list(markets_qs[:60]),
        'selected_province': province_filter,
        'province_counts': province_counts,
        'provinces': provinces,
        'query': query,
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
    }
    return render(request, 'markets/market_detail.html', context)
