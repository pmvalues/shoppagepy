from django import template
from django.utils.safestring import mark_safe

register = template.Library()

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
    Renders professional, crisp, enterprise-grade vector product artwork
    matching Google Shopping and Takealot standards.
    """
    title = ""
    cat = ""
    if hasattr(product_or_title, 'title'):
        title = product_or_title.title.lower()
        cat = getattr(product_or_title, 'category_ref', '').lower()
    elif isinstance(product_or_title, str):
        title = product_or_title.lower()

    dim = "120" if size == "small" else ("160" if size == "medium" else "220")

    # 1. LiFePO4 Lithium Battery / Power Storage
    if 'battery' in title or 'lifepo4' in title or 'dyness' in title or 'hubble' in title or 'pylon' in title:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="32" width="120" height="96" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  <rect x="28" y="42" width="104" height="28" rx="4" fill="#0F172A"/>
  <rect x="36" y="52" width="12" height="8" rx="2" fill="#10B981"/>
  <rect x="52" y="52" width="12" height="8" rx="2" fill="#10B981"/>
  <rect x="68" y="52" width="12" height="8" rx="2" fill="#10B981"/>
  <rect x="84" y="52" width="12" height="8" rx="2" fill="#10B981"/>
  <rect x="100" y="52" width="12" height="8" rx="2" fill="#34D399"/>
  <text x="36" y="90" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="9" font-weight="700" fill="#94A3B8">LiFePO4 51.2V</text>
  <text x="36" y="104" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF">5.12 kWh</text>
  <circle cx="116" cy="94" r="8" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
  <rect x="114" y="90" width="4" height="8" rx="1" fill="#EF4444"/>
  <circle cx="14" cy="50" width="6" height="60" rx="3" fill="#64748B"/>
  <rect x="12" y="54" width="4" height="52" rx="2" fill="#94A3B8"/>
  <rect x="144" y="54" width="4" height="52" rx="2" fill="#94A3B8"/>
</svg>''')

    # 2. Solar Inverter / Hybrid Station
    elif 'inverter' in title or 'solar' in title or 'deye' in title or 'sunsynk' in title or 'growatt' in title or 'solar' in cat:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="26" y="24" width="108" height="112" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="36" y="34" width="88" height="50" rx="6" fill="#0F172A"/>
  <rect x="44" y="42" width="72" height="34" rx="4" fill="#022C22"/>
  <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="800" fill="#34D399">5.0 kW</text>
  <text x="50" y="70" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="7" font-weight="700" fill="#6EE7B7">NRS 097-2-1 GRID OK</text>
  <circle cx="106" cy="56" r="4" fill="#10B981"/>
  <rect x="36" y="96" width="88" height="2" fill="#E2E8F0"/>
  <rect x="42" y="106" width="24" height="18" rx="3" fill="#F1F5F9" stroke="#CBD5E1"/>
  <rect x="72" y="106" width="24" height="18" rx="3" fill="#F1F5F9" stroke="#CBD5E1"/>
  <rect x="102" y="106" width="12" height="18" rx="2" fill="#0F172A"/>
  <path d="M76 24L84 14L92 24H76Z" fill="#F59E0B"/>
</svg>''')

    # 3. Smartphones / Mobile Tech
    elif 'phone' in title or 'smart' in title or 'galaxy' in title or 'iphone' in title or 'xiaomi' in title or 'smartphones' in cat:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="46" y="18" width="68" height="124" rx="14" fill="#0F172A" stroke="#334155" stroke-width="2"/>
  <rect x="50" y="22" width="60" height="116" rx="11" fill="url(#phoneGrad)"/>
  <circle cx="80" cy="28" r="2.5" fill="#000000"/>
  <rect x="66" y="132" width="28" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.6"/>
  <text x="80" y="75" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">5G</text>
  <text x="80" y="90" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="8" font-weight="600" fill="#E2E8F0" text-anchor="middle">ICASA ZA</text>
  <defs>
    <linearGradient id="phoneGrad" x1="50" y1="22" x2="110" y2="138" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1E3A8A"/>
      <stop offset="0.5" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
</svg>''')

    # 4. Building, Hardware & Industrial
    elif 'cement' in title or 'hardware' in title or 'drill' in title or 'ppc' in title or 'afrisam' in title or 'hardware' in cat:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="28" y="44" width="104" height="74" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="36" y="52" width="88" height="24" rx="4" fill="#DC2626"/>
  <text x="80" y="68" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">SUREBUILD 50kg</text>
  <text x="80" y="94" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="10" font-weight="800" fill="#0F172A" text-anchor="middle">42.5N CEMENT</text>
  <text x="80" y="108" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="8" font-weight="700" fill="#059669" text-anchor="middle">✓ SABS 50197-1</text>
  <path d="M20 126H140V136H20V126Z" fill="#78350F" rx="2"/>
</svg>''')

    # 5. Jump Starter / Power Equipment
    elif 'jump' in title or 'starter' in title or 'inflator' in title or 'station' in title or 'power' in title:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="28" y="32" width="104" height="96" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
  <rect x="36" y="40" width="88" height="36" rx="6" fill="#F59E0B"/>
  <rect x="44" y="48" width="40" height="20" rx="3" fill="#0F172A"/>
  <text x="64" y="63" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11" font-weight="800" fill="#10B981" text-anchor="middle">100%</text>
  <circle cx="104" cy="58" r="8" fill="#DC2626"/>
  <text x="44" y="94" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">2000A PEAK</text>
  <text x="44" y="108" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="8" font-weight="600" fill="#94A3B8">12V Jump Starter</text>
  <rect x="18" y="58" width="10" height="44" rx="4" fill="#DC2626"/>
  <rect x="132" y="58" width="10" height="44" rx="4" fill="#0F172A" stroke="#334155"/>
</svg>''')

    # Default General High-Tech Commercial Product Graphic
    else:
        return mark_safe(f'''<svg width="{dim}" height="{dim}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="30" width="100" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  <rect x="42" y="42" width="76" height="50" rx="6" fill="#F8FAFC" stroke="#E2E8F0"/>
  <path d="M54 62L68 50L82 64L94 54L106 66" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="62" cy="54" r="3" fill="#F59E0B"/>
  <text x="80" y="112" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="9" font-weight="800" fill="#0F172A" text-anchor="middle">GS1 VERIFIED</text>
  <text x="80" y="122" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="7" font-weight="600" fill="#059669" text-anchor="middle">● IN STOCK</text>
</svg>''')

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


