"""
PostgreSQL prefix index the ranking engine can actually use.

The structural candidate query filtered with `title ILIKE 'term%'`, but the
existing varchar_pattern_ops indexes only serve LIKE, not ILIKE, so Postgres
sequential-scanned the table: measured 27s for 'inverter' and 142ms for
'samsng' against 77ms / 4ms for the indexed lower() form below.

(GIST pg_trgm indexes for KNN-ordered fuzzy search were tried and dropped: the
`<->` ordering measured 19.5s for 'inverter' versus ~3.5s for the existing
GIN-narrowed similarity sort, so the engine keeps the current query.)
"""

from django.db import connection, migrations

APPLY_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS catalog_mp_title_lower_prefix "
    "ON catalog_masterproduct USING btree (lower(title) text_pattern_ops)",
    "CREATE INDEX IF NOT EXISTS catalog_mp_brand_lower_prefix "
    "ON catalog_masterproduct USING btree (lower(brand) text_pattern_ops)",
]

REVERSE_STATEMENTS = [
    "DROP INDEX IF EXISTS catalog_mp_brand_lower_prefix",
    "DROP INDEX IF EXISTS catalog_mp_title_lower_prefix",
]


def apply_prefix_indexes(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cur:
        for stmt in APPLY_STATEMENTS:
            cur.execute(stmt)


def remove_prefix_indexes(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cur:
        for stmt in REVERSE_STATEMENTS:
            cur.execute(stmt)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('catalog', '0007_category_masterproduct_master_category_categorypath'),
    ]

    operations = [
        migrations.RunPython(apply_prefix_indexes, remove_prefix_indexes),
    ]
