# Shoppage Commerce Intelligence Foundation

This package starts the Shoppage Commerce Intelligence Graph as an evidence-backed implementation, not a bulk-listing exercise.

## What is implemented

- A PostgreSQL schema for organisations, activities, places, nested markets, master products, category taxonomies, attributes, offers, claims, provenance, matching candidates and coverage cells.
- Versioned global reference classifications: ISIC Rev. 5 for company activities and CPC 3.0 for goods and services.
- A Zimbabwe place discovery seed from GeoNames, with explicit warning that ZIMSTAT administrative boundaries must control official geography.
- Source acquisition plans for 5,000+ organisations and 1,000,000+ product offers.
- Entity-resolution and data-quality gates so records are not silently merged or promoted to verified truth.
- A source-backed Zimbabwe organisation study containing 6,101 candidate records, 5,281 distinct normalized names and explicit activity evidence.
- Reproducible ingestion for named OpenStreetMap commercial entities, the RBZ microfinance register, ZSE-listed anchors and ZERA petroleum licensees.
- A validated global food master seed containing 1,000,000 unique product identities, 950,334 checksum-valid GTINs and 466,276 product-family keys.
- A validated Zimbabwe place/market discovery graph with 25,210 nodes, 25,209 parent edges and 118 explicitly tagged marketplaces or malls.
- A versioned merchant-offer feed contract and idempotent ingester that resolves exact GTINs, preserves unmatched identifiers and creates a resolution review queue.

## Build the reference data

Run `scripts/build_shoppage_foundation.py` from the package's parent workspace. It downloads official/current reference files and creates:

- `data/reference/isic_rev5.csv`
- `data/reference/cpc_v3.csv`
- `data/reference/zimbabwe_places_geonames.csv`
- `data/seed/place_market_candidates.csv`
- `foundation_metrics.json`

Then build and validate the organisation study:

1. `scripts/ingest_osm_organisation_candidates.py`
2. `scripts/extract_rbz_mfi_register.py`
3. `scripts/ingest_zera_petroleum_licensees.py`
4. `scripts/build_organisation_study.py`
5. `scripts/validate_organisation_study.py`

Primary outputs:

- `data/study/zimbabwe_organisation_activity_study.csv`
- `quality/zimbabwe_organisation_activity_study_profile.json`
- `quality/organisation_study_validation.json`
- `data/seed/zera_petroleum_license_rows.csv`

Then build and validate the global food master seed from the official Open Food Facts full CSV export:

1. `scripts/download_with_ranges.py <export-url> <working-file> --provenance <provenance-json>`
2. `scripts/build_global_food_master_products.py <working-file> 1000000`
3. `scripts/validate_global_food_master_products.py`

Primary outputs:

- `data/study/global_food_master_products.sqlite`
- `quality/global_food_master_products_profile.json`
- `quality/global_food_master_products_validation.json`
- `docs/global_product_mastering_methodology.md`

Build and validate the place/market hierarchy:

1. `scripts/build_place_market_hierarchy.py`
2. `scripts/validate_place_market_hierarchy.py`

Primary outputs:

- `data/study/zimbabwe_place_market_nodes.csv`
- `data/study/zimbabwe_place_market_edges.csv`
- `data/review/place_market_parent_review_queue.csv`
- `quality/zimbabwe_place_market_hierarchy_profile.json`
- `quality/zimbabwe_place_market_hierarchy_validation.json`
- `docs/place_market_hierarchy_methodology.md`

## Important boundary

The global master seed and the Zimbabwe offer census are different layers. This package now proves that the master layer can hold one million distinct global references. It does **not** yet prove that one million Zimbabwe seller offers have been observed and resolved. Local listings, prices, currencies, stock states, branches, markets and observation dates must remain separate evidence records linked to a master product.

The package is a foundation seed. No entity becomes `verified` merely because it appears in a public directory, map, website, social page or model output.

OpenStreetMap-derived data requires OpenStreetMap contributor attribution and compliance with the Open Database License. Regulator and exchange records retain their dated, predicate-specific verification scope.

Product enrichment gaps are exposed through the `product_enrichment_review_queue` view in the SQLite product database. Missing fields are never silently imputed.

## Ingest a merchant-authorized offer feed

Start from `templates/merchant_offer_feed.csv` and comply with `config/merchant_offer_feed_contract.json`, then run:

`scripts/ingest_merchant_offer_feed.py <merchant-feed.csv>`

The resulting `data/study/zimbabwe_offer_observations.sqlite` stores time-varying seller/branch observations. Exact valid GTINs link to the global master; missing, invalid or unseen identifiers remain visible in `offer_resolution_review_queue`.
