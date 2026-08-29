"""
Periodic merchant catalog crawler.

Checks the next batch of tracked product URLs (impression-requested first,
then never-checked, then oldest), captures each page as an EvidenceArtifact
through the TinyFish fetch tier and refreshes the URL health ledger. Run on a
cron every few hours:

    python manage.py crawl_merchant_catalog --limit 12

``--discover`` additionally runs a TinyFish search pass per merchant to track
new product URLs never seen before. Pacing respects the free-tier rate limit.
"""

import time

from apps.offers.services.crawler import crawl_rotation, discover_merchant_urls
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crawl tracked merchant product URLs and refresh the health ledger.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=12, help='URLs to check this run')
        parser.add_argument('--merchant', default='', help='Restrict to one merchant canonical id')
        parser.add_argument('--pacing', type=float, default=2.1, help='Seconds between checks (TinyFish free tier)')
        parser.add_argument('--discover', action='store_true', help='Run merchant web discovery first')

    def handle(self, *args, **options):
        from apps.merchants.models import Merchant

        merchant = None
        if options['merchant']:
            merchant = Merchant.objects.filter(canonical_id=options['merchant']).first()
            if not merchant:
                self.stderr.write(f'Merchant not found: {options["merchant"]}')
                return

        if options['discover']:
            if merchant:
                merchants = [merchant]
            else:
                merchants = list(
                    Merchant.objects.filter(claim_state='claimed', website_url__isnull=False)[:50]
                )
            discovered = 0
            for m in merchants:
                outcome = discover_merchant_urls(m)
                discovered += outcome['found']
                self.stdout.write(
                    f'discovery [{m.canonical_id}] {outcome["queries"]} queries -> '
                    f'{outcome["found"]} URL(s) tracked'
                )
                time.sleep(1.1)
            self.stdout.write(self.style.SUCCESS(f'Discovery pass tracked {discovered} new URL(s).'))

        started = time.monotonic()
        outcome = crawl_rotation(
            limit=options['limit'], merchant=merchant,
            trigger='periodic', pacing=options['pacing'],
        )
        elapsed = round(time.monotonic() - started, 1)
        self.stdout.write(
            self.style.SUCCESS(
                f'Crawl run {outcome["run_id"]}: {outcome["attempted"]} attempted, '
                f'{outcome["ok"]} ok, {outcome["failed"]} failed ({elapsed}s).'
            )
        )
