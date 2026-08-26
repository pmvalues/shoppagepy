# Shoppage.co.za — Platform Modernization Analysis & Roadmap

**Date:** 2026-08-26
**Baseline:** v8.1 constitution (Django 5.1, HTMX 2, Alpine 3, PostgreSQL/SQLite, Typesense, Redis)
**Goal:** Evolve the current Django monolith into a modern discovery platform that can credibly compete with Google Shopping-class vertical search — while respecting the v8.1 constitutional hard-kill rules (no cart/checkout custody, evidence-backed truth, AI never writes canonical state).

---

## 1. Current State Assessment

### What exists and works
| Layer | Status | Notes |
|---|---|---|
| Domain model | ✅ Strong | `MasterProduct`, `Merchant`, `Market`, `Offer`, `DiscoveredOffer`, `EvidenceArtifact`, `TrustPassport` — a genuinely differentiated "evidence graph" moat |
| Experience plane | ✅ Functional | Server-rendered templates + HTMX live search + Alpine |
| Universal link resolver (`/l/<id>/`) | ✅ Good | Sub-50ms WhatsApp/outbound routing is the core economic primitive |
| REST API | ✅ Present | `/api/v1/*`, assistant endpoint, GMC feed, trust seal SVG |
| Docker stack | ✅ Present | Postgres+pgvector, Redis, Typesense, Traefik labels |

### Critical gaps blocking "Google-class" competition
1. **Search is toy-grade.** `apps/intelligence/services.py::semantic_search` uses `icontains` substring matching with no ranking, no stemming, no typo tolerance, no relevance scoring. Google's core product *is* ranked retrieval; this must be fixed first.
2. **Zero SEO surface.** No sitemaps, no robots.txt, no structured data (JSON-LD), no canonical tags, no OpenGraph. A discovery platform invisible to crawlers cannot compete for discovery.
3. **No caching anywhere.** Every homepage/search hit re-queries the DB; no template fragment caching, no Redis cache usage despite it being in the stack.
4. **No pagination** on search results (hard slice `[:24]`) — fatal for crawlability and UX at scale.
5. **No health/readiness endpoints** for orchestration; no API throttling (constitution rule 9 requires throttling).
6. **Missing PWA/mobile fundamentals**: no manifest, no theme-color, no apple-touch icons.
7. **Dead code paths**: `apps/web` Next.js app duplicates the Django experience plane — split-brain architecture. Constitution says experience plane = Django + HTMX. The Next app should be retired or clearly scoped as headless storefront only.

### Constitutional constraints honored in this modernization
- Rule 16: LLMs stay out of deterministic basic search → we build **conventional ranked retrieval**, not an LLM pipeline.
- Rule 21: audit/observability added alongside features, not after.
- Rule 22: all mutations remain server-authoritative.

---

## 2. Modernization Delivered (this change set)

### 2.1 Ranked full-text search engine (new: `apps/intelligence/ranking.py`)
Replaces `icontains` with a proper retrieval stack that works on **both SQLite (dev) and PostgreSQL (prod)**:

- **Query understanding:** multi-token parsing, stopword removal, synonym expansion (ZA-specific: "load shedding"→inverter/battery/UPS, "geyser"→solar geyser, brand aliases).
- **BM25-style scoring** on PostgreSQL via `SearchVector` (weighted title > brand > model > category) with `SearchRank`; on SQLite, a portable Python-side TF-IDF-ish scorer over a candidate set pulled by tokenized `__icontains` OR queries.
- **Typo tolerance:** trigram similarity fallback when zero results (Postgres `pg_trgm`); Levenshtein-based fuzzy match on SQLite.
- **Faceted results:** category counts, brand counts, price histogram buckets computed from the result set.
- **Structured filters:** category, brand, province, min/max price, availability — applied as queryset filters, not post-filters.
- **Deterministic ranking formula:** `score = w1·text_relevance + w2·merchant_trust + w3·offer_freshness + w4·price_completeness`. No LLM in path (Rule 16).

### 2.2 SEO & crawler layer (new: `apps/core/seo.py`, sitemap views)
- `robots.txt` route with explicit allow/disallow and sitemap pointer.
- Sitemap index + segmented sitemaps: products, merchants, markets, static pages — chunked at 10k URLs per file, generated from DB with `lastmod`.
- JSON-LD structured data injected on:
  - Product detail → `Product` + `Offer` (+ `AggregateOffer` when multiple sellers)
  - Merchant detail → `LocalBusiness` / `Store`
  - Market detail → `ShoppingCenter`
  - Search page → `SearchResultsPage` + `ItemList`
- Canonical URL + OpenGraph/Twitter meta tags via template partial included in `base.html`.

### 2.3 Performance & caching layer
- Per-view caching with short TTLs using Django's cache framework (LocMem default, Redis in prod via existing `REDIS_URL`):
  - Homepage: 60s · Search: 30s · Directories: 300s · Live-search fragments: 60s
- `Vary` headers correct for query-string-driven views (cache key includes normalized query params).
- Template fragment caching on hot blocks (stats ticker, top brands).
- DB hardening: `select_related`/`prefetch_related` everywhere N+1 existed (search results, merchant lists, product offers).

### 2.4 Reliability & governance endpoints
- `/healthz/` (liveness) and `/readyz/` (readiness incl. DB + cache ping) for Dokploy/K8s probes.
- DRF throttling: `AnonRateThrottle` (60/min) and `ScopedRateThrottle` on search/assistant (30/min) — satisfies constitution rule 9's throttling requirement for public surfaces.
- Structured request logging middleware adding `X-Request-ID` for trace correlation.

### 2.5 Modern PWA front-end baseline
- `manifest.webmanifest` served from Django with theme colors, maskable icons.
- Meta upgrades in `base.html`: `theme-color`, description, OG/Twitter cards, canonical.
- Service-worker-ready structure (offline shell can be layered later without template churn).

### 2.6 Architecture decision record: retire `apps/web` (Next.js)
The Next.js app in `apps/web` violates the single-experience-plane principle of v8.1 Part III and creates two sources of UI truth. Recommendation: freeze it now, delete after the Django experience plane reaches parity. This repo keeps it untouched but marked deprecated in this document.

---

## 3. Competitive Gap Analysis vs Google (honest assessment)

| Capability | Google | Shoppage today | After this change | To truly compete |
|---|---|---|---|---|
| Ranked web-scale retrieval | ✅ | ❌ icontains | ✅ BM25 + facets | OpenSearch/Typesense cluster + embedding recall |
| Typo/semantic tolerance | ✅ | ❌ | ⚠️ trigram/fuzzy | pgvector embeddings + query rewriting |
| Freshness (stock/prices) | n/a | ⚠️ manual | ⚠️ unchanged | Celery beat sweeps + merchant SLA timers |
| Structured-data SEO | ✅ | ❌ | ✅ JSON-LD everywhere | Entity graph + Merchant Center feeds at scale |
| Speed (TTFB) | ✅ global CDN | ⚠️ uncached | ✅ cached views | CDN edge + static export of hot pages |
| Local commerce depth | ⚠️ weak in ZA townships | ✅ unique moat | ✅ preserved | Double down — this is the wedge Google lacks |

**Strategic verdict:** Shoppage cannot out-Google Google on general web search. It *can* win decisively on **evidence-backed local commerce intelligence in African trade corridors** (malls, taxi ranks, wholesale hubs, WhatsApp commerce) where Google Shopping has near-zero structured coverage. The modernization therefore prioritizes: (a) making the discovery layer technically credible, (b) making every entity machine-readable so Google itself becomes a traffic source, not just a competitor.

---

## 4. Next-phase roadmap (post-change-set)

1. **Celery + beat** for offer freshness sweeps, sitemap regeneration, trust score recalculation.
2. **Typesense indexing pipeline** (container already in compose) behind a `SearchBackend` interface so SQLite dev → Postgres FTS → Typesense are swappable.
3. **pgvector semantic recall** merged with lexical BM25 (hybrid RRF fusion) — still no LLM in basic path.
4. **Merchant OS v2**: real auth (phone OTP), draft approval workflows wired to `Draft` model, offer SLA countdowns.
5. **Observability**: OpenTelemetry traces, Prometheus metrics endpoint, Sentry.
6. **Edge caching** of product/merchant pages via CDN with tag-based invalidation on offer updates.
