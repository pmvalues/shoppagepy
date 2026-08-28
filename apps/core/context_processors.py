from django.conf import settings
from django.core.cache import cache

from apps.core.signals import data_version  # re-exported for callers

COUNTER_TTL = 3600


def _cached_count(model_label: str, key: str) -> int:
    value = cache.get(key)
    if value is not None:
        return value
    from django.apps import apps

    value = apps.get_model(model_label).objects.count()
    cache.set(key, value, COUNTER_TTL)
    return value


def shoppage_global_context(request):
    """
    Baseline context for every template: measured grid counters (never literals),
    the request-resolved public origin, and social/verification metadata.
    """
    from apps.core.seo import site_url

    try:
        from apps.core.seo import jsonld_script, web_site_jsonld, organization_jsonld

        site_jsonld = jsonld_script([web_site_jsonld(request), organization_jsonld(request)])
    except Exception:
        site_jsonld = ''

    counts: dict[str, int] = {}
    for label, key, var in (
        ('catalog.MasterProduct', 'sp:count:products', 'total_products_count'),
        ('merchants.Merchant', 'sp:count:merchants', 'total_merchants_count'),
        ('markets.Market', 'sp:count:markets', 'total_malls_count'),
    ):
        try:
            counts[var] = _cached_count(label, key)
        except Exception:  # an unreachable database must not break the page shell
            counts[var] = 0

    default_og_image = f"{site_url(request)}/static/icons/og-image.png"
    return {
        'site_url': site_url(request),
        'site_title': 'Shoppage — South Africa National Commerce Grid',
        'site_description': (
            'Compare merchant-confirmed prices, local stock and verified traders '
            'across the South African commerce grid.'
        ),
        'page_title': 'Shoppage — South Africa National Commerce Grid',
        'meta_description': (
            'Compare merchant-confirmed prices, local stock and verified traders '
            'across the South African commerce grid.'
        ),
        'canonical_path': request.path,
        'og_type': 'website',
        'og_locale': 'en_ZA',
        'og_image_url': '',
        'default_og_image': default_og_image,
        'og_image_alt': 'Shoppage — South Africa National Commerce Grid',
        'robots_meta': 'index,follow,max-image-preview:large',
        'twitter_handle': '@ShoppageZA',
        'provinces_count': 9,
        'google_site_verification': getattr(settings, 'GOOGLE_SITE_VERIFICATION', ''),
        'bing_site_verification': getattr(settings, 'BING_SITE_VERIFICATION', ''),
        'site_jsonld': site_jsonld,
        **counts,
    }
