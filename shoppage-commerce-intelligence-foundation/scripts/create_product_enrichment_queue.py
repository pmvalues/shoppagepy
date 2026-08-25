from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "data" / "study" / "global_food_master_products.sqlite"

VIEW_SQL = """
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
WHERE product_name = '' OR brand_normalized = '' OR category_leaf = '' OR quantity = ''
"""


def main() -> None:
    connection = sqlite3.connect(DATABASE)
    connection.execute(VIEW_SQL)
    counts = dict(connection.execute(
        "SELECT priority, COUNT(*) FROM product_enrichment_review_queue GROUP BY priority"
    ).fetchall())
    total = sum(counts.values())
    connection.commit()
    connection.close()
    print(json.dumps({"database": str(DATABASE), "review_queue_rows": total, "priority_counts": counts}, indent=2))


if __name__ == "__main__":
    main()
