import json

from apps.core.seo import breadcrumb_jsonld, jsonld_script, product_jsonld
from apps.intelligence.services import get_brand_knowledge_card
from apps.media_hub.models import Short
from apps.offers.models import AvailabilityStateChoices
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

from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.utils.text import slugify
from .models import MasterProduct, Review, ReviewModerationChoices
from apps.offers.models import DiscoveredOffer
from apps.media_hub.models import Short
from apps.core.seo import product_jsonld, jsonld_script, itemlist_jsonld
from apps.intelligence.services import get_tiered_moq_pricing, get_brand_knowledge_card

BROWSE_SORTS = ('relevance', 'price_asc', 'price_desc', 'newest', 'rating')
BROWSE_PER_PAGE = 24


def _best_offer_price(product):
    prices = [
        float(o.price_amount) for o in product.offers.all()
        if o.price_amount and o.availability_state not in ('out_of_stock', 'hidden', 'expired')
    ]
    return min(prices) if prices else None


def _rating_value(product):
    rs = product.reviews_summary if isinstance(product.reviews_summary, dict) else {}
    for key in ('average_rating', 'rating', 'avg_rating'):
        val = rs.get(key)
        if isinstance(val, (int, float)):
            return float(val)
    return 0.0


def _sort_browse_products(products, sort):
    if sort not in BROWSE_SORTS:
        sort = 'relevance'
    if sort == 'price_asc':
        return sorted(products, key=lambda p: (_best_offer_price(p) if _best_offer_price(p) is not None else float('inf'), p.title))
    if sort == 'price_desc':
        return sorted(products, key=lambda p: (_best_offer_price(p) or 0, p.title), reverse=True)
    if sort == 'newest':
        return sorted(products, key=lambda p: (p.created_at or p.updated_at), reverse=True)
    if sort == 'rating':
        return sorted(products, key=lambda p: (_rating_value(p), p.offers.count()), reverse=True)
    return sorted(products, key=lambda p: (-min(p.offers.count(), 5), -(1 if _best_offer_price(p) else 0), p.title))


def _browse_context(request, products, kind, title, subtitle, facet_kind):
    sort = request.GET.get('sort', 'relevance')
    if sort not in BROWSE_SORTS:
        sort = 'relevance'

    def parse_price(name):
        try:
            return float(request.GET.get(name))
        except (TypeError, ValueError):
            return None

    min_price = parse_price('min_price')
    max_price = parse_price('max_price')

    def price_of(p):
        return _best_offer_price(p) if _best_offer_price(p) is not None else (
            float(p.estimated_price_zar) if p.estimated_price_zar else None)

    if min_price is not None:
        products = [p for p in products if (pr := price_of(p)) is not None and pr >= min_price]
    if max_price is not None:
        products = [p for p in products if (pr := price_of(p)) is not None and pr <= max_price]

    products = _sort_browse_products(products, sort)

    facet_counts = {}
    for p in products:
        key = p.brand if facet_kind == 'brand' else (p.category_ref or 'other')
        facet_counts[key] = facet_counts.get(key, 0) + 1
    facets = [
        {'name': name, 'slug': slugify(name), 'count': count}
        for name, count in sorted(facet_counts.items(), key=lambda kv: -kv[1])[:12]
    ]

    try:
        page_num = max(int(request.GET.get('page', 1)), 1)
    except ValueError:
        page_num = 1
    total = len(products)
    total_pages = max(-(-total // BROWSE_PER_PAGE), 1)
    page_products = products[(page_num - 1) * BROWSE_PER_PAGE: page_num * BROWSE_PER_PAGE]
    for p in page_products:
        p.best_price = _best_offer_price(p)

    def page_url(n):
        params = request.GET.copy()
        params['page'] = n
        return f'{request.path}?{params.urlencode()}'

    page_links = [{'n': n, 'url': page_url(n), 'current': n == page_num}
                  for n in range(1, total_pages + 1)]

    hidden_params = [
        {'name': k, 'value': v}
        for k, v in request.GET.items()
        if k not in ('sort', 'page') and v
    ]

    jsonld_items = [
        {'url': f'/p/{p.canonical_id}/', 'name': p.title}
        for p in page_products
    ]

    return {
        'browse_kind': kind,
        'browse_title': title,
        'browse_subtitle': subtitle,
        'products': page_products,
        'facets': facets,
        'facet_kind': facet_kind,
        'sort': sort,
        'total_products': total,
        'page_num': page_num,
        'total_pages': total_pages,
        'page_links': page_links,
        'hidden_params': hidden_params,
        'jsonld': jsonld_script(itemlist_jsonld(f'{kind}: {title}', jsonld_items)),
    }


def category_view(request, slug):
    ref = slug.strip().lower().replace('-', '_')
    products = list(
        MasterProduct.objects.filter(category_ref__iexact=ref, status__in=['active', 'ACTIVE'])
        .prefetch_related('offers', 'offers__merchant')
    )
    if not products:
        products = list(
            MasterProduct.objects.filter(category_ref__icontains=ref, status__in=['active', 'ACTIVE'])
            .prefetch_related('offers', 'offers__merchant')[:120]
        )
    title = ref.replace('_', ' ').title()
    context = _browse_context(
        request, products, 'Category', title,
        f'Compare verified offers from South African merchants — 0% commission, direct contact.',
        'brand',
    )
    context['breadcrumbs'] = [
        {'label': 'Home', 'url': '/'},
        {'label': 'Categories', 'url': '/search/'},
        {'label': title, 'url': None},
    ]
    return render(request, 'catalog/browse_page.html', context)


def brand_view(request, slug):
    brand_name = slug.replace('-', ' ').title()
    products = []
    for candidate in (slug, slug.replace('-', ' '), slug.replace('-', '')):
        products = list(
            MasterProduct.objects.filter(brand__iexact=candidate, status__in=['active', 'ACTIVE'])
            .prefetch_related('offers', 'offers__merchant')
        )
        if products:
            brand_name = products[0].brand
            break
    if not products:
        products = list(
            MasterProduct.objects.filter(brand__icontains=slug.replace('-', ' '), status__in=['active', 'ACTIVE'])
            .prefetch_related('offers', 'offers__merchant')[:120]
        )
    context = _browse_context(
        request, products, 'Brand', brand_name,
        f'Every verified {brand_name} listing on the Shoppage grid — compare prices, stock and merchants.',
        'category',
    )
    context['breadcrumbs'] = [
        {'label': 'Home', 'url': '/'},
        {'label': 'Brands', 'url': '/search/'},
        {'label': brand_name, 'url': None},
    ]
    return render(request, 'catalog/browse_page.html', context)


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


def product_detail_view(request, canonical_id):
    product, matched_by_pk = _resolve_product(canonical_id)
    if not product:
        raise Http404("Product not found")
    if matched_by_pk:
        return HttpResponsePermanentRedirect(f'/p/{product.seo_handle}/')

    offers = list(
        product.offers
        .filter(availability_state__in=VISIBLE_STATES)
        .select_related('merchant', 'merchant__market')
    product = get_object_or_404(MasterProduct, canonical_id=canonical_id)

    if request.method == 'POST' and 'review_submit' in request.POST:
        _handle_product_review(request, product)
        from django.shortcuts import redirect
        return redirect(request.path)

    confirmed_offers = list(
        product.offers.select_related('merchant', 'merchant__market')
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
    bundle_items = variation_group or list(
        MasterProduct.objects.filter(
            category_ref=product.category_ref, status=ProductStatusChoices.ACTIVE
        ).exclude(canonical_id=product.canonical_id)[:2]
    )
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
            Q(title__icontains=product.brand) |
            Q(product_title__icontains=product.brand) |
            Q(summary__icontains=product.brand)
        )[:3])

    related_products = list(
        MasterProduct.objects.filter(
            category_ref=product.category_ref, status=ProductStatusChoices.ACTIVE
        ).exclude(canonical_id=product.canonical_id).prefetch_related('offers')[:3]
    )

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
        'reviews': list(product.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED)),
        'jsonld': jsonld_script(product_jsonld(product, confirmed_offers)),
    }
    return render(request, 'catalog/product_detail.html', context)


def _handle_product_review(request, product):
    """Validate and persist a product review (honeypot spam trap, no login required)."""
    if request.POST.get('website'):  # honeypot
        return
    try:
        rating = int(request.POST.get('rating', 0))
    except (TypeError, ValueError):
        return
    if not (1 <= rating <= 5):
        return
    Review.objects.create(
        product=product,
        author_name=(request.POST.get('author_name') or 'Verified Buyer')[:120],
        rating=rating,
        title=(request.POST.get('title') or '')[:200],
        body=(request.POST.get('body') or '')[:2000],
        is_verified_buyer=request.POST.get('is_verified_buyer') == 'on',
    )


def _handle_merchant_review(request, merchant):
    """Validate and persist a merchant review (honeypot spam trap, no login required)."""
    if request.POST.get('website'):  # honeypot
        return
    try:
        rating = int(request.POST.get('rating', 0))
    except (TypeError, ValueError):
        return
    if not (1 <= rating <= 5):
        return
    Review.objects.create(
        merchant=merchant,
        author_name=(request.POST.get('author_name') or 'Verified Buyer')[:120],
        rating=rating,
        title=(request.POST.get('title') or '')[:200],
        body=(request.POST.get('body') or '')[:2000],
        is_verified_buyer=request.POST.get('is_verified_buyer') == 'on',
    )

