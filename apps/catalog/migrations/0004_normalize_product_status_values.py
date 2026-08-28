from django.db import migrations

# Seed loaders wrote the literal Python enum *names* instead of values. Both the
# sitemap and ranking layers grew compensating filters; this collapses them onto
# the declared choices so a single status value means "live".
LEGACY_TO_CANONICAL = {
    'ACTIVE': 'active',
    'DRAFT': 'draft',
    'REFERENCE_ONLY': 'reference_only',
}


def forwards(apps, schema_editor):
    MasterProduct = apps.get_model('catalog', 'MasterProduct')
    for legacy, canonical in LEGACY_TO_CANONICAL.items():
        MasterProduct.objects.filter(status=legacy).update(status=canonical)


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_masterproduct_bullet_points_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards, elidable=True),
    ]
