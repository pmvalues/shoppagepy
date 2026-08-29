"""
Federated meta-search: the internal catalogue index plus live external sources.

The orchestrator runs providers concurrently (time-boxed), enforces the
RightsSource register (closed by default), and caches per query+provider so
repeat queries never hit the network again. Results merge with price-bearing
hits first, deduplicated by URL.
"""

import hashlib
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from apps.intelligence.connectors import get_providers
from apps.intelligence.connectors.base import ExternalResult
from apps.intelligence.ranking import ranked_search
from apps.intelligence.services import clean_search_query, detect_intent
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


def _config() -> dict[str, Any]:
    return getattr(settings, 'SHOPPAGE_EXTERNAL_SEARCH', {})


def _cache_key(provider, query: str) -> str:
    normalized = ' '.join(query.lower().split())
    digest = hashlib.md5(normalized.encode()).hexdigest()
    return f'sp:ext:v1:{provider.key}:{digest}'


def _rate_allowed(provider) -> bool:
    max_per_minute = int(_config().get('rate_limit_per_minute', 60))
    if max_per_minute <= 0:
        return False
    key = f'sp:ext:rl:{provider.key}'
    if cache.add(key, 1, 60):  # first call of the window
        return True
    try:
        count = cache.incr(key)
    except ValueError:  # window expired between add and incr
        cache.set(key, 1, 60)
        return True
    return count <= max_per_minute


def _fetch_provider(provider, query: str, limit: int) -> tuple[str, list[dict[str, Any]]]:
    """Cache-first, rate-limited provider fetch. Never raises."""
    key = _cache_key(provider, query)
    cached = cache.get(key)
    if cached is not None:
        return provider.key, cached
    if not _rate_allowed(provider):
        return provider.key, []
    if provider.networked:
        # Worker threads own their connection: close it when done so the
        # test-runner's outer transaction and prod connection pool stay sane.
        try:
            results = provider.search(query, limit=limit)
        finally:
            from django.db import connections

            connections.close_all()
    else:
        # Local (DB-backed) providers must run on the calling thread so they
        # see the caller's transaction snapshot.
        results = provider.search(query, limit=limit)
    payload = [result.model_dump(mode='json') for result in results]
    cache.set(key, payload, _config().get('cache_ttl_seconds', 86400))
    return provider.key, payload


def external_results(query: str, limit: int = 8) -> dict[str, Any]:
    """
    Live external results for a query: rights-gated, cached, concurrent.

    Returns an empty block (never raises) when the feature is disabled, the
    query is too short, or every provider is rights-blocked.
    """
    generated_at = timezone.now()
    empty = {'results': [], 'providers': [], 'generated_at': generated_at}

    cfg = _config()
    if not cfg.get('enabled', True):
        return empty
    cleaned = clean_search_query(detect_intent(query or '')['normalized_query']) or (query or '').strip()
    if len(cleaned) < 3:
        return empty

    providers = [p for p in get_providers() if p.is_available()]
    if not providers:
        return empty

    per_provider = max(2, limit // max(len(providers), 1))
    merged: list[ExternalResult] = []
    seen: set[str] = set()
    hit_providers: set[str] = set()

    # Local (DB-backed) providers run inline — they share the caller's
    # transaction snapshot; only networked providers run concurrently.
    local_providers = [p for p in providers if not p.networked]
    remote_providers = [p for p in providers if p.networked]

    def _merge(provider_key: str, payload: list[dict[str, Any]]) -> None:
        for item in payload:
            try:
                result = ExternalResult(**item)
            except Exception:
                continue
            dedupe_key = result.result_key()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            merged.append(result)
        if payload:
            hit_providers.add(provider_key)

    for provider in local_providers:
        try:
            provider_key, payload = _fetch_provider(provider, cleaned, per_provider)
        except Exception:
            continue
        _merge(provider_key, payload)

    if remote_providers:
        workers = min(len(remote_providers), int(cfg.get('max_workers', 3)))
        timeout = float(cfg.get('timeout_seconds', 3)) + 2
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(_fetch_provider, p, cleaned, per_provider) for p in remote_providers}
            for future in futures:
                try:
                    provider_key, payload = future.result(timeout=timeout)
                except Exception:
                    continue
                _merge(provider_key, payload)

    # Price-bearing observations first, then by confidence.
    merged.sort(key=lambda r: (0 if r.price_amount is not None else 1, -r.confidence))

    return {
        'results': [r.model_dump(mode='json') for r in merged[:limit]],
        'providers': sorted(hit_providers),
        'generated_at': generated_at,
    }


def federated_search(query: str, limit: int = 12, include_external: bool = True) -> dict[str, Any]:
    """
    Federated search: internal ranked catalogue + (optionally) live external
    results, keyed under ``internal`` / ``external`` so callers stay in control
    of what they render.
    """
    intent = detect_intent(query)
    cleaned = clean_search_query(intent['normalized_query']) or (query or '').strip()

    payload: dict[str, Any] = {
        'intent': intent,
        'internal': ranked_search(
            cleaned or query,
            limit=limit,
            category=intent.get('category') or '',
        ),
    }
    if include_external:
        payload['external'] = external_results(query)
    return payload
