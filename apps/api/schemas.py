"""Typed API contracts (Pydantic) for the Shoppage public API.

These models give the API boundary real input validation (coercion + bounds)
and a guaranteed response shape, independent of the ORM serializers used to
build the payloads.
"""
from __future__ import annotations

from typing import Any

try:
    from pydantic import BaseModel, Field, ValidationError
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return self.__dict__
        def dict(self):
            return self.__dict__

    def Field(default=None, **kwargs):
        return default

    class ValidationError(Exception):
        pass


class SearchQuery(BaseModel):
    """Validated `/api/v1/search/` query parameters."""

    q: str = Field(default="", max_length=200)
    limit: int = Field(default=12, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    category: str = Field(default="")
    province: str = Field(default="")
    brand: str = Field(default="")
    min_price: float | None = None
    max_price: float | None = None
    sort: str = Field(default='relevance')

    @classmethod
    def from_get(cls, get_params: Any) -> SearchQuery:
        """Build a validated query from a Django QueryDict.

        Query-string values arrive as strings (and ``dict()`` on a QueryDict
        yields list values), so we extract scalars explicitly. Pydantic then
        coerces them and enforces the bounds above. Invalid input falls back
        to defaults rather than surfacing a 500.
        """
        try:
            data = {
                'q': get_params.get('q', ''),
                'limit': int(get_params.get('limit', 12) or 12),
                'offset': int(get_params.get('offset', 0) or 0),
                'category': get_params.get('category', ''),
                'province': get_params.get('province', ''),
                'brand': get_params.get('brand', ''),
                'min_price': float(get_params['min_price']) if get_params.get('min_price') else None,
                'max_price': float(get_params['max_price']) if get_params.get('max_price') else None,
                'sort': get_params.get('sort', 'relevance'),
            }
            return cls(**data)
        except (ValidationError, ValueError):
            return cls()


class SearchResponse(BaseModel):
    """Guaranteed shape of the `/api/v1/search/` JSON response."""

    query: str
    intent: dict[str, Any]
    overview: str
    top_brands: list[str]
    total_products: int
    total_merchants: int
    price_stats: dict[str, Any] | None = None
    products: Any
    merchants: Any
    result_cap: int | None = None
    is_capped: bool = False
