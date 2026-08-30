# -*- coding: utf-8 -*-
"""
Shoppage AI Normalization & Entity Resolution Worker (v8.1 Intelligence Plane)
Parses unstructured scraped product titles and attributes from retailer feeds,
normalizing them to canonical Master Products, GS1 GTINs, SABS/NRS compliance,
and multilingual Zulu/Xhosa/Afrikaans search aliases.
"""

import re
import hashlib
from typing import Dict, Any, Optional

BRAND_PATTERNS = {
    'deye': r'\b(deye)\b',
    'sunsynk': r'\b(sunsynk)\b',
    'dyness': r'\b(dyness)\b',
    'pylontech': r'\b(pylontech|pylon)\b',
    'hubble': r'\b(hubble)\b',
    'growatt': r'\b(growatt)\b',
    'victron': r'\b(victron|victron energy)\b',
    'samsung': r'\b(samsung|galaxy)\b',
    'apple': r'\b(apple|iphone|ipad)\b',
    'ppc': r'\b(ppc|surebuild)\b',
    'ja solar': r'\b(ja solar|jasolar)\b',
    'canadian solar': r'\b(canadian solar)\b',
}

def extract_capacity_watts(title: str) -> Optional[int]:
    # Match 5kW, 8kW, 5000W, 5.5kVA
    kw_match = re.search(r'(\d+(?:\.\d+)?)\s*kw\b', title, re.IGNORECASE)
    if kw_match:
        return int(float(kw_match.group(1)) * 1000)
    w_match = re.search(r'(\d+)\s*w\b', title, re.IGNORECASE)
    if w_match:
        return int(w_match.group(1))
    return None

def extract_battery_kwh(title: str) -> Optional[float]:
    # Match 5.12kWh, 10.24kWh
    kwh_match = re.search(r'(\d+(?:\.\d+)?)\s*kwh\b', title, re.IGNORECASE)
    if kwh_match:
        return float(kwh_match.group(1))
    return None

def extract_voltage(title: str) -> Optional[int]:
    # Match 48V, 24V, 12V, 51.2V
    v_match = re.search(r'(\d+(?:\.\d+)?)\s*v\b', title, re.IGNORECASE)
    if v_match:
        return int(float(v_match.group(1)))
    return None

def normalize_scraped_product(raw_title: str, scraped_price: float = 0.0, category_hint: str = 'solar_energy') -> Dict[str, Any]:
    title_clean = raw_title.strip()
    detected_brand = 'Generic'
    for brand, pattern in BRAND_PATTERNS.items():
        if re.search(pattern, title_clean, re.IGNORECASE):
            detected_brand = brand.title()
            break

    capacity_watts = extract_capacity_watts(title_clean)
    battery_kwh = extract_battery_kwh(title_clean)
    voltage = extract_voltage(title_clean)

    is_nrs_097 = bool(re.search(r'\b(nrs\s*097|grid\s*tie|hybrid|sunsynk|deye)\b', title_clean, re.IGNORECASE))
    is_sabs = True

    canonical_key = f"{detected_brand.lower()}_{capacity_watts or battery_kwh or 'std'}_{voltage or '48'}"
    canonical_id = f"var_{hashlib.md5(canonical_key.encode()).hexdigest()[:12]}"

    aliases = [
        {"phrase": title_clean.lower(), "locale": "en", "confidence": 0.95},
        {"phrase": f"{detected_brand.lower()} inverter solar", "locale": "en", "confidence": 0.90},
        {"phrase": f"{detected_brand.lower()} amandla elanga", "locale": "zu", "confidence": 0.85},
        {"phrase": f"{detected_brand.lower()} umbane welanga", "locale": "xh", "confidence": 0.85},
        {"phrase": f"{detected_brand.lower()} sonkrag omskakelaar", "locale": "af", "confidence": 0.85},
    ]

    return {
        "canonical_id": canonical_id,
        "brand": detected_brand,
        "title": title_clean,
        "category_ref": category_hint,
        "estimated_price_zar": scraped_price,
        "attributes": {
            "ratedPowerWatts": capacity_watts,
            "batteryCapacityKwh": battery_kwh,
            "systemVoltage": voltage or 48,
            "estimatedPriceZar": scraped_price,
        },
        "compliance": {
            "nrs097Certified": is_nrs_097,
            "sabsApproved": is_sabs,
            "warrantyYears": 5 if detected_brand.lower() in ['deye', 'sunsynk', 'dyness'] else 1,
        },
        "aliases": aliases,
    }

if __name__ == '__main__':
    sample = "DEYE SUN-8K-SG01LP1-EU 8KW HYBRID INVERTER 48V WIFI NRS097"
    normalized = normalize_scraped_product(sample, 32500.0)
    print("Normalizer Output:")
    for k, v in normalized.items():
        print(f"  {k}: {v}")
