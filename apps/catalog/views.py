from django.shortcuts import render, get_object_or_404
from .models import MasterProduct

def calculate_backup_runtime(battery_kwh: float, load_watts: float):
    if load_watts <= 0:
        return {'hours': 0, 'minutes': 0, 'formatted': 'N/A'}
    usable_kwh = battery_kwh * 0.90 # 90% DoD for LiFePO4
    hours_total = (usable_kwh * 1000) / load_watts
    hours = int(hours_total)
    minutes = int((hours_total - hours) * 60)
    return {
        'hours': hours,
        'minutes': minutes,
        'formatted': f"{hours}h {minutes:02d}m"
    }

def product_detail_view(request, canonical_id):
    product = get_object_or_404(MasterProduct, canonical_id=canonical_id)
    confirmed_offers = list(product.offers.select_related('merchant', 'merchant__market').all())
    discovered_offers = list(product.discovered_offers.all())

    # Battery runtime calculation if solar product
    runtime_450w = calculate_backup_runtime(5.12, 450)
    runtime_1200w = calculate_backup_runtime(5.12, 1200)

    context = {
        'product': product,
        'confirmed_offers': confirmed_offers,
        'discovered_offers': discovered_offers,
        'runtime_450w': runtime_450w,
        'runtime_1200w': runtime_1200w,
    }
    return render(request, 'catalog/product_detail.html', context)
