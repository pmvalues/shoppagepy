"""
Shoppage Ranked Retrieval Engine (v8.2 Modernization)

Constitutional compliance:
- Rule 16: No LLM in the deterministic basic-search critical path. This module is
  pure conventional retrieval: tokenization, synonym expansion, weighted scoring,
  fuzzy fallback. Deterministic and auditable.

Design:
- Works on PostgreSQL (weighted SearchVector + SearchRank, trigram fallback)
  and SQLite (portable Python-side scoring) so dev == prod semantics.
- Ranking formula (deterministic):
    score = 0.55*text_relevance + 0.20*merchant_trust + 0.15*offer_freshness + 0.10*price_completeness
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

from django.conf import settings
from django.db import connection
from django.db.models import Q
from django.utils import timezone

from apps.catalog.models import MasterProduct
from apps.merchants.models import Merchant
from apps.offers.models import Offer

# ---------------------------------------------------------------------------
# Query understanding
# ---------------------------------------------------------------------------

STOPWORDS = {
    'the', 'a', 'an', 'for', 'of', 'and', 'or', 'to', 'in', 'on', 'at', 'is',
    'best', 'cheap', 'cheapest', 'buy', 'price', 'prices', 'where', 'how',
    'get', 'find', 'me', 'my', 'i', 'want', 'need', 'looking',
    'under', 'over', 'below', 'above', 'than', 'from', 'with', 'near',
}

# South-Africa-specific synonym expansion (ZA commerce wedge)
SYNONYMS: Dict[str, List[str]] = {
    'loadshedding': ['inverter', 'battery', 'backup', 'ups'],
    'load shedding': ['inverter', 'battery', 'backup', 'ups'],
    'stage 6': ['inverter', 'battery'],
    'geyser': ['solar geyser', 'element'],
    'panel': ['solar panel', 'pv'],
    'phone': ['smartphone', 'cellphone'],
    'cell': ['cellphone', 'smartphone'],
    'laptop': ['notebook', 'computer'],
    'tv': ['television'],
    'tyre': ['tire'],
    'bakkie': ['pickup', 'vehicle'],
    'robot': ['traffic'],
    'spaza': ['grocery', 'fmcg'],
    'boost': ['booster', 'amplifier'],
    'soundbar': ['speaker'],
    'power': ['inverter', 'battery', 'generator'],
}

BRAND_HINTS = [
    'deye', 'sunsynk', 'dyness', 'samsung', 'apple', 'huawei', 'lg', 'sony',
    'oraimo', 'victron', 'growatt', 'pylontech', 'hubble', 'must',
    'ja solar', 'canadian solar', 'xiaomi', 'redmi', 'oppo', 'hisense',
]

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    'solar_energy': [
        'solar', 'inverter', 'battery', 'backup', 'power', 'deye', 'sunsynk',
        'dyness', 'panel', 'pv', 'load shedding', 'loadshedding', 'ups',
        'hybrid', 'lifepo4', 'pylontech', 'hubble', 'growatt', 'victron',
        'lithium', 'geyser timer', 'generator',
    ],
    'smartphones': [
        'phone', 'smartphone', 'samsung', 'apple', 'iphone', 'android',
        'galaxy', 'tablet', 'cellphone', 'mobile', 'xiaomi', 'redmi', 'oppo',
        'honor', 'oraimo', 'airpods', 'earbuds',
    ],
    'hardware': [
        'hardware', 'cement', 'surebuild', 'ppc', 'brick', 'paint', 'tool',
        'drill', 'building', 'plumbing', 'tile', 'steel', 'timber', 'jojo',
        'borehole', 'pump', 'welder', 'grinder',
    ],
    'groceries': [
        'food', 'grocery', 'fmcg', 'maize', 'rice', 'sugar', 'oil', 'flour',
        'spaza', 'beverage', 'pantry',
    ],
    'pharmacy': [
        'pharmacy', 'medicine', 'health', 'vitamin', 'supplement', 'dischem',
        'clicks', 'first aid',
    ],
    'automotive': [
        'car', 'auto', 'spare', 'tyre', 'tire', 'engine oil', 'brake',
        'vehicle', 'car battery', 'alternator',
    ],
}


def tokenize(query: str) -> List[str]:
    """Lowercase, strip punctuation, drop stopwords."""
    raw = re.findall(r"[a-z0-9.\-]+", (query or '').lower())
    return [t for t in raw if t not in STOPWORDS and len(t) > 1]


def expand_synonyms(tokens: List[str]) -> List[str]:
    """Return additional search tokens from ZA synonym map (bounded)."""
    text = ' '.join(tokens)
    extra: List[str] = []
    for key, syns in SYNONYMS.items():
        if key in text:
            for s in syns:
                extra.extend(s.split())
    return [e for e in extra if e not in tokens][:8]


def detect_filters(query: str) -> Dict[str, Any]:
    """Deterministic intent extraction: brand, category, price bounds."""
    text = (query or '').lower()

    def _price(raw: str) -> Optional[float]:
        clean = raw.replace(',', '').strip().lower()
        m = re.match(r'^([\d.]+)\s*(k|grand)?$', clean)
        if not m:
            return None
        val = float(m.group(1))
        if m.group(2) == 'k':
            val *= 1_000
        elif m.group(2) == 'grand':
            val *= 1_000
        return round(val)

    max_price = min_price = None
    m = re.search(
        r'(?:under|below|less than|up to|max)\s+(?:r\s*)?([\d,.]+\s*(?:k|grand)?)', text)
    if m:
        max_price = _price(m.group(1))
    m = re.search(
        r'(?:over|above|more than|from|min)\s+(?:r\s*)?([\d,.]+\s*(?:k|grand)?)', text)
    if m:
        min_price = _price(m.group(1))

    brand = next((b for b in BRAND_HINTS if b in text), None)
    category = None
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in text for k in kws):
            category = cat
            break

    return {
        'brand': brand,
        'category': category,
        'min_price': min_price,
        'max_price': max_price,
    }


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

FRESH_WINDOW = timedelta(days=7)


@dataclass
class ScoredProduct:
    product: MasterProduct
    score: float = 0.0
    best_offer: Optional[Offer] = None
    offer_count: int = 0
    matched_tokens: List[str] = field(default_factory=list)


def _token_hits(product: MasterProduct, tokens: Iterable[str]) -> int:
    """Count how many query tokens appear in the product's searchable text."""
    haystack = ' '.join(filter(None, [
        product.title.lower(),
        (product.brand or '').lower(),
        (product.model_number or '').lower(),
        (product.category_ref or '').lower(),
        (product.gtin13 or '').lower(),
    ]))
    return sum(1 for t in set(tokens) if t in haystack)


def _score_product(p: MasterProduct, tokens: List[str], offers: List[Offer]) -> ScoredProduct:
    hits = _token_hits(p, tokens)
    n_tokens = max(len(set(tokens)), 1)

    # Text relevance: coverage ratio + title-position boost
    coverage = hits / n_tokens
    title_lower = p.title.lower()
    phrase_bonus = 0.15 if all(t in title_lower for t in tokens) else 0.0
    text_relevance = min(coverage + phrase_bonus, 1.0)

    # Merchant trust: best trust among offering merchants (0..1)
    trusts = [o.merchant.trust_score for o in offers if o.merchant_id and o.merchant.trust_score]
    trust_component = (max(trusts) / 100.0) if trusts else 0.35

    # Freshness: share of offers confirmed in last FRESH_WINDOW
    now = timezone.now()
    fresh = sum(
        1 for o in offers
        if o.last_confirmed_at and (now - o.last_confirmed_at) <= FRESH_WINDOW
    )
    freshness = fresh / len(offers) if offers else 0.25

    # Price completeness: does this product have a usable price?
    has_price = bool(offers and any(o.price_amount for o in offers)) or bool(p.estimated_price_zar)
    price_component = 1.0 if has_price else 0.3

    score = (
        0.55 * text_relevance
        + 0.20 * trust_component
        + 0.15 * freshness
        + 0.10 * price_component
    )
    scored_offers = sorted(
        [o for o in offers if o.price_amount], key=lambda o: o.price_amount)
    return ScoredProduct(
        product=p,
        score=round(score, 4),
        best_offer=scored_offers[0] if scored_offers else None,
        offer_count=len(offers),
        matched_tokens=[t for t in set(tokens) if t in haystack_of(p)],
    )


def haystack_of(p: MasterProduct) -> str:
    return ' '.join(filter(None, [
        p.title.lower(), (p.brand or '').lower(), (p.model_number or '').lower(),
        (p.category_ref or '').lower(), (p.gtin13 or '').lower(),
    ]))


# ---------------------------------------------------------------------------
# Candidate selection backends
# ---------------------------------------------------------------------------

def _candidate_ids_sqlite(tokens: List[str], expanded: List[str], limit: int) -> List[int]:
    """
    SQLite candidate pull. Primary path: FTS5 full-text index (fast substring +
    prefix + bm25 ranking, no full-table scan). Falls back to indexed prefix SQL
    if the FTS index is absent (e.g. not yet built on a fresh dev DB).
    """
    all_terms = list(dict.fromkeys(tokens + expanded))[:12]
    if not all_terms:
        return []

    # Primary: FTS5 index
    try:
        from apps.catalog.fts import fts_search_ids, fts_row_count
        if fts_row_count() > 0:
            ids = fts_search_ids(' '.join(all_terms), limit)
            if ids:
                return ids
    except Exception:
        pass

    # Fallback: indexed prefix scans (per-column, status-filtered)
    ids: List[int] = []
    with connection.cursor() as cur:
        for t in all_terms:
            if len(ids) >= limit:
                break
            esc = t.replace('\\', '\\\\').replace('%', r'\%').replace('_', r'\_')
            pat = f'{esc}%'
            cur.execute(
                "SELECT id FROM catalog_masterproduct "
                "WHERE (status = 'active' OR status = 'ACTIVE') AND ("
                "title LIKE %s ESCAPE '\\' OR brand LIKE %s ESCAPE '\\' "
                "OR model_number LIKE %s ESCAPE '\\') LIMIT %s",
                [pat, pat, pat, limit],
            )
            ids.extend(r[0] for r in cur.fetchall())
    return list(dict.fromkeys(ids))[:limit]


def _candidate_ids_postgres(tokens: List[str], expanded: List[str], limit: int) -> Optional[List[int]]:
    """Weighted full-text candidate pull on PostgreSQL. Returns None if unavailable."""
    if connection.vendor != 'postgresql':
        return None
    try:
        from django.contrib.postgres.search import SearchVector
        terms = ' '.join(list(dict.fromkeys(tokens + expanded))[:12])
        if not terms.strip():
            return []
        vector = (
            SearchVector('title', weight='A')
            + SearchVector('brand', weight='B')
            + SearchVector('model_number', weight='C')
            + SearchVector('category_ref', weight='D')
        )
        qs = (
            MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
            .annotate(search_rank=vector)
            .filter(search_rank=terms)
            .order_by('-search_rank')
        )
        return list(qs.values_list('id', flat=True)[:limit * 6])
    except Exception:
        # Table may lack tsvector support yet; fall back to portable path.
        return None


def _fuzzy_candidates(term: str, limit: int) -> List[int]:
    """Typo tolerance fallback: Levenshtein-ish prefix matching on brand/title."""
    if len(term) < 4:
        return []
    qs = MasterProduct.objects.filter(status__in=['active', 'ACTIVE'])
    ids: List[int] = []
    for t in {term[:len(term) - 1], term[:4]}:
        if len(t) < 3:
            continue
        ids.extend(
            qs.filter(Q(title__istartswith=t) | Q(brand__istartswith=t))
            .values_list('id', flat=True)[:limit]
        )
    return list(dict.fromkeys(ids))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def ranked_search(
    raw_query: str,
    limit: int = 24,
    offset: int = 0,
    category: str = '',
    province: str = '',
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Deterministic ranked product+merchant search.
    Returns products (ScoredProduct), merchants, facets, price stats, pagination meta.
    """
    t0 = time.perf_counter()
    tokens = tokenize(raw_query)
    expanded = expand_synonyms(tokens)
    intent = detect_filters(raw_query)

    # Explicit URL params override inline intent
    category = category or intent.get('category') or ''
    min_price = min_price if min_price is not None else intent.get('min_price')
    max_price = max_price if max_price is not None else intent.get('max_price')

    candidate_limit = 400
    ids = _candidate_ids_postgres(tokens, expanded, candidate_limit)
    if ids is None:
        ids = _candidate_ids_sqlite(tokens, expanded, candidate_limit)
        if not ids and tokens:
            ids = _fuzzy_candidates(tokens[0], candidate_limit)

    # Hard cap the scoring pool: rank the most textually relevant candidates only.
    # Full-pool scoring is O(n) prefetches and dominated runtime at scale.
    ids = ids[:600]

    products_qs = (
        MasterProduct.objects.filter(id__in=ids)
        .prefetch_related('offers', 'offers__merchant')
    )
    if category:
        products_qs = products_qs.filter(category_ref=category)

    scored: List[ScoredProduct] = []
    for p in products_qs:
        offers = [o for o in p.offers.all()
                  if o.availability_state not in ('out_of_stock', 'hidden', 'expired')]
        sp = _score_product(p, tokens + expanded, offers)

        # Price bounds applied at scoring time using best known price
        price = None
        if sp.best_offer is not None:
            price = float(sp.best_offer.price_amount)
        elif p.estimated_price_zar:
            price = float(p.estimated_price_zar)
        if min_price is not None and (price is None or price < min_price):
            continue
        if max_price is not None and (price is None or price > max_price):
            continue
        scored.append(sp)

    scored.sort(key=lambda s: (-s.score, -(s.offer_count)))

    total = len(scored)
    page = scored[offset:offset + limit]

    # Facets from full result set
    facet_categories: Dict[str, int] = {}
    facet_brands: Dict[str, int] = {}
    prices: List[float] = []
    for s in scored:
        cat = s.product.category_ref or 'other'
        facet_categories[cat] = facet_categories.get(cat, 0) + 1
        b = s.product.brand or 'Unknown'
        facet_brands[b] = facet_brands.get(b, 0) + 1
        pr = s.best_offer.price_amount if s.best_offer else s.product.estimated_price_zar
        if pr:
            prices.append(float(pr))

    merchants_qs = Merchant.objects.all().select_related('market')
    if category:
        merchants_qs = merchants_qs.filter(category=category)
    elif tokens:
        mq = Q()
        for t in tokens[:5]:
            mq |= Q(name__icontains=t) | Q(category__icontains=t) | \
                  Q(province__icontains=t) | Q(address_text__icontains=t)
        merchants_qs = merchants_qs.filter(mq)
    if province:
        merchants_qs = merchants_qs.filter(province=province)
    merchants = list(merchants_qs.order_by('-trust_score')[:6])

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    return {
        'query': raw_query,
        'tokens': tokens,
        'products': page,
        'merchants': merchants,
        'total_products': total,
        'total_merchants': len(merchants),
        'facets': {
            'categories': dict(sorted(facet_categories.items(), key=lambda kv: -kv[1])[:10]),
            'brands': dict(sorted(facet_brands.items(), key=lambda kv: -kv[1])[:10]),
        },
        'price_stats': ({
            'min': min(prices), 'max': max(prices), 'avg': round(sum(prices) / len(prices))
        } if prices else None),
        'page': offset // limit + 1 if limit else 1,
        'has_next': offset + limit < total,
        'next_offset': offset + limit if offset + limit < total else None,
        'elapsed_ms': elapsed_ms,
    }
