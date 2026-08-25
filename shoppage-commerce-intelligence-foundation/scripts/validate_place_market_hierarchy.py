from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NODES = ROOT / "data" / "study" / "zimbabwe_place_market_nodes.csv"
EDGES = ROOT / "data" / "study" / "zimbabwe_place_market_edges.csv"
OUTPUT = ROOT / "quality" / "zimbabwe_place_market_hierarchy_validation.json"


def main() -> None:
    with NODES.open(encoding="utf-8", newline="") as handle:
        nodes = list(csv.DictReader(handle))
    with EDGES.open(encoding="utf-8", newline="") as handle:
        edges = list(csv.DictReader(handle))
    ids = [row["node_id"] for row in nodes]
    id_set = set(ids)
    market_nodes = [row for row in nodes if row["node_type"] in {"market", "mall"}]
    market_ids = {row["node_id"] for row in market_nodes}
    market_parent_edges = [row for row in edges if row["child_node_id"] in market_ids]
    checks = {
        "all_25019_geonames_features_materialized": sum(row["node_id"].startswith("geonames:") for row in nodes) == 25019,
        "node_ids_unique": len(ids) == len(id_set),
        "all_edge_parents_exist": all(row["parent_node_id"] in id_set for row in edges),
        "all_edge_children_exist": all(row["child_node_id"] in id_set for row in edges),
        "all_markets_have_one_parent_candidate": len(market_parent_edges) == len(market_nodes) and len({row["child_node_id"] for row in market_parent_edges}) == len(market_nodes),
        "no_unsubstantiated_nested_market_edges": not any(row["parent_node_id"] in market_ids and row["child_node_id"] in market_ids for row in edges),
        "every_edge_has_review_state": all(row["review_state"] for row in edges),
    }
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "node_count": len(nodes), "edge_count": len(edges),
        "market_and_mall_nodes": len(market_nodes),
        "checks": checks, "all_checks_passed": all(checks.values()),
        "interpretation": "Complete GeoNames feature scaffold plus explicit OSM marketplace/mall discovery. Production administrative and nested-market containment remain evidence-gated.",
    }
    OUTPUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    if not result["all_checks_passed"]:
        raise SystemExit("Place-market validation failed")


if __name__ == "__main__":
    main()
