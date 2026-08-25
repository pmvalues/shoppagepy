from __future__ import annotations

import csv
import gzip
import hashlib
import json
import re
import sqlite3
import sys
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / "data" / "study"
QUALITY = ROOT / "quality"
DEFAULT_LIMIT = 1_000_000
SOURCE_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"


def clean(value: str | None) -> str:
    return " ".join((value or "").replace("\u00a0", " ").split())


def normalize(value: str | None) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def valid_gtin(code: str) -> bool:
    if not code.isdigit() or len(code) not in {8, 12, 13, 14}:
        return False
    digits = [int(char) for char in code]
    check = digits.pop()
    total = sum(value * (3 if (len(digits) - index) % 2 == 1 else 1) for index, value in enumerate(digits))
    return (10 - total % 10) % 10 == check


def first(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = clean(row.get(key))
        if value:
            return value
    return ""


def leaf_category(tags: str) -> str:
    values = [item.strip() for item in (tags or "").split(",") if item.strip()]
    return values[-1] if values else ""


def family_key(row: dict[str, str], brand_norm: str, generic_norm: str, category_leaf: str) -> str:
    basis = category_leaf or generic_norm
    if not basis:
        basis = " ".join(item for item in [brand_norm, normalize(row.get("product_name"))] if item)
    if not basis:
        return "unclassified"
    return "off-family:" + hashlib.sha1(basis.encode("utf-8")).hexdigest()[:20]


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;
        CREATE TABLE IF NOT EXISTS global_master_product (
          master_product_id TEXT PRIMARY KEY,
          source_product_code TEXT NOT NULL UNIQUE,
          gtin TEXT,
          gtin_valid INTEGER NOT NULL,
          product_family_key TEXT NOT NULL,
          product_name TEXT,
          generic_name TEXT,
          brand TEXT,
          brand_normalized TEXT,
          quantity TEXT,
          packaging TEXT,
          category_path TEXT,
          category_tags TEXT,
          category_leaf TEXT,
          countries TEXT,
          manufacturing_places TEXT,
          ingredients_text TEXT,
          allergens TEXT,
          labels TEXT,
          nutrition_grade TEXT,
          nova_group TEXT,
          ecoscore_grade TEXT,
          completeness TEXT,
          global_features_json TEXT NOT NULL,
          source_url TEXT,
          source_created_t TEXT,
          source_modified_t TEXT,
          source_authority TEXT NOT NULL,
          source_licence TEXT NOT NULL,
          source_verification_state TEXT NOT NULL,
          local_zimbabwe_availability_state TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS global_master_product_family_idx ON global_master_product(product_family_key);
        CREATE INDEX IF NOT EXISTS global_master_product_brand_idx ON global_master_product(brand_normalized);
        CREATE INDEX IF NOT EXISTS global_master_product_category_idx ON global_master_product(category_leaf);
        CREATE INDEX IF NOT EXISTS global_master_product_gtin_idx ON global_master_product(gtin);
        CREATE TABLE IF NOT EXISTS build_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE VIEW IF NOT EXISTS product_enrichment_review_queue AS
        SELECT
          master_product_id,
          source_product_code,
          CASE
            WHEN product_name = '' AND brand_normalized = '' AND category_leaf = '' THEN 'critical'
            WHEN category_leaf = '' AND brand_normalized = '' THEN 'high'
            WHEN category_leaf = '' OR brand_normalized = '' THEN 'standard'
            ELSE 'low'
          END AS priority,
          trim(
            CASE WHEN product_name = '' THEN 'product_name,' ELSE '' END ||
            CASE WHEN brand_normalized = '' THEN 'brand,' ELSE '' END ||
            CASE WHEN category_leaf = '' THEN 'category,' ELSE '' END ||
            CASE WHEN quantity = '' THEN 'quantity,' ELSE '' END,
            ','
          ) AS missing_fields,
          source_url,
          'pending_enrichment' AS review_state
        FROM global_master_product
        WHERE product_name = '' OR brand_normalized = '' OR category_leaf = '' OR quantity = '';
        """
    )


def product_tuple(row: dict[str, str]) -> tuple:
    code = clean(row.get("code"))
    gtin_ok = valid_gtin(code)
    master_id = f"gtin:{code}" if gtin_ok else f"off:{code}"
    product_name = first(row, "product_name", "product_name_en", "abbreviated_product_name")
    generic_name = first(row, "generic_name", "generic_name_en")
    brand = first(row, "brands")
    brand_norm = normalize(brand)
    generic_norm = normalize(generic_name)
    category_tags = clean(row.get("categories_tags"))
    category_leaf = leaf_category(category_tags)
    features = {
        "serving_size": clean(row.get("serving_size")),
        "energy_kcal_100g": clean(row.get("energy-kcal_100g")),
        "fat_100g": clean(row.get("fat_100g")),
        "saturated_fat_100g": clean(row.get("saturated-fat_100g")),
        "carbohydrates_100g": clean(row.get("carbohydrates_100g")),
        "sugars_100g": clean(row.get("sugars_100g")),
        "fiber_100g": clean(row.get("fiber_100g")),
        "proteins_100g": clean(row.get("proteins_100g")),
        "salt_100g": clean(row.get("salt_100g")),
        "sodium_100g": clean(row.get("sodium_100g")),
        "additives_n": clean(row.get("additives_n")),
        "ingredients_from_palm_oil_n": clean(row.get("ingredients_from_palm_oil_n")),
        "food_groups_tags": clean(row.get("food_groups_tags")),
        "pnns_groups_1": clean(row.get("pnns_groups_1")),
        "pnns_groups_2": clean(row.get("pnns_groups_2")),
    }
    features = {key: value for key, value in features.items() if value}
    return (
        master_id, code, code if gtin_ok else None, int(gtin_ok),
        family_key(row, brand_norm, generic_norm, category_leaf), product_name, generic_name,
        brand, brand_norm, clean(row.get("quantity")), clean(row.get("packaging")),
        clean(row.get("categories")), category_tags, category_leaf, clean(row.get("countries")),
        clean(row.get("manufacturing_places")), first(row, "ingredients_text", "ingredients_text_en"),
        clean(row.get("allergens")), clean(row.get("labels")), first(row, "nutrition_grade_fr", "nutriscore_grade"),
        clean(row.get("nova_group")), clean(row.get("ecoscore_grade")), clean(row.get("completeness")),
        json.dumps(features, ensure_ascii=False, separators=(",", ":")), clean(row.get("url")),
        clean(row.get("created_t")), clean(row.get("last_modified_t")), "Open Food Facts contributors",
        "ODbL database; Database Contents License; images excluded from this build",
        "community_contributed_global_reference", "not_observed",
    )


INSERT_SQL = """
INSERT OR IGNORE INTO global_master_product (
  master_product_id, source_product_code, gtin, gtin_valid, product_family_key,
  product_name, generic_name, brand, brand_normalized, quantity, packaging,
  category_path, category_tags, category_leaf, countries, manufacturing_places,
  ingredients_text, allergens, labels, nutrition_grade, nova_group, ecoscore_grade,
  completeness, global_features_json, source_url, source_created_t, source_modified_t,
  source_authority, source_licence, source_verification_state, local_zimbabwe_availability_state
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
"""


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: build_global_food_master_products.py <openfoodfacts.csv.gz> [limit]")
    source = Path(sys.argv[1])
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_LIMIT
    if not source.exists():
        raise FileNotFoundError(source)
    STUDY.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    database = STUDY / "global_food_master_products.sqlite"
    if database.exists():
        database.unlink()
    connection = sqlite3.connect(database)
    create_schema(connection)
    csv.field_size_limit(100_000_000)
    scanned = 0
    usable = 0
    missing = Counter()
    category_counts: Counter[str] = Counter()
    brand_counts: Counter[str] = Counter()
    gtin_valid_count = 0
    modified_values: list[int] = []
    seen_codes: set[str] = set()
    batch: list[tuple] = []
    with gzip.open(source, "rt", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required_source_columns = {"code", "product_name", "brands", "categories_tags"}
        if not required_source_columns.issubset(set(reader.fieldnames or [])):
            raise ValueError(f"Open Food Facts schema missing required fields: {required_source_columns - set(reader.fieldnames or [])}")
        for row in reader:
            scanned += 1
            code = clean(row.get("code"))
            product_name = first(row, "product_name", "product_name_en", "abbreviated_product_name")
            brand = clean(row.get("brands"))
            categories = clean(row.get("categories_tags"))
            if not code or not (product_name or brand or categories):
                missing["unusable_row"] += 1
                continue
            if code in seen_codes:
                missing["duplicate_source_code"] += 1
                continue
            seen_codes.add(code)
            item = product_tuple(row)
            batch.append(item)
            usable += 1
            gtin_valid_count += item[3]
            category_counts[item[13] or "unclassified"] += 1
            brand_counts[item[8] or "unbranded"] += 1
            for field_name, value in [("product_name", product_name), ("brand", brand), ("categories", categories), ("quantity", clean(row.get("quantity")) )]:
                if not value:
                    missing[field_name] += 1
            modified = clean(row.get("last_modified_t"))
            if modified.isdigit():
                modified_values.append(int(modified))
            if len(batch) >= 10_000:
                connection.executemany(INSERT_SQL, batch)
                connection.commit()
                batch.clear()
            if usable >= limit:
                break
    if batch:
        connection.executemany(INSERT_SQL, batch)
        connection.commit()
    stored = connection.execute("SELECT COUNT(*) FROM global_master_product").fetchone()[0]
    families = connection.execute("SELECT COUNT(DISTINCT product_family_key) FROM global_master_product").fetchone()[0]
    metadata = {
        "source_url": SOURCE_URL,
        "source_file": source.name,
        "source_file_bytes": source.stat().st_size,
        "build_limit": limit,
        "rows_scanned": scanned,
        "usable_rows_seen": usable,
        "stored_master_products": stored,
        "distinct_family_keys": families,
        "gtin_valid_records": gtin_valid_count,
        "gtin_valid_rate": round(gtin_valid_count / usable, 6) if usable else 0,
        "missing_counts": dict(missing),
        "top_category_leafs": category_counts.most_common(50),
        "top_brands": brand_counts.most_common(50),
        "source_modified_t_min": min(modified_values) if modified_values else None,
        "source_modified_t_max": max(modified_values) if modified_values else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "quality_status": "global_reference_master_seed_not_zimbabwe_offer_or_availability_evidence",
        "sampling_note": "Deterministic first usable rows in the daily export; suitable for scale testing, not a representative market sample.",
    }
    connection.executemany("INSERT OR REPLACE INTO build_metadata(key,value) VALUES (?,?)", [(key, json.dumps(value)) for key, value in metadata.items()])
    connection.commit()
    connection.execute("ANALYZE")
    connection.commit()
    connection.close()
    (QUALITY / "global_food_master_products_profile.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({"database": str(database), **metadata}, indent=2))
    if stored < limit:
        raise SystemExit(f"Stored only {stored} products, below requested limit {limit}")


if __name__ == "__main__":
    main()
