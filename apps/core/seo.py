"""
Shoppage SEO Layer (v8.2 Modernization)

Machine-readable surface so search engines can index the commerce grid:
- robots.txt with sitemap pointer
- Segmented, chunked XML sitemaps (products / merchants / markets / static)
- JSON-LD structured data builders (Product+Offer, LocalBusiness, ShoppingCenter)

All data is destination-neutral per constitution Rule 2 (no ownership claims).
"""

from __future__ import annotations

from typing import Any, Dict, List

from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse

SITE_URL = getattr(settings, 'SHOPPAGE_SITE_URL', 'https://shoppage.co.za')
SITEMAP_CHUNK = 10_000


def _xml_escape(s: str) -> str:
    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace(
        '>', '&gt;').replace('"', '&quot;')


def robots_txt_view(request) -> HttpResponse:
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /merchant/dashboard/',
        'Disallow: /api/',
        'Disallow: /search/live/',
        '',
        f'Sitemap: {SITE_URL}/sitemap.xml',
        '',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def _url_entry(loc: str, lastmod=None, changefreq: str = 'daily', priority: str = '0.7') -> str:
    lm = f'<lastmod>{lastmod:%Y-%m-%d}</lastmod>' if lastmod else ''
    return (
        '<url>'
        f'<loc>{_xml_escape(loc)}</loc>'
        f'{lm}'
        f'<changefreq>{changefreq}</changefreq>'
        f'<priority>{priority}</priority>'
        '</url>'
    )


def sitemap_index_view(request) -> HttpResponse:
    """Sitemap index pointing at segmented sitemaps."""
    from apps.catalog.models import MasterProduct
    from apps.merchants.models import Merchant
    from apps.markets.models import Market

    def segments(count: int, name: str) -> List[str]:
        out = []
        for i in range(0, max(count, 1), SITEMAP_CHUNK):
            page = i // SITEMAP_CHUNK + 1
            out.append(f'{SITE_URL}/sitemap-{name}-{page}.xml')
        return out

    urls: List[str] = []
    urls += segments(MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).count(), 'products')
    urls += segments(Merchant.objects.count(), 'merchants')
    urls += segments(Market.objects.count(), 'markets')
    urls.append(f'{SITE_URL}/sitemap-static.xml')

    body = ''.join(f'<sitemap><loc>{u}</loc></sitemap>' for u in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f'{body}</sitemapindex>'
    )
    return HttpResponse(xml, content_type='application/xml')


def _paged_sitemap(name: str, page: int):
    def view(request) -> HttpResponse:
        from apps.catalog.models import MasterProduct
        from apps.merchants.models import Merchant
        from apps.markets.models import Market

        start = (page - 1) * SITEMAP_CHUNK
        end = start + SITEMAP_CHUNK
        entries: List[str] = []

        if name == 'products':
            qs = (MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
                  .order_by('id')[start:end])
            for p in qs:
                entries.append(_url_entry(
                    f'{SITE_URL}/p/{p.canonical_id}/',
                    lastmod=p.updated_at, changefreq='daily', priority='0.8'))
        elif name == 'merchants':
            qs = Merchant.objects.order_by('id')[start:end]
            for m in qs:
                entries.append(_url_entry(
                    f'{SITE_URL}/m/{m.canonical_id}/',
                    lastmod=m.updated_at, changefreq='weekly', priority='0.6'))
        elif name == 'markets':
            qs = Market.objects.order_by('id')[start:end]
            for mk in qs:
                entries.append(_url_entry(
                    f'{SITE_URL}/markets/{mk.canonical_slug}/',
                    lastmod=mk.updated_at, changefreq='weekly', priority='0.5'))

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + ''.join(entries) + '</urlset>'
        )
        return HttpResponse(xml, content_type='application/xml')
    return view


def static_sitemap_view(request) -> HttpResponse:
    entries = [
        _url_entry(f'{SITE_URL}/', changefreq='hourly', priority='1.0'),
        _url_entry(f'{SITE_URL}/search/', changefreq='daily', priority='0.9'),
        _url_entry(f'{SITE_URL}/malls/', changefreq='weekly', priority='0.6'),
        _url_entry(f'{SITE_URL}/merchants/', changefreq='weekly', priority='0.6'),
        _url_entry(f'{SITE_URL}/shorts/', changefreq='daily', priority='0.5'),
        _url_entry(f'{SITE_URL}/shows/', changefreq='weekly', priority='0.5'),
        _url_entry(f'{SITE_URL}/merchant/claim/', changefreq='monthly', priority='0.4'),
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

def product_jsonld(product, offers=None) -> Dict[str, Any]:
    """Product schema with Offer(s). Destination-neutral wording (Rule 2)."""
    offers = offers if offers is not None else []
    priced = [o for o in offers if o.price_amount]
    data: Dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.title,
        'sku': product.canonical_id,
        'category': product.category_ref,
        'url': f'{SITE_URL}/p/{product.canonical_id}/',
    }
    if product.brand:
        data['brand'] = {'@type': 'Brand', 'name': product.brand}
    if product.gtin13:
        data['gtin13'] = product.gtin13
    if product.mpn:
        data['mpn'] = product.mpn

    if len(priced) > 1:
        prices = [float(o.price_amount) for o in priced]
        data['offers'] = {
            '@type': 'AggregateOffer',
            'lowPrice': min(prices),
            'highPrice': max(prices),
            'priceCurrency': priced[0].currency,
            'offerCount': len(priced),
        }
    elif priced:
        o = priced[0]
        offer: Dict[str, Any] = {
            '@type': 'Offer',
            'price': float(o.price_amount),
            'priceCurrency': o.currency,
            'availability': (
                'https://schema.org/InStock'
                if o.availability_state in ('fresh', 'confirm_required')
                else 'https://schema.org/OutOfStock'
            ),
        }
        if o.merchant:
            offer['seller'] = {'@type': 'Organization', 'name': o.merchant.name}
        data['offers'] = offer
    return data


def merchant_jsonld(merchant) -> Dict[str, Any]:
    data: Dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        'name': merchant.name,
        'address': {
            '@type': 'PostalAddress',
            'addressCountry': merchant.country,
            'addressRegion': merchant.province or '',
            'streetAddress': merchant.address_text or '',
        },
    }
    if merchant.telephone:
        data['telephone'] = merchant.telephone
    if merchant.latitude and merchant.longitude:
        data['geo'] = {
            '@type': 'GeoCoordinates',
            'latitude': float(merchant.latitude),
            'longitude': float(merchant.longitude),
        }
    if merchant.google_rating:
        data['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': float(merchant.google_rating),
            'reviewCount': max(merchant.google_reviews_count, 1),
        }
    return data


def market_jsonld(market) -> Dict[str, Any]:
    data: Dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'ShoppingCenter',
        'name': market.name,
        'address': {
            '@type': 'PostalAddress',
            'addressCountry': market.country,
            'addressRegion': market.province,
            'streetAddress': market.street_address or '',
        },
    }
    if market.latitude and market.longitude:
        data['geo'] = {
            '@type': 'GeoCoordinates',
            'latitude': float(market.latitude),
            'longitude': float(market.longitude),
        }
    return data


def jsonld_script(data: Dict[str, Any]) -> str:
    import json as _json
    return _json.dumps(data, separators=(',', ':'), default=str)
