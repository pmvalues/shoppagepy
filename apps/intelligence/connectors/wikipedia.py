"""
Wikipedia open-search provider: free, no API key, CC BY-SA content displayed
with clear source attribution. Rights-gated via RightsSource(name='wikipedia').
"""

from urllib.parse import quote

from apps.intelligence.connectors.base import ExternalResult, ExternalSearchProvider
from django.utils import timezone

API_ENDPOINT = 'https://en.wikipedia.org/w/api.php'


class WikipediaProvider(ExternalSearchProvider):
    """Intro-snippet web results for entity-style queries."""

    key = 'wikipedia'
    display_name = 'Wikipedia'
    rights_name = 'wikipedia'
    timeout_s = 3.0
    networked = True

    def search(self, query: str, limit: int = 4) -> list[ExternalResult]:
        import requests

        params = {
            'action': 'query',
            'generator': 'search',
            'gsrsearch': query[:120],
            'gsrlimit': limit,
            'prop': 'extracts|info',
            'exintro': '1',
            'explaintext': '1',
            'inprop': 'url',
            'format': 'json',
            'utf8': '1',
            'origin': '*',
        }
        resp = requests.get(API_ENDPOINT, params=params, timeout=self.timeout_s)
        resp.raise_for_status()
        pages = (resp.json().get('query') or {}).get('pages') or {}

        results = []
        for page in sorted(pages.values(), key=lambda p: p.get('index', 0)):
            title = (page.get('title') or '').strip()
            if not title:
                continue
            url = page.get('fullurl') or f'https://en.wikipedia.org/wiki/{quote(title.replace(" ", "_"))}'
            results.append(ExternalResult(
                title=title,
                url=url,
                hostname='en.wikipedia.org',
                snippet=(page.get('extract') or '')[:240],
                source='wikipedia',
                provider=self.key,
                observed_at=timezone.now(),
                confidence=0.6,
            ))
        return results
