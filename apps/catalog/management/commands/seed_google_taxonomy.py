"""Seed CategoryMapping rows from the default CATEGORY_REF_MAP (idempotent)."""
from django.core.management.base import BaseCommand
from apps.catalog.models import CategoryMapping
from apps.catalog.taxonomy import CATEGORY_REF_MAP


class Command(BaseCommand):
    help = 'Seed Shoppage category_ref -> Google product category mappings (skips admin custom overrides).'

    def handle(self, *args, **options):
        created = 0
        for category_ref, google_id in CATEGORY_REF_MAP.items():
            obj, was_created = CategoryMapping.objects.get_or_create(
                category_ref=category_ref,
                defaults={'google_category_id': google_id, 'is_custom': False},
            )
            if was_created:
                created += 1
            else:
                # Only backfill the default when the row was never customised.
                if not obj.is_custom and obj.google_category_id != google_id:
                    obj.google_category_id = google_id
                    obj.save(update_fields=['google_category_id'])
        self.stdout.write(self.style.SUCCESS(f'CategoryMapping seeded: {created} new, {len(CATEGORY_REF_MAP)} total.'))
