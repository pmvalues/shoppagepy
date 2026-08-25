from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    required = [
        ROOT / "sql" / "001_commerce_graph.sql",
        ROOT / "data" / "study" / "zimbabwe_organisation_activity_study.csv",
        ROOT / "data" / "study" / "global_food_master_products.sqlite",
        ROOT / "data" / "study" / "zimbabwe_place_market_nodes.csv",
        ROOT / "data" / "study" / "zimbabwe_place_market_edges.csv",
        ROOT / "data" / "review" / "place_market_parent_review_queue.csv",
        ROOT / "quality" / "organisation_study_validation.json",
        ROOT / "quality" / "global_food_master_products_validation.json",
        ROOT / "quality" / "zimbabwe_place_market_hierarchy_validation.json",
    ]
    missing = [str(path) for path in required if not path.exists()]
    json_files = list(ROOT.rglob("*.json"))
    parsed = {str(path.relative_to(ROOT)): json.loads(path.read_text(encoding="utf-8")) for path in json_files}
    validations = {
        name: (value.get("all_checks_passed") is True or value.get("status") == "passed")
        for name, value in parsed.items()
        if name.endswith("validation.json")
    }
    database = ROOT / "data" / "study" / "global_food_master_products.sqlite"
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    product_rows = connection.execute("SELECT COUNT(*) FROM global_master_product").fetchone()[0]
    queue_rows = connection.execute("SELECT COUNT(*) FROM product_enrichment_review_queue").fetchone()[0]
    integrity = connection.execute("PRAGMA quick_check").fetchone()[0]
    connection.close()
    raw_off_inside_package = list(ROOT.rglob("en.openfoodfacts.org.products.csv.gz"))
    result = {
        "missing_required_files": missing,
        "json_files_parsed": len(json_files),
        "validation_results": validations,
        "product_rows": product_rows,
        "product_enrichment_queue_rows": queue_rows,
        "sqlite_quick_check": integrity,
        "raw_open_food_facts_files_in_package": [str(path) for path in raw_off_inside_package],
    }
    checks = {
        "required_files_present": not missing,
        "all_validation_profiles_pass": bool(validations) and all(validations.values()),
        "million_products_present": product_rows == 1_000_000,
        "review_queue_present": queue_rows > 0,
        "sqlite_integrity_ok": integrity == "ok",
        "raw_off_export_excluded": not raw_off_inside_package,
    }
    result["checks"] = checks
    result["all_checks_passed"] = all(checks.values())
    print(json.dumps(result, indent=2))
    if not result["all_checks_passed"]:
        raise SystemExit("Foundation package validation failed")


if __name__ == "__main__":
    main()
