"""
Provider registry. ``get_providers()`` returns configured, instantiated
providers; an explicitly non-empty ``providers`` dict in settings selects
which keys run (entry ``False`` disables a known provider).
"""

from apps.intelligence.connectors.base import ExternalResult, ExternalSearchProvider
from apps.intelligence.connectors.own_sweep import OwnSweepProvider
from apps.intelligence.connectors.tinyfish import TinyFishFetchProvider, TinyFishProvider
from apps.intelligence.connectors.wikipedia import WikipediaProvider
from django.conf import settings

__all__ = ['ExternalResult', 'ExternalSearchProvider', 'get_providers']

_PROVIDER_CLASSES = [OwnSweepProvider, WikipediaProvider, TinyFishProvider, TinyFishFetchProvider]


def get_providers(config=None) -> list[ExternalSearchProvider]:
    cfg = config if config is not None else getattr(settings, 'SHOPPAGE_EXTERNAL_SEARCH', {})
    providers_cfg = cfg.get('providers') or {}

    providers = []
    for klass in _PROVIDER_CLASSES:
        entry = providers_cfg.get(klass.key)
        if providers_cfg and entry is None:
            continue  # explicit registry without this key → provider off
        if entry is False:
            continue
        providers.append(klass(entry if isinstance(entry, dict) else {}))
    return providers
