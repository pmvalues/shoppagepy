"""
Deterministic Hybrid Ranking Engine for Shoppage (v8.2).

Formula:
  Score = 0.55 * TextMatch + 0.20 * TrustPassport + 0.15 * Freshness + 0.10 * PriceCompleteness

Scale & performance:
  Designed to execute < 30ms against 1,000,000 MasterProducts and 3,100,000 Merchants.
  - On PostgreSQL: indexed prefix/substring candidate pull via B-Tree index + Redis cache.
  - On SQLite: FTS5 BM25 virtual table (`apps.catalog.fts`).
  - Strict candidate cap ensures O(1) ranking runtime independent of database size.
"""

from __future__ import annotations

import contextlib
import math
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from apps.catalog.models import MasterProduct
from apps.merchants.models import Merchant
from apps.offers.models import Offer
from django.core.cache import cache
from django.db import connection

# ---------------------------------------------------------------------------
# Query Processing
# ---------------------------------------------------------------------------

SYNONYMS: dict[str, list[str]] = {
    'solar': ['pv', 'photovoltaic', 'inverter', 'battery'],
    'inverter': ['hybrid inverter', 'offgrid', 'pure sine wave', 'deye', 'sunsynk', 'growatt'],
    'battery': ['lifepo4', 'lithium', 'pylontech', 'dyness', 'hubble'],
    'cement': ['surebuild', 'ppc', 'afrisam', 'lafarge', 'concrete'],
    'phone': ['smartphone', 'galaxy', 'iphone', 'xiaomi', 'huawei'],
    'iphone': ['apple', 'smartphone', 'smartphones'],
    'apple': ['iphone', 'macbook', 'ipad', 'smartphones'],
    'samsung': ['galaxy', 'smartphone', 'smartphones'],
    'laptop': ['notebook', 'thinkpad', 'macbook', 'latitude'],
    'drill': ['bosch', 'makita', 'dewalt', 'hardware'],
    'tool': ['hardware', 'drill', 'bosch'],
    'sandton': ['sandton city', 'nelson mandela square'],
    'crown': ['dragon city', 'crown mines', 'main reef'],
    'oriental': ['oriental plaza', 'fordsburg'],
    'loadshedding': ['load shedding', 'stage 6', 'backup power', 'ups'],
}

CATEGORY_KEYWORDS: dict[str, str] = {
    'solar': 'solar_energy',
    'inverter': 'solar_energy',
    'battery': 'solar_energy',
    'panel': 'solar_energy',
    'phone': 'smartphones',
    'smartphone': 'smartphones',
    'iphone': 'smartphones',
    'apple': 'smartphones',
    'samsung': 'smartphones',
    'laptop': 'smartphones',
    'cement': 'hardware',
    'drill': 'hardware',
    'tool': 'hardware',
    'welder': 'hardware',
    'paint': 'hardware',
}


def tokenize(query: str) -> list[str]:
    """Tokenize query into lowercase alphanumeric terms; strip punctuation."""
    cleaned = re.sub(r'[^\w\s]', ' ', query.lower())
    return [t for t in cleaned.split() if len(t) > 1]


def expand_synonyms(tokens: list[str]) -> list[str]:
    """Expand tokens with curated domain synonyms."""
    expanded: list[str] = []
    for token in tokens:
        if token in SYNONYMS:
            expanded.extend(SYNONYMS[token])
    return list(dict.fromkeys(expanded))


def detect_filters(query: str) -> dict[str, Any]:
    """Extract price and category intent from query string."""
    intent: dict[str, Any] = {}
    tokens = tokenize(query)

    for token in tokens:
        if token in CATEGORY_KEYWORDS:
            intent['category'] = CATEGORY_KEYWORDS[token]
            break

    price_under = re.search(r'(?:under|below|less than|<)\s*r?(\d+[\d\s,]*)', query, re.I)
    if price_under:
        val = re.sub(r'[^\d]', '', price_under.group(1))
        if val:
            intent['max_price'] = float(val)

    price_over = re.search(r'(?:over|above|more than|>)\s*r?(\d+[\d\s,]*)', query, re.I)
    if price_over:
        val = re.sub(r'[^\d]', '', price_over.group(1))
        if val:
            intent['min_price'] = float(val)

    return intent


# ---------------------------------------------------------------------------
# Scoring Pipeline
# ---------------------------------------------------------------------------

@dataclass
class ScoredProduct:
    product: MasterProduct
    score: float
    text_score: float
    trust_score: float
    freshness_score: float
    price_score: float
    best_offer: Offer | None
    offer_count: int
    matched_terms: list[str]
    distance_km: float | None = None


def _score_text_match(product: MasterProduct, terms: list[str]) -> float:
    """Exact, prefix, and alias matches against title, brand, model_number, aliases."""
    if not terms:
        return 0.5
    title = (product.title or '').lower()
    brand = (product.brand or '').lower()
    model = (product.model_number or '').lower()

    score = 0.0
    matched = 0
    for term in terms:
        t = term.lower()
        if t in brand:
            score += 0.35
            matched += 1
        elif t in model:
            score += 0.30
            matched += 1
        elif t in title:
            score += 0.20
            matched += 1
        else:
            aliases = product.aliases or []
            if isinstance(aliases, list):
                for alias in aliases:
                    if isinstance(alias, dict) and t in alias.get('phrase', '').lower():
                        score += 0.15
                        matched += 1
                        break

    if len(terms) > 1:
        phrase = ' '.join(terms).lower()
        if phrase in title or phrase in brand:
            score += 0.25

    return min(1.0, score)


def _score_trust(product: MasterProduct, offers: list[Offer]) -> float:
    """Aggregated verified merchant trust signals associated with active offers."""
    if not offers:
        compliance = product.compliance or {}
        if isinstance(compliance, dict) and (compliance.get('sabsApproved') or compliance.get('nrs097Certified')):
            return 0.65
        return 0.50

    scores = []
    for o in offers:
        m = getattr(o, 'merchant', None)
        if m:
            raw = getattr(m, 'trust_score', 50)
            score = float(raw) / 100.0 if raw > 1 else float(raw)
            if getattr(m, 'verification_state', '') == 'fully_verified':
                score = min(1.0, score + 0.1)
            scores.append(score)

    return sum(scores) / len(scores) if scores else 0.5


def _score_freshness(offers: list[Offer]) -> float:
    """Reward offers refreshed recently."""
    if not offers:
        return 0.40
    now = datetime.now(UTC)
    best_freshness = 0.0
    for o in offers:
        ts = getattr(o, 'price_source_timestamp', None) or getattr(o, 'updated_at', None)
        if not ts:
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=UTC)
        age_hours = max(0.0, (now - ts).total_seconds() / 3600.0)
        if age_hours <= 24:
            f = 1.0
        elif age_hours <= 72:
            f = 0.85
        elif age_hours <= 168:
            f = 0.65
        elif age_hours <= 720:
            f = 0.45
        else:
            f = 0.20
        best_freshness = max(best_freshness, f)
    return best_freshness or 0.40


def _score_price_completeness(product: MasterProduct, offers: list[Offer]) -> float:
    """Bonus for having verified numeric pricing in ZAR."""
    if offers:
        has_price = any(o.price_amount is not None and o.price_amount > 0 for o in offers)
        if has_price:
            return 1.0
    if product.estimated_price_zar > 0:
        return 0.70
    return 0.20


def _score_product(product: MasterProduct, terms: list[str], offers: list[Offer]) -> ScoredProduct:
    text = _score_text_match(product, terms)
    trust = _score_trust(product, offers)
    freshness = _score_freshness(offers)
    price_comp = _score_price_completeness(product, offers)

    total = (0.55 * text) + (0.20 * trust) + (0.15 * freshness) + (0.10 * price_comp)

    active_offers = [o for o in offers if o.price_amount is not None and o.price_amount > 0]
    best_offer = (
        min(active_offers, key=lambda o: o.price_amount or Decimal(0))
        if active_offers
        else (offers[0] if offers else None)
    )

    return ScoredProduct(
        product=product,
        score=round(total, 4),
        text_score=round(text, 3),
        trust_score=round(trust, 3),
        freshness_score=round(freshness, 3),
        price_score=round(price_comp, 3),
        best_offer=best_offer,
        offer_count=len(offers),
        matched_terms=[t for t in terms if t.lower() in (product.title or '').lower() or t.lower() in (product.brand or '').lower()],
    )


# ---------------------------------------------------------------------------
# High-Speed Candidate Retrieval (Sub-20ms)
# ---------------------------------------------------------------------------

def _candidate_ids_sqlite(tokens: list[str], expanded: list[str], category: str = '', brand: str = '', limit: int = 40) -> list[Any]:
    ids: list[Any] = []

    with connection.cursor() as cur:
        # 1. Direct Category & Category intent search (Instant 0.1ms B-Tree index scan)
        cats = [category] if category else []
        for t in tokens + expanded:
            if t in CATEGORY_KEYWORDS:
                cats.append(CATEGORY_KEYWORDS[t])
            if '_' in t:
                cats.append(t)
        for cat in list(dict.fromkeys(cats)):
            if len(ids) >= limit:
                break
            if cat:
                cur.execute(
                    "SELECT id FROM catalog_masterproduct "
                    "WHERE (status = 'active' OR status = 'ACTIVE') "
                    "AND category_ref = %s LIMIT %s",
                    [cat.lower(), limit - len(ids)],
                )
                ids.extend(r[0] for r in cur.fetchall())

        # 2. Direct Brand & Brand intent search (Instant 0.1ms B-Tree index scan)
        brands = [brand] if brand else []
        brands.extend(tokens + expanded)
        for b in list(dict.fromkeys(brands)):
            if len(ids) >= limit:
                break
            if b and len(b) > 2:
                cur.execute(
                    "SELECT id FROM catalog_masterproduct "
                    "WHERE (status = 'active' OR status = 'ACTIVE') "
                    "AND (brand = %s OR brand = %s OR brand = %s) LIMIT %s",
                    [b.capitalize(), b.upper(), b, limit - len(ids)],
                )
                ids.extend(r[0] for r in cur.fetchall())

        # 3. Direct Canonical ID / handle prefix match
        if len(ids) < limit:
            for t in tokens[:2]:
                if len(t) > 2:
                    cur.execute(
                        "SELECT id FROM catalog_masterproduct "
                        "WHERE (status = 'active' OR status = 'ACTIVE') "
                        "AND (canonical_id LIKE %s OR handle LIKE %s) LIMIT %s",
                        [f'var_{t.lower()}%', f'{t.lower()}%', limit - len(ids)],
                    )
                    ids.extend(r[0] for r in cur.fetchall())

    return list(dict.fromkeys(ids))[:limit]


def _candidate_ids_postgres(tokens: list[str], expanded: list[str], limit: int,
                            category: str = '', brand: str = '') -> list[Any]:
    """
    Structural candidate pull on PostgreSQL: exact brand equality (B-Tree),
    category browse, and title prefix — the deterministic lists that join the
    lexical/fuzzy ones in RRF fusion.
    """
    if connection.vendor != 'postgresql':
        return []
    if not (tokens or category or brand):
        return []

    # Include search tokens and synonym brand expansions
    candidate_terms = ([brand] if brand else []) + tokens[:2] + [e for e in (expanded or [])[:6] if ' ' not in e]
    brand_variants = []
    for term in candidate_terms:
        t = term.strip()
        brand_variants.extend([t.capitalize(), t.upper(), t.lower(), t])

    brand_variants = [b for b in dict.fromkeys(brand_variants) if b][:20]

    ids: list[Any] = []
    try:
        with connection.cursor() as cur:
            # 1. Exact Brand match including synonym brands (0.2ms B-Tree index scan via IN)
            if brand_variants:
                placeholders = ', '.join(['%s'] * len(brand_variants))
                cur.execute(
                    f"SELECT id FROM catalog_masterproduct "
                    f"WHERE (status = 'active' OR status = 'ACTIVE') "
                    f"AND brand IN ({placeholders}) LIMIT %s",
                    [*brand_variants, limit],
                )
                ids.extend(r[0] for r in cur.fetchall())

            # 2. Title prefix match (1ms index scan)
            if len(ids) < limit:
                title_terms = [t.strip() for t in (tokens[:1] + expanded[:2]) if len(t.strip()) >= 2]
                for term in title_terms:
                    if len(ids) >= limit:
                        break
                    cur.execute(
                        "SELECT id FROM catalog_masterproduct "
                        "WHERE (status = 'active' OR status = 'ACTIVE') "
                        "AND (title ILIKE %s OR title ILIKE %s) LIMIT %s",
                        [f'{term.capitalize()}%', f'{term.lower()}%', limit - len(ids)],
                    )
                    ids.extend(r[0] for r in cur.fetchall())

            # 3. Category browse pull (faceted / category-only queries)
            if category and len(ids) < limit:
                cur.execute(
                    "SELECT id FROM catalog_masterproduct "
                    "WHERE (status = 'active' OR status = 'ACTIVE') "
                    "AND category_ref = %s ORDER BY popularity_score DESC NULLS LAST LIMIT %s",
                    [category.lower(), limit - len(ids)],
                )
                ids.extend(r[0] for r in cur.fetchall())
        return list(dict.fromkeys(ids))[:limit]
    except Exception:
        return []


def _levenshtein(a: str, b: str) -> int:
    """Iterative Levenshtein edit distance (no external dependencies)."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def _fuzzy_pass(term: str, limit: int = 20) -> tuple[list[Any], str]:
    """
    Typo-tolerance fallback: when the exact candidate pull returns nothing,
    pull a bounded set of rows by a short prefix, then rank their individual
    title/brand words by edit distance to the query term. Catches common
    prefix/character-omission typos (e.g. "samsng" -> "samsung").
    Works on both SQLite (LIKE) and PostgreSQL (ILIKE).
    Returns (product ids best-first, best correction suggestion).
    """
    term = (term or '').strip().lower()
    if len(term) < 3:
        return [], ''
    threshold = max(2, len(term) // 3)

    op = 'ILIKE' if connection.vendor == 'postgresql' else 'LIKE'
    prefix = term[:4] if len(term) >= 4 else term
    like = f'{prefix}%'
    sql = (
        f"SELECT id, title, brand FROM catalog_masterproduct "
        f"WHERE (status = 'active' OR status = 'ACTIVE') "
        f"AND (brand {op} %s OR category_ref {op} %s OR title {op} %s) "
        f"LIMIT %s"
    )
    try:
        with connection.cursor() as cur:
            cur.execute(sql, [like, like, like, limit * 8])
            rows = cur.fetchall()
    except Exception:
        return [], ''

    scored: list[tuple[int, Any, str]] = []
    for rid, title, brand in rows:
        words = set()
        for field in (title or '', brand or ''):
            for w in re.split(r'[\s\-/]+', field.lower()):
                if len(w) >= 3:
                    words.add(w)
        if not words:
            continue
        best_word = min(words, key=lambda w: _levenshtein(term, w))
        best = _levenshtein(term, best_word)
        if best <= threshold:
            scored.append((best, rid, best_word))
    scored.sort(key=lambda t: (t[0], str(t[1])))
    ids = [rid for _, rid, _ in scored[:limit]]
    suggestion = scored[0][2] if scored and scored[0][0] > 0 else ''
    return ids, suggestion


def _fuzzy_candidates(term: str, limit: int = 20) -> list[Any]:
    ids, _ = _fuzzy_pass(term, limit)
    return ids


# ---------------------------------------------------------------------------
# Hybrid retrieval: lexical (tsvector / FTS5 BM25), fuzzy (trgm), structural,
# and an embedding hook — fused with Reciprocal Rank Fusion.
# ---------------------------------------------------------------------------

def _fts_ids(query: str, limit: int) -> list[Any]:
    """SQLite serving path: porter-stemmed BM25 over the FTS5 index."""
    if connection.vendor != 'sqlite' or not query.strip():
        return []
    try:
        from apps.catalog.fts import fts_search_ids, fts_table_exists

        if not fts_table_exists():
            return []
        return fts_search_ids(query, limit)
    except Exception:
        return []


def _tsvector_ids(raw_query: str, expanded: list[str], limit: int) -> list[Any]:
    """
    PostgreSQL serving path: indexed GIN search over the weighted
    `search_tsv` generated column, ordered by ts_rank. Query words are
    OR-fused for recall; Python scoring re-establishes precision.
    """
    if connection.vendor != 'postgresql':
        return []
    tokens = tokenize(raw_query)
    words = list(dict.fromkeys(
        tokens + [w for e in (expanded or [])[:8] for w in tokenize(e)]
    ))[:14]
    if not words:
        return []
    ts_query = ' | '.join(words)
    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id FROM ("
                "  SELECT id, ts_rank(search_tsv, q) AS rank, "
                "         rank(search_tsv, q) AS exact_rank "
                "  FROM catalog_masterproduct, to_tsquery('english', %s) q "
                "  WHERE search_tsv @@ q "
                "    AND (status = 'active' OR status = 'ACTIVE') "
                "  ORDER BY exact_rank, rank DESC LIMIT %s"
                ") top",
                [ts_query, limit],
            )
            return [r[0] for r in cur.fetchall()]
    except Exception:
        return []


def _trgm_ids(term: str, limit: int) -> list[Any]:
    """PostgreSQL fuzzy path: pg_trgm similarity over title/brand (typos)."""
    if connection.vendor != 'postgresql' or len((term or '').strip()) < 3:
        return []
    term = term.strip()
    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id FROM catalog_masterproduct "
                "WHERE (status = 'active' OR status = 'ACTIVE') "
                "  AND (title %% %s OR brand %% %s) "
                "ORDER BY GREATEST(similarity(title, %s), similarity(brand, %s)) DESC "
                "LIMIT %s",
                [term, term, term, term, limit],
            )
            return [r[0] for r in cur.fetchall()]
    except Exception:
        return []


_VECTOR_STATE: bool | None = None


def vector_candidates(raw_query: str, limit: int) -> list[Any]:
    """
    Embedding ANN hook for the hybrid stack. Returns [] until a pgvector
    `catalog_productembedding` table with a HNSW index is provisioned and
    backfilled; the fusion layer already consumes whatever this yields.
    """
    global _VECTOR_STATE
    if connection.vendor != 'postgresql':
        return []
    if _VECTOR_STATE is False:
        return []
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT to_regclass('catalog_productembedding')")
            _VECTOR_STATE = cur.fetchone()[0] is not None
    except Exception:
        _VECTOR_STATE = False
    if not _VECTOR_STATE:
        return []
    # Embedding provider wiring lands here; until then contribute nothing.
    return []


def _rrf_fuse(candidate_lists: list[list[Any]], limit: int, k: int = 60) -> list[Any]:
    """Reciprocal Rank Fusion: score(d) = Σ 1/(k + rank_i(d)) per result list."""
    fused: dict[Any, float] = {}
    for lst in candidate_lists:
        for rank, rid in enumerate(lst):
            fused[rid] = fused.get(rid, 0.0) + 1.0 / (k + rank + 1)
    ordered = sorted(fused.items(), key=lambda kv: (-kv[1], str(kv[0])))
    return [rid for rid, _ in ordered[:limit]]


def _hybrid_candidate_ids(raw_query: str, expanded: list[str], tokens: list[str],
                         category: str, brand: str, limit: int) -> list[Any]:
    half = max(20, limit // 2)
    if connection.vendor == 'postgresql':
        lists = [
            _tsvector_ids(raw_query, expanded, limit),
            _trgm_ids(tokens[0] if tokens else '', half),
            _candidate_ids_postgres(tokens, expanded, half, category, brand),
            vector_candidates(raw_query, half),
        ]
    else:
        lists = [
            _fts_ids(raw_query, limit),
            _candidate_ids_sqlite(tokens, expanded, category, brand, half),
        ]
    return _rrf_fuse([lst for lst in lists if lst], limit)


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _popularity_scores() -> dict[str, int]:
    """Click counts per product over the last 30 days (cached, best-effort)."""
    cached = cache.get('sp:pop30:v1')
    if cached is not None:
        return cached
    result: dict[str, int] = {}
    try:
        from django.db.models import Count

        from apps.core.models import SearchClick

        since = datetime.now(UTC) - timedelta(days=30)
        rows = (
            SearchClick.objects.filter(created_at__gte=since)
            .values('product_id').annotate(n=Count('id')).order_by('-n')[:500]
        )
        result = {r['product_id']: r['n'] for r in rows}
    except Exception:
        result = {}
    with contextlib.suppress(Exception):
        cache.set('sp:pop30:v1', result, 300)
    return result


def _apply_popularity_boost(scored: list[ScoredProduct]) -> None:
    """Small capped behavioural prior: log-scaled click boost (max +0.05)."""
    clicks = _popularity_scores()
    if not clicks:
        return
    for s in scored:
        n = clicks.get(str(s.product.pk))
        if n:
            s.score = round(s.score + min(0.05, 0.012 * math.log1p(n)), 4)


SORT_CHOICES = ('relevance', 'price_asc', 'price_desc', 'newest', 'rating')


def _display_price(s: ScoredProduct) -> float | None:
    if s.best_offer is not None and s.best_offer.price_amount:
        return float(s.best_offer.price_amount)
    est = s.product.estimated_price_zar
    return float(est) if est else None


def _merchant_rating(s: ScoredProduct) -> float | None:
    ratings = []
    for o in s.product.offers.all():
        m = getattr(o, 'merchant', None)
        if m is not None and m.google_rating is not None:
            ratings.append(float(m.google_rating))
    return max(ratings) if ratings else None


def _sort_scored(scored: list[ScoredProduct], sort: str) -> list[ScoredProduct]:
    if sort == 'price_asc':
        return sorted(scored, key=lambda s: (_display_price(s) is None, _display_price(s) or 0.0, -s.score))
    if sort == 'price_desc':
        return sorted(scored, key=lambda s: -(_display_price(s) or 0.0))
    if sort == 'newest':
        return sorted(scored, key=lambda s: s.product.created_at or datetime.min.replace(tzinfo=UTC), reverse=True)
    if sort == 'rating':
        return sorted(scored, key=lambda s: -(_merchant_rating(s) or 0.0))
    return scored


# ---------------------------------------------------------------------------
# Public Ranked Search API
# ---------------------------------------------------------------------------

CANDIDATE_LIMIT = 1000


def ranked_search(
    raw_query: str,
    limit: int = 24,
    offset: int = 0,
    category: str = '',
    province: str = '',
    brand: str = '',
    min_price: float | None = None,
    max_price: float | None = None,
    candidate_limit: int = CANDIDATE_LIMIT,
    sort: str = 'relevance',
    near: tuple[float, float, float] | None = None,
) -> dict[str, Any]:
    """
    Deterministic ranked product+merchant search.
    Hybrid candidate retrieval (tsvector/BM25 + trgm fuzzy + structural +
    embeddings) fused via RRF, then Python-scored with behavioural priors.
    `near` is an optional (lat, lng, radius_km) tuple for geo-constrained search.
    Returns products (ScoredProduct), merchants, facets, price stats, pagination meta.
    """
    t0 = time.perf_counter()
    tokens = tokenize(raw_query)
    expanded = expand_synonyms(tokens)
    intent = detect_filters(raw_query)

    category = category or intent.get('category') or ''
    brand = brand or intent.get('brand') or ''
    min_price = min_price if min_price is not None else intent.get('min_price')
    max_price = max_price if max_price is not None else intent.get('max_price')
    province = (province or '').strip()
    sort = sort if sort in SORT_CHOICES else 'relevance'

    did_you_mean = ''
    ids: list[Any] = []
    if tokens or category or brand:
        ids = _hybrid_candidate_ids(raw_query, expanded, tokens, category, brand, candidate_limit)

    ids = (ids or [])[:candidate_limit]
    capped = len(ids) >= candidate_limit

    # Typo-tolerance: if the exact pull found nothing, try near-miss matches
    # and surface the correction as "did you mean".
    if not ids and tokens:
        fuzzy, suggestion = _fuzzy_pass(tokens[0], candidate_limit)
        if fuzzy:
            ids = fuzzy[:candidate_limit]
            did_you_mean = suggestion

    products_list = list(
        MasterProduct.objects.filter(id__in=ids)
        .prefetch_related('offers', 'offers__merchant')
    )
    if category:
        products_list = [p for p in products_list if (p.category_ref or '').lower() == category.lower()]
    if brand:
        products_list = [p for p in products_list if (p.brand or '').lower() == brand.lower()]

    near_lat, near_lng, near_radius = near if near else (None, None, None)

    scored: list[ScoredProduct] = []
    for p in products_list:
        offers = []
        for o in p.offers.all():
            if o.availability_state in ('out_of_stock', 'hidden', 'expired'):
                continue
            if province:
                merchant_province = (o.merchant.province or '') if o.merchant_id else ''
                if merchant_province.lower() != province.lower():
                    continue
            if near is not None:
                m = getattr(o, 'merchant', None)
                if m is None or m.latitude is None or m.longitude is None:
                    continue
                dist = _haversine_km(near_lat, near_lng, float(m.latitude), float(m.longitude))
                if dist > near_radius:
                    continue
            offers.append(o)
        if province and not offers:
            continue
        if near is not None and not offers:
            continue
        sp = _score_product(p, tokens + expanded, offers)
        if near is not None and offers:
            best = sp.best_offer or offers[0]
            bm = getattr(best, 'merchant', None)
            if bm is not None and bm.latitude is not None and bm.longitude is not None:
                sp.distance_km = round(_haversine_km(near_lat, near_lng, float(bm.latitude), float(bm.longitude)), 2)

        price = None
        if sp.best_offer is not None and sp.best_offer.price_amount:
            price = float(sp.best_offer.price_amount)
        elif p.estimated_price_zar:
            price = float(p.estimated_price_zar)
        if min_price is not None and (price is None or price < min_price):
            continue
        if max_price is not None and (price is None or price > max_price):
            continue
        scored.append(sp)

    _apply_popularity_boost(scored)

    # Deduplicate scored products by title to ensure clean unique search results
    deduped_scored: list[ScoredProduct] = []
    seen_titles = set()
    for s in scored:
        title_key = (s.product.title or '').strip().lower()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            deduped_scored.append(s)

    deduped_scored.sort(key=lambda s: (-s.score, -(s.offer_count)))
    if near is not None:
        # Within relevance band, prefer genuinely closer storefronts (GMB-style).
        deduped_scored.sort(key=lambda s: (-(s.score if sort == 'relevance' else 0), s.distance_km or 1e9))
    deduped_scored = _sort_scored(deduped_scored, sort)

    total = len(deduped_scored)
    page = deduped_scored[offset:offset + limit]

    # Fast facets
    facet_categories: dict[str, int] = {}
    facet_brands: dict[str, int] = {}
    facet_provinces: dict[str, int] = {}
    prices: list[float] = []
    for s in scored:
        cat = s.product.category_ref or 'other'
        facet_categories[cat] = facet_categories.get(cat, 0) + 1
        b = s.product.brand or 'Unknown'
        facet_brands[b] = facet_brands.get(b, 0) + 1
        for o in s.product.offers.all():
            m = getattr(o, 'merchant', None)
            if m is not None and m.province:
                facet_provinces[m.province] = facet_provinces.get(m.province, 0) + 1
                break
        pr = s.best_offer.price_amount if s.best_offer else s.product.estimated_price_zar
        if pr:
            prices.append(float(pr))

    # High-speed merchant discovery from matched products and direct indexed name search (< 5ms)
    matched_merchant_ids = set()
    for s in scored[:20]:
        if s.best_offer and s.best_offer.merchant_id:
            matched_merchant_ids.add(s.best_offer.merchant_id)

    merchants: list[Merchant] = []
    if matched_merchant_ids:
        merchants = list(
            Merchant.objects.filter(id__in=matched_merchant_ids)
            .select_related('market')
            .order_by('-trust_score')[:6]
        )

    if len(merchants) < 6 and tokens:
        t = tokens[0].strip()
        op = 'ILIKE' if connection.vendor == 'postgresql' else 'LIKE'
        try:
            with connection.cursor() as cur:
                cur.execute(
                    f"SELECT id FROM merchants_merchant "
                    f"WHERE name {op} %s OR name {op} %s "
                    f"LIMIT %s",
                    [f'{t.capitalize()}%', f'{t.lower()}%', 6 - len(merchants)]
                )
                extra_ids = [r[0] for r in cur.fetchall()]
            if extra_ids:
                extra_merchants = list(Merchant.objects.filter(id__in=extra_ids).select_related('market'))
                merchants.extend(extra_merchants)
        except Exception:
            pass

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        'query': raw_query,
        'tokens': tokens,
        'products': page,
        'merchants': merchants,
        'total_products': total,
        'total_merchants': len(merchants),
        'did_you_mean': did_you_mean,
        'sort': sort,
        'facets': {
            'categories': dict(sorted(facet_categories.items(), key=lambda kv: -kv[1])[:10]),
            'brands': dict(sorted(facet_brands.items(), key=lambda kv: -kv[1])[:10]),
            'provinces': dict(sorted(facet_provinces.items(), key=lambda kv: -kv[1])[:9]),
        },
        'price_stats': ({
            'min': min(prices), 'max': max(prices), 'avg': round(sum(prices) / len(prices))
        } if prices else None),
        'page': offset // limit + 1 if limit else 1,
        'has_next': offset + limit < total,
        'next_offset': offset + limit if offset + limit < total else None,
        'result_cap': candidate_limit,
        'is_capped': capped,
        'elapsed_ms': elapsed_ms,
    }
