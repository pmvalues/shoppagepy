"""
SQLite FTS5 search index for Shoppage (dev / single-node path).

Mirrors the PostgreSQL full-text path used in production. Provides fast
substring + prefix + ranked retrieval over MasterProduct without scanning
the 1M-row base table. The index is a standalone FTS5 virtual table. Because
MasterProduct uses a UUID primary key (not an integer rowid), the UUID is
stored as an UNINDEXED text column `pid` and returned directly for ORM lookup.

The index is rebuilt explicitly via `manage.py rebuild_catalog_fts`.

Production note: on PostgreSQL the ranking.py module uses django.contrib.postgres
SearchVector/SearchRank instead; this module is only the SQLite fallback.
"""

from __future__ import annotations

from typing import List

from django.db import connection

FTS_TABLE = 'catalog_masterproduct_fts'


def ensure_fts_table() -> None:
    with connection.cursor() as cur:
        cur.execute(
            f"CREATE VIRTUAL TABLE IF NOT EXISTS {FTS_TABLE} "
            "USING fts5(pid UNINDEXED, title, brand, model_number, "
            "category_ref, gtin13, tokenize='porter unicode61')"
        )


def fts_table_exists() -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM sqlite_master WHERE name = %s", [FTS_TABLE])
        return cur.fetchone()[0] > 0


def fts_row_count() -> int:
    if not fts_table_exists():
        return 0
    with connection.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {FTS_TABLE}")
        return cur.fetchone()[0]


def rebuild_fts(batch_size: int = 5000) -> int:
    """
    (Re)populate the FTS5 index from MasterProduct. Returns row count indexed.
    Safe to run repeatedly; truncates and reloads. Uses batched executemany
    inserts for speed over large catalogs (1M+ rows).
    """
    from apps.catalog.models import MasterProduct

    ensure_fts_table()
    with connection.cursor() as cur:
        cur.execute(f"DELETE FROM {FTS_TABLE}")

    qs = MasterProduct.objects.values_list(
        'id', 'title', 'brand', 'model_number', 'category_ref', 'gtin13'
    ).iterator(chunk_size=batch_size)

    count = 0
    batch = []
    with connection.cursor() as cur:
        for row in qs:
            pid, title, brand, model_number, category_ref, gtin13 = row
            batch.append([
                str(pid), title or '', brand or '', model_number or '',
                category_ref or '', gtin13 or '',
            ])
            if len(batch) >= batch_size:
                cur.executemany(
                    f"INSERT INTO {FTS_TABLE}(pid, title, brand, model_number, "
                    "category_ref, gtin13) VALUES (%s, %s, %s, %s, %s, %s)",
                    batch,
                )
                count += len(batch)
                batch.clear()
        if batch:
            cur.executemany(
                f"INSERT INTO {FTS_TABLE}(pid, title, brand, model_number, "
                "category_ref, gtin13) VALUES (%s, %s, %s, %s, %s, %s)",
                batch,
            )
            count += len(batch)
    return count


def fts_search_ids(query: str, limit: int) -> List[str]:
    """
    Run an FTS5 MATCH query with bm25 ranking. Each token is treated as a prefix
    (trailing '*') so partial words match. Returns product UUID strings ordered
    best-first.
    """
    if not query or not query.strip():
        return []
    terms = [t for t in query.split() if t]
    if not terms:
        return []
    match_expr = ' '.join(f'{t}*' for t in terms)

    with connection.cursor() as cur:
        cur.execute(
            f"SELECT pid FROM {FTS_TABLE} "
            f"WHERE {FTS_TABLE} MATCH %s ORDER BY bm25({FTS_TABLE}) LIMIT %s",
            [match_expr, limit],
        )
        return [r[0] for r in cur.fetchall()]
