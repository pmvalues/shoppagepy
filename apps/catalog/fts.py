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

from django.db import connection

FTS_TABLE = 'catalog_masterproduct_fts'
FTS_COLUMNS = ('pid', 'title', 'brand', 'model_number', 'category_ref', 'gtin13', 'description', 'aliases')


def _fts_ddl() -> str:
    return (
        f"CREATE VIRTUAL TABLE IF NOT EXISTS {FTS_TABLE} USING fts5("
        "pid UNINDEXED, title, brand, model_number, category_ref, gtin13, description, aliases, "
        "tokenize='porter unicode61')"
    )


def fts_column_names() -> list[str]:
    if connection.vendor != 'sqlite':
        return []
    try:
        with connection.cursor() as cur:
            cur.execute(f"PRAGMA table_info({FTS_TABLE})")
            return [row[1] for row in cur.fetchall()]
    except Exception:
        return []


def ensure_fts_table() -> None:
    if connection.vendor != 'sqlite':
        return
    existing = fts_column_names()
    if existing and existing != list(FTS_COLUMNS):
        # Shape drifted from the indexed column set — rebuild rather than mismatch.
        with connection.cursor() as cur:
            cur.execute(f"DROP TABLE IF EXISTS {FTS_TABLE}")
    with connection.cursor() as cur:
        cur.execute(_fts_ddl())


def row_values(product) -> list[str]:
    aliases = product.aliases if isinstance(product.aliases, list) else []
    alias_text = ' '.join(
        str(item.get('phrase', '')) for item in aliases if isinstance(item, dict)
    )
    return [
        str(product.pk),
        product.title or '',
        product.brand or '',
        product.model_number or '',
        product.category_ref or '',
        product.gtin13 or '',
        (product.description or '')[:2000],
        alias_text[:2000],
    ]


def upsert_row(product) -> None:
    """Keep a single product's index entry in step with the row."""
    if connection.vendor != 'sqlite':
        return
    ensure_fts_table()
    try:
        with connection.cursor() as cur:
            cur.execute(f"DELETE FROM {FTS_TABLE} WHERE pid = %s", [str(product.pk)])
            if product.status != 'active':
                return
            cur.execute(
                f"INSERT INTO {FTS_TABLE}({', '.join(FTS_COLUMNS)}) "
                f"VALUES ({', '.join(['%s'] * len(FTS_COLUMNS))})",
                row_values(product),
            )
    except Exception:
        pass


def delete_row(product_id) -> None:
    if connection.vendor != 'sqlite':
        return
    if not fts_table_exists():
        return
    try:
        with connection.cursor() as cur:
            cur.execute(f"DELETE FROM {FTS_TABLE} WHERE pid = %s", [str(product_id)])
    except Exception:
        pass


def missing_ids(batch: int = 2000) -> list[str]:
    """Product ids absent from the index — the drift a rebuild would have cured."""
    if connection.vendor != 'sqlite' or not fts_table_exists():
        return []
    try:
        with connection.cursor() as cur:
            cur.execute(
                f"SELECT p.id FROM catalog_masterproduct p "
                f"LEFT JOIN {FTS_TABLE} f ON f.pid = p.id "
                "WHERE f.pid IS NULL AND p.status = 'active' LIMIT %s",
                [batch],
            )
            return [row[0] for row in cur.fetchall()]
    except Exception:
        return []


def fts_table_exists() -> bool:
    if connection.vendor != 'sqlite':
        return False
    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM sqlite_master WHERE name = %s", [FTS_TABLE])
            row = cur.fetchone()
            return bool(row and row[0] > 0)
    except Exception:
        return False


def fts_row_count() -> int:
    if connection.vendor != 'sqlite':
        return 0
    if not fts_table_exists():
        return 0
    try:
        with connection.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {FTS_TABLE}")
            row = cur.fetchone()
            return int(row[0]) if row else 0
    except Exception:
        return 0


def rebuild_fts(batch_size: int = 5000) -> int:
    """
    (Re)populate the FTS5 index from MasterProduct. Returns row count indexed.
    Safe to run repeatedly; truncates and reloads. Runs as a single transaction
    with synchronous=OFF so a million-row catalogue indexes in one commit rather
    than committing every batch.
    """
    if connection.vendor != 'sqlite':
        return 0

    from django.db import transaction

    from apps.catalog.models import MasterProduct

    ensure_fts_table()

    qs = MasterProduct.objects.all().iterator(chunk_size=batch_size)

    insert_sql = (
        f"INSERT INTO {FTS_TABLE}({', '.join(FTS_COLUMNS)}) "
        f"VALUES ({', '.join(['%s'] * len(FTS_COLUMNS))})"
    )

    count = 0
    batch: list[list[str]] = []
    with connection.cursor() as cur:
        cur.execute("PRAGMA synchronous=OFF")
        cur.execute("PRAGMA temp_store=MEMORY")
        try:
            with transaction.atomic():
                cur.execute(f"DELETE FROM {FTS_TABLE}")
                for product in qs:
                    if product.status != 'active':
                        continue
                    batch.append(row_values(product))
                    if len(batch) >= batch_size:
                        cur.executemany(insert_sql, batch)
                        count += len(batch)
                        batch.clear()
                if batch:
                    cur.executemany(insert_sql, batch)
                    count += len(batch)
        finally:
            cur.execute("PRAGMA synchronous=FULL")
    return count


def fts_search_ids(query: str, limit: int) -> list[str]:
    """
    Run an FTS5 MATCH query with bm25 ranking. Each token is treated as a prefix
    (trailing '*') so partial words match. Returns product UUID strings ordered
    best-first.
    """
    if connection.vendor != 'sqlite':
        return []
    if not query or not query.strip():
        return []
    terms = [t for t in query.split() if t]
    if not terms:
        return []
    match_expr = ' '.join(f'{t}*' for t in terms)

    try:
        with connection.cursor() as cur:
            cur.execute(
                f"SELECT pid FROM {FTS_TABLE} "
                f"WHERE {FTS_TABLE} MATCH %s ORDER BY bm25({FTS_TABLE}) LIMIT %s",
                [match_expr, limit],
            )
            return [r[0] for r in cur.fetchall()]
    except Exception:
        return []
