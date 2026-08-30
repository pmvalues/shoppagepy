from urllib.parse import urlencode

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag(takes_context=True)
def facet_url(context, key, value=''):
    """
    Current search query string with one parameter set (or removed when the
    value is empty or already active — click-to-toggle facets). Always drops
    'offset' so filtered/sorted views return to page 1.
    """
    request = context.get('request')
    if request is None:
        return ''
    params = {k: v for k, v in request.GET.items() if k != 'offset' and v}
    if not value or str(params.get(key, '')) == str(value):
        params.pop(key, None)
    else:
        params[key] = value
    return urlencode(params)

@register.filter
def get_item(dictionary, key):
    """
    Template filter to look up a key dynamically from a dictionary.
    Usage: {{ dict|get_item:key }}
    """
    if isinstance(dictionary, dict):
        return dictionary.get(key)
    return None

@register.filter
def mul(value, arg):
    """Multiplies value by arg."""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return ''

@register.filter
def multiply(value, arg):
    """Alias for mul."""
    return mul(value, arg)

@register.filter
def div(value, arg):
    """Divides value by arg."""
    try:
        return float(value) / float(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return ''

@register.filter(is_safe=True)
def product_svg(product_or_title, size="medium"):
    """
    Placeholder artwork for a product with no photograph.

    Only states things that are true of the product it is drawn for: the brand
    and a "no photo yet" caption. Category shapes are decorative and carry no
    specification, certification or stock claim — an earlier version stamped
    "SABS 50197-1", "NRS 097-2-1", "ICASA", capacities and "IN STOCK" onto the
    artwork of any imageless product, which invented compliance marks.
    """
    title = ''
    cat = ''
    brand = ''
    if isinstance(product_or_title, str):
        # str has a .title() method, so this must be checked before hasattr.
        title = product_or_title.lower()
    elif product_or_title is not None:
        title = str(getattr(product_or_title, 'title', '') or '').lower()
        cat = str(getattr(product_or_title, 'category_ref', '') or '').lower()
        brand = str(getattr(product_or_title, 'brand', '') or '').upper()

    dim = "120" if size == "small" else ("160" if size == "medium" else "220")

    # Category only chooses a shape and a palette — never a claim.
    if 'batter' in cat or any(w in title for w in ('battery', 'lifepo4', 'dyness', 'hubble', 'pylon')):
        glyph, accent = 'battery', '#10B981'
    elif any(w in title for w in ('inverter', 'solar', 'panel', 'deye', 'sunsynk', 'growatt')) or 'solar' in cat:
        glyph, accent = 'inverter', '#F59E0B'
    elif any(w in title for w in ('phone', 'smart', 'galaxy', 'iphone', 'xiaomi')) or 'smartphone' in cat:
        glyph, accent = 'device', '#3B82F6'
    elif any(w in title for w in ('cement', 'drill', 'hardware', 'board', 'timber')) or 'hardware' in cat or 'building' in cat:
        glyph, accent = 'crate', '#64748B'
    else:
        glyph, accent = 'crate', '#94A3B8'

    brand_text = (brand[:16] if brand else '')
    label = '<text x="80" y="140" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="9" font-weight="700" fill="#94A3B8" letter-spacing="0.5">NO PHOTO YET</text>'
    if brand_text:
        brand_markup = (
            '<text x="80" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"'
            f' font-size="10" font-weight="800" fill="#475569">{_svg_escape(brand_text)}</text>'
        )
    else:
        brand_markup = ''

    if glyph == 'battery':
        shape = (
            '<rect x="26" y="46" width="108" height="72" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>'
            f'<rect x="36" y="58" width="14" height="8" rx="2" fill="{accent}"/>'
            f'<rect x="56" y="58" width="14" height="8" rx="2" fill="{accent}"/>'
            f'<rect x="76" y="58" width="14" height="8" rx="2" fill="{accent}"/>'
            '<rect x="136" y="66" width="8" height="32" rx="2" fill="#475569"/>'
        )
    elif glyph == 'inverter':
        shape = (
            '<rect x="34" y="38" width="92" height="90" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>'
            '<rect x="46" y="50" width="68" height="40" rx="5" fill="#0F172A"/>'
            f'<circle cx="118" cy="104" r="6" fill="{accent}"/>'
            f'<rect x="46" y="100" width="34" height="18" rx="3" fill="{accent}" fill-opacity="0.18" stroke="{accent}"/>'
        )
    elif glyph == 'device':
        shape = (
            '<rect x="54" y="36" width="52" height="96" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>'
            f'<rect x="60" y="44" width="40" height="76" rx="8" fill="{accent}" fill-opacity="0.35"/>'
            '<circle cx="80" cy="126" r="3" fill="#475569"/>'
        )
    else:
        shape = (
            '<rect x="30" y="48" width="100" height="70" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>'
            f'<path d="M40 78L56 64L72 76L88 62L120 84" stroke="{accent}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            '<rect x="30" y="92" width="100" height="26" rx="4" fill="#F1F5F9" stroke="#E2E8F0"/>'
        )

    return mark_safe(
        f'<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" role="img" '
        'xmlns="http://www.w3.org/2000/svg" aria-label="No product photo available yet">'
        f'<title>No product photo available yet</title>'
        f'<rect width="160" height="160" rx="14" fill="#F8FAFC"/>{brand_markup}{shape}{label}</svg>'
    )


def _svg_escape(value: str) -> str:
    return (
        str(value).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        .replace('"', '&quot;')
    )

@register.filter(is_safe=True)
def merchant_svg(merchant, size="medium"):
    """
    Renders professional store vector artwork.
    """
    dim = "90" if size == "small" else "110"
    return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  <path d="M25 45L60 25L95 45V95H25V45Z" fill="#FFFFFF" stroke="#334155" stroke-width="2"/>
  <rect x="48" y="60" width="24" height="35" rx="3" fill="#10B981"/>
  <circle cx="66" cy="78" r="2" fill="#FFFFFF"/>
  <rect x="32" y="55" width="12" height="18" rx="2" fill="#3B82F6"/>
  <rect x="76" y="55" width="12" height="18" rx="2" fill="#3B82F6"/>
  <path d="M20 45L60 22L100 45" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
</svg>''')

@register.filter(is_safe=True)
def mall_svg(market, size="medium"):
    """
    Renders professional shopping centre / commercial hub vector artwork.
    """
    dim = "90" if size == "small" else "110"
    return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  <rect x="24" y="36" width="32" height="60" rx="3" fill="#FFFFFF" stroke="#334155" stroke-width="1.5"/>
  <rect x="56" y="24" width="40" height="72" rx="3" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
  <rect x="30" y="44" width="6" height="8" rx="1" fill="#94A3B8"/>
  <rect x="42" y="44" width="6" height="8" rx="1" fill="#94A3B8"/>
  <rect x="30" y="58" width="6" height="8" rx="1" fill="#94A3B8"/>
  <rect x="42" y="58" width="6" height="8" rx="1" fill="#94A3B8"/>
  <rect x="64" y="34" width="8" height="10" rx="1" fill="#60A5FA"/>
  <rect x="80" y="34" width="8" height="10" rx="1" fill="#60A5FA"/>
  <rect x="64" y="50" width="8" height="10" rx="1" fill="#60A5FA"/>
  <rect x="80" y="50" width="8" height="10" rx="1" fill="#60A5FA"/>
  <rect x="68" y="76" width="16" height="20" rx="2" fill="#10B981"/>
</svg>''')


