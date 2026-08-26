"""Django management command: rebuild the SQLite FTS5 catalog search index."""

from django.core.management.base import BaseCommand
from apps.catalog.fts import rebuild_fts, fts_row_count


class Command(BaseCommand):
    help = "Rebuild the SQLite FTS5 full-text index for MasterProduct."

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch', type=int, default=5000,
            help="Rows per insert batch (default 5000).",
        )

    def handle(self, *args, **options):
        self.stdout.write("Ensuring FTS5 table exists...")
        before = fts_row_count()
        self.stdout.write(f"Existing index rows: {before}")

        count = rebuild_fts(batch_size=options['batch'])

        self.stdout.write(
            self.style.SUCCESS(
                f"FTS index rebuilt: {count} products indexed."
            )
        )
