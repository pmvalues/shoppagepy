from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "data" / "study" / "global_food_master_products.sqlite"
PROFILE = ROOT / "quality" / "global_food_master_products_profile.json"
OUTPUT = ROOT / "quality" / "global_food_master_products_validation.json"
TARGET = 1_000_000


def scalar(connection: sqlite3.Connection, sql: str):
    return connection.execute(sql).fetchone()[0]


def main() -> None:
    if not DATABASE.exists():
        raise FileNotFoundError(DATABASE)
    profile = json.loads(PROFILE.read_text(encoding="utf-8"))
    connection = sqlite3.connect(f"file:{DATABASE}?mode=ro", uri=True)
    counts = {
        "stored_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product"),
        "distinct_master_ids": scalar(connection, "SELECT COUNT(DISTINCT master_product_id) FROM global_master_product"),
        "distinct_source_codes": scalar(connection, "SELECT COUNT(DISTINCT source_product_code) FROM global_master_product"),
        "valid_gtin_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE gtin_valid = 1"),
        "distinct_family_keys": scalar(connection, "SELECT COUNT(DISTINCT product_family_key) FROM global_master_product"),
        "categorized_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE category_leaf <> ''"),
        "branded_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE brand_normalized <> ''"),
        "named_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE product_name <> ''"),
        "feature_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE global_features_json <> '{}'"),
        "not_observed_zimbabwe_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE local_zimbabwe_availability_state = 'not_observed'"),
        "global_reference_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE source_verification_state = 'community_contributed_global_reference'"),
        "invalid_json_rows": scalar(connection, "SELECT COUNT(*) FROM global_master_product WHERE json_valid(global_features_json) = 0"),
        "enrichment_review_queue_rows": scalar(connection, "SELECT COUNT(*) FROM product_enrichment_review_queue"),
    }
    connection.close()
    rows = counts["stored_rows"]
    checks = {
        "at_least_one_million_unique_master_products": rows >= TARGET,
        "master_ids_are_unique": counts["distinct_master_ids"] == rows,
        "source_codes_are_unique": counts["distinct_source_codes"] == rows,
        "profile_matches_database": profile.get("stored_master_products") == rows,
        "global_features_are_valid_json": counts["invalid_json_rows"] == 0,
        "no_global_record_claims_zimbabwe_availability": counts["not_observed_zimbabwe_rows"] == rows,
        "all_rows_keep_global_reference_state": counts["global_reference_rows"] == rows,
        "family_keys_present": counts["distinct_family_keys"] > 0,
        "enrichment_gaps_are_queued": counts["enrichment_review_queue_rows"] > 0,
    }
    coverage = {
        key.removesuffix("_rows") + "_rate": round(value / rows, 6) if rows else 0
        for key, value in counts.items()
        if key in {"valid_gtin_rows", "categorized_rows", "branded_rows", "named_rows", "feature_rows"}
    }
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "database": str(DATABASE),
        "counts": counts,
        "coverage": coverage,
        "checks": checks,
        "all_checks_passed": all(checks.values()),
        "interpretation": "Scale-tested global food master seed. It is neither a Zimbabwe offer census nor evidence of local stock, sellers, price, or availability.",
    }
    OUTPUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    if not result["all_checks_passed"]:
        raise SystemExit("Global product validation failed")


if __name__ == "__main__":
    main()
