"""
First-pass Google taxonomy assignment for the existing catalogue.

Maps products to a taxonomy leaf per their coarse sector (`category_ref`) using
title/brand keywords; syntax-aware rows land on a precise leaf, everything else
on the sector default. Idempotent and non-destructive: only rows with a NULL
master_category are touched, so autopilot/operator decisions are never
overwritten.

Usage: python manage.py assign_google_categories [--sector solar_energy]
"""

from apps.catalog.models import Category, MasterProduct, ProductStatusChoices
from django.core.management.base import BaseCommand

# sector -> (default leaf fragment, {keyword: leaf fragment})
SECTOR_LEAVES = {
    'solar_energy': (
        'Hardware > Power & Electrical Supplies > Solar Energy Kits',
        {
            'inverter': 'Hardware > Power & Electrical Supplies > Power Inverters',
            'battery': 'Electronics > Electronics Accessories > Power > Batteries',
            'panel': 'Hardware > Power & Electrical Supplies > Solar Panels',
            'charge controller': 'Hardware > Power & Electrical Supplies > Solar Energy Kits',
            'generator': 'Hardware > Power & Electrical Supplies > Generators',
        },
    ),
    'hardware_tools': (
        'Hardware > Tools', {},
    ),
    'hardware': (
        'Hardware > Tools', {},
    ),
    'building_materials': (
        'Hardware > Building Materials', {},
    ),
    'smartphones': (
        'Electronics > Communications > Telephony > Mobile Phones', {},
    ),
    'smartphones_electronics': (
        'Electronics > Communications > Telephony > Mobile Phones', {},
    ),
    'appliances_home': (
        'Home & Garden > Household Appliances', {},
    ),
    'automotive_tyres': (
        'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts '
        '> Motor Vehicle Wheel Systems > Motor Vehicle Tires > Automotive Tires',
        {},
    ),
}


class Command(BaseCommand):
    help = 'Assign Google taxonomy leaves to still-unclassified master products by sector.'

    def add_arguments(self, parser):
        parser.add_argument('--sector', default=None, help='Only this category_ref (default: all known sectors).')

    def handle(self, *args, **options):
        only_sector = options['sector']
        cache = {c.path: c for c in Category.objects.all()}

        assigned_total = 0
        for sector, (default_fragment, keyword_map) in SECTOR_LEAVES.items():
            if only_sector and sector != only_sector:
                continue
            assigned_total += self._assign_sector(sector, default_fragment, keyword_map, cache)

        self.stdout.write(self.style.SUCCESS(
            f'Assigned: {assigned_total} product(s); '
            f'{MasterProduct.objects.filter(master_category__isnull=False).count()} classified in total.'
        ))

    # ------------------------------------------------------------------
    def _assign_sector(self, sector, default_fragment, keyword_map, cache):
        base = MasterProduct.objects.filter(
            status=ProductStatusChoices.ACTIVE,
            category_ref=sector,
            master_category__isnull=True,
        )
        total = base.count()
        if not total:
            return 0

        default_leaf = cache.get(default_fragment)
        assigned = 0

        if default_leaf is None:
            self.stderr.write(f'  [skip] sector {sector}: leaf not found: {default_fragment}')

        for keyword, fragment in keyword_map.items():
            leaf = cache.get(fragment)
            if leaf is None:
                continue
            updated = base.filter(title__icontains=keyword).update(master_category=leaf)
            assigned += updated
            self.stdout.write(f'  {sector}: {updated} product(s) -> {fragment}')

        if default_leaf is not None:
            remaining = base.filter(master_category__isnull=True).count()
            if remaining:
                updated = base.filter(master_category__isnull=True).update(master_category=default_leaf)
                assigned += updated
                self.stdout.write(f'  {sector}: {updated} product(s) -> {default_fragment} (sector default)')

        return assigned
