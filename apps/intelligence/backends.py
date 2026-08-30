"""
Retrieval backend seam (roadmap item M2): SQL hybrid <-> Typesense.

``ranked_search()`` in apps.intelligence.ranking stays the single entry point
and keeps returning the same dict contract, so the storefront search page, the
live dropdown, product detail, the API and the federated merge are all
unaffected by which backend answers.

Why a seam at all: the hybrid SQL engine scores up to ``CANDIDATE_LIMIT`` rows
in Python per uncached query, which measured 14-32s against the 1M product
table, while cached responses cost ~15ms. The 60s context cache hides that for
repeat queries only; the long tail pays it. Typesense is the engine already
provisioned in docker-compose to take that load.

The SQL engine remains the correctness reference: every failure mode here
(unconfigured, unreachable, timeout, non-2xx, unparseable body) returns None
and the caller falls back to it rather than degrading to an empty results page.
"""

from __future__ import annotations

import json
from typing import Any

import requests
from django.conf import settings

from apps.intelligence.ranking import UNAVAILABLE_STATES

# ---------------------------------------------------------------------------
# Shared collection schema — imported by the reindex command so the index and
# the query layer can never drift apart silently.
# ---------------------------------------------------------------------------

# Denormalised onto each product so filtering/faceting stays single-collection.
COLLECTION_NAME = 'products'

COLLECTION_SCHEMA: dict[str, Any] = {
    'name': COLLECTION_NAME,
    'fields': [
        {'name': 'canonical_id', 'type': 'string'},
        {'name': 'product_id', 'type': 'string'},
        {'name': 'title', 'type': 'string'},
        {'name': 'brand', 'type': 'string', 'facet': True},
        {'name': 'category_ref', 'type': 'string', 'facet': True},
        {'name': 'model_number', 'type': 'string', 'optional': True},
        {'name': 'status', 'type': 'string'},
        {'name': 'price_zar', 'type': 'float', 'optional': True},
        {'name': 'offer_count', 'type': 'int32', 'default': 0},
        {'name': 'in_stock', 'type': 'bool', 'facet': True, 'default': False},
        {'name': 'provinces', 'type': 'string[]', 'facet': True, 'optional': True},
        {'name': 'merchant_ids', 'type': 'string[]', 'optional': True},
        {'name': 'merchant_names', 'type': 'string[]', 'facet': True, 'optional': True},
        {'name': 'max_trust_score', 'type': 'int32', 'default': 0},
        {'name': 'nrs_certified', 'type': 'bool', 'default': False},
        {'name': 'sabs_approved', 'type': 'bool', 'default': False},
        {'name': 'compatibility_edge_count', 'type': 'int32', 'default': 0},
        {'name': 'locations', 'type': 'geo', 'optional': True},
        {'name': 'popularity', 'type': 'int32', 'default': 0},
        {'name': 'indexed_at', 'type': 'int64', 'optional': True},
    ],
    'default_sorting_field': 'popularity',
}

# Ranked fields mirror the weighted tsvector in catalog migration 0006.
QUERY_BY = ['title', 'model_number', 'brand', 'category_ref']
QUERY_BY_WEIGHTS = [10, 8, 6, 3]

SORT_BY = {
    'relevance': '',
    'price_asc': 'price_zar:asc',
    'price_desc': 'price_zar:desc',
    'newest': 'indexed_at:desc',
    'rating': 'max_trust_score:desc',
}


def _config() -> dict[str, Any]:
    return getattr(settings, 'SHOPPAGE_SEARCH', {}) or {}


def _live_offers(product) -> list:
    """Offers eligible to back a displayed price, honouring the prefetch cache."""
    return [o for o in product.offers.all() if o.availability_state not in UNAVAILABLE_STATES]


# ---------------------------------------------------------------------------
# Contract
# ---------------------------------------------------------------------------

class SearchBackend:
    """Returns ranked_search's dict contract, or None when it cannot serve."""

    name = 'base'

    def search(self, raw_query: str, **filters) -> dict[str, Any] | None:  # pragma: no cover
        raise NotImplementedError


class SqlHybridBackend(SearchBackend):
    """The existing Postgres FTS / trigram / SQLite FTS5 hybrid engine."""

    name = 'sql'

    def search(self, raw_query: str, **filters) -> dict[str, Any] | None:
        from apps.intelligence.ranking import _ranked_search_sql

        return _ranked_search_sql(raw_query, **filters)


class TypesenseBackend(SearchBackend):
    name = 'typesense'

    def __init__(self, config: dict[str, Any] | None = None):
        cfg = config if config is not None else _config()
        self.base_url = (cfg.get('typesense_url') or '').rstrip('/')
        self.api_key = cfg.get('typesense_api_key') or ''
        self.collection = cfg.get('typesense_collection') or COLLECTION_NAME
        self.timeout = float(cfg.get('timeout_seconds') or 1.5)

    # -- availability -------------------------------------------------------
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def health(self) -> bool:
        """ Cheap reachability probe; never raises. """
        if not self.is_configured():
            return False
        try:
            resp = requests.get(
                f'{self.base_url}/health', timeout=self.timeout,
                headers={'x-typesense-api-key': self.api_key},
            )
            return bool(resp.ok and resp.json().get('ok'))
        except Exception:
            return False

    # -- request building ---------------------------------------------------
    def build_params(self, raw_query: str, *, limit: int, offset: int, category: str,
                     province: str, brand: str, min_price, max_price, sort: str,
                     near, in_stock_only: bool,
                     candidate_limit: int | None = None) -> dict[str, Any]:
        """
        Pure: translates the ranked_search signature into Typesense params.

        `candidate_limit` is accepted for signature parity with the SQL engine
        and deliberately unused — Typesense pages with page/per_page instead of
        retrieving a candidate window to score in Python.
        """
        filters = ['status:=[active, ACTIVE]']
        if category:
            filters.append(f'category_ref:={_ts_escape(category)}')
        if brand:
            filters.append(f'brand:={_ts_escape(brand)}')
        if province:
            filters.append(f'provinces:={_ts_escape(province)}')
        if in_stock_only:
            filters.append('in_stock:=true')
        if min_price is not None:
            filters.append(f'price_zar:>={float(min_price):g}')
        if max_price is not None:
            filters.append(f'price_zar:<={float(max_price):g}')
        if near is not None:
            lat, lng, radius_km = near
            # Typesense reads a bare geo distance as kilometres, matching
            # _haversine_km in the SQL path.
            filters.append(f'location:({float(lat)},{float(lng)},{float(radius_km):g})')

        params: dict[str, Any] = {
            'q': raw_query.strip() or '*',
            'per_page': max(limit, 1),
            'page': (offset // limit + 1) if limit else 1,
            'include_fields': 'canonical_id,product_id,price_zar,offer_count,in_stock,merchant_ids',
            'exclude_fields': 'locations',
            'max_facet_values': 10,
            'facet_by': 'category_ref,brand,provinces,merchant_names,in_stock',
            'stats_facets': 'price_zar',
            'num_typos': 2,
        }
        if raw_query.strip():
            params['query_by'] = ','.join(QUERY_BY)
            params['query_by_weights'] = ','.join(str(w) for w in QUERY_BY_WEIGHTS)
            params['sort_by'] = ':relevance'
        else:
            params['sort_by'] = 'popularity:desc'
        if sort and sort != 'relevance':
            params['sort_by'] = SORT_BY.get(sort, params['sort_by'])
        params['filter_by'] = ' && '.join(filters)
        return params

    # -- response mapping ---------------------------------------------------
    def hydrate(self, payload: dict[str, Any], *, raw_query: str, tokens: list[str],
                expanded: list[str], limit: int, offset: int, sort: str,
                near) -> dict[str, Any] | None:
        """Turn hits into ScoredProducts using the same ORM prefetch as the SQL path."""
        from apps.catalog.models import MasterProduct
        from apps.intelligence.ranking import ScoredProduct, _score_product
        from django.db.models import Prefetch
        from apps.offers.models import Offer

        hits = payload.get('hits') or []
        if not hits:
            return None
        ordered_ids = [h.get('canonical_id') for h in hits if h.get('canonical_id')]
        if not ordered_ids:
            return None

        by_id = {
            p.canonical_id: p
            for p in MasterProduct.objects.filter(canonical_id__in=ordered_ids).prefetch_related(
                Prefetch('offers', queryset=Offer.objects.select_related('merchant')),
                'images',
            )
        }
        candidates = [by_id[cid] for cid in ordered_ids if cid in by_id]
        if not candidates:
            return None  # index is stale relative to the DB — fall back to SQL

        scored: list[ScoredProduct] = []
        rank = len(candidates)
        for position, product in enumerate(candidates):
            offers = _live_offers(product)
            sp = _score_product(product, tokens + expanded, offers)
            # Preserve Typesense's ordering as the authoritative relevance signal.
            sp.score = float(rank - position)
            if near is not None and offers:
                best = sp.best_offer or offers[0]
                merchant = getattr(best, 'merchant', None)
                if merchant is not None and merchant.latitude is not None:
                    from apps.intelligence.ranking import _haversine_km

                    sp.distance_km = round(
                        _haversine_km(near[0], near[1], float(merchant.latitude),
                                      float(merchant.longitude)), 2)
            scored.append(sp)

        found = int(payload.get('found') or len(scored))
        facets = _map_facets(payload.get('facet_counts') or [])
        merchants = _merchants_for(scored)
        return {
            'query': raw_query,
            'tokens': tokens,
            'products': scored,
            'merchants': merchants,
            'total_products': found,
            'total_merchants': len(merchants),
            'did_you_mean': '',
            'sort': sort,
            'facets': facets,
            'price_stats': _price_stats(payload.get('stats')),
            'page': (offset // limit + 1) if limit else 1,
            'has_next': (offset + limit) < found,
            'next_offset': offset + limit if (offset + limit) < found else None,
            'result_cap': found,
            'is_capped': False,
            'elapsed_ms': float(payload.get('search_time_ms') or 0),
            'backend': self.name,
        }

    # -- administration (used by the reindex command) -----------------------
    def _headers(self) -> dict[str, str]:
        return {'x-typesense-api-key': self.api_key}

    def ensure_collection(self, recreate: bool = False) -> bool:
        """Create the collection from COLLECTION_SCHEMA when absent."""
        if not self.is_configured():
            return False
        try:
            if recreate:
                requests.delete(
                    f'{self.base_url}/collections/{self.collection}',
                    headers=self._headers(), timeout=self.timeout,
                )
            exists = requests.get(
                f'{self.base_url}/collections/{self.collection}',
                headers=self._headers(), timeout=self.timeout,
            )
            if exists.ok:
                return True
            created = requests.post(
                f'{self.base_url}/collections',
                json=COLLECTION_SCHEMA, headers=self._headers(), timeout=self.timeout,
            )
            return bool(created.ok)
        except Exception:
            return False

    def import_documents(self, docs: list[dict]) -> tuple[int, list[str]]:
        """Bulk upsert via the NDJSON import endpoint. Returns (ok, errors)."""
        if not self.is_configured() or not docs:
            return 0, []
        body = '\n'.join(json.dumps(d, default=str) for d in docs)
        headers = self._headers() | {'Content-Type': 'text/plain'}
        try:
            resp = requests.post(
                f'{self.base_url}/collections/{self.collection}/documents/import',
                params={'action': 'upsert'},
                data=body.encode('utf-8'),
                headers=headers,
                timeout=max(self.timeout, 30.0),
            )
        except Exception as exc:
            return 0, [f'{type(exc).__name__}: {exc}']
        if not resp.ok:
            return 0, [f'HTTP {resp.status_code}: {resp.text[:200]}']
        imported = 0
        errors: list[str] = []
        for line in resp.text.splitlines():
            if not line.strip():
                continue
            try:
                parsed = json.loads(line)
            except ValueError:
                errors.append(line[:200])
                continue
            if parsed.get('success'):
                imported += 1
            else:
                errors.append(str(parsed.get('error') or parsed)[:200])
        return imported, errors

    # -- entry point --------------------------------------------------------
    def search(self, raw_query: str, **filters) -> dict[str, Any] | None:
        """Return the shared contract, or None so the caller falls back to SQL."""
        if not self.is_configured():
            return None
        from apps.intelligence.ranking import expand_synonyms, tokenize

        tokens = tokenize(raw_query)
        expanded = expand_synonyms(tokens)
        params = self.build_params(raw_query, **filters)
        try:
            resp = requests.get(
                f'{self.base_url}/collections/{self.collection}/documents/search',
                params=params,
                timeout=self.timeout,
                headers={'x-typesense-api-key': self.api_key},
            )
            if not resp.ok:
                return None
            payload = (resp.json().get('results') or [None])[0]
        except Exception:
            return None
        if not payload or not (payload.get('hits') or []):
            return None
        return self.hydrate(
            payload,
            raw_query=raw_query,
            tokens=tokens,
            expanded=expanded,
            limit=filters['limit'],
            offset=filters.get('offset', 0),
            sort=filters.get('sort', 'relevance'),
            near=filters.get('near'),
        )


def _ts_escape(value: str) -> str:
    return '`' + str(value).replace('`', '') + '`'


def _map_facets(facet_counts: list[dict]) -> dict[str, dict[str, int]]:
    mapping = {
        'category_ref': 'categories',
        'brand': 'brands',
        'provinces': 'provinces',
        'merchant_names': 'merchants',
    }
    out: dict[str, dict[str, int]] = {'categories': {}, 'brands': {}, 'provinces': {}, 'merchants': {}}
    for entry in facet_counts:
        key = mapping.get(entry.get('field_name') or '')
        if not key:
            continue
        out[key] = {
            c['value']: int(c.get('count') or 0)
            for c in (entry.get('counts') or [])[:10]
            if c.get('value') is not None
        }
    return out


def _price_stats(stats: list[dict] | None) -> dict[str, Any] | None:
    for entry in stats or []:
        if entry.get('name') == 'price_zar':
            return {
                'min': entry.get('min'),
                'max': entry.get('max'),
                'avg': round(entry.get('avg') or 0),
            }
    return None


def _merchants_for(scored: list) -> list:
    from apps.merchants.models import Merchant

    ids = []
    for s in scored[:20]:
        if s.best_offer and s.best_offer.merchant_id:
            ids.append(s.best_offer.merchant_id)
    if not ids:
        return []
    return list(
        Merchant.objects.filter(id__in=list(dict.fromkeys(ids)))
        .select_related('market').order_by('-trust_score')[:6]
    )


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------

_BACKENDS: dict[str, SearchBackend] = {}


def get_backend(prefer: str | None = None) -> SearchBackend:
    cfg = _config()
    choice = (prefer or cfg.get('backend') or 'auto').lower()
    if choice == 'sql':
        return _BACKENDS.setdefault('sql', SqlHybridBackend())
    typesense = _BACKENDS.setdefault('typesense', TypesenseBackend(cfg))
    if choice == 'typesense':
        return typesense
    return typesense if typesense.is_configured() else _BACKENDS.setdefault('sql', SqlHybridBackend())


def reset_backends() -> None:
    """Test hook: settings changes must not keep a stale Typesense client."""
    _BACKENDS.clear()


# ---------------------------------------------------------------------------
# Indexing: one denormalised document per product. Kept next to the query
# params so the fields the backend filters/facets on and the fields written
# here cannot drift.
# ---------------------------------------------------------------------------

def build_product_doc(product, offers: list | None = None) -> dict[str, Any]:
    """
    MasterProduct -> Typesense document.

    `offers` may be supplied by a caller that already grouped them; otherwise
    the prefetched related manager is used so this stays query-free in a loop.
    """
    live = (
        [o for o in offers if o.availability_state not in UNAVAILABLE_STATES]
        if offers is not None else _live_offers(product)
    )
    priced = sorted(float(o.price_amount) for o in live if o.price_amount)
    estimated = float(product.estimated_price_zar) if product.estimated_price_zar else None
    best_price = priced[0] if priced else estimated

    provinces = sorted({o.merchant.province for o in live if o.merchant and o.merchant.province})
    merchant_ids = sorted({str(o.merchant_id) for o in live if o.merchant_id})
    merchant_names = sorted({o.merchant.name for o in live if o.merchant})
    trust_scores = [int(o.merchant.trust_score or 0) for o in live if o.merchant]
    locations = [
        [float(o.merchant.latitude), float(o.merchant.longitude)]
        for o in live
        if o.merchant and o.merchant.latitude is not None and o.merchant.longitude is not None
    ]
    compliance = product.compliance if isinstance(product.compliance, dict) else {}

    doc: dict[str, Any] = {
        'canonical_id': product.canonical_id,
        'product_id': str(product.pk),
        'title': product.title or '',
        'brand': product.brand or '',
        'category_ref': product.category_ref or 'other',
        'status': product.status or '',
        'offer_count': len(live),
        # in_stock is a claim about live offers only — mirrors the storefront.
        'in_stock': bool(live),
        'provinces': provinces,
        'merchant_ids': merchant_ids,
        'merchant_names': merchant_names,
        'max_trust_score': max(trust_scores) if trust_scores else 0,
        'nrs_certified': bool(compliance.get('nrs097Certified')),
        'sabs_approved': bool(compliance.get('sabsApproved')),
        'compatibility_edge_count': int(product.compatibility_edge_count or 0),
        # Ranked fallback when no behavioural signal exists; see default_sorting_field.
        'popularity': len(live),
        'indexed_at': int(product.updated_at.timestamp()) if product.updated_at else 0,
    }
    if product.model_number:
        doc['model_number'] = product.model_number
    if best_price is not None:
        doc['price_zar'] = best_price
    if locations:
        doc['locations'] = locations[:10]
    return doc


def iter_product_docs(batch_size: int = 500, limit: int | None = None):
    """Stream documents for every active product, offers grouped per batch."""
    from apps.catalog.models import MasterProduct
    from apps.offers.models import Offer
    from django.db.models import Prefetch

    queryset = (
        MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
        .prefetch_related(Prefetch('offers', queryset=Offer.objects.select_related('merchant')))
        .order_by('id')
    )
    if limit:
        queryset = queryset[:limit]
    for product in queryset.iterator(chunk_size=batch_size):
        yield build_product_doc(product)
