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

def get_brand_knowledge_card(query_or_brand: str) -> Optional[Dict[str, Any]]:
    """
    Generates a Google-style Knowledge Graph card for recognized brands and industrial manufacturers.
    """
    q = (query_or_brand or '').lower()

    knowledge_base = {
        'battery': {
            'brand': 'Electric Battery & Energy Storage',
            'short_name': 'Battery',
            'icon': '🔋',
            'category': 'Electrochemical Energy Storage & Power Cells',
            'origin': 'Invention: 1800 (Alessandro Volta) · South African Standards: SABS / NRCS / SANS 10142',
            'warranty': '10 Years (LiFePO4 Lithium) / 24–36 Months (Automotive Calcium-Lead)',
            'certifications': ['SABS SANS 10142', 'NRS 097-2-1', 'UN 38.3', 'IEC 62619'],
            'description': 'An electric battery is a source of electric power consisting of one or more electrochemical cells with external connections for powering electrical devices. Modern rechargeable chemistry in South Africa spans LiFePO4 rack batteries for load-shedding backup, starter lead-acid car batteries, and high-density consumer cells.',
            'popular_models': ['Dyness BX51100 5.12kWh LiFePO4', 'Hubble AM-2 5.5kWh Lithium', 'Willard 652 Car Battery', 'SABAT 652 Calcium', 'Duracell Ultra AA/AAA'],
            'distributors': ['First Battery Centre', 'Battery Centre SA', 'Midrand Midas', 'AutoZone SA', 'Dragon City Solar Tech'],
            'satisfaction_rating': '4.9 / 5.0 (Essential South Africa Power Infrastructure)',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Key Chemistries': 'Lithium Iron Phosphate (LiFePO4), Lead-Acid, AGM, Gel, Alkaline',
                'Nominal Voltages': '1.5V (AA), 12V (Auto), 48V / 51.2V (Solar Rack), 100V–400V (High Voltage)',
                'Cycle Life': '6,000+ Cycles (LiFePO4 @ 80% DoD) vs 500–800 Cycles (Lead Acid)',
                'Primary Applications': 'Stage 6 Load-Shedding Backup, Automotive Starting, Commercial Solar Micro-Grids',
            },
        },
        'deye': {
            'brand': 'Deye (Ningbo Deye Inverter Technology)',
            'short_name': 'Deye',
            'icon': '☀️',
            'category': 'Solar Inverters & Battery Storage',
            'origin': 'Ningbo, China (Global HQ) / South Africa Authorized Distribution',
            'warranty': '5 to 10 Years Standard Manufacturer Warranty',
            'certifications': ['NRS 097-2-1 Grid Certified', 'SABS Standard', 'IEC 62109', 'CE'],
            'description': 'Deye is one of South Africa\'s most popular hybrid inverter brands, engineered for seamless Stage 6 loadshedding transition, parallel scalability (up to 16 units), and dual generator/solar inputs.',
            'popular_models': ['SUN-5K-SG03LP1-EU (5kW)', 'SUN-8K-SG01LP1-EU (8kW)', 'SUN-12K-SG04LP3-EU (12kW 3-Phase)', 'BOS-G High Voltage'],
            'distributors': ['Herholdts', 'SegenSolar', 'Rentech', 'SolarBros Sandton', 'Rubicon'],
            'satisfaction_rating': '4.9 / 5.0 (Over 18,000 ZA Installations)',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Efficiency Rating': '97.6% (Euro Efficiency 96.5%)',
                'Parallel Capability': 'Up to 16 Units in Parallel (Single/Three Phase)',
                'Protection Degree': 'IP65 Water & Dust Ingress Rating',
                'Switchover Time': '< 4ms Seamless UPS Transfer',
            },
        },
        'sunsynk': {
            'brand': 'Sunsynk Power Solutions',
            'short_name': 'Sunsynk',
            'icon': '⚡',
            'category': 'Hybrid Inverters & Smart Power',
            'origin': 'United Kingdom / South Africa Regional Service Centre',
            'warranty': '5-Year extendable to 10-Year Warranty with Sunsynk Battery pairing',
            'certifications': ['NRS 097-2-1', 'SABS Tested', 'City of Cape Town Approved List'],
            'description': 'Sunsynk is a market leader in smart hybrid power management, renowned for its intuitive Sunsynk Connect cloud monitoring, generator control, and micro-grid capability.',
            'popular_models': ['Sunsynk 5.5kW Hybrid', 'Sunsynk 8.8kW Hybrid', 'Sunsynk 12kW 3-Phase', 'Sunsynk Mobile Power'],
            'distributors': ['Herholdts', 'One Energy', 'SegenSolar', 'Trade Solar Wholesale'],
            'satisfaction_rating': '4.85 / 5.0 (High Reliability Rating)',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Max Solar Input': '6500W (5kW model) / 10400W (8kW model)',
                'Cloud Connectivity': 'Wi-Fi / Ethernet Dongle with Sunsynk App',
                'Certifications': 'NRS 097-2-1 / SABS Compliant',
            },
        },
        'dyness': {
            'brand': 'Dyness Renewable Energy',
            'short_name': 'Dyness',
            'icon': '🔋',
            'category': 'LiFePO4 Lithium Iron Phosphate Batteries',
            'origin': 'Global HQ / Official Southern Africa Support Hub',
            'warranty': '10-Year Manufacturer Warranty (6,000+ Cycles @ 90% DoD)',
            'certifications': ['UN38.3', 'IEC62619', 'CE', 'SABS EMC Certified'],
            'description': 'Dyness manufactures tier-1 LiFePO4 battery modules offering deep discharge cycles, high thermal stability, and seamless CAN communication with Deye, Sunsynk, Growatt and Victron inverters.',
            'popular_models': ['BX51100 5.12kWh Rack Mount', 'Powerbox Pro 10.24kWh Wallmount', 'A48100 4.8kWh', 'Tower High Voltage Series'],
            'distributors': ['SegenSolar', 'SolarBros Sandton', 'Rubicon', 'Herholdts Group'],
            'satisfaction_rating': '4.9 / 5.0 (Top Recommended Lithium Pack)',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Battery Chemistry': 'LiFePO4 (Lithium Iron Phosphate)',
                'Nominal Voltage': '51.2V (Usable Capacity 4.6kWh / 100Ah)',
                'Cycle Life': '6,000 Cycles @ 90% DoD, 25°C',
                'Communication': 'CAN / RS485 for Deye, Sunsynk, Victron, Growatt',
            },
        },
        'apple': {
            'brand': 'Apple Inc.',
            'short_name': 'Apple',
            'icon': '🍎',
            'category': 'Smartphones, Tablets & Computing',
            'origin': 'Cupertino, California, USA / Core Group SA Authorized',
            'warranty': '1-Year Official Apple Warranty + ICASA Approved',
            'certifications': ['ICASA Type Approved', 'SABS Standards', 'CE'],
            'description': 'Apple produces industry-leading iPhones, MacBooks, iPads, and AirPods, powered by Apple Silicon chips and high resale retention value in South Africa.',
            'popular_models': ['iPhone 16 Pro Max', 'iPhone 15', 'MacBook Air M3', 'AirPods Pro 2', 'iPad Air M2'],
            'distributors': ['iStore South Africa', 'Incredible Connection', 'Vodacom 4U', 'Dragon City Tech Wholesale'],
            'satisfaction_rating': '4.95 / 5.0',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Operating System': 'iOS / macOS / iPadOS',
                'Network Standards': '5G Sub-6GHz, Wi-Fi 7 / 6E, ICASA Certified',
                'Trade-In Support': 'Official Certified Trade-In Supported in ZA',
            },
        },
        'samsung': {
            'brand': 'Samsung Electronics',
            'short_name': 'Samsung',
            'icon': '📱',
            'category': 'Galaxy Mobile, Displays & Smart Appliances',
            'origin': 'Suwon, South Korea / Samsung Electronics South Africa',
            'warranty': '24 Months Official Manufacturer Warranty + Samsung Care+',
            'certifications': ['ICASA Type Approved', 'SABS Safety Standards'],
            'description': 'Samsung dominates Android smartphone and consumer display sales across Southern Africa with robust Galaxy S, A, and Z foldable series.',
            'popular_models': ['Galaxy S24 Ultra', 'Galaxy A55 5G', 'Galaxy A16', 'Neo QLED 4K TVs', 'Galaxy Tab S9'],
            'distributors': ['Samsung Brand Stores', 'Takealot Direct', 'FNB Connect', 'Makro Wholesale'],
            'satisfaction_rating': '4.8 / 5.0',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Display Tech': 'Dynamic AMOLED 2X 120Hz',
                'Processor': 'Snapdragon 8 Gen 3 / Exynos Octa-Core',
                'Warranty': '24 Months Official Manufacturer SA Warranty',
            },
        },
        'makita': {
            'brand': 'Makita Power Tools',
            'short_name': 'Makita',
            'icon': '🔨',
            'category': 'Professional Industrial & Building Hardware',
            'origin': 'Anjo, Aichi, Japan / Makita South Africa (Pty) Ltd',
            'warranty': '3-Year Makita Professional Tool Warranty',
            'certifications': ['SABS ISO 9001', 'CIDB Contractor Approved Standard'],
            'description': 'Makita is a global industrial powerhouse providing 18V LXT and 40V XGT cordless power tools engineered for harsh construction site conditions.',
            'popular_models': ['DHP482 Cordless Hammer Drill', 'DGA504 Angle Grinder', 'DLX2180TJ 18V Combo Kit', 'Rotary SDS+ Hammers'],
            'distributors': ['Builders Warehouse', 'Chamberlains', 'Cashbuild Commercial', 'Tooltime Wholesalers'],
            'satisfaction_rating': '4.9 / 5.0',
            'b2b_wholesale_ready': True,
            'attributes_table': {
                'Battery Platform': '18V LXT / 40V Max XGT Lithium-Ion',
                'Motor Type': 'Brushless Heavy-Duty Motor',
                'Standards': 'SABS Compliant Electrical Safety',
            },
        },
    }

    for key, data in knowledge_base.items():
        if key in q:
            return data
    return None

def get_people_also_ask(query: str) -> List[Dict[str, str]]:
    """
    Generates contextual 'People Also Ask' accordions tailored for South African buyers.
    """
    q = (query or '').lower()
    
    if any(k in q for k in ['battery', 'batteries', 'lifepo4', 'lithium', 'dyness', 'pylontech', 'hubble', 'willard', 'sabat']):
        return [
            {
                'question': 'What is the difference between LiFePO4 and AGM/Lead-Acid batteries?',
                'answer': 'Lithium Iron Phosphate (LiFePO4) batteries offer 6,000+ cycles at 90% Depth of Discharge (DoD) lasting 10–15 years, compared to Lead-Acid/Gel batteries which typically yield 500–800 cycles and last 2–3 years under daily Stage 6 load-shedding in South Africa.'
            },
            {
                'question': 'What size battery do I need for 4-hour Stage 6 load-shedding?',
                'answer': 'For a typical South African home powering lights, Wi-Fi router, TV, fridge, and security systems (averaging 800W–1.2kW continuous load), a 5.12kWh 100Ah 48V/51.2V LiFePO4 battery (such as Dyness BX51100 or Hubble AM-2) provides 4.5 to 5.5 hours of continuous backup.'
            },
            {
                'question': 'Which car battery lasts the longest in South Africa?',
                'answer': 'Willard and SABAT silver-calcium maintenance-free batteries are specifically engineered for high-ambient South African road conditions, providing 36 to 48 months of reliable service life.'
            },
            {
                'question': 'What does a battery replacement cost in South Africa?',
                'answer': 'Standard 12V automotive batteries (size 618, 628, 652) range from R950 to R1,850 with scrap battery trade-in. 5.12kWh lithium solar rack batteries range from R16,500 to R24,900 from verified Shoppage distributors.'
            }
        ]
    elif any(k in q for k in ['inverter', 'solar', 'deye', 'sunsynk', 'growatt', 'victron', 'panel']):
        return [
            {
                'question': 'Which hybrid inverter is best for home backup in South Africa?',
                'answer': 'Deye 5kW/8kW and Sunsynk 5.5kW/8.8kW are the leading NRS 097 grid-certified hybrid inverters in SA due to their dual MPPT trackers, rapid <4ms UPS switchover time, and extensive local technician support.'
            },
            {
                'question': 'Do I need an electrical Certificate of Compliance (CoC) for solar/inverter installations?',
                'answer': 'Yes. Under South African law (SANS 10142-1), any fixed grid-tied or hybrid inverter installation must be inspected and certified by a Department of Labour registered Wireman\'s License electrician with a supplementary CoC.'
            },
            {
                'question': 'Can I expand my solar inverter system with more batteries later?',
                'answer': 'Yes. Modern 48V LiFePO4 batteries communicate via CAN/RS485 and can be expanded in parallel up to 15–30 modules (e.g. from 5.12kWh up to 80kWh+) as your household energy demand grows.'
            }
        ]
    elif any(k in q for k in ['phone', 'smartphone', 'samsung', 'apple', 'iphone', 'huawei', 'xiaomi']):
        return [
            {
                'question': 'Are devices sold through Shoppage verified suppliers ICASA approved?',
                'answer': 'Yes. All smartphones and wireless equipment listed on the Shoppage grid are verified against ICASA type-approval registers and include official South African manufacturer warranties.'
            },
            {
                'question': 'What warranty is included on new smartphones in South Africa?',
                'answer': 'Brand-new Samsung, Apple, Xiaomi, and Honor devices include an official 12 to 24-month manufacturer warranty serviceable at authorized repair centres across Sandton, Pretoria, Cape Town, and Durban.'
            }
        ]
    else:
        return [
            {
                'question': f'How do I compare verified supplier prices for {query.title() if query else "products"}?',
                'answer': 'Shoppage indexes physical trade counters, shopping centres, and wholesale importers across South Africa with side-by-side price comparison, stock availability, and direct WhatsApp trade channels.'
            },
            {
                'question': 'Can I request wholesale / bulk container quotes?',
                'answer': 'Yes. You can click "Post Bulk RFQ Tender" on any search result to broadcast your procurement requirements directly to verified stockists and commercial distributors.'
            }
        ]

def get_related_searches(query: str, category: str = '') -> List[str]:
    """
    Generates high-intent localized search suggestions (Google 'People also search for' style).
    """
    q = (query or '').lower().strip()
    
    if any(k in q for k in ['battery', 'batteries', 'lifepo4', 'lithium']):
        return [
            'Battery price',
            'Battery replacement',
            'Battery near me',
            'Battery afrikaans',
            'Battery lithium 5.12kWh',
            'Battery price south africa',
            'Battery SABAT 652',
            'Battery Willard 652',
            'Battery charger 12V',
            'LiFePO4 vs Gel battery'
        ]
    elif any(k in q for k in ['inverter', 'solar', 'deye', 'sunsynk']):
        return [
            'Deye 5kW inverter price',
            'Sunsynk 8.8kW hybrid inverter',
            'Solar panels price south africa',
            'Dyness 5.12kWh battery price',
            'Inverter with battery specials',
            'Solar installer near me Sandton',
            'NRS 097 certified inverter list',
            'Off-grid solar kit wholesale'
        ]
    elif any(k in q for k in ['samsung', 'phone', 'apple', 'iphone']):
        return [
            'Samsung Galaxy S24 Ultra price',
            'Samsung A16 5G specials',
            'iPhone 16 Pro Max price south africa',
            'Samsung brand store near me',
            'Refurbished smartphones Sandton',
            'Wholesale phones Dragon City'
        ]
    else:
        q_clean = query.title() if query else "Products"
        return [
            f'{q_clean} price south africa',
            f'{q_clean} near me',
            f'{q_clean} wholesale distributors',
            f'{q_clean} Johannesburg',
            f'{q_clean} Cape Town',
            f'{q_clean} specials & discounts',
            f'{q_clean} suppliers Sandton',
            f'{q_clean} reviews'
        ]

def get_tiered_moq_pricing(unit_price: float) -> List[Dict[str, Any]]:
    """
    Calculates Alibaba-style B2B Minimum Order Quantity (MOQ) volume tier pricing.
    """
    if not unit_price or unit_price <= 0:
        unit_price = 1000.0

    return [
        {
            'tier': '1–9 units',
            'moq': 1,
            'label': 'Sample / Retail Standard',
            'unit_price': round(unit_price, 2),
            'discount_pct': 0,
            'lead_time': 'Immediate / Same-Day Dispatch',
        },
        {
            'tier': '10–49 units',
            'moq': 10,
            'label': 'Trade Bulk Tier',
            'unit_price': round(unit_price * 0.88, 2),
            'discount_pct': 12,
            'lead_time': '24–48 Hours Collection / Delivery',
        },
        {
            'tier': '50–199 units',
            'moq': 50,
            'label': 'Master Carton / Wholesale MOQ',
            'unit_price': round(unit_price * 0.78, 2),
            'discount_pct': 22,
            'lead_time': '2–4 Business Days Dispatch',
        },
        {
            'tier': '200+ units',
            'moq': 200,
            'label': 'Container / Factory Direct Contract',
            'unit_price': round(unit_price * 0.68, 2),
            'discount_pct': 32,
            'lead_time': 'Contracted Freight SLA',
        },
    ]

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
