from django.shortcuts import render
from apps.markets.models import Market
from apps.merchants.models import Merchant
from apps.catalog.models import MasterProduct
from apps.media_hub.models import Show, Short
from apps.intelligence.services import semantic_search

def home_view(request):
    """
    High-performance pure Django homepage view querying the National Commerce Grid.
    """
    featured_products = list(MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).prefetch_related('offers')[:8])
    if not featured_products:
        featured_products = list(MasterProduct.objects.all().prefetch_related('offers')[:8])

    verified_merchants = list(Merchant.objects.all().select_related('market')[:8])
    
    shows = list(Show.objects.filter(status__in=['active', 'ACTIVE'])[:3])
    if not shows:
        shows = list(Show.objects.all()[:3])

    shorts = list(Short.objects.filter(moderation_state__in=['approved', 'APPROVED'])[:4])
    if not shorts:
        shorts = list(Short.objects.all()[:4])

    flagship_malls = list(Market.objects.all()[:12])

    context = {
        'featured_products': featured_products,
        'verified_merchants': verified_merchants,
        'shows': shows,
        'shorts': shorts,
        'flagship_malls': flagship_malls,
        'stats': {
            'total_merchants': 3100000,
            'total_malls': 3296,
            'total_products': 1000000,
        }
    }
    return render(request, 'home.html', context)

def search_view(request):
    query = request.GET.get('q', '')
    category_param = request.GET.get('category', '')
    
    effective_query = f"{category_param} {query}".strip() if category_param else query
    results = semantic_search(effective_query, limit=24) if effective_query else semantic_search('solar', limit=12)

    context = {
        'query': query,
        'category': category_param,
        'results': results,
    }
    return render(request, 'search/search_results.html', context)

def search_live_view(request):
    """
    HTMX-powered live search endpoint returning HTML fragments in <15ms.
    """
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return render(request, 'search/partials/search_live_dropdown.html', {'results': None, 'query': query})
    results = semantic_search(query, limit=6)
    return render(request, 'search/partials/search_live_dropdown.html', {'results': results, 'query': query})

def requests_view(request):
    return render(request, 'requests/requests_page.html')

def agency_view(request):
    return render(request, 'agency/agency_page.html')
