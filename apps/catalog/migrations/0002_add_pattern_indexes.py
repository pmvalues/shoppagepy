from django.db import migrations

def create_pattern_indexes(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cur:
            cur.execute("CREATE INDEX IF NOT EXISTS idx_prod_title_pattern ON catalog_masterproduct (title varchar_pattern_ops);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_prod_brand_pattern ON catalog_masterproduct (brand varchar_pattern_ops);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_prod_model_pattern ON catalog_masterproduct (model_number varchar_pattern_ops);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_merc_name_pattern ON merchants_merchant (name varchar_pattern_ops);")

def drop_pattern_indexes(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cur:
            cur.execute("DROP INDEX IF EXISTS idx_prod_title_pattern;")
            cur.execute("DROP INDEX IF EXISTS idx_prod_brand_pattern;")
            cur.execute("DROP INDEX IF EXISTS idx_prod_model_pattern;")
            cur.execute("DROP INDEX IF EXISTS idx_merc_name_pattern;")

class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0001_initial'),
        ('merchants', '0004_alter_merchant_trust_score'),
    ]

    operations = [
        migrations.RunPython(create_pattern_indexes, drop_pattern_indexes),
    ]
