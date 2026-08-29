"""
TinyFish live web provider pair: Search + Fetch-to-verify.

Search (GET https://api.search.tinyfish.ai) returns ranked web hits for the
federated engine. Fetch (POST https://api.fetch.tinyfish.ai) renders a URL
to markdown so a click can verify a live price; each fetched page is captured
as an immutable EvidenceArtifact (SHA-256 hash + payload).

Both are rights-gated via RightsSource(name='tinyfish') and silently
unavailable when no API key is configured (config ``api_key`` or the
TINYFISH_API_KEY environment variable). Nothing here ever raises.
"""

import hashlib
import os
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

from apps.intelligence.connectors.base import ExternalResult, ExternalSearchProvider
from django.utils import timezone

SEARCH_ENDPOINT = 'https://api.search.tinyfish.ai'
FETCH_ENDPOINT = 'https://api.fetch.tinyfish.ai'
MAX_FETCH_URLS = 10
_MAX_FETCH_TIMEOUT_S = 44.0  # TinyFish caps per_url_timeout_ms just under 45s

# ZAR price hint inside fetched markdown: "R 4 999.00", "R1,299.99", "R1299"
_PRICE_RE = re.compile(r'\bR\s?(\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[,.](\d{2}))?\b')


def api_key(config) -> str:
    """API key from provider config, then env, then Django settings (local.py)."""
    key = (config or {}).get('api_key') or ''
    if not key:
        key = os.environ.get('TINYFISH_API_KEY', '')
    if not key:
        from django.conf import settings

        key = getattr(settings, 'TINYFISH_API_KEY', '') or ''
    return key.strip()


def extract_zar(text: str) -> Decimal | None:
    """Best-effort ZAR price hint from fetched text; None when absent."""
    match = _PRICE_RE.search(text or '')
    if not match:
        return None
    digits = re.sub(r'[^\d]', '', match.group(1))
    cents = match.group(2)
    try:
        return Decimal(f'{digits}.{cents}') if cents else Decimal(digits)
    except InvalidOperation:
        return None


class TinyFishProvider(ExternalSearchProvider):
    """Live web results from TinyFish Search (free, 30 req/min)."""

    key = 'tinyfish'
    display_name = 'TinyFish Live Web'
    rights_name = 'tinyfish'
    timeout_s = 4.0
    networked = True

    def is_available(self) -> bool:
        if not api_key(self.config):
            return False
        return super().is_available()

    def search(self, query: str, limit: int = 4) -> list[ExternalResult]:
        key = api_key(self.config)
        if not key:
            return []
        import requests

        try:
            resp = requests.get(
                SEARCH_ENDPOINT,
                params={
                    'query': query[:200],
                    'location': self.config.get('location', 'ZA'),
                    'language': self.config.get('language', 'en'),
                },
                headers={'X-API-Key': key},
                timeout=self.timeout_s,
            )
            resp.raise_for_status()
            items = resp.json().get('results') or []
        except Exception:
            return []

        results = []
        for item in items[:limit]:
            url = (item.get('url') or '').strip()
            title = (item.get('title') or '').strip()
            if not url or not title:
                continue
            hostname = item.get('domain') or urlparse(url).netloc or ''
            snippet = (item.get('snippet') or '').strip()
            results.append(ExternalResult(
                title=title,
                url=url,
                hostname=hostname,
                snippet=snippet[:200],
                source='tinyfish',
                provider=self.key,
                observed_at=timezone.now(),
                confidence=0.7,
            ))
        return results


class TinyFishFetchProvider(ExternalSearchProvider):
    """
    Click-to-verify price snapshots. Not a search producer — ``search()`` is a
    no-op so the federated loop leaves it alone; call ``fetch()`` explicitly
    with the exact URLs the user wants verified. Each successful fetch is
    captured as an EvidenceArtifact under the same tinyfish rights register.
    """

    key = 'tinyfish_fetch'
    display_name = 'TinyFish Fetch Verify'
    rights_name = 'tinyfish'
    timeout_s = _MAX_FETCH_TIMEOUT_S
    networked = True

    def is_available(self) -> bool:
        if not api_key(self.config):
            return False
        return super().is_available()

    def search(self, query: str, limit: int = 4) -> list[ExternalResult]:
        return []  # verification is invoked per-URL, not per-query

    def fetch(self, urls: list[str], intent: str = '') -> list[dict]:
        """Fetch pages, capture EvidenceArtifacts, return normalized snapshots."""
        key = api_key(self.config)
        batch = [u for u in (urls or []) if u][:MAX_FETCH_URLS]
        if not key or not batch:
            return []
        import requests
        from apps.evidence.models import EvidenceArtifact, SourceTypeChoices
        from apps.rights.models import RightsSource

        try:
            resp = requests.post(
                FETCH_ENDPOINT,
                json={
                    'urls': batch,
                    'format': 'markdown',
                    'ttl': 0,
                    'per_url_timeout_ms': min(
                        int(self.config.get('per_url_timeout_ms', 40000)), 44_000
                    ),
                    'intent': intent or 'verify current retail price and availability',
                    'links': False,
                    'image_links': False,
                },
                headers={'X-API-Key': key},
                timeout=min(self.timeout_s, _MAX_FETCH_TIMEOUT_S),
            )
            resp.raise_for_status()
            payload = resp.json()
        except Exception:
            return []

        rights = RightsSource.objects.filter(name=self.rights_name).first()
        snapshots = []
        for result in payload.get('results') or []:
            url = (result.get('url') or result.get('final_url') or '').strip()
            if not url:
                continue
            text = (result.get('text') or '').strip()
            snippet = text[:300]
            price = extract_zar(text)
            captured_at = timezone.now()
            artifact_payload = {
                'url': url,
                'final_url': result.get('final_url') or '',
                'title': result.get('title') or '',
                'language': result.get('language') or '',
                'snippet': snippet,
                'price_amount': str(price) if price is not None else None,
                'provider': self.key,
                'captured_at': captured_at.isoformat(),
            }
            artifact_hash = hashlib.sha256(
                f"{url}|{artifact_payload['title']}|{artifact_payload['snippet']}".encode()
            ).hexdigest()
            EvidenceArtifact.objects.create(
                source_type=SourceTypeChoices.PUBLIC_WEB_SWEEP,
                source_identifier=url,
                artifact_hash=artifact_hash,
                raw_payload=artifact_payload,
                rights_source=rights,
                source_timestamp=captured_at,
            )
            snapshots.append({
                'url': url,
                'final_url': result.get('final_url') or '',
                'title': result.get('title') or '',
                'snippet': snippet,
                'price_amount': artifact_payload['price_amount'],
                'language': result.get('language') or '',
                'artifact_hash': artifact_hash,
            })
        return snapshots
