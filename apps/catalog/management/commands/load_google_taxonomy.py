"""
Load the Google Shopping product taxonomy (taxonomy-with-ids.en-US.txt) into the
Category closed hierarchy. Idempotent: re-running refreshes names/paths, rebuilds
the closure table and re-applies the sector mapping — the quarterly Google update
path.

Usage: python manage.py load_google_taxonomy [--file path/to/taxonomy.txt]
"""

from pathlib import Path

from apps.catalog.models import Category, CategoryPath
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify


class Command(BaseCommand):
    help = 'Load (or refresh) the Google product taxonomy tree into Category.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            default=str(Path(__file__).resolve().parent.parent.parent / 'data' / 'taxonomy-with-ids.en-US.txt'),
            help='Path to the taxonomy file (default: bundled Google en-US taxonomy).',
        )

    def handle(self, *args, **options):
        path = Path(options['file'])
        if not path.exists():
            raise CommandError(f'Taxonomy file not found: {path}')

        with path.open(encoding='utf-8') as fh:
            lines = [ln.strip() for ln in fh if ln.strip()]

        nodes = []  # (google_id, path)
        for ln in lines:
            if ' - ' not in ln:
                continue  # header line (# Google_Product_Taxonomy_Version: ...)
            raw_id, raw_path = ln.split(' - ', 1)
            nodes.append((int(raw_id), ' > '.join(p.strip() for p in raw_path.split(' > '))))

        if not nodes:
            raise CommandError('No taxonomy rows parsed from file.')

        with transaction.atomic():
            self._upsert_tree(nodes)
        self.stdout.write(self.style.SUCCESS(
            f'Taxonomy ready: {Category.objects.count()} nodes, '
            f'{CategoryPath.objects.count()} closure rows.'
        ))

    # ------------------------------------------------------------------
    @staticmethod
    def _upsert_tree(nodes):
        existing = {c.google_id: c for c in Category.objects.all()}
        by_path = {c.path: c for c in existing.values()}

        for google_id, path in sorted(nodes, key=lambda item: item[1].count(' > ')):
            parts = path.split(' > ')
            name = parts[-1]
            level = len(parts) - 1
            parent_path = ' > '.join(parts[:-1]) if level else ''
            parent = by_path.get(parent_path) if parent_path else None

            node = existing.get(google_id)
            if node is None:
                node = Category(google_id=google_id)
            node.name = name
            node.path = path
            node.level = level
            node.parent_id = parent.pk if parent else None
            node.slug = slugify(path)[:250] or f'cat-{google_id}'
            node.save()
            existing[google_id] = node
            by_path[path] = node

        slugs = {}
        for node in Category.objects.all():
            slug = slugify(node.path)[:250]
            if slug not in slugs:
                slugs[slug] = node
            elif slugs[slug].pk != node.pk:
                node.slug = f'{slug}-{node.google_id}'
                node.save(update_fields=['slug'])

        # Sector membership: coarse verticals the commerce side filters on.
        for node in Category.objects.select_related('parent').all():
            node.sector = Command._resolve_sector(node.path)
            node.save(update_fields=['sector'])

        # Closure table rebuild (self-inclusive).
        CategoryPath.objects.all().delete()
        rows = []
        for node in Category.objects.all():
            cursor = node
            depth = 0
            while cursor is not None:
                rows.append((node.pk, cursor.pk, depth))
                depth += 1
                cursor = cursor.parent
        CategoryPath.objects.bulk_create(
            [CategoryPath(descendant_id=d, ancestor_id=a, depth=dp) for d, a, dp in rows],
            batch_size=2000,
        )

    SECTOR_RULES = [
        # (sector slug, path fragment). First (longest) match wins.
        ('solar_energy', 'Solar Energy'),
        ('solar_energy', 'Power Inverters'),
        ('solar_energy', 'Solar Panels'),
        ('solar_energy', 'Generators'),
        ('hardware_tools', 'Hardware > Tools'),
        ('building_materials', 'Hardware > Building Materials'),
        ('building_materials', 'Hardware > Building Consumables'),
        ('building_materials', 'Hardware > Lumber'),
        ('smartphones_electronics', 'Telephony > Mobile Phones'),
        ('smartphones_electronics', 'Electronics >'),
        ('appliances_home', 'Household Appliances'),
        ('appliances_home', 'Kitchen Appliances'),
        ('automotive_tyres', 'Motor Vehicle Tires'),
        ('automotive_tyres', 'Vehicles & Parts'),
    ]

    @staticmethod
    def _resolve_sector(path: str) -> str:
        for sector, fragment in sorted(Command.SECTOR_RULES, key=lambda r: -len(r[1])):
            if fragment in path:
                return sector
        return ''
