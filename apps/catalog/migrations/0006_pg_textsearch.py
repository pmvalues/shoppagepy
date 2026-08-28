"""
PostgreSQL real full-text + fuzzy search infrastructure (SQLite keeps FTS5).

Adds a weighted tsvector generated column over the searchable product fields,
a GIN index for it, and pg_trgm GIN indexes on title/brand for typo-tolerant
matching. The column is DB-managed (GENERATED ALWAYS ... STORED) so the Django
ORM never needs to know about it; inserts and updates keep it current.
"""

from django.db import connection, migrations

APPLY_STATEMENTS = [
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",
    "ALTER TABLE catalog_masterproduct DROP COLUMN IF EXISTS search_tsv",
    """
    ALTER TABLE catalog_masterproduct ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(model_number, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(search_terms, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(category_ref, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(left(description, 2000), '')), 'C')
      ) STORED
    """,
    "CREATE INDEX IF NOT EXISTS catalog_mp_search_tsv_gin "
    "ON catalog_masterproduct USING gin (search_tsv)",
    "CREATE INDEX IF NOT EXISTS catalog_mp_title_trgm "
    "ON catalog_masterproduct USING gin (title gin_trgm_ops)",
    "CREATE INDEX IF NOT EXISTS catalog_mp_brand_trgm "
    "ON catalog_masterproduct USING gin (brand gin_trgm_ops)",
]

REVERSE_STATEMENTS = [
    "DROP INDEX IF EXISTS catalog_mp_brand_trgm",
    "DROP INDEX IF EXISTS catalog_mp_title_trgm",
    "DROP INDEX IF EXISTS catalog_mp_search_tsv_gin",
    "ALTER TABLE catalog_masterproduct DROP COLUMN IF EXISTS search_tsv",
]


def apply_search_index(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cur:
        for stmt in APPLY_STATEMENTS:
            cur.execute(stmt)


def remove_search_index(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cur:
        for stmt in REVERSE_STATEMENTS:
            cur.execute(stmt)


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0005_alter_masterproduct_options'),
    ]

    operations = [
        migrations.RunPython(apply_search_index, remove_search_index),
    ]
