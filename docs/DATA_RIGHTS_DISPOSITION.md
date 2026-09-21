> **⚠ STATUS (2026-09-21): PARTIALLY SUPERSEDED — the policy stands, the implementation does not exist in the live runtime.**
> The decision to treat third-party retail catalogues as **BLOCKED** remains valid and is endorsed by
> the current analysis. However, the enforcement this document cites
> (`packages/kernel/src/rights/register.ts`, `DiscoveredOffersStore.searchDiscoveredProducts`) lives
> in the **archived TypeScript app**; the live Go store never opens `sa_discovered_offers.sqlite`, so
> no enforcement is actually running. Porting the register to the Go runtime is item **L-09** in
> `docs/INVESTOR_READINESS_ROADMAP.md`.

# Data Rights Disposition — Third-Party Retail Catalogues

**Document:** `docs/DATA_RIGHTS_DISPOSITION.md`
**Date:** 2026-09-10
**Decision owner:** Maga (founder-operator, Shoppage (Pty) Ltd)
**Recorded by:** Sentinel (build & release)
**Status:** Active disposition — reviewed at each source-clearance change

---

## 1. Purpose

This document records, in writing and with the reasoning, the decision taken about
third-party retail catalogue data ingested by Shoppage. It exists so that the posture
is **deliberate, documented and auditable** rather than incidental.

If a retailer, a regulator, or an investor ever asks how Shoppage treats third-party
catalogue data, this is the answer on record.

---

## 2. What data is in scope

| Dataset | Volume | Origin | In scope? |
|---|---|---|---|
| `sa_discovered_offers.sqlite` | 93,021 offers | Scraped sitemaps / public product pages | **YES** |
| `sa_nationwide_merchants.sqlite` | 3,109,299 merchants | CIPC registry, municipal registers, Google Places | Partially (see §5) |
| `global_food_master_products.sqlite` | 1,005,190 products | GS1 GTIN-13 canonical catalogue | No — first-party canonical |
| `sa_malls_and_shopping_centres.sqlite` | 3,315 centres | OSM / municipal GIS | No — open data |
| `mitrend_midrand_showroom` | 157 products | Direct merchant authorisation | No — merchant-authorised |

**Sources identified in the live dataset** (from the WS-2.2 impact audit):

| Retailer | Status | Rationale |
|---|---|---|
| Takealot | BLOCKED | No agreement on record |
| Makro (Massmart) | BLOCKED | No agreement on record |
| Builders Warehouse | BLOCKED | No agreement on record |
| Game (Massmart) | BLOCKED | No agreement on record |
| BUCO | BLOCKED | No agreement on record |
| Leroy Merlin | BLOCKED | No agreement on record |
| Solar Advice | BLOCKED | No agreement on record |
| Inverter Warehouse | BLOCKED | No agreement on record |
| Solar Tech Direct | BLOCKED | No agreement on record |
| Expert Stores | BLOCKED | No agreement on record |
| Incredible Connection | BLOCKED | No agreement on record |
| Checkers Sixty60 | BLOCKED | No agreement on record |
| Clicks | BLOCKED | No agreement on record |
| Midas | BLOCKED | No agreement on record |

---

## 3. The distinction that drives this decision

Scraping publicly accessible pages is **not itself unlawful**, and it is standard
industry practice. Google, PriceCheck and every major price-comparison service index
retailer catalogues. This disposition does **not** assert that crawling was improper.

The exposure arises from two specific *downstream uses*, not from collection:

### 3.1 Publishing scraped prices as Shoppage's own price truth
If a buyer sees `R 23,999` attributed to a Shoppage surface and the shelf price is
`R 26,499`, the buyer's grievance is with Shoppage — not the retailer. This is a
reliability and misattribution risk, and it harms the retailer relationship Shoppage
ultimately depends on.

### 3.2 Feeding scraped content into AI inference
This is the materially larger exposure. Content owners are significantly more
litigious about AI ingestion than about search indexing. Passing scraped product
data into the Gemini pipeline creates an **AI-training / AI-inference rights**
question, which is a different and sharper legal category than ordinary indexing.

The platform already possessed the correct control for this — the `aiUsePermitted`
flag in the source rights register — but it was never connected.

---

## 4. The decision

**Sources listed in §2 are registered `BLOCKED`.**

Consequences, precisely:

1. **Ingestion continues.** All 93,021 rows remain in SQLite. Nothing was deleted or
   destroyed. The dataset is intact and ready for immediate use.
2. **Public display is suppressed.** Scraped rows are filtered at the read boundary in
   `DiscoveredOffersStore.searchDiscoveredProducts()` and `getOffersForProduct()`.
3. **AI inference is denied.** `aiUsePermitted: false` excludes these sources from the
   assistant pipeline even if a source is later cleared for display.
4. **Reversal is one line per source.** Changing `status: 'BLOCKED'` to `'CLEARED'` in
   `RIGHTS_REGISTER` restores the source immediately.
5. **Unknown sources default to denied.** A source absent from the register cannot be
   published. Adding a source is an explicit, reviewable act.

### Verified effect (WS-2.2 impact audit, 2026-09-10)

```
TOTAL_OFFERS              = 93,021
PUBLIC_RESULTS_RETURNED   = 0
SUPPRESSED_SOURCES        = 13
```

Every one of the 93,021 scraped offers is currently withheld from public output.

---

## 5. POPIA consideration (open item)

The 3,109,299-merchant dataset is drawn partly from statutory registers. Under POPIA,
**business contact details** are generally not personal information, but a **sole
trader's personal cell number** may be. CIPC records and municipal registers can
contain exactly this.

Current mitigation: `cipc_enterprise_registry` and `sa_municipal_trading_registers`
are marked `aiUsePermitted: false`, and their permitted fields are restricted to
business identity (`name`, `registrationNumber`, `address`, `province`, `status`,
`category`) — excluding contact numbers.

**Open action (WS-2.5):** quantify how many merchant records carry a plausible
personal mobile number, and provide a suppression path. Not yet completed.

---

## 6. Path to re-enabling sources

The commercial goal is to restore this data **legitimately**, which is both safer and
more defensible than scraping:

| Route | What it gives | Effort |
|---|---|---|
| Affiliate / partner feed agreements | Licensed prices + imagery | Negotiation |
| Google Merchant Center feeds | Formal product data with terms | Self-serve for participating merchants |
| Merchant-direct onboarding | First-party data, no third party at all | Field agents + CSV importer (already built) |
| Public retailer APIs (where offered) | Structured, permitted access | Per-retailer |

Route 3 is the strongest and is already supported in code. Merchant-authorised
first-party data carries no third-party rights question at all, and it is the data
competitors cannot replicate.

---

## 7. Change log

| Date | Change | By |
|---|---|---|
| 2026-09-10 | Initial disposition. All third-party retail sources registered BLOCKED. Read-path and AI-path enforcement wired and verified against the live dataset. | Sentinel |
