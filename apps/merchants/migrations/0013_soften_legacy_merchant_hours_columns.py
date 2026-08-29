from django.db import migrations


def _column_is_not_null(connection, table, column):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT is_nullable FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
            """,
            [table, column],
        )
        row = cursor.fetchone()
    return bool(row) and row[0] == 'NO'


def soften_legacy_columns(apps, schema_editor):
    """Production DBs created under an older migration history still carry
    Merchant columns that no longer exist in the model (operating_hours_json,
    reviews_summary). They are NOT NULL with no server default, so every
    INSERT of a new Merchant (claim flow, test merchant bootstrap) omits them
    and raises NotNullViolation. Relax those columns when present."""
    connection = schema_editor.connection
    for column in ('operating_hours_json', 'reviews_summary'):
        if _column_is_not_null(connection, 'merchants_merchant', column):
            with connection.cursor() as cursor:
                cursor.execute(
                    'ALTER TABLE merchants_merchant '
                    f'ALTER COLUMN "{column}" DROP NOT NULL'
                )


def renot_null_legacy_columns(apps, schema_editor):
    """Reverse: restore NOT NULL so the state matches the legacy schema."""
    connection = schema_editor.connection
    for column in ('operating_hours_json', 'reviews_summary'):
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT COUNT(*) FROM information_schema.columns '
                'WHERE table_name = %s AND column_name = %s AND is_nullable = %s',
                ['merchants_merchant', column, 'YES'],
            )
            if cursor.fetchone()[0]:
                cursor.execute(
                    'ALTER TABLE merchants_merchant '
                    f'ALTER COLUMN "{column}" SET NOT NULL'
                )


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0012_alter_draft_draft_type'),
    ]

    operations = [
        migrations.RunPython(soften_legacy_columns, renot_null_legacy_columns),
    ]
