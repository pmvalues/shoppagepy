from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "data" / "reference"
SEED = ROOT / "data" / "seed"
STUDY = ROOT / "data" / "study"
QUALITY = ROOT / "quality"

FIELDS = [
    "study_record_id", "source_family", "source_candidate_id", "name", "normalized_name",
    "source_activity", "shoppage_role_candidate", "isic_rev5_code", "isic_rev5_title",
    "isic_mapping_confidence", "activity_mapping_method", "latitude", "longitude",
    "location_text", "source_url", "source_as_of", "source_authority", "verification_state",
    "needs_human_review", "potential_match_group", "potential_match_group_size",
]


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    value = re.sub(r"\b(pvt|private|limited|ltd|plc|inc|company|co)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def load_isic() -> dict[str, str]:
    path = REF / "isic_rev5.csv"
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return {
            row["ISIC Rev 5 Code"]: row["ISIC Rev 5 Title"]
            for row in csv.DictReader(handle)
        }


SHOP_MAP = {
    "supermarket": ("4721", "food retailer"), "convenience": ("4721", "food and convenience retailer"),
    "grocery": ("4721", "food retailer"), "greengrocer": ("4721", "fruit and vegetable retailer"),
    "butcher": ("4721", "meat retailer"), "bakery": ("4721", "bakery retailer"),
    "alcohol": ("4722", "beverage retailer"), "beverages": ("4722", "beverage retailer"),
    "tobacco": ("4723", "tobacco retailer"), "hardware": ("4752", "hardware and building-material retailer"),
    "doityourself": ("4752", "hardware and building-material retailer"), "paint": ("4752", "paint retailer"),
    "tiles": ("4752", "building-material retailer"), "furniture": ("4759", "furniture retailer"),
    "appliance": ("4759", "household-appliance retailer"), "electronics": ("4740", "electronics retailer"),
    "mobile_phone": ("4740", "mobile-phone retailer"), "computer": ("4740", "computer retailer"),
    "clothes": ("4771", "clothing retailer"), "shoes": ("4771", "footwear retailer"),
    "fashion": ("4771", "fashion retailer"), "pharmacy": ("4772", "pharmacy retailer"),
    "medical_supply": ("4772", "medical-goods retailer"), "beauty": ("4772", "beauty-goods retailer"),
    "cosmetics": ("4772", "cosmetics retailer"), "car": ("4781", "motor-vehicle retailer"),
    "car_parts": ("4782", "motor-vehicle-parts retailer"), "tyres": ("4782", "tyre retailer"),
    "motorcycle": ("4783", "motorcycle retailer"), "books": ("4761", "book retailer"),
    "stationery": ("4761", "stationery retailer"), "sports": ("4762", "sporting-goods retailer"),
    "toys": ("4763", "toy retailer"), "games": ("4763", "games retailer"),
    "second_hand": ("4774", "second-hand-goods retailer"), "car_repair": ("9531", "motor-vehicle repairer"),
    "hairdresser": ("9621", "hairdressing business"), "travel_agency": ("7911", "travel agency"),
    "copyshop": ("1811", "printing and copying service"),
}

OFFICE_MAP = {
    "government": ("P", "public administration office"), "diplomatic": ("V", "diplomatic or extraterritorial office"),
    "lawyer": ("6910", "legal-services office"), "accountant": ("6920", "accounting or tax-services office"),
    "insurance": ("651", "insurance business"), "telecommunication": ("6110", "telecommunications office"),
    "estate_agent": ("6829", "real-estate agency"), "ngo": ("9499", "non-governmental membership or service organisation"),
    "educational_institution": ("Q", "education institution"),
}

AMENITY_MAP = {
    "clinic": ("8620", "medical clinic"), "doctors": ("8620", "medical practice"),
    "dentist": ("8620", "dental practice"), "hospital": ("8610", "hospital"),
    "pharmacy": ("4772", "pharmacy retailer"), "veterinary": ("7500", "veterinary practice"),
    "restaurant": ("5610", "restaurant"), "fast_food": ("5610", "fast-food service"),
    "cafe": ("5610", "cafe"), "bar": ("5630", "bar"), "pub": ("5630", "pub"),
    "nightclub": ("5630", "nightclub or beverage-serving venue"), "fuel": ("4730", "fuel retailer"),
    "bank": ("641", "banking institution or branch"), "bureau_de_change": ("661", "foreign-exchange service"),
    "money_transfer": ("6499", "money-transfer or financial service"), "post_office": ("5310", "postal service"),
    "car_rental": ("7710", "motor-vehicle rental service"), "car_wash": ("9531", "motor-vehicle cleaning service"),
    "marketplace": ("G", "market or commercial cluster"), "driving_school": ("8559", "driving school"),
    "cinema": ("5914", "cinema"), "theatre": ("S", "theatre or performing-arts venue"),
    "studio": ("J", "media or content studio"), "laboratory": ("8699", "health or testing laboratory"),
}

TOURISM_MAP = {
    "hotel": ("5510", "hotel"), "motel": ("5510", "motel"),
    "guest_house": ("5510", "guest-house accommodation"), "camp_site": ("5520", "camp-site accommodation"),
}

ZSE_SECTOR_MAP = {
    "Financials": ("L", "financial or insurance holding/operating company"),
    "Real Estate": ("M", "real-estate company"), "ICT": ("K", "information or communications company"),
    "Industrials": ("C", "industrial company; specific activity requires issuer review"),
    "Materials": ("B", "materials/mining/manufacturing company; specific activity requires issuer review"),
    "Consumer Staples": ("G", "consumer-staples producer or trader; specific activity requires issuer review"),
    "Consumer Discretionary": ("G", "consumer-discretionary producer or trader; specific activity requires issuer review"),
}


def osm_activity(key: str, value: str) -> tuple[str, str, str, float, str]:
    if key == "shop":
        if value in SHOP_MAP:
            code, summary = SHOP_MAP[value]
            return code, summary, "merchant", 0.78, "osm_tag_specific_rule"
        return "G", f"retail or wholesale business ({value})", "merchant", 0.55, "osm_tag_section_rule"
    if key == "office":
        if value in OFFICE_MAP:
            code, summary = OFFICE_MAP[value]
            return code, summary, "service_provider_or_institution", 0.68, "osm_tag_specific_rule"
        return "", f"office ({value}); activity unresolved", "service_provider_or_institution", 0.0, "source_tag_only"
    if key == "amenity":
        if value in AMENITY_MAP:
            code, summary = AMENITY_MAP[value]
            return code, summary, "service_provider_or_commercial_place", 0.74, "osm_tag_specific_rule"
        return "", f"commercial amenity ({value}); activity unresolved", "service_provider_or_commercial_place", 0.0, "source_tag_only"
    if key == "tourism":
        code, summary = TOURISM_MAP.get(value, ("I", f"tourism or accommodation activity ({value})"))
        return code, summary, "hospitality_or_tourism_provider", 0.76, "osm_tag_specific_rule"
    if key == "healthcare":
        return "R", f"health service ({value})", "health_service_provider", 0.55, "osm_tag_section_rule"
    if key in {"leisure", "club"}:
        return "931", f"sports or recreation activity ({value})", "sports_or_recreation_provider", 0.55, "osm_tag_group_rule"
    if key == "man_made" and value == "water_works":
        return "3600", "water collection, treatment or supply facility", "utility_or_infrastructure_operator", 0.68, "osm_tag_specific_rule"
    if key in {"industrial", "man_made"}:
        return "C", f"industrial or manufacturing facility ({value})", "manufacturer_or_industrial_operator", 0.45, "osm_tag_section_rule"
    if key == "craft":
        return "C", f"craft or trade business ({value})", "artisan_or_trade_service", 0.45, "osm_tag_section_rule"
    return "", f"commercial entity ({key}={value})", "commercial_entity_candidate", 0.0, "source_tag_only"


def base_row(**kwargs: str) -> dict[str, str]:
    row = {field: "" for field in FIELDS}
    row.update(kwargs)
    return row


def read_osm(isic: dict[str, str]) -> list[dict[str, str]]:
    path = SEED / "osm_organisation_candidates.csv"
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8", newline="") as handle:
        for source in csv.DictReader(handle):
            code, summary, role, confidence, method = osm_activity(source["primary_tag_key"], source["primary_tag_value"])
            if code and code not in isic:
                raise ValueError(f"OSM mapping references missing ISIC code {code}")
            rows.append(base_row(
                study_record_id=f"study:{source['candidate_id']}", source_family="openstreetmap",
                source_candidate_id=source["candidate_id"], name=source["name"],
                normalized_name=source["normalized_name"], source_activity=summary,
                shoppage_role_candidate=role, isic_rev5_code=code, isic_rev5_title=isic.get(code, ""),
                isic_mapping_confidence=f"{confidence:.2f}", activity_mapping_method=method,
                latitude=source["latitude"], longitude=source["longitude"],
                location_text=source["address_text"], source_url=source["source_url"],
                source_as_of=source["source_observed_at"], source_authority=source["source_authority"],
                verification_state=source["verification_state"], needs_human_review="true",
            ))
    return rows


def read_rbz(isic: dict[str, str]) -> list[dict[str, str]]:
    path = SEED / "rbz_registered_mfi_candidates.csv"
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8", newline="") as handle:
        for source in csv.DictReader(handle):
            code = "6495"
            rows.append(base_row(
                study_record_id=f"study:{source['candidate_id']}", source_family="rbz_microfinance_register",
                source_candidate_id=source["candidate_id"], name=source["name"], normalized_name=normalize_name(source["name"]),
                source_activity="registered microfinance institution", shoppage_role_candidate="financial_service_provider",
                isic_rev5_code=code, isic_rev5_title=isic[code], isic_mapping_confidence="0.95",
                activity_mapping_method="regulator_register_scope", location_text=source["head_office_address"],
                source_url=source["source_url"], source_as_of=source["source_as_of"],
                source_authority=source["source_authority"], verification_state=source["verification_state"],
                needs_human_review="true",
            ))
    return rows


def read_zse(isic: dict[str, str]) -> list[dict[str, str]]:
    path = SEED / "zse_listed_organisation_candidates.csv"
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8", newline="") as handle:
        for source in csv.DictReader(handle):
            code, summary = ZSE_SECTOR_MAP.get(source["source_sector"], ("", f"ZSE sector {source['source_sector']}"))
            if code and code not in isic:
                raise ValueError(f"ZSE mapping references missing ISIC code {code}")
            rows.append(base_row(
                study_record_id=f"study:{source['source_record_key']}", source_family="zimbabwe_stock_exchange",
                source_candidate_id=source["source_record_key"], name=source["canonical_name_candidate"],
                normalized_name=normalize_name(source["canonical_name_candidate"]), source_activity=summary,
                shoppage_role_candidate="formal_anchor_company", isic_rev5_code=code,
                isic_rev5_title=isic.get(code, ""), isic_mapping_confidence="0.45" if code else "0.00",
                activity_mapping_method="source_sector_section_rule" if code else "source_sector_only",
                source_url=source["source_url"], source_as_of="2026-07-10",
                source_authority="Zimbabwe Stock Exchange", verification_state="exchange_listed_scope_only",
                needs_human_review="true",
            ))
    return rows


def read_zera(isic: dict[str, str]) -> list[dict[str, str]]:
    path = SEED / "zera_petroleum_organisation_candidates.csv"
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8", newline="") as handle:
        for source in csv.DictReader(handle):
            code = source["isic_rev5_candidate"]
            if code not in isic:
                raise ValueError(f"ZERA mapping references missing ISIC code {code}")
            rows.append(base_row(
                study_record_id=f"study:{source['candidate_id']}", source_family="zera_petroleum_licensees",
                source_candidate_id=source["candidate_id"], name=source["name"],
                normalized_name=source["normalized_name"], source_activity=source["activity_description"],
                shoppage_role_candidate=source["shoppage_role_candidate"], isic_rev5_code=code,
                isic_rev5_title=isic[code], isic_mapping_confidence=source["isic_mapping_confidence"],
                activity_mapping_method="regulator_license_type_rule", location_text=source["locations"],
                source_url=source["source_url"], source_as_of=source["source_as_of"],
                source_authority=source["source_authority"], verification_state=source["verification_state"],
                needs_human_review="true",
            ))
    return rows


def main() -> None:
    STUDY.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    isic = load_isic()
    rows = read_osm(isic) + read_rbz(isic) + read_zse(isic) + read_zera(isic)
    group_counts = Counter(row["normalized_name"] for row in rows)
    sources_by_name: defaultdict[str, set[str]] = defaultdict(set)
    for row in rows:
        sources_by_name[row["normalized_name"]].add(row["source_family"])
    for row in rows:
        key = row["normalized_name"]
        row["potential_match_group"] = "name:" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
        row["potential_match_group_size"] = str(group_counts[key])

    output = STUDY / "zimbabwe_organisation_activity_study.csv"
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    source_counts = Counter(row["source_family"] for row in rows)
    method_counts = Counter(row["activity_mapping_method"] for row in rows)
    mapped = [row for row in rows if row["isic_rev5_code"]]
    specific = [row for row in mapped if len(row["isic_rev5_code"]) == 4]
    unresolved = [row for row in rows if not row["isic_rev5_code"]]
    cross_source_names = [name for name, sources in sources_by_name.items() if len(sources) > 1]
    profile = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "grain": "one source-observed organisation, branch, facility, institution or commercial-place candidate",
        "study_records": len(rows),
        "source_counts": dict(source_counts),
        "unique_source_candidate_ids": len({row["source_candidate_id"] for row in rows}),
        "unique_normalized_names": len(group_counts),
        "rows_with_repeated_normalized_name": sum(count for count in group_counts.values() if count > 1),
        "repeated_normalized_name_groups": sum(1 for count in group_counts.values() if count > 1),
        "cross_source_name_match_groups": len(cross_source_names),
        "isic_mapped_records": len(mapped),
        "isic_mapping_rate": round(len(mapped) / len(rows), 6),
        "specific_four_digit_isic_records": len(specific),
        "specific_four_digit_isic_rate": round(len(specific) / len(rows), 6),
        "activity_mapping_methods": dict(method_counts),
        "unresolved_activity_counts": dict(Counter(row["source_activity"] for row in unresolved).most_common(50)),
        "quality_status": "candidate_study_complete_at_source_record_grain_entity_resolution_and_verification_incomplete",
        "important_limitations": [
            "Study records are not the same as unique legal companies; OSM includes branches, institutions and commercial places.",
            "Repeated names are match candidates, not automatic duplicates; many represent legitimate branches.",
            "OSM-to-ISIC mappings are hypotheses derived from tags and require category calibration and review.",
            "ZSE sector mappings are deliberately broad because issuers and holding companies may span several activities.",
            "RBZ listing verifies register scope as of 31 March 2026, not current trading activity, ownership or catalogue.",
            "ZERA licensing verifies petroleum licence scope as of 8 June 2026; multiple licences and trade names may belong to one organisation.",
        ],
    }
    (QUALITY / "zimbabwe_organisation_activity_study_profile.json").write_text(
        json.dumps(profile, indent=2), encoding="utf-8"
    )
    metrics_path = ROOT / "foundation_metrics.json"
    if metrics_path.exists():
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        metrics.setdefault("counts", {}).update({
            "organisation_study_records": len(rows),
            "organisation_unique_normalized_names": len(group_counts),
            "organisation_isic_mapped_records": len(mapped),
            "organisation_specific_isic_records": len(specific),
        })
        metrics["organisation_study_status"] = profile["quality_status"]
        metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(output), **profile}, indent=2))


if __name__ == "__main__":
    main()
