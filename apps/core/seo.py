"""
Shoppage SEO layer.

Machine-readable surface so search engines can index the commerce grid:
- robots.txt with sitemap pointer
- Segmented, chunked XML sitemaps (products / merchants / markets / static)
- JSON-LD builders: Product+Offer, Store, ShoppingCenter, BreadcrumbList,
  SearchResultsPage+ItemList

Structured data asserts only what the record actually holds — no image, rating or
identifier is emitted unless the underlying data exists — and all copy stays
destination-neutral per constitution Rule 2.
"""

from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse

SITEMAP_CHUNK = 10_000


def site_url(request=None) -> str:
    """Absolute origin. Explicit configuration wins; otherwise the served host."""
    configured = (getattr(settings, 'SHOPPAGE_SITE_URL', '') or '').strip().rstrip('/')
    if configured:
        return configured
    if request is not None:
        return request.build_absolute_uri('/').rstrip('/')
    return ''


def _join(base: str, path: str) -> str:
    return f'{base}{path}'


def _xml_escape(s: str) -> str:
    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace(
        '>', '&gt;').replace('"', '&quot;')


def robots_txt_view(request) -> HttpResponse:
    base = site_url(request)
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /merchant/dashboard/',
        'Disallow: /accounts/',
        'Disallow: /api/feeds/',
        'Disallow: /api/',
        'Disallow: /search/live/',
        '',
        f'Sitemap: {_join(base, "/sitemap.xml")}',
        '',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def _url_entry(loc: str, lastmod=None, changefreq: str = 'daily', priority: str = '0.7') -> str:
    lm = f'<lastmod>{lastmod:%Y-%m-%dT%H:%M:%S+00:00}</lastmod>' if lastmod else ''
    return (
        '<url>'
        f'<loc>{_xml_escape(loc)}</loc>'
        f'{lm}'
        f'<changefreq>{changefreq}</changefreq>'
        f'<priority>{priority}</priority>'
        '</url>'
    )


def _cached_count(qs, key: str) -> int:
    cached = cache.get(key)
    if cached is None:
        cached = qs.count()
        cache.set(key, cached, 3600)
    return cached


def sitemap_index_view(request) -> HttpResponse:
    """Sitemap index pointing at segmented sitemaps."""
    from apps.catalog.models import MasterProduct, ProductStatusChoices
    from apps.markets.models import Market
    from apps.merchants.models import Merchant

    base = site_url(request)

    def segments(count: int, name: str) -> list[str]:
        out = []
        for i in range(0, max(count, 1), SITEMAP_CHUNK):
            page = i // SITEMAP_CHUNK + 1
            out.append(_join(base, f'/sitemap-{name}-{page}.xml'))
        return out

    urls: list[str] = []
    urls += segments(_cached_count(
        MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE), 'sp:count:products'), 'products')
    urls += segments(_cached_count(Merchant.objects.all(), 'sp:count:merchants'), 'merchants')
    urls += segments(_cached_count(Market.objects.all(), 'sp:count:markets'), 'markets')
    urls.append(_join(base, '/sitemap-static.xml'))

    body = ''.join(f'<sitemap><loc>{_xml_escape(u)}</loc></sitemap>' for u in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f'{body}</sitemapindex>'
    )
    return HttpResponse(xml, content_type='application/xml')


def _paged_sitemap(name: str, default_page: int = 1):
    def view(request, page: int = default_page) -> HttpResponse:
        from apps.catalog.models import MasterProduct, ProductStatusChoices
        from apps.markets.models import Market
        from apps.merchants.models import Merchant

        base = site_url(request)
        page_num = max(1, page)
        start = (page_num - 1) * SITEMAP_CHUNK
        entries: list[str] = []

        # Keyset pagination: resolve the boundary id with a lightweight id-only
        # query, then range-scan. Avoids deep OFFSET over multi-million-row tables.
        model = {'products': MasterProduct, 'merchants': Merchant, 'markets': Market}.get(name)
        start_id = None
        if start > 0 and model is not None:
            try:
                start_id = model.objects.order_by('id').values_list('id', flat=True)[start]
            except IndexError:
                start_id = None

        if name == 'products':
            qs = MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE)
            if start_id is not None:
                qs = qs.filter(id__gt=start_id)
            for p in qs.order_by('id')[:SITEMAP_CHUNK]:
                entries.append(_url_entry(
                    _join(base, f'/p/{p.seo_handle}/'),
                    lastmod=p.updated_at, changefreq='daily', priority='0.8'))
        elif name == 'merchants':
            qs = Merchant.objects.all()
            if start_id is not None:
                qs = qs.filter(id__gt=start_id)
            for m in qs.order_by('id')[:SITEMAP_CHUNK]:
                entries.append(_url_entry(
                    _join(base, f'/m/{m.canonical_id}/'),
                    lastmod=m.updated_at, changefreq='weekly', priority='0.6'))
        elif name == 'markets':
            qs = Market.objects.all()
            if start_id is not None:
                qs = qs.filter(id__gt=start_id)
            for mk in qs.order_by('id')[:SITEMAP_CHUNK]:
                entries.append(_url_entry(
                    _join(base, f'/markets/{mk.canonical_slug}/'),
                    lastmod=mk.updated_at, changefreq='weekly', priority='0.5'))

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + ''.join(entries) + '</urlset>'
        )
        return HttpResponse(xml, content_type='application/xml')
    return view


def static_sitemap_view(request) -> HttpResponse:
    base = site_url(request)
    entries = [
        _url_entry(_join(base, '/'), changefreq='hourly', priority='1.0'),
        _url_entry(_join(base, '/search/'), changefreq='daily', priority='0.9'),
        _url_entry(_join(base, '/malls/'), changefreq='weekly', priority='0.6'),
        _url_entry(_join(base, '/merchants/'), changefreq='weekly', priority='0.6'),
        _url_entry(_join(base, '/shorts/'), changefreq='daily', priority='0.5'),
        _url_entry(_join(base, '/shows/'), changefreq='weekly', priority='0.5'),
        _url_entry(_join(base, '/merchant/claim/'), changefreq='monthly', priority='0.4'),
    ]
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + ''.join(entries) + '</urlset>'
    )
    return HttpResponse(xml, content_type='application/xml')


# ---------------------------------------------------------------------------
# JSON-LD structured data builders
# ---------------------------------------------------------------------------

def _hours_spec(hours: Any) -> list[dict[str, Any]]:
    from apps.core.hours import DAY_KEYS, normalize_hours

    schedule = normalize_hours(hours)
    if not schedule:
        return []
    spec = []
    for day in DAY_KEYS:
        window = schedule.get(day)
        if not window:
            continue
        spec.append({
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': f'https://schema.org/{day.title()}day',
            'opens': window['open'],
            'closes': window['close'],
        })
    return spec


def _address(country: str, *, street: str = '', region: str = '', locality: str = '', postal: str = '') -> dict[str, str]:
    data: dict[str, str] = {'@type': 'PostalAddress'}
    if street:
        data['streetAddress'] = street
    if locality:
        data['addressLocality'] = locality
    if region:
        data['addressRegion'] = region
    if postal:
        data['postalCode'] = postal
    if country:
        data['addressCountry'] = country
    return data


def _geo(latitude, longitude):
    if latitude is None or longitude is None:
        return None
    try:
        return {'@type': 'GeoCoordinates', 'latitude': float(latitude), 'longitude': float(longitude)}
    except (TypeError, ValueError):
        return None


def _offer_ld(offer, base: str) -> dict[str, Any]:
    data: dict[str, Any] = {
        '@type': 'Offer',
        'url': f'{base}/p/{offer.variant.seo_handle}/',
        'price': float(offer.price_amount),
        'priceCurrency': offer.currency,
        'availability': offer.schema_availability,
        'availabilityStarts': offer.last_confirmed_at.isoformat() if offer.last_confirmed_at else None,
    }
    if offer.expires_at:
        data['validThrough'] = offer.expires_at.isoformat()
    if offer.merchant_id and offer.merchant:
        data['seller'] = {'@type': 'Organization', 'name': offer.merchant.name}
    return {k: v for k, v in data.items() if v is not None}


def product_jsonld(product, offers=None, request=None) -> dict[str, Any]:
    """Product schema with Offer(s). Destination-neutral wording (Rule 2)."""
    base = site_url(request)
    url = f'{base}/p/{product.seo_handle}/'
    offers = list(offers) if offers is not None else list(product.offers.all())
    priced = [o for o in offers if o.price_amount]

    data: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.title,
        'sku': product.canonical_id,
        'category': product.category_ref,
        'url': url,
    }
    description = (product.listing_description or '').strip()
    if description:
        data['description'] = description[:500]
    images = product.image_urls
    if images:
        data['image'] = [img if img.startswith('http') else f'{base}{img}' for img in images]
    if product.brand:
        data['brand'] = {'@type': 'Brand', 'name': product.brand}
    if product.mpn:
        data['mpn'] = product.mpn
    for field, digits in product.gtin_pairs:
        data[field] = digits
    if product.model_number:
        data['model'] = product.model_number
    attributes = product.attributes if isinstance(product.attributes, dict) else {}
    props = [
        {'@type': 'PropertyValue', 'name': str(key), 'value': str(value)}
        for key, value in list(attributes.items())[:12]
        if value not in (None, '', [], {})
    ]
    if props:
        data['additionalProperty'] = props
    if product.condition_type and product.condition_type != 'new':
        data['itemCondition'] = f'https://schema.org/{product.condition_type.capitalize()}Condition'

    summary = product.reviews_summary if isinstance(product.reviews_summary, dict) else {}
    rating_value = summary.get('ratingValue') or summary.get('average')
    rating_count = summary.get('reviewCount') or summary.get('count')
    if rating_value and rating_count:
        data['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': float(rating_value),
            'reviewCount': int(rating_count),
            'bestRating': 5,
        }

    publishable = [o for o in priced if o.availability_state in ('fresh', 'confirm_required', 'quote_required')]
    if len(publishable) > 1:
        prices = [float(o.price_amount) for o in publishable]
        data['offers'] = {
            '@type': 'AggregateOffer',
            'lowPrice': min(prices),
            'highPrice': max(prices),
            'priceCurrency': publishable[0].currency,
            'offerCount': len(publishable),
            'availability': 'https://schema.org/InStock',
            'offers': [_offer_ld(o, base) for o in publishable[:5]],
        }
    elif publishable:
        data['offers'] = _offer_ld(publishable[0], base)
    elif priced:
        o = priced[0]
        data['offers'] = {
            '@type': 'AggregateOffer',
            'lowPrice': float(min(o.price_amount for o in priced)),
            'highPrice': float(max(o.price_amount for o in priced)),
            'priceCurrency': o.currency,
            'offerCount': len(priced),
            'availability': 'https://schema.org/OutOfStock',
        }
    return data


def merchant_jsonld(merchant, request=None) -> dict[str, Any]:
    base = site_url(request)
    data: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        'name': merchant.name,
        'url': f'{base}/m/{merchant.canonical_id}/',
        'address': _address(
            merchant.country or '', street=merchant.address_text or '',
            region=merchant.province or '', locality=merchant.locality or '',
            postal=merchant.postal_code or '',
        ),
    }
    if merchant.telephone:
        data['telephone'] = merchant.telephone
    if merchant.public_image_url:
        data['image'] = merchant.public_image_url
    if merchant.primary_category:
        data['genre'] = merchant.primary_category
    geo = _geo(merchant.latitude, merchant.longitude)
    if geo:
        data['geo'] = geo
    hours = _hours_spec(merchant.opening_hours)
    if hours:
        data['openingHoursSpecification'] = hours
    if merchant.google_maps_url:
        data['hasMap'] = merchant.google_maps_url
    same_as = [link for link in (merchant.website_url, merchant.google_maps_url, merchant.google_reviews_url) if link]
    if same_as:
        data['sameAs'] = same_as
    if merchant.google_rating and merchant.rating_count:
        data['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': float(merchant.google_rating),
            'reviewCount': merchant.rating_count,
            'bestRating': 5,
        }
    return data


def market_jsonld(market, request=None) -> dict[str, Any]:
    base = site_url(request)
    data: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'ShoppingCenter',
        'name': market.name,
        'url': f'{base}/markets/{market.canonical_slug}/',
        'address': _address(
            market.country or '', street=market.street_address or '',
            region=market.province or '', locality=market.locality or market.metro or '',
            postal=market.postal_code or '',
        ),
    }
    if market.public_image_url:
        data['image'] = market.public_image_url
    geo = _geo(market.latitude, market.longitude)
    if geo:
        data['geo'] = geo
    hours = _hours_spec(market.opening_hours)
    if hours:
        data['openingHoursSpecification'] = hours
    if market.google_maps_url:
        data['hasMap'] = market.google_maps_url
    if market.operating_hours:
        data['abstract'] = market.operating_hours
    return data


def breadcrumb_jsonld(crumbs, request=None) -> dict[str, Any]:
    """crumbs: ordered (name, url_path_or_None) pairs, last one being the page."""
    base = site_url(request)
    items = []
    for position, (name, path) in enumerate(crumbs, start=1):
        item: dict[str, Any] = {'@type': 'ListItem', 'position': position, 'name': name}
        if path:
            item['item'] = f'{base}{path}'
        items.append(item)
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items}


def search_results_jsonld(query: str, items, request=None, total: int | None = None) -> dict[str, Any]:
    """SearchResultsPage + ItemList so product intent pages are eligible for rich results."""
    from urllib.parse import quote

    base = site_url(request)
    entry = [
        {'@type': 'ListItem', 'position': position, 'url': url, 'name': name}
        for position, (name, url) in enumerate(items, start=1)
    ]
    return {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        'url': f'{base}/search/?q={quote(query or "")}',
        'name': f'{query} — Shoppage search results' if query else 'Shoppage search results',
        'mainEntity': {
            '@type': 'ItemList',
            'numberOfItems': total if total is not None else len(entry),
            'itemListElement': entry,
        },
    }


def jsonld_script(data: dict[str, Any]) -> str:
    import json as _json
    return _json.dumps(data, separators=(',', ':'), default=str)
