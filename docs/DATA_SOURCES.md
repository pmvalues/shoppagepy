# Shoppage — Data Source Register

**Document:** `docs/DATA_SOURCES.md`
**Date:** 2026-09-21 · **Owner:** founder-operator
**Rule this register enforces:** a dataset is *published*, *reference-only*, *quarantined*, or
*blocked*. Nothing is published unless it appears here with a status that permits it.

Provenance was established by direct inspection of each file (see
`docs/PLATFORM_READINESS_ANALYSIS_2026-09-21.md` §3), not from documentation.

---

## 1. Status definitions

| Status | Meaning |
|---|---|
| **PUBLISHED** | May be shown to the public, with attribution where the licence requires it |
| **REFERENCE** | May be used internally for matching or enrichment; may not be presented as a live offer or as verified seller data |
| **QUARANTINED** | Not loaded by the runtime; held for audit or disposal; must not reach any public surface |
| **BLOCKED** | Rights do not permit publication or AI use until an agreement exists (see `docs/DATA_RIGHTS_DISPOSITION.md`) |

---

## 2. Register

| Dataset | Path | Source | Licence basis | AI use | Status | Notes / action |
|---|---|---|---|---|---|---|
| Canonical product masters (1,000,000) | `shoppage-commerce-intelligence-foundation/data/study/global_food_master_products.sqlite` | Open Food Facts bulk export (`off:` identifiers) | ODbL — attribution and share-alike obligations | Permitted (open licence) | **REFERENCE** | Must display OFD attribution wherever its data appears; may not be presented as local availability. ~62% brand / ~43% category coverage |
| Discovered retail offers (93,021) | `…/sa_discovered_offers.sqlite` | Scraped retailer sitemaps (`sitemap_harvest`, e.g. takealot.com) | **No agreement on record**; price field is `-1.0` (never captured) | Denied | **BLOCKED** | Cannot be published or fed to AI. Not read by the Go runtime today. Path to clearing: affiliate/partner agreement or Google Merchant Center feeds |
| South African merchant records (~3.1M) | `…/sa_nationwide_merchants.sqlite` | **Synthetic generator** (`scripts/ingestion/shoppage_ingest_all_sa_2_5m.py`) | No licence — generated content | Denied | **QUARANTINED** | Contains fabricated CIPC/CSD/CIDB/tax identifiers, random `+27` phone numbers, random Google ratings and a random `source_origin`. Must not be loaded in a public runtime. Decision required: delete, or rebuild from licensed registers |
| Mall / shopping-centre layer (3,315) | `data/malls.json`, `…/sa_malls_and_shopping_centres.sqlite` | **Synthetic generator** (`scripts/ingestion/shoppage_build_sa_all_malls.py`) over a hand-written suburb list; a small number of real centres mixed in | No licence — generated content | Denied | **QUARANTINED** | Must be labelled placeholder or rebuilt from OSM/municipal GIS with attribution |
| Zimbabwe place & market graph (25,210 nodes) | `…/data/study/zimbabwe_place_market_nodes.csv`, `…/data/reference/zimbabwe_places_geonames.csv` | GeoNames ZW export + OpenStreetMap extract | GeoNames CC-BY 4.0; OSM ODbL | Permitted with attribution | **REFERENCE** | Strongest genuine asset. Review states already recorded per edge |
| Demo seed content | `services/consumer-web/data/*.json` (16 merchants, 181 products, 183 posts, 30 deals, 4 shorts) | Hand-authored demo content using real brand names, Unsplash imagery | Unsplash licence for images; brand names used without permission | Denied for AI | **QUARANTINED** | Must be labelled "illustrative" or fictionalised before public traffic; real-brand records and invented CIPC numbers must be removed |
| Merchant-authorised catalogue (157 products) | `mitrend_midrand_showroom` | Direct merchant authorisation | First-party consent | Permitted | **PUBLISHED** (subject to merchant's own terms) | The only clean commercial dataset. Model for all future ingestion |
| Google-ratings fields inside any dataset | columns `google_rating`, `google_reviews_count` | Generated (not Google Places) | **No licence; misleading attribution** | Denied | **QUARANTINED** | Never render these fields. Do not label anything "Google rating" |

---

## 3. Rules that follow from this register

1. **Default deny.** A dataset absent from this register cannot be published.
2. **Provenance on the record.** Every published offer carries `source`, `observed_at`,
   `confidence` and `rights_status` (roadmap item P1-14).
3. **Attribution is a feature, not a footer.** OFD, GeoNames and OSM attribution must appear
   wherever their data is displayed.
4. **No synthetic identifiers in production.** CIPC, CSD, CIDB, VAT, tax-pin and phone fields may
   only be populated from a licensed register or from the merchant directly.
5. **Personal information.** Any contact field that can identify a natural person requires a
   lawful basis, a suppression path and a POPIA-compliant retention rule (roadmap item L-07).

---

## 4. Change log

| Date | Change |
|---|---|
| 2026-09-21 | Initial register. Synthetic merchant and mall layers moved to QUARANTINED; product masters and Zimbabwe graph confirmed as REFERENCE; scraped offers confirmed BLOCKED. |
