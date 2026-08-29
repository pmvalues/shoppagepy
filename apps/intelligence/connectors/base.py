"""
External search provider contract and normalized result type.

Providers translate a query into a list of :class:`ExternalResult` — the
neutral shape the federated search engine merges, ranks and renders. Real
pydantic (v2) is used; the fallback shim mirrors apps/api/schemas.py so the
platform degrades gracefully without it.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import Any

try:
    from pydantic import BaseModel, Field
except ImportError:

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def model_dump(self, *args, **kwargs):
            return self.__dict__


    def Field(default=None, **kwargs):
        return default


class ExternalResult(BaseModel):
    """A single external hit, normalized across every provider."""

    title: str
    url: str
    hostname: str = ''
    snippet: str = ''
    source: str = 'web'
    provider: str = ''
    observed_at: datetime | None = None
    price_amount: Decimal | None = None
    currency: str = 'ZAR'
    image_url: str | None = None
    confidence: float = 0.7
    location_hint: str = ''

    def result_key(self) -> str:
        """Deduplication identity: URL when present, else provider+title."""
        if self.url:
            return self.url
        return f'{self.provider}:{self.title}'


class ExternalSearchProvider(ABC):
    """Base class for live external sources.

    ``rights_name`` gates availability through the RightsSource register —
    an empty string marks first-party data (own capture) that needs no gate;
    anything else requires a CLEARED RightsSource row (default is blocked).
    """

    key: str = ''
    display_name: str = ''
    rights_name: str = ''
    timeout_s: float = 2.5
    networked: bool = False  # True for providers that call external HTTP APIs

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or {}

    @abstractmethod
    def search(self, query: str, limit: int = 4) -> list[ExternalResult]:
        """Live query against the external source. Must never raise."""

    def is_available(self) -> bool:
        if not self.rights_name:
            return True
        from apps.rights.models import RightsSource, RightsStatusChoices

        source = RightsSource.objects.filter(name=self.rights_name).first()
        return bool(source and source.status == RightsStatusChoices.CLEARED)
