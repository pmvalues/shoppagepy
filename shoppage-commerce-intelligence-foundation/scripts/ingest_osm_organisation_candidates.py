from __future__ import annotations

import csv
import hashlib
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
SEED = ROOT / "data" / "seed"
QUALITY = ROOT / "quality"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

QUERY = r'''
[out:json][timeout:600];
area["ISO3166-1"="ZW"][admin_level=2]->.zw;
(
  nwr["name"]["shop"](area.zw);
  nwr["name"]["office"](area.zw);
  nwr["name"]["craft"](area.zw);
  nwr["name"]["industrial"](area.zw);
  nwr["name"]["amenity"~"bank|clinic|hospital|pharmacy|restaurant|fast_food|cafe|bar|pub|nightclub|fuel|marketplace|car_rental|car_wash|post_office|cinema|theatre|internet_cafe|driving_school|veterinary|dentist|doctors|laboratory|studio|bureau_de_change|money_transfer"](area.zw);
  nwr["name"]["healthcare"](area.zw);
  nwr["name"]["leisure"~"fitness_centre|sports_centre|golf_course|water_park|amusement_arcade|dance"](area.zw);
  nwr["name"]["club"](area.zw);
  nwr["name"]["tourism"~"hotel|guest_house|motel|camp_site"](area.zw);
  nwr["name"]["man_made"~"works|water_works"](area.zw);
);
out center tags;
'''.strip()

TAG_PRIORITY = ["shop", "office", "craft", "amenity", "healthcare", "leisure", "club", "tourism", "industrial", "man_made"]

FIELDS = [
    "candidate_id", "source_element_type", "source_element_id", "name", "normalized_name",
    "entity_kind_candidate", "primary_tag_key", "primary_tag_value", "activity_tags",
    "brand", "operator", "website", "latitude", "longitude", "address_text", "city",
    "suburb", "province", "postcode", "source_url", "source_observed_at", "source_authority",
    "source_licence", "verification_state", "activity_mapping_state", "duplicate_cluster_key",
]


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    value = re.sub(r"\b(pvt|private|limited|ltd|plc|inc|company|co)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def fetch(query: str) -> tuple[dict, str]:
    payload = urllib.parse.urlencode({"data": query}).encode("utf-8")
    last_error: Exception | None = None
    for endpoint in ENDPOINTS:
        for attempt in range(3):
            try:
                req = urllib.request.Request(
                    endpoint,
                    data=payload,
                    headers={"User-Agent": "ShoppageCommerceGraph/0.2 (research; ODbL attribution retained)"},
                )
                with urllib.request.urlopen(req, timeout=720) as response:
                    return json.load(response), endpoint
            except Exception as exc:  # network retry is intentionally bounded
                last_error = exc
                time.sleep(2 ** attempt)
    raise RuntimeError(f"All Overpass endpoints failed: {last_error}")


def choose_tag(tags: dict[str, str]) -> tuple[str, str]:
    for key in TAG_PRIORITY:
        if tags.get(key):
            return key, tags[key]
    return "other", "unknown"


def kind_for(key: str, value: str) -> str:
    if key == "shop":
        return "retailer_or_wholesaler"
    if key in {"craft", "office"}:
        return "service_or_trade_business"
    if key in {"industrial", "man_made"}:
        return "industrial_or_manufacturing_site"
    if key == "tourism":
        return "hospitality_business"
    if key == "amenity" and value in {"restaurant", "fast_food"}:
        return "food_service_business"
    if key == "amenity" and value in {"cafe", "bar", "pub", "nightclub"}:
        return "food_or_beverage_service_business"
    if key == "amenity" and value in {"bank", "post_office"}:
        return "financial_or_business_service"
    if key == "amenity" and value in {"clinic", "hospital", "pharmacy"}:
        return "health_service_business_or_institution"
    if key == "amenity" and value in {"veterinary", "dentist", "doctors", "laboratory"}:
        return "health_or_veterinary_service_business"
    if key == "healthcare":
        return "health_service_business_or_institution"
    if key == "amenity" and value == "fuel":
        return "fuel_retailer"
    if key == "amenity" and value == "marketplace":
        return "market_operator_or_commercial_cluster"
    if key == "amenity" and value in {"bureau_de_change", "money_transfer"}:
        return "financial_or_business_service"
    if key == "amenity" and value == "driving_school":
        return "education_service_business"
    if key == "amenity" and value in {"cinema", "theatre", "studio"}:
        return "arts_or_media_business"
    if key in {"leisure", "club"}:
        return "sports_or_recreation_business_or_club"
    return "commercial_entity_candidate"


def coordinates(element: dict) -> tuple[str, str]:
    if "lat" in element and "lon" in element:
        return str(element["lat"]), str(element["lon"])
    center = element.get("center") or {}
    return str(center.get("lat", "")), str(center.get("lon", ""))


def address(tags: dict[str, str]) -> str:
    parts = [
        tags.get("addr:housenumber", ""), tags.get("addr:street", ""),
        tags.get("addr:suburb", ""), tags.get("addr:city", ""),
    ]
    return ", ".join(item for item in parts if item)


def transform(data: dict, observed_at: str) -> tuple[list[dict[str, str]], dict]:
    rows: list[dict[str, str]] = []
    exact_keys: Counter[str] = Counter()
    tag_counts: Counter[str] = Counter()
    kind_counts: Counter[str] = Counter()
    name_clusters: defaultdict[str, int] = defaultdict(int)

    for element in data.get("elements", []):
        tags = element.get("tags") or {}
        name = (tags.get("name") or "").strip()
        if not name:
            continue
        element_type = element.get("type", "unknown")
        element_id = str(element.get("id", ""))
        primary_key, primary_value = choose_tag(tags)
        lat, lon = coordinates(element)
        normalized = normalize_name(name)
        rounded_lat = f"{float(lat):.4f}" if lat else ""
        rounded_lon = f"{float(lon):.4f}" if lon else ""
        duplicate_key = f"{normalized}|{rounded_lat}|{rounded_lon}"
        exact_keys[duplicate_key] += 1
        name_clusters[normalized] += 1
        tag_counts[f"{primary_key}={primary_value}"] += 1
        entity_kind = kind_for(primary_key, primary_value)
        kind_counts[entity_kind] += 1
        activity_tags = {key: tags[key] for key in TAG_PRIORITY if tags.get(key)}
        rows.append({
            "candidate_id": f"osm:{element_type}/{element_id}",
            "source_element_type": element_type,
            "source_element_id": element_id,
            "name": name,
            "normalized_name": normalized,
            "entity_kind_candidate": entity_kind,
            "primary_tag_key": primary_key,
            "primary_tag_value": primary_value,
            "activity_tags": json.dumps(activity_tags, ensure_ascii=False, sort_keys=True),
            "brand": tags.get("brand", ""),
            "operator": tags.get("operator", ""),
            "website": tags.get("website", tags.get("contact:website", "")),
            "latitude": lat,
            "longitude": lon,
            "address_text": address(tags),
            "city": tags.get("addr:city", ""),
            "suburb": tags.get("addr:suburb", ""),
            "province": tags.get("addr:province", tags.get("is_in:state", "")),
            "postcode": tags.get("addr:postcode", ""),
            "source_url": f"https://www.openstreetmap.org/{element_type}/{element_id}",
            "source_observed_at": observed_at,
            "source_authority": "OpenStreetMap contributors",
            "source_licence": "ODbL 1.0; attribution required",
            "verification_state": "discovery_only",
            "activity_mapping_state": "pending_isic_review",
            "duplicate_cluster_key": duplicate_key,
        })

    duplicate_rows = sum(count for count in exact_keys.values() if count > 1)
    duplicate_clusters = sum(1 for count in exact_keys.values() if count > 1)
    repeated_name_rows = sum(count for count in name_clusters.values() if count > 1)
    profile = {
        "grain": "one named OpenStreetMap element carrying a selected commercial tag",
        "source_element_rows": len(rows),
        "unique_candidate_ids": len({row["candidate_id"] for row in rows}),
        "unique_normalized_names": len(name_clusters),
        "rows_in_exact_name_coordinate_duplicate_clusters": duplicate_rows,
        "exact_name_coordinate_duplicate_clusters": duplicate_clusters,
        "rows_with_repeated_normalized_names": repeated_name_rows,
        "null_rates": {
            field: round(sum(1 for row in rows if not row[field]) / len(rows), 6) if rows else 0
            for field in ["latitude", "longitude", "address_text", "city", "suburb", "website", "brand", "operator"]
        },
        "top_activity_tags": tag_counts.most_common(50),
        "entity_kind_counts": kind_counts.most_common(),
        "quality_status": "discovery_only_not_verified_company_register",
        "quality_findings": [
            "OSM elements mix businesses, branches, institutions, facilities and market nodes; entity resolution is required.",
            "Repeated names may be legitimate branches or duplicate map features and must not be merged on name alone.",
            "Address completeness is expected to be low; coordinate-to-place reconciliation is required.",
            "OSM activity tags are discovery signals, not authoritative ISIC classifications.",
        ],
    }
    return rows, profile


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    SEED.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    observed_at = datetime.now(timezone.utc).isoformat()
    data, endpoint = fetch(QUERY)
    raw_path = RAW / "osm_zimbabwe_commercial_entities.json"
    raw_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    rows, profile = transform(data, observed_at)
    profile.update({
        "generated_at": observed_at,
        "overpass_endpoint": endpoint,
        "query_sha256": hashlib.sha256(QUERY.encode("utf-8")).hexdigest(),
        "raw_sha256": hashlib.sha256(raw_path.read_bytes()).hexdigest(),
    })
    out_path = SEED / "osm_organisation_candidates.csv"
    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    (QUALITY / "osm_organisation_candidates_profile.json").write_text(
        json.dumps(profile, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps({"output": str(out_path), **profile}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
