"""
Own-sweep corpus provider: searches the platform's captured external web
observations (DiscoveredOffer) as a first-party, rights-clean external tier.
"""

import re

from apps.intelligence.connectors.base import ExternalResult, ExternalSearchProvider
from django.utils import timezone

EXTRA_TOKENS_BLOCKED = {'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'price', 'prices'}


class OwnSweepProvider(ExternalSearchProvider):
    """Live-searchable view over previously captured web observations."""

    key = 'own_sweep'
    display_name = 'Sweep Corpus'
    rights_name = ''  # first-party capture — no external rights gate

    def search(self, query: str, limit: int = 4) -> list[ExternalResult]:
        from apps.offers.models import DiscoveredOffer

        tokens = [
            t for t in re.split(r'\W+', query.lower())
            if len(t) > 2 and t not in EXTRA_TOKENS_BLOCKED
        ][:4]
        if not tokens:
            return []

        qs = DiscoveredOffer.objects.select_related('master_product').filter(
            master_product__status__in=['active', 'ACTIVE'],
            discovered_price_amount__isnull=False,
        )
        for token in tokens:
            qs = qs.filter(master_product__title__icontains=token)

        results = []
        for sweep in qs.order_by('-confidence_score', 'discovered_price_amount')[:limit]:
            snippet = (sweep.availability_text or 'Observed web price').strip()
            if sweep.location_hint:
                snippet = f'{snippet} · {sweep.location_hint}'
            results.append(ExternalResult(
                title=f'{sweep.master_product.title} — {sweep.merchant_name}',
                url=sweep.source_url,
                hostname=sweep.source_website or '',
                snippet=snippet[:200],
                source='discovered_offer',
                provider=self.key,
                observed_at=sweep.observed_at or timezone.now(),
                price_amount=sweep.discovered_price_amount,
                currency=sweep.currency or 'ZAR',
                confidence=float(sweep.confidence_score or 0.7),
                location_hint=sweep.location_hint or '',
            ))
        return results
