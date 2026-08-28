from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Metadata-only merchant column additions.

    SQLite cannot add a column with a JSON CHECK constraint without rewriting the
    whole table, which would copy all ~3M merchant rows twice. All eight columns
    are nullable, so they are added with plain ALTER TABLE statements (a
    metadata-only operation) while the migration state is kept identical to the
    auto-generated version for future autodetection.
    """

    dependencies = [
        ("merchants", "0005_merchant_owner"),
    ]

    state_operations = [
        migrations.AddField(
            model_name="merchant", name="appointment_url",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="locality",
            field=models.CharField(blank=True, db_index=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="meta_description",
            field=models.CharField(blank=True, max_length=320, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="meta_title",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="opening_hours",
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="postal_code",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="profile_categories",
            field=models.JSONField(blank=True, default=list, null=True),
        ),
        migrations.AddField(
            model_name="merchant", name="timezone",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]

    database_operations = [
        migrations.RunSQL(
            [
                'ALTER TABLE "merchants_merchant" ADD COLUMN "appointment_url" varchar(200) NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "locality" varchar(100) NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "meta_description" varchar(320) NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "meta_title" varchar(255) NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "opening_hours" text NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "postal_code" varchar(20) NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "profile_categories" text NULL;',
                'ALTER TABLE "merchants_merchant" ADD COLUMN "timezone" varchar(64) NULL;',
                'CREATE INDEX "merchants_merchant_locality_b3300338" ON "merchants_merchant" ("locality");',
            ],
            reverse_sql='DROP INDEX IF EXISTS "merchants_merchant_locality_b3300338";',
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=state_operations,
            database_operations=database_operations,
        ),
    ]
