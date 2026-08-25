# Shoppage Commerce Intelligence: implementation progress report

## Executive summary

Shoppage now has a runnable, source-backed commerce-intelligence foundation rather than only a conceptual model. Three scale milestones are implemented and independently validated:

1. **Organisation discovery:** 6,101 source records, 5,281 distinct normalized names and 96.7% ISIC mapping coverage.
2. **Global master products:** exactly 1,000,000 unique product identities, 950,334 checksum-valid GTINs and 466,276 family keys in an indexed SQLite database.
3. **Zimbabwe place/market scaffold:** 25,210 nodes and 25,209 parent edges, including every 25,019-feature GeoNames record and 118 explicitly tagged marketplaces or malls.

The merchant-offer bridge is also implemented: a versioned partner-feed contract, an idempotent observation database, exact-GTIN resolution to the master catalogue, and a resolution review queue.

This is sufficient to begin building ingestion, matching, review and search services. It is not yet proof of 5,000 legally verified operating companies, one million Zimbabwe seller offers, or a complete official market hierarchy. Those are separate evidence and operations milestones.

## What is implemented

| Layer | Implemented result | Validation boundary |
|---|---:|---|
| Company/activity candidates | 6,101 records; 5,281 normalized names | Mixed organisations, branches, institutions and facilities; every record needs review |
| ISIC activity mapping | 5,899 mapped; 4,536 at four-digit level | Mapping describes source evidence, not verified current operations |
| Global product masters | 1,000,000 unique masters | Global reference only; no local seller, stock, price or availability claim |
| Valid GTINs | 950,334 | Checksum validity does not prove ownership or Zimbabwe sale |
| Product family keys | 466,276 | Navigational grouping, not interchangeability proof |
| Product enrichment queue | 883,674 records with one or more gaps | Missing fields remain visible; no silent imputation |
| Place/market graph | 25,210 nodes; 25,209 edges | GeoNames hierarchy is discovery scaffolding pending ZIMSTAT reconciliation |
| Explicit OSM markets/malls | 118 | Discovery records; current operating state unverified |
| Market-parent review queue | 118 | 1 critical, 21 high, 96 standard |
| Merchant-offer ingester acceptance | 3/3 expected paths passed | Synthetic acceptance fixture only; no production offers claimed |

## Key quality findings

- Product names are present on 98.66% of masters, valid structured feature JSON on 99.997%, normalized brands on 62.47%, and categories on 42.77%.
- The first product build deliberately failed at 999,995 stored rows after detecting five duplicate source codes. The corrected build counts unique source identities and passed at exactly 1,000,000.
- Every global product record is set to `not_observed` for Zimbabwe availability.
- Every place and market edge has a review state; no market-inside-market edge was invented from proximity.
- Of 118 proposed market parents, only five use an unambiguous exact source city-name match. The remaining 113 use nearest-settlement evidence and require review.
- The public Open Prices country endpoint reported Zimbabwe with zero locations and zero prices on 10 July 2026, confirming that local offer scale requires merchant, distributor, POS or field partnerships.

## Defensibility created

The defensible asset is the evidence graph and its operations loop, not a scraped directory. The current implementation preserves source, licence, predicate scope, timestamps, review state and unresolved conflicts. It separates:

- legal or regulated entity claims from current trading claims;
- organisations from branches and facilities;
- global product references from local offers;
- products from variants and seller listings;
- official geography from discovery scaffolding;
- geographic proximity from containment.

## Next implementation wave

1. **Zimbabwe offer acquisition:** secure merchant, distributor and manufacturer feeds; capture `(seller branch, seller product, master, market, observed_at, price, currency, stock state, evidence)`.
2. **Company resolution:** add CIPZ/official identity evidence where reuse is permitted, resolve branches to legal entities, and work the unresolved activity queue.
3. **Official geography:** reconcile the place scaffold to current ZIMSTAT boundaries and identifiers.
4. **Nested markets:** acquire municipal/operator registers and polygon or address evidence for market-in-market, building, section, store and stall containment.
5. **Master enrichment:** prioritize the 14 critical and 223,312 high-priority global food records, then add non-food verticals through rights-cleared standards and supplier feeds.
6. **Production services:** deploy idempotent ingestion, evidence APIs, matching workers, reviewer interfaces, freshness jobs, change history and search indexes.

## Source and licence notes

- [Open Food Facts API and data guidance](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) recommends bulk exports for work above a few hundred products and describes the ODbL/database-content boundary.
- [Open Food Facts documentation](https://openfoodfacts.github.io/openfoodfacts-python/usage/) describes the downloadable data formats.
- [RBZ microfinance institutions](https://rbz.co.zw/index.php/regulation-supervision/regulation-supervision/micro-finance-institutions) provides the regulator source for the dated MFI register.
- [ZERA liquid-fuels licensees](https://www.zera.co.zw/liquid-fuels-licensees/) provides the dated petroleum licensee source.
- [GeoNames Zimbabwe export](https://download.geonames.org/export/dump/ZW.zip) and [OpenStreetMap Zimbabwe extract](https://download.geofabrik.de/africa/zimbabwe.html) remain discovery sources subject to their respective licences.

## Decision

Proceed with Stage 1 implementation using this package as the evidence and schema foundation. Do not represent the current counts as a complete verified Zimbabwe commerce census. The next commercial dependency is rights-cleared local offer supply; the next public-data dependency is official administrative reconciliation.
