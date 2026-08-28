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


def _url_entry(loc: str, lastmod=None, changefreq: str = 'daily', priority: str = '0.7', extra: str = '') -> str:
    lm = f'<lastmod>{lastmod:%Y-%m-%dT%H:%M:%S+00:00}</lastmod>' if lastmod else ''
    return (
        '<url>'
        f'<loc>{_xml_escape(loc)}</loc>'
        f'{lm}'
        f'<changefreq>{changefreq}</changefreq>'
        f'<priority>{priority}</priority>'
        f'{extra}'
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
            qs = (
                MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE)
                .prefetch_related('images')
            )
            if start_id is not None:
                qs = qs.filter(id__gt=start_id)
            for p in qs.order_by('id')[:SITEMAP_CHUNK]:
                img_xml = ''
                for im in p.images.all()[:3]:
                    im_url = im.url or ''
                    if not im_url:
                        continue
                    loc = im_url if im_url.startswith('http') else _join(base, im_url)
                    img_xml += (
                        '<image:image>'
                        f'<image:loc>{_xml_escape(loc)}</image:loc>'
                        f'<image:title>{_xml_escape((p.title or "")[:100])}</image:title>'
                        f'<image:caption>{_xml_escape((im.effective_alt or "")[:200])}</image:caption>'
                        '</image:image>'
                    )
                entries.append(_url_entry(
                    _join(base, f'/p/{p.seo_handle}/'),
                    lastmod=p.updated_at, changefreq='daily', priority='0.8', extra=img_xml))
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
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
            + (' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' if name == 'products' else '')
            + '>'
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
    # Individual Review entries when the summary carries real review text.
    raw_reviews = summary.get('reviews') or summary.get('items') or []
    review_entries = []
    if isinstance(raw_reviews, list):
        for r in raw_reviews[:5]:
            if not isinstance(r, dict):
                continue
            body = str(r.get('reviewBody') or r.get('text') or r.get('comment') or '').strip()
            try:
                rv = float(r.get('ratingValue') or r.get('rating') or 0)
            except (TypeError, ValueError):
                continue
            if not body or not 1 <= rv <= 5:
                continue
            author = str(r.get('author') or r.get('name') or r.get('reviewer') or 'Verified buyer')[:80]
            review_entries.append({
                '@type': 'Review',
                'author': {'@type': 'Person', 'name': author},
                'reviewRating': {'@type': 'Rating', 'ratingValue': rv, 'bestRating': 5},
                'reviewBody': body[:500],
            })
    if review_entries:
        data['review'] = review_entries

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
    # GMB-level attributes: logo, accepted payments, currency, service area.
    if merchant.public_image_url:
        data['logo'] = merchant.public_image_url
    methods = [m for m in (merchant.payment_methods or []) if isinstance(m, str)]
    if methods:
        data['paymentAccepted'] = ', '.join(methods[:8])
    data['currenciesAccepted'] = 'ZAR'
    if merchant.province:
        data['areaServed'] = merchant.province
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


def web_site_jsonld(request=None) -> dict[str, Any]:
    """Site-wide WebSite + SearchAction (sitelinks search box eligibility)."""
    base = site_url(request)
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Shoppage',
        'url': f'{base}/',
        'publisher': {'@id': f'{base}/#organization'},
        'potentialAction': {
            '@type': 'SearchAction',
            'target': {
                '@type': 'EntryPoint',
                'urlTemplate': f'{base}/search/?q={{search_term_string}}',
            },
            'query-input': 'required name=search_term_string',
        },
    }


def organization_jsonld(request=None) -> dict[str, Any]:
    """Site-level Organization (Knowledge Panel publisher)."""
    from django.conf import settings

    base = site_url(request)
    data: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': f'{base}/#organization',
        'name': 'Shoppage',
        'url': f'{base}/',
        'logo': {'@type': 'ImageObject', 'url': f'{base}/static/icons/og-image.png'},
        'description': (
            'South Africa National Commerce Grid — compare merchant-confirmed prices, '
            'local stock and verified traders across the commerce grid.'
        ),
    }
    same_as = list(getattr(settings, 'SITE_SAME_AS', []) or [])
    if same_as:
        data['sameAs'] = same_as
    return data


def _iso_duration(raw: Any) -> str:
    """'MM:SS' / 'HH:MM:SS' -> ISO-8601 ('PT4M5S'); '' when unparseable."""
    text = str(raw or '').strip()
    if not text:
        return ''
    parts = text.split(':')
    try:
        nums = [int(float(p)) for p in parts]
    except ValueError:
        return ''
    if len(nums) == 3:
        h, m, s = nums
    elif len(nums) == 2:
        h, m, s = 0, nums[0], nums[1]
    elif len(nums) == 1:
        h, m, s = 0, 0, nums[0]
    else:
        return ''
    out = 'PT'
    if h:
        out += f'{h}H'
    if m:
        out += f'{m}M'
    if s or out == 'PT':
        out += f'{s}S'
    return out


def video_jsonld(obj, request=None) -> dict[str, Any]:
    """VideoObject for Show/Short items (both expose video_url/thumbnail_url/views)."""
    base = site_url(request)
    title = (getattr(obj, 'title', '') or '').strip()
    description = (
        (getattr(obj, 'description', '') or '') or (getattr(obj, 'summary', '') or '')
    ).strip() or title
    canonical = getattr(obj, 'canonical_id', '') or str(getattr(obj, 'pk', ''))
    if hasattr(obj, 'slug'):
        path = f'/shows/{obj.slug}/'
    else:
        # Shorts have no dedicated pages yet; point at the directory.
        path = '/shorts/'
    data: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        'name': title[:200],
        'description': description[:500],
        'contentUrl': getattr(obj, 'video_url', '') or '',
        'url': f'{base}{path}',
    }
    thumb = (getattr(obj, 'thumbnail_url', '') or '').strip()
    if thumb:
        data['thumbnailUrl'] = [thumb if thumb.startswith('http') else f'{base}{thumb}']
    duration = _iso_duration(getattr(obj, 'duration', ''))
    if duration:
        data['duration'] = duration
    created = getattr(obj, 'created_at', None)
    if created:
        data['uploadDate'] = created.strftime('%Y-%m-%d')
    views = getattr(obj, 'views', None)
    if views:
        data['interactionStatistic'] = {
            '@type': 'InteractionCounter',
            'interactionType': 'https://schema.org/ViewAction',
            'userInteractionCount': int(views),
        }
    return data


def video_list_jsonld(objs, request=None) -> dict[str, Any]:
    """ItemList of VideoObjects for the shorts/shows directory pages."""
    items = [
        {'@type': 'ListItem', 'position': position, 'item': video_jsonld(obj, request)}
        for position, obj in enumerate(objs, start=1)
    ]
    return {'@context': 'https://schema.org', '@type': 'ItemList', 'itemListElement': items}


def jsonld_script(data: dict[str, Any]) -> str:
    import json as _json
    return _json.dumps(data, separators=(',', ':'), default=str)
