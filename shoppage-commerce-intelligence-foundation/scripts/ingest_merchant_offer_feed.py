from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sqlite3
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "config" / "merchant_offer_feed_contract.json"
MASTER_DATABASE = ROOT / "data" / "study" / "global_food_master_products.sqlite"
OFFER_DATABASE = ROOT / "data" / "study" / "zimbabwe_offer_observations.sqlite"


def clean(value: str | None) -> str:
    return " ".join((value or "").replace("\u00a0", " ").split())


def valid_gtin(code: str) -> bool:
    if not code.isdigit() or len(code) not in {8, 12, 13, 14}:
        return False
    digits = [int(char) for char in code]
    check = digits.pop()
    total = sum(value * (3 if (len(digits) - index) % 2 == 1 else 1) for index, value in enumerate(digits))
    return (10 - total % 10) % 10 == check


def parse_timestamp(value: str) -> str:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("observed_at requires a timezone")
    return parsed.isoformat()


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS offer_observation (
          observation_id TEXT PRIMARY KEY,
          source_offer_id TEXT NOT NULL,
          seller_external_id TEXT NOT NULL,
          seller_branch_external_id TEXT NOT NULL,
          market_external_id TEXT,
          observed_at TEXT NOT NULL,
          source_url TEXT NOT NULL,
          seller_sku TEXT,
          gtin TEXT,
          product_name TEXT NOT NULL,
          brand TEXT,
          quantity TEXT,
          category TEXT,
          currency TEXT NOT NULL,
          price TEXT NOT NULL,
          availability TEXT NOT NULL,
          master_product_id TEXT,
          resolution_state TEXT NOT NULL,
          resolution_method TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          attributes_json TEXT NOT NULL,
          feed_file TEXT NOT NULL,
          ingested_at TEXT NOT NULL,
          UNIQUE(seller_external_id, seller_branch_external_id, source_offer_id, observed_at)
        );
        CREATE INDEX IF NOT EXISTS offer_master_idx ON offer_observation(master_product_id);
        CREATE INDEX IF NOT EXISTS offer_seller_branch_idx ON offer_observation(seller_external_id, seller_branch_external_id);
        CREATE INDEX IF NOT EXISTS offer_observed_idx ON offer_observation(observed_at);
        CREATE VIEW IF NOT EXISTS offer_resolution_review_queue AS
        SELECT observation_id, seller_external_id, seller_branch_external_id,
               source_offer_id, gtin, product_name, brand, quantity, category,
               resolution_state, source_url, observed_at,
               CASE
                 WHEN resolution_state = 'invalid_input' THEN 'critical'
                 WHEN resolution_state = 'valid_gtin_not_in_master' THEN 'high'
                 ELSE 'standard'
               END AS priority
        FROM offer_observation
        WHERE resolution_state <> 'matched';
        """
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("feed", type=Path)
    parser.add_argument("--database", type=Path, default=OFFER_DATABASE)
    args = parser.parse_args()

    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    required = set(contract["required_columns"])
    allowed_availability = set(contract["allowed_availability"])
    master = sqlite3.connect(f"file:{MASTER_DATABASE}?mode=ro", uri=True)
    output = sqlite3.connect(args.database)
    create_schema(output)
    counters = {"rows_seen": 0, "inserted": 0, "idempotent_duplicates": 0, "matched": 0, "valid_gtin_not_in_master": 0, "pending_text_resolution": 0, "invalid_input": 0}
    errors: list[dict[str, str | int]] = []
    ingested_at = datetime.now().astimezone().isoformat()

    with args.feed.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing_columns = sorted(required - set(reader.fieldnames or []))
        if missing_columns:
            raise ValueError(f"Feed missing required columns: {missing_columns}")
        for line_number, row in enumerate(reader, start=2):
            counters["rows_seen"] += 1
            try:
                missing_values = sorted(name for name in required if not clean(row.get(name)))
                if missing_values:
                    raise ValueError(f"missing required values: {missing_values}")
                observed_at = parse_timestamp(clean(row["observed_at"]))
                currency = clean(row["currency"]).upper()
                if not re.fullmatch(r"[A-Z]{3}", currency):
                    raise ValueError("currency must be a three-letter code")
                try:
                    price = Decimal(clean(row["price"]))
                except InvalidOperation as exc:
                    raise ValueError("price is not a decimal") from exc
                if price < 0:
                    raise ValueError("price must be non-negative")
                availability = clean(row["availability"]).lower()
                if availability not in allowed_availability:
                    raise ValueError(f"unsupported availability: {availability}")
                attributes_text = clean(row.get("attributes_json")) or "{}"
                attributes = json.loads(attributes_text)
                if not isinstance(attributes, dict):
                    raise ValueError("attributes_json must be an object")

                gtin = clean(row.get("gtin"))
                master_id = None
                if gtin and valid_gtin(gtin):
                    candidate = f"gtin:{gtin}"
                    exists = master.execute(
                        "SELECT 1 FROM global_master_product WHERE master_product_id = ?", (candidate,)
                    ).fetchone()
                    if exists:
                        master_id, state, method = candidate, "matched", "exact_valid_gtin"
                    else:
                        state, method = "valid_gtin_not_in_master", "exact_valid_gtin_lookup_miss"
                elif gtin:
                    state, method = "invalid_input", "invalid_gtin_checksum_or_length"
                else:
                    state, method = "pending_text_resolution", "no_gtin"

                identity = "|".join([
                    clean(row["seller_external_id"]), clean(row["seller_branch_external_id"]),
                    clean(row["source_offer_id"]), observed_at,
                ])
                observation_id = "offer:" + hashlib.sha256(identity.encode("utf-8")).hexdigest()[:32]
                values = (
                    observation_id, clean(row["source_offer_id"]), clean(row["seller_external_id"]),
                    clean(row["seller_branch_external_id"]), clean(row.get("market_external_id")),
                    observed_at, clean(row["source_url"]), clean(row.get("seller_sku")), gtin,
                    clean(row["product_name"]), clean(row.get("brand")), clean(row.get("quantity")),
                    clean(row.get("category")), currency, format(price, "f"), availability,
                    master_id, state, method, clean(row.get("description")), clean(row.get("image_url")),
                    json.dumps(attributes, ensure_ascii=False, separators=(",", ":")), args.feed.name, ingested_at,
                )
                cursor = output.execute(
                    """INSERT OR IGNORE INTO offer_observation VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    values,
                )
                if cursor.rowcount:
                    counters["inserted"] += 1
                    counters[state] += 1
                else:
                    counters["idempotent_duplicates"] += 1
            except (ValueError, KeyError, json.JSONDecodeError) as exc:
                counters["invalid_input"] += 1
                errors.append({"line": line_number, "error": str(exc)})
    output.commit()
    review_rows = output.execute("SELECT COUNT(*) FROM offer_resolution_review_queue").fetchone()[0]
    stored_rows = output.execute("SELECT COUNT(*) FROM offer_observation").fetchone()[0]
    output.close(); master.close()
    result = {"feed": str(args.feed), "database": str(args.database), **counters, "stored_rows": stored_rows, "review_queue_rows": review_rows, "errors": errors[:100]}
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit("Feed contained invalid rows; valid rows were retained and errors reported")


if __name__ == "__main__":
    main()
