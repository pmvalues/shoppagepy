from __future__ import annotations

import csv
import json
import math
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GEONAMES = ROOT / "data" / "reference" / "zimbabwe_places_geonames.csv"
OSM = ROOT / "data" / "seed" / "osm_organisation_candidates.csv"
STUDY = ROOT / "data" / "study"
QUALITY = ROOT / "quality"
REVIEW = ROOT / "data" / "review"
NODES = STUDY / "zimbabwe_place_market_nodes.csv"
EDGES = STUDY / "zimbabwe_place_market_edges.csv"
REVIEW_QUEUE = REVIEW / "place_market_parent_review_queue.csv"
PROFILE = QUALITY / "zimbabwe_place_market_hierarchy_profile.json"


def clean(value: str | None) -> str:
    return " ".join((value or "").replace("\u00a0", " ").split())


def normalize(value: str | None) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def feature_type(feature_class: str, feature_code: str) -> str:
    if feature_class == "P":
        return "settlement"
    if feature_class == "A":
        return "administrative_feature"
    return {
        "H": "hydrographic_feature",
        "L": "area_feature",
        "R": "route_feature",
        "S": "site_feature",
        "T": "terrain_feature",
        "U": "undersea_feature",
        "V": "vegetation_feature",
    }.get(feature_class, f"geographic_feature_{feature_code.lower()}")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    value = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def main() -> None:
    STUDY.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    REVIEW.mkdir(parents=True, exist_ok=True)
    with GEONAMES.open(encoding="utf-8", newline="") as handle:
        geonames = list(csv.DictReader(handle))
    with OSM.open(encoding="utf-8", newline="") as handle:
        osm = list(csv.DictReader(handle))

    nodes: list[dict[str, str | float | int]] = []
    edges: list[dict[str, str | float | int]] = []
    nodes.append({
        "node_id": "country:ZW", "name": "Zimbabwe", "normalized_name": "zimbabwe",
        "node_type": "country", "feature_class": "A", "feature_code": "PCLI",
        "latitude": "", "longitude": "", "admin1_code": "", "admin2_code": "",
        "admin1_name": "", "admin2_name": "", "population": "",
        "source_url": "https://download.geonames.org/export/dump/ZW.zip",
        "source_authority": "GeoNames contributors", "source_licence": "CC BY 4.0",
        "verification_state": "country_anchor",
    })

    admin1: dict[str, str] = {}
    admin2: dict[tuple[str, str], str] = {}
    for row in geonames:
        code1, name1 = clean(row.get("admin1_code")), clean(row.get("admin1_name"))
        code2, name2 = clean(row.get("admin2_code")), clean(row.get("admin2_name"))
        if code1 and name1:
            admin1.setdefault(code1, name1)
        if code1 and code2 and name2:
            admin2.setdefault((code1, code2), name2)

    for code, name in sorted(admin1.items()):
        node_id = f"geonames-admin1:ZW.{code}"
        nodes.append({
            "node_id": node_id, "name": name, "normalized_name": normalize(name),
            "node_type": "province_candidate", "feature_class": "A", "feature_code": "ADM1",
            "latitude": "", "longitude": "", "admin1_code": code, "admin2_code": "",
            "admin1_name": name, "admin2_name": "", "population": "",
            "source_url": "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
            "source_authority": "GeoNames contributors", "source_licence": "CC BY 4.0",
            "verification_state": "discovery_hierarchy_requires_zimstat_reconciliation",
        })
        edges.append({
            "parent_node_id": "country:ZW", "child_node_id": node_id,
            "relationship_type": "contains_candidate", "evidence_method": "geonames_admin1_code",
            "distance_km": "", "review_state": "requires_zimstat_reconciliation",
        })

    for (code1, code2), name in sorted(admin2.items()):
        node_id = f"geonames-admin2:ZW.{code1}.{code2}"
        nodes.append({
            "node_id": node_id, "name": name, "normalized_name": normalize(name),
            "node_type": "district_candidate", "feature_class": "A", "feature_code": "ADM2",
            "latitude": "", "longitude": "", "admin1_code": code1, "admin2_code": code2,
            "admin1_name": admin1.get(code1, ""), "admin2_name": name, "population": "",
            "source_url": "https://download.geonames.org/export/dump/admin2Codes.txt",
            "source_authority": "GeoNames contributors", "source_licence": "CC BY 4.0",
            "verification_state": "discovery_hierarchy_requires_zimstat_reconciliation",
        })
        edges.append({
            "parent_node_id": f"geonames-admin1:ZW.{code1}", "child_node_id": node_id,
            "relationship_type": "contains_candidate", "evidence_method": "geonames_admin2_code",
            "distance_km": "", "review_state": "requires_zimstat_reconciliation",
        })

    settlements: list[tuple[str, str, float, float]] = []
    settlement_names: dict[str, list[str]] = {}
    for row in geonames:
        node_id = f"geonames:{clean(row['geonameid'])}"
        lat, lon = float(row["latitude"]), float(row["longitude"])
        node_type = feature_type(row["feature_class"], row["feature_code"])
        nodes.append({
            "node_id": node_id, "name": clean(row["name"]),
            "normalized_name": normalize(row["name"]), "node_type": node_type,
            "feature_class": clean(row["feature_class"]), "feature_code": clean(row["feature_code"]),
            "latitude": lat, "longitude": lon, "admin1_code": clean(row.get("admin1_code")),
            "admin2_code": clean(row.get("admin2_code")), "admin1_name": clean(row.get("admin1_name")),
            "admin2_name": clean(row.get("admin2_name")), "population": clean(row.get("population")),
            "source_url": clean(row.get("source_url")), "source_authority": "GeoNames contributors",
            "source_licence": "CC BY 4.0", "verification_state": "reference_feature_discovery_only",
        })
        code1, code2 = clean(row.get("admin1_code")), clean(row.get("admin2_code"))
        if code1 and code2 and (code1, code2) in admin2:
            parent = f"geonames-admin2:ZW.{code1}.{code2}"
            method = "geonames_admin_codes"
        elif code1 and code1 in admin1:
            parent = f"geonames-admin1:ZW.{code1}"
            method = "geonames_admin1_code"
        else:
            parent = "country:ZW"
            method = "country_fallback"
        edges.append({
            "parent_node_id": parent, "child_node_id": node_id,
            "relationship_type": "contains_candidate", "evidence_method": method,
            "distance_km": "", "review_state": "discovery_only",
        })
        if row["feature_class"] == "P":
            settlements.append((node_id, normalize(row["name"]), lat, lon))
            settlement_names.setdefault(normalize(row["name"]), []).append(node_id)

    explicit_market_rows = []
    for row in osm:
        key, value = clean(row.get("primary_tag_key")), clean(row.get("primary_tag_value"))
        if (key, value) not in {("amenity", "marketplace"), ("shop", "mall")}:
            continue
        explicit_market_rows.append(row)
        market_type = "market" if value == "marketplace" else "mall"
        market_id = "market-" + clean(row["candidate_id"])
        lat, lon = float(row["latitude"]), float(row["longitude"])
        nodes.append({
            "node_id": market_id, "name": clean(row["name"]),
            "normalized_name": normalize(row["name"]), "node_type": market_type,
            "feature_class": "OSM", "feature_code": f"{key}={value}",
            "latitude": lat, "longitude": lon, "admin1_code": "", "admin2_code": "",
            "admin1_name": clean(row.get("province")), "admin2_name": "", "population": "",
            "source_url": clean(row.get("source_url")), "source_authority": "OpenStreetMap contributors",
            "source_licence": "ODbL 1.0; attribution required",
            "verification_state": "explicit_osm_tag_discovery_only",
        })

        city_norm = normalize(row.get("city"))
        candidates = settlement_names.get(city_norm, []) if city_norm else []
        if len(candidates) == 1:
            parent_id, method, distance = candidates[0], "source_address_city_exact_name", ""
        else:
            nearest = min(
                ((haversine_km(lat, lon, slat, slon), sid) for sid, _, slat, slon in settlements),
                key=lambda item: item[0],
            )
            distance, parent_id = nearest
            method = "nearest_geonames_settlement_candidate"
            distance = round(distance, 4)
        edges.append({
            "parent_node_id": parent_id, "child_node_id": market_id,
            "relationship_type": "contains_market_candidate", "evidence_method": method,
            "distance_km": distance, "review_state": "human_review_required",
        })

    node_fields = list(nodes[0].keys())
    edge_fields = list(edges[0].keys())
    with NODES.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=node_fields)
        writer.writeheader(); writer.writerows(nodes)
    with EDGES.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=edge_fields)
        writer.writeheader(); writer.writerows(edges)

    node_by_id = {str(row["node_id"]): row for row in nodes}
    market_ids = {str(row["node_id"]) for row in nodes if row["node_type"] in {"market", "mall"}}
    review_rows = []
    for edge in edges:
        if edge["child_node_id"] not in market_ids:
            continue
        distance_text = str(edge["distance_km"])
        distance = float(distance_text) if distance_text else None
        priority = "critical" if distance is not None and distance > 25 else "high" if distance is not None and distance > 10 else "standard"
        parent = node_by_id[str(edge["parent_node_id"])]
        child = node_by_id[str(edge["child_node_id"])]
        review_rows.append({
            "review_id": f"review:{edge['child_node_id']}", "priority": priority,
            "market_node_id": edge["child_node_id"], "market_name": child["name"],
            "market_type": child["node_type"], "proposed_parent_node_id": edge["parent_node_id"],
            "proposed_parent_name": parent["name"], "evidence_method": edge["evidence_method"],
            "distance_km": edge["distance_km"], "market_source_url": child["source_url"],
            "review_state": "pending_human_review",
        })
    review_rows.sort(key=lambda row: ({"critical": 0, "high": 1, "standard": 2}[str(row["priority"])], -(float(row["distance_km"]) if row["distance_km"] else -1)))
    with REVIEW_QUEUE.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(review_rows[0].keys()))
        writer.writeheader(); writer.writerows(review_rows)

    node_types = Counter(str(row["node_type"]) for row in nodes)
    edge_methods = Counter(str(row["evidence_method"]) for row in edges)
    market_distances = [float(row["distance_km"]) for row in edges if row["distance_km"] != ""]
    profile = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_geonames_features": len(geonames),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "admin1_scaffolds": len(admin1),
        "admin2_scaffolds": len(admin2),
        "settlement_nodes": len(settlements),
        "explicit_osm_market_and_mall_nodes": len(explicit_market_rows),
        "node_types": dict(node_types),
        "edge_evidence_methods": dict(edge_methods),
        "market_parent_distance_km_max": round(max(market_distances), 4) if market_distances else None,
        "market_parent_distance_km_over_25_count": sum(value > 25 for value in market_distances),
        "nested_market_edges": 0,
        "market_parent_review_queue_rows": len(review_rows),
        "market_parent_review_priority_counts": dict(Counter(str(row["priority"]) for row in review_rows)),
        "nested_market_note": "The graph schema supports market-in-market edges, but none are inferred from proximity. Polygon, address, operator, or source containment evidence is required.",
        "official_hierarchy_note": "GeoNames codes are discovery scaffolding. ZIMSTAT boundaries and official administrative registers must control production hierarchy.",
        "quality_status": "complete_reference_feature_graph_and_explicit_market_discovery_seed_not_official_market_census",
    }
    PROFILE.write_text(json.dumps(profile, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(profile, indent=2))


if __name__ == "__main__":
    main()
