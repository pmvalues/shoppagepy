"""Audit (and optionally repair) GS1 identifiers held on the master catalogue.

A barcode that fails its own check digit cannot be published: feeds reject it and
search engines treat the record as unreliable. This reports the real exposure and,
with --blank-invalid, clears the bad values so the platform stops asserting them.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.catalog.identifiers import clean_gtin, has_valid_check_digit
from apps.catalog.models import MasterProduct

GTIN_FIELDS = ('gtin8', 'gtin12', 'gtin13', 'gtin14')


class Command(BaseCommand):
    help = 'Report GTIN check-digit validity across the catalogue; optionally clear invalid values.'

    def add_arguments(self, parser):
        parser.add_argument('--blank-invalid', action='store_true',
                            help='Clear GTIN fields that fail the GS1 check digit.')
        parser.add_argument('--sample', type=int, default=20000,
                            help='How many products to inspect (0 = all).')

    def handle(self, *args, **opts):
        sample = opts['sample']
        qs = MasterProduct.objects.values_list('pk', *GTIN_FIELDS)
        if sample:
            qs = qs[:sample]

        checked = held = valid = blanked = 0
        for row in qs.iterator(chunk_size=5000):
            pk, *values = row
            checked += 1
            for field, raw in zip(GTIN_FIELDS, values):
                digits = clean_gtin(raw)
                if not digits:
                    continue
                held += 1
                if has_valid_check_digit(digits):
                    valid += 1
                elif opts['blank_invalid']:
                    MasterProduct.objects.filter(pk=pk).update(**{field: None})
                    blanked += 1

        invalid = held - valid
        self.stdout.write(self.style.MIGRATE_HEADING('GS1 identifier audit'))
        self.stdout.write(f'  products scanned : {checked:,}')
        self.stdout.write(f'  gtin values held : {held:,}')
        self.stdout.write(f'  valid checksums  : {valid:,}')
        self.stdout.write(f'  invalid checksums: {invalid:,}')
        if held:
            self.stdout.write(f'  valid share      : {valid / held:.1%}')
        if opts['blank_invalid']:
            self.stdout.write(self.style.WARNING(f'  cleared          : {blanked:,} value(s) — invalid ids are no longer asserted'))
        else:
            self.stdout.write('  (dry run — pass --blank-invalid to clear invalid identifiers)')
