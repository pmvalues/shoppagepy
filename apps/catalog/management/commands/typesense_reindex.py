"""Django management command: build or refresh the Typesense products collection."""

from django.core.management.base import BaseCommand, CommandError

from apps.intelligence import backends


class Command(BaseCommand):
    help = (
        'Index active products into Typesense. Needs TYPESENSE_URL and '
        'TYPESENSE_API_KEY (already declared in .env.example and compose); '
        'without them the storefront keeps using the SQL hybrid engine.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--batch', type=int, default=500, help='Documents per import request.')
        parser.add_argument('--limit', type=int, default=None, help='Index only the first N products.')
        parser.add_argument('--recreate', action='store_true', help='Drop and recreate the collection first.')
        parser.add_argument('--dry-run', action='store_true', help='Build documents without sending them.')

    def handle(self, *args, **options):
        batch = max(int(options['batch'] or 500), 1)
        backend = backends.TypesenseBackend()

        if not backend.is_configured():
            raise CommandError(
                'TYPESENSE_URL / TYPESENSE_API_KEY are not set — Typesense indexing is disabled.'
            )

        if options['dry_run']:
            built = sum(1 for _ in backends.iter_product_docs(batch, options['limit']))
            self.stdout.write(self.style.SUCCESS(
                f'Dry run: built {built} documents for collection "{backend.collection}".'
            ))
            return

        if not backend.health():
            raise CommandError(f'Typesense is not reachable at {backend.base_url}.')

        if not backend.ensure_collection(recreate=options['recreate']):
            raise CommandError(f'Could not ensure collection "{backend.collection}" exists.')

        self.stdout.write(f'Indexing into {backend.base_url}/{backend.collection} (batch {batch})...')
        imported = 0
        failures: list[str] = []
        pending: list[dict] = []

        def flush() -> int:
            nonlocal pending
            if not pending:
                return 0
            ok, errors = backend.import_documents(pending)
            failures.extend(errors)
            pending = []
            return ok

        for doc in backends.iter_product_docs(batch, options['limit']):
            pending.append(doc)
            if len(pending) >= batch:
                imported += flush()
                self.stdout.write(f'  {imported} imported, {len(failures)} rejected')

        imported += flush()

        for error in failures[:5]:
            self.stderr.write(f'  reject: {error}')

        rejected = len(failures)
        summary = f'Typesense indexing complete: {imported} imported, {rejected} rejected.'
        self.stdout.write(self.style.SUCCESS(summary) if not rejected else self.style.WARNING(summary))

        if not imported:
            raise CommandError(
                'No documents imported — SHOPPAGE_SEARCH_BACKEND stays effective only after a '
                'successful index; the storefront is falling back to the SQL engine.'
            )
