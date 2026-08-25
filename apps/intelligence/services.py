import re
from typing import Dict, Any, List, Optional
from django.db.models import Q
from apps.catalog.models import MasterProduct
from apps.merchants.models import Merchant
from apps.offers.models import Offer
from apps.markets.models import Market

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    'solar_energy': [
        'solar', 'inverter', 'battery', 'backup', 'power', 'deye', 'sunsynk', 'dyness', 'panel', 'pv',
        'load shedding', 'loadshedding', 'ups', 'hybrid', 'lifepo4', 'pylontech', 'hubble', 'growatt',
        'victron', 'must', 'geyser timer', 'generator', 'stage 6', 'lithium'
    ],
    'smartphones': [
        'phone', 'smartphone', 'samsung', 'apple', 'iphone', 'android', 'galaxy', 'a16', 'a55', 'tablet',
        'cellphone', 'mobile', 'xiaomi', 'redmi', 'oppo', 'honor', 'oraimo', 'airpods', 'earbuds'
    ],
    'hardware': [
        'hardware', 'cement', 'surebuild', 'ppc', 'brick', 'paint', 'tool', 'drill', 'building', 'plumbing',
        'tile', 'steel', 'timber', 'jojo', 'borehole', 'pump', 'welder', 'angle grinder'
    ],
    'groceries': [
        'food', 'grocery', 'fmcg', 'maize', 'rice', 'sugar', 'oil', 'flour', 'tin', 'can', 'spaza',
        'beverage', 'bulk food', 'pantry'
    ],
    'pharmacy': [
        'pharmacy', 'medicine', 'health', 'vitamin', 'supplement', 'pill', 'tablet med', 'dischem', 'clicks', 'first aid'
    ],
    'automotive': [
        'car', 'auto', 'spare', 'tyre', 'tire', 'engine oil', 'brake', 'vehicle', 'car battery', 'alternator'
    ],
}

BRAND_HINTS = [
    'deye', 'sunsynk', 'dyness', 'samsung', 'apple', 'huawei', 'lg', 'sony', 'oraimo',
    'victron', 'growatt', 'pylontech', 'hubble', 'must', 'ja solar', 'canadian solar'
]

def parse_price_value(raw: str) -> Optional[float]:
    if not raw:
        return None
    clean = raw.strip().replace(',', '').strip()
    clean = re.sub(r'^[rR]\s*', '', clean).strip().lower()
    
    # Handle "grand" e.g. "20 grand"
    grand_match = re.match(r'^([\d.]+)\s*grand', clean, re.IGNORECASE)
    if grand_match:
        try:
            return round(float(grand_match.group(1)) * 1000)
        except ValueError:
            return None

    # Handle "k" e.g. "20k", "1.5k"
    k_match = re.match(r'^([\d.]+)\s*k$', clean, re.IGNORECASE)
    if k_match:
        try:
            return round(float(k_match.group(1)) * 1000)
        except ValueError:
            return None

    try:
        return float(clean)
    except ValueError:
        return None

def detect_intent(raw: str) -> Dict[str, Any]:
    text = (raw or '').lower().strip()
    max_price = None
    min_price = None

    under = re.search(r'(?:under|below|less than|cheaper than|max|up to)\s*(?:r\s*)?([\d,.]+\s*(?:k|grand)?)', text, re.IGNORECASE)
    if under:
        max_price = parse_price_value(under.group(1))

    over = re.search(r'(?:over|above|more than|min|from)\s*(?:r\s*)?([\d,.]+\s*(?:k|grand)?)', text, re.IGNORECASE)
    if over:
        min_price = parse_price_value(over.group(1))

    brand = next((b for b in BRAND_HINTS if b in text), None)

    category = None
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in text for k in kws):
            category = cat
            break

    loc_match = re.search(r'(?:in|near|around|at)\s+([a-z ]+?)(?:\s+(?:for|with|under|below|that|and|$))', text)
    location = loc_match.group(1).strip() if loc_match else None

    wants_video = bool(re.search(r'video|short|watch|youtube|clip|demo|teardown|walk', text))
    wants_compare = bool(re.search(r'compare|vs|versus|difference|which|better', text))

    return {
        'normalized_query': text,
        'category': category,
        'brand': brand,
        'max_price': max_price,
        'min_price': min_price,
        'location': location,
        'wants_video': wants_video,
        'wants_compare': wants_compare,
    }

def clean_search_query(text: str) -> str:
    s = re.sub(r'(?:under|below|less than|cheaper than|max|up to|over|above|more than|min|from)\s*(?:r\s*)?[\d,.]+\s*(?:k|grand)?', ' ', text, flags=re.IGNORECASE)
    s = re.sub(r'\b(?:i\s+need|i\s+want|looking\s+for|give\s+me|find\s+me|show\s+me|where\s+to\s+buy|price\s+of|prices\s+for|can\s+i\s+get|please)\b', ' ', s, flags=re.IGNORECASE)
    s = re.sub(r'\b\d[\d,]*\b', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def build_overview(query: str, intent: Dict[str, Any], total_products: int, total_merchants: int, min_price: Optional[float], max_price: Optional[float], avg_price: Optional[float], top_brands: List[str]) -> str:
    scope = f"in the {intent['category'].replace('_', ' ')} category" if intent.get('category') else "across the national catalogue"
    brand_line = f" focused on {intent['brand'].upper()} " if intent.get('brand') else " "
    
    if min_price and max_price:
        price_line = f" Live pricing currently ranges from R {min_price:,.0f} to R {max_price:,.0f} (avg R {avg_price:,.0f})."
    else:
        price_line = " Live local pricing is confirmed directly with verified merchants."
        
    brand_summary = f" Top matching brands: {', '.join(top_brands[:4])}." if top_brands else ""
    return (
        f"Shoppage intelligence found {total_products:,} master product{'s' if total_products != 1 else ''} and "
        f"{total_merchants:,} verified supplier{'s' if total_merchants != 1 else ''}{brand_line}{scope}.{price_line}{brand_summary} "
        f"Results are ranked by local availability, freshness and merchant trust signals."
    )

def semantic_search(raw_query: str, limit: int = 12, offset: int = 0) -> Dict[str, Any]:
    intent = detect_intent(raw_query)
    cleaned = clean_search_query(intent['normalized_query'])
    q = cleaned or raw_query

    product_qs = MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).prefetch_related('offers', 'offers__merchant')
    
    if intent.get('brand'):
        product_qs = product_qs.filter(brand__icontains=intent['brand'])
    elif intent.get('category'):
        product_qs = product_qs.filter(category_ref=intent['category'])
    elif q:
        product_qs = product_qs.filter(
            Q(title__icontains=q) |
            Q(brand__icontains=q) |
            Q(model_number__icontains=q) |
            Q(category_ref__icontains=q) |
            Q(gtin13__icontains=q)
        )

    products = list(product_qs[offset:offset+limit])
    
    # Filter price range if intent contains bounds
    if intent.get('max_price') or intent.get('min_price'):
        filtered = []
        for p in products:
            price = p.estimated_price_zar
            p_offers = list(p.offers.all())
            if p_offers:
                price = min(float(o.price_amount or 0) for o in p_offers if o.price_amount)
            if intent.get('max_price') and price and price > intent['max_price']:
                continue
            if intent.get('min_price') and price and price < intent['min_price']:
                continue
            filtered.append(p)
        products = filtered

    # Merchant search
    merchant_qs = Merchant.objects.all()
    if intent.get('category'):
        merchant_qs = merchant_qs.filter(category=intent['category'])
    elif q:
        merchant_qs = merchant_qs.filter(
            Q(name__icontains=q) |
            Q(category__icontains=q) |
            Q(address_text__icontains=q) |
            Q(province__icontains=q)
        )
    merchants = list(merchant_qs[:6])

    # Price stats
    all_prices = []
    offers_by_product = {}
    for p in products:
        p_offers = list(p.offers.all())
        offers_by_product[p.canonical_id] = p_offers
        for o in p_offers:
            if o.price_amount:
                all_prices.append(float(o.price_amount))
        if p.estimated_price_zar:
            all_prices.append(float(p.estimated_price_zar))

    min_p = min(all_prices) if all_prices else None
    max_p = max(all_prices) if all_prices else None
    avg_p = sum(all_prices) / len(all_prices) if all_prices else None

    top_brands = list(dict.fromkeys(p.brand for p in products))[:5]
    overview = build_overview(raw_query, intent, len(products), len(merchants), min_p, max_p, avg_p, top_brands)

    return {
        'query': raw_query,
        'intent': intent,
        'overview': overview,
        'products': products,
        'merchants': merchants,
        'offers_by_product': offers_by_product,
        'price_stats': {'min': min_p, 'max': max_p, 'avg': avg_p} if min_p else None,
        'top_brands': top_brands,
        'total_products': len(products),
        'total_merchants': len(merchants),
    }

def ask_assistant(message: str) -> Dict[str, Any]:
    intent = detect_intent(message)
    cleaned = clean_search_query(intent['normalized_query'])
    q = cleaned or message

    product_qs = MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).prefetch_related('offers')
    if intent.get('brand'):
        product_qs = product_qs.filter(brand__icontains=intent['brand'])
    elif intent.get('category'):
        product_qs = product_qs.filter(category_ref=intent['category'])
    elif q:
        product_qs = product_qs.filter(
            Q(title__icontains=q) |
            Q(brand__icontains=q) |
            Q(category_ref__icontains=q)
        )

    products = list(product_qs[:6])
    merchants = list(Merchant.objects.filter(Q(name__icontains=q) | Q(category__icontains=q))[:4])

    if not products and not merchants:
        reply = (
            f"I couldn't find a direct match for \"{message}\" in the current South African catalogue. "
            f"Try searching by product type (e.g. \"5kW inverter\"), brand (e.g. \"Deye\", \"Dyness\"), "
            f"or ask for budget filters like \"under R20000\"."
        )
    else:
        subject = intent['brand'].upper() if intent.get('brand') else intent['category'].replace('_', ' ') if intent.get('category') else 'your search'
        lines = [f"Here's what I found for {subject}, ranked by local availability and merchant trust:"]
        for i, p in enumerate(products[:4], 1):
            p_offers = list(p.offers.all())
            lowest = min((float(o.price_amount) for o in p_offers if o.price_amount), default=p.estimated_price_zar)
            price_str = f"from R {lowest:,.0f}" if lowest else "price on request"
            offer_count = f" ({len(p_offers)} confirmed local offer{'s' if len(p_offers) != 1 else ''})" if p_offers else ""
            lines.append(f"{i}. {p.title} — {price_str}{offer_count}.")
        if merchants:
            lines.append(f"I also matched {len(merchants)} verified supplier{'s' if len(merchants) != 1 else ''} you can contact directly on WhatsApp.")
        reply = " ".join(lines)

    return {
        'reply': reply,
        'products': products,
        'merchants': merchants,
        'intent': intent,
    }

def generate_google_merchant_center_feed(merchant_id: str, base_url: str = 'https://shoppage.co.za') -> str:
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first()
    if not merchant:
        return "<rss version='2.0'><channel><title>Merchant Not Found</title></channel></rss>"

    offers = Offer.objects.filter(merchant=merchant, availability_state='fresh').select_related('variant')
    items_xml = []
    for o in offers:
        p = o.variant
        gtin_tag = f"<g:gtin>{p.gtin13}</g:gtin>" if p.gtin13 else ""
        mpn_tag = f"<g:mpn>{p.mpn}</g:mpn>" if p.mpn else ""
        items_xml.append(f"""
    <item>
      <g:id>{o.canonical_id}</g:id>
      <title><![CDATA[{p.title}]]></title>
      <description><![CDATA[{p.title} sold by {merchant.name} in {merchant.province or 'South Africa'}.]]></description>
      <link>{base_url}/l/{o.canonical_id}</link>
      <g:price>{float(o.price_amount or 0):.2f} {o.currency}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand><![CDATA[{p.brand}]]></g:brand>
      {gtin_tag}
      {mpn_tag}
    </item>""")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[{merchant.name} Google Merchant Center Feed]]></title>
    <link>{base_url}/m/{merchant.canonical_id}</link>
    <description><![CDATA[Official Shoppage Automated Google Shopping Feed for {merchant.name}]]></description>
    {''.join(items_xml)}
  </channel>
</rss>"""

def generate_trust_seal_svg(merchant: Merchant) -> str:
    score = merchant.trust_score
    status = merchant.get_verification_state_display()
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="280" height="70" viewBox="0 0 280 70" fill="none">
  <rect width="280" height="70" rx="10" fill="#0F172A" stroke="#2563EB" stroke-width="2"/>
  <circle cx="35" cy="35" r="20" fill="#2563EB" fill-opacity="0.2"/>
  <path d="M35 22L42 27V36C42 41 39 45 35 47C31 45 28 41 28 36V27L35 22Z" fill="#10B981" stroke="#34D399" stroke-width="1.5"/>
  <path d="M32 35L34.5 37.5L38.5 32.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="65" y="28" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="bold">SHOPPAGE TRUST VERIFIED</text>
  <text x="65" y="44" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10">{merchant.name[:24]}</text>
  <text x="65" y="58" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" font-weight="bold">✓ Trust Score: {score}/100 · {status}</text>
</svg>"""
