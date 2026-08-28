import contextlib
import json

from apps.core.seo import breadcrumb_jsonld, jsonld_script, product_jsonld
from apps.intelligence.services import get_brand_knowledge_card
from apps.media_hub.models import Short
from apps.offers.models import AvailabilityStateChoices
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import Http404, HttpResponsePermanentRedirect
from django.shortcuts import render

from .models import MasterProduct, ProductStatusChoices

REFERENCE_PRICE_KEYS = ('msrpZar', 'recommendedRetailZar', 'listPriceZar', 'rrpZar')
COMPLIANCE_LABELS = {
    'nrs097Certified': 'NRS 097-2-1 grid interconnection certified',
    'sabsApproved': 'SABS safety approved',
    'icasaApproved': 'ICASA type approved',
    'cidbApproved': 'CIDB contractor registered',
    'cocRequired': 'Electrical CoC required for installation',
    'warrantyYears': 'Warranty (years)',
}
VISIBLE_STATES = [
    AvailabilityStateChoices.FRESH,
    AvailabilityStateChoices.CONFIRM_REQUIRED,
    AvailabilityStateChoices.QUOTE_REQUIRED,
    AvailabilityStateChoices.OUT_OF_STOCK,
]


def _compliance_items(compliance):
    items = []
    for key, value in (compliance or {}).items():
        if value in (None, '', False, [], {}):
            continue
        label = COMPLIANCE_LABELS.get(key, str(key))
        items.append((label, '' if isinstance(value, bool) else value))
    return items[:8]


def calculate_backup_runtime(battery_kwh: float, load_watts: float):
    if load_watts <= 0:
        return {'hours': 0, 'minutes': 0, 'formatted': 'N/A'}
    usable_kwh = battery_kwh * 0.90  # 90% DoD for LiFePO4
    hours_total = (usable_kwh * 1000) / load_watts
    hours = int(hours_total)
    minutes = int((hours_total - hours) * 60)
    return {'hours': hours, 'minutes': minutes, 'formatted': f"{hours}h {minutes:02d}m"}


def _resolve_product(identifier: str):
    """Return (product, requested_by_pk). A pk lookup is redirected, never rendered."""
    product = MasterProduct.objects.filter(canonical_id=identifier).first()
    if product:
        return product, False
    try:
        product = MasterProduct.objects.filter(id=identifier).first()
    except ValidationError:
        product = None
    if product:
        return product, True
    return None, False


def _reference_price(product) -> float:
    attributes = product.attributes if isinstance(product.attributes, dict) else {}
    for key in REFERENCE_PRICE_KEYS:
        value = attributes.get(key)
        try:
            if value:
                return float(value)
        except (TypeError, ValueError):
            continue
    return 0.0


def _price_history(offers):
    """Measured 30-day band from recorded observations, or None when unobserved."""
    ranges = [offer.price_range(30) for offer in offers[:8]]
    ranges = [r for r in ranges if r]
    if not ranges:
        return None
    observations = sum(r['observations'] for r in ranges)
    return {
        'low': min(r['low'] for r in ranges),
        'high': max(r['high'] for r in ranges),
        'observations': observations,
        'meaningful': observations >= 2,
    }


def _capture_search_click(request, product):
    """
    Search feedback signal: opening a product page from a /search results page
    counts as a click for that query (referer-based, no extra JS needed).
    Throttled per session+product so refreshes don't inflate popularity.
    """
    referer = request.META.get('HTTP_REFERER', '') or ''
    if '/search' not in referer:
        return
    from urllib.parse import parse_qs, urlparse

    try:
        query = (parse_qs(urlparse(referer).query).get('q') or [''])[0].strip()[:255]
    except Exception:
        query = ''
    session_key = getattr(getattr(request, 'session', None), 'session_key', None) or 'anon'
    throttle = f'sp:clk:{session_key}:{product.pk}'
    if cache.get(throttle):
        return
    with contextlib.suppress(Exception):
        cache.set(throttle, 1, 60)
        from apps.core.models import SearchClick

        SearchClick.objects.create(query=query, product_id=str(product.pk), source='web')


def product_detail_view(request, canonical_id):
    product, matched_by_pk = _resolve_product(canonical_id)
    if not product:
        raise Http404("Product not found")
    if matched_by_pk:
        return HttpResponsePermanentRedirect(f'/p/{product.seo_handle}/')
    _capture_search_click(request, product)

    offers = list(
        product.offers
        .filter(availability_state__in=VISIBLE_STATES)
        .select_related('merchant', 'merchant__market')
        .order_by('price_amount', '-merchant__trust_score')
    )
    confirmed_offers = [o for o in offers if o.price_amount]
    discovered_offers = list(
        product.discovered_offers.select_related('merchant').order_by('discovered_price_amount')[:12]
    )

    price_points = [float(o.price_amount) for o in confirmed_offers]
    market_prices = price_points + [
        float(o.discovered_price_amount) for o in discovered_offers if o.discovered_price_amount
    ]
    if not market_prices and product.estimated_price_zar:
        market_prices = [float(product.estimated_price_zar)]

    min_price = min(market_prices) if market_prices else 0.0
    max_price = max(market_prices) if market_prices else 0.0
    avg_price = round(sum(market_prices) / len(market_prices), 2) if market_prices else 0.0
    confirmed_min = min(price_points) if price_points else 0.0
    reference_price = _reference_price(product)
    price_savings = round(reference_price - confirmed_min, 2) if reference_price > confirmed_min > 0 else 0.0
    discount_pct = round(price_savings / reference_price * 100) if price_savings > 0 else 0
    history = _price_history(confirmed_offers)
    price_status = ''
    if history and history['meaningful'] and confirmed_min:
        price_status = (
            'At its 30-day low' if confirmed_min <= float(history['low']) * 1.02
            else 'Above its 30-day low'
        )

    best_offer = confirmed_offers[0] if confirmed_offers else None
    fulfilment_options = []
    if best_offer and best_offer.merchant_id:
        stated = best_offer.merchant.delivery_options or []
        fulfilment_options = [str(option) for option in stated if str(option).strip()][:4]

    variation_group = list(product.variation_group()[:8])
    if variation_group:
        bundle_items = variation_group[:2]
    else:
        raw_candidates = list(
            MasterProduct.objects.filter(brand=product.brand, status=ProductStatusChoices.ACTIVE)[:4]
        )
        bundle_items = [p for p in raw_candidates if p.canonical_id != product.canonical_id][:2]

    bundle_prices = []
    for item in bundle_items:
        lowest = item.offers.filter(
            price_amount__isnull=False, availability_state__in=VISIBLE_STATES
        ).order_by('price_amount').values_list('price_amount', flat=True).first()
        bundle_prices.append(float(lowest) if lowest else 0.0)
    bundle_total = round(min_price + sum(bundle_prices), 2) if all(bundle_prices) and min_price else 0.0

    runtime_450w = calculate_backup_runtime(5.12, 450)
    runtime_1200w = calculate_backup_runtime(5.12, 1200)

    knowledge_card = get_brand_knowledge_card(product.brand or product.title)
    linked_shorts = list(product.shorts.filter(moderation_state__in=['approved', 'APPROVED']))
    if not linked_shorts and product.brand:
        linked_shorts = list(Short.objects.filter(
            Q(title__istartswith=product.brand) |
            Q(product_title__istartswith=product.brand)
        )[:3])

    raw_rel = list(
        MasterProduct.objects.filter(
            brand=product.brand, status=ProductStatusChoices.ACTIVE
        ).prefetch_related('offers')[:5]
    )
    related_products = [p for p in raw_rel if p.canonical_id != product.canonical_id][:3]

    category_label = product.category_ref.replace('_', ' ').title()
    crumbs = [
        ('Home', '/'),
        (category_label, f'/search/?category={product.category_ref}'),
        (product.brand, f'/search/?q={product.brand}'),
        (product.title, None),
    ]
    gtin_pairs = product.gtin_pairs
    valid_gtin = f'{gtin_pairs[0][0].upper()}: {gtin_pairs[0][1]}' if gtin_pairs else ''
    description = (product.description or '').strip()
    primary_image = product.primary_image
    compliance_items = _compliance_items(
        product.compliance if isinstance(product.compliance, dict) else {}
    )
    summary = product.reviews_summary if isinstance(product.reviews_summary, dict) else {}
    product_rating = summary.get('ratingValue') or summary.get('average') or ''
    product_rating_count = summary.get('reviewCount') or summary.get('count') or 0
    history_marker_pct = 50
    if history and history['meaningful'] and confirmed_min:
        low, high = float(history['low']), float(history['high'])
        if high > low > 0:
            history_marker_pct = max(0, min(100, round((confirmed_min - low) / (high - low) * 100)))
    gallery = [{'url': img.url, 'alt': img.effective_alt} for img in product.images.all()[:8]]

    context = {
        'product': product,
        'confirmed_offers': confirmed_offers,
        'discovered_offers': discovered_offers,
        'best_offer': best_offer,
        'min_price': min_price,
        'max_price': max_price,
        'avg_price': avg_price,
        'confirmed_min': confirmed_min,
        'reference_price': reference_price,
        'discount_pct': discount_pct,
        'price_savings': price_savings,
        'price_history': history,
        'price_status': price_status,
        'bundle_items': bundle_items,
        'bundle_total': bundle_total,
        'fulfilment_options': fulfilment_options,
        'variation_group': variation_group,
        'runtime_450w': runtime_450w,
        'runtime_1200w': runtime_1200w,
        'knowledge_card': knowledge_card,
        'linked_shorts': linked_shorts,
        'related_products': related_products,
        'valid_gtin': valid_gtin,
        'category_label': category_label,
        'compliance_items': compliance_items,
        'product_rating': product_rating,
        'product_rating_count': product_rating_count,
        'history_marker_pct': history_marker_pct,
        'gallery_json': json.dumps(gallery),
        'primary_image': primary_image,
        'product_images': list(product.images.all()[:8]),
        'description': description,
        'bullet_points': [b for b in (product.bullet_points or []) if str(b).strip()][:5],
        'jsonld': jsonld_script(product_jsonld(product, offers, request)),
        'breadcrumb_jsonld': jsonld_script(breadcrumb_jsonld(crumbs, request)),
        'breadcrumbs': crumbs,
        'page_title': product.meta_title or f'{product.brand} {product.title} — Prices, Local Stock | Shoppage',
        'meta_description': product.meta_description or (description or product.listing_description)[:155],
        'canonical_path': f'/p/{product.seo_handle}/',
        'og_image_url': primary_image.url if primary_image else '',
        'og_image_alt': f'{product.brand} {product.title}',
        'og_type': 'product',
    }
    return render(request, 'catalog/product_detail.html', context)
