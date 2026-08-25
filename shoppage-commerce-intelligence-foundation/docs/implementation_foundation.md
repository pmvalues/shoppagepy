# Shoppage commerce intelligence implementation foundation

## Executive decision

The attached investor edition is directionally coherent: Shoppage should be implemented as a commerce graph plus operating workflows, not as a generic listings site. The immediate technical priority is therefore canonical identity, provenance, classification, place hierarchy, product resolution and freshness. Search, ads, creators and market pages consume that foundation.

The requested scale is feasible only as an ingestion-and-resolution programme:

- **5,000+ Zimbabwe organisations:** create 8,000-12,000 discovery candidates from official lists, sector regulators, market rosters, directories, public business pages, websites, OpenStreetMap and partner feeds; resolve and verify at least 5,000 useful organisation nodes.
- **1,000,000+ products:** ingest at least one million raw offers/listings/SKUs; resolve them into a smaller set of product families, master products and variants; preserve merchant-specific offers, prices, availability and evidence separately.
- **Global enrichment:** map Shoppage categories to CPC 3.0 and, where licensing and applicability permit, GS1 GPC, UNSPSC, GTIN and GS1 attribute standards. Global attributes are candidates until category experts approve Zimbabwe-specific requirements.
- **Places and markets:** use ZIMSTAT administrative boundaries as the official hierarchy, then layer GeoNames/OSM discovery, manually verified commercial clusters, markets, malls, buildings, stalls, routes, pickup points and delivery zones. A market may be nested in another market through a versioned parent relationship.

## Canonical modelling decisions

1. **Separate entity, claim and evidence.** A company, place or product is a stable node. “Located at,” “sells,” “has stock,” “price is,” and “member of market” are versioned claims with source, observation time, confidence and verification state.
2. **Separate product from offer.** A master product describes what the item is. A variant describes a commercially meaningful configuration. An offer describes who sells it, where, price, currency, stock and validity.
3. **Separate organisation from location.** One organisation can operate many stores, branches, warehouses, stalls, service bases and pickup points.
4. **Use polyhierarchy deliberately.** A commercial cluster can sit inside a suburb, city and parent market; a product can map to a Shoppage navigation category, CPC, GPC and UNSPSC without forcing the schemes to share one tree.
5. **Human approval at merge boundaries.** High-confidence automation may classify or suggest matches, but ambiguous company/product/place merges enter a review queue.

## Company mapping programme

Classify each organisation by primary and secondary ISIC Rev. 5 activities, Shoppage commercial roles, operating model and served categories. “What they do” is not one text field; it is a set of evidenced activities with effective dates.

Minimum useful record:

- canonical name and aliases;
- organisation type and status;
- primary/secondary ISIC activity;
- Shoppage role: manufacturer, importer, distributor, wholesaler, retailer, service provider, informal seller, market operator, creator, logistics, payment, association;
- locations and service/delivery areas;
- categories, brands and representative products/services;
- contact/ownership claim scope, verification tier, source provenance and last review;
- discovery stage, catalogue stage, freshness, responsiveness and activation state.

Acquisition is staged: discovery → duplicate check → claim/consent → identity/location evidence → activity classification → catalogue sample → contact-path test → ongoing freshness.

## Product mastering programme

The resolver should process raw offers through:

1. source normalization and rights check;
2. title/brand/model/identifier extraction;
3. category classification against Shoppage + CPC/GPC/UNSPSC;
4. unit, pack, size, technical-attribute and condition normalization;
5. exact identifier matching (GTIN/MPN/ISBN/serial family where applicable);
6. deterministic candidate generation;
7. similarity scoring using title, brand, model and category-specific attributes;
8. automatic match only above a category-calibrated threshold;
9. review queue for ambiguous merges and creation of a new master when evidence supports it;
10. category-expert feedback and gold-set evaluation.

Do not merge these layers:

- product family: “hybrid solar inverter”;
- master product/model: specific manufacturer/model;
- variant: capacity, voltage, colour, pack, grade or condition configuration;
- offer: merchant, branch, price, stock, lead time and terms.

## Product enrichment policy

Each category owns an attribute template containing required, recommended and optional attributes, unit rules, allowed values, compatibility relationships, substitution rules, freshness window and safety/trust controls. Global standards provide a starting vocabulary; Zimbabwe category experts decide which attributes are commercially necessary.

The Home, Power and Building wedge should begin with solar/backup power, electrical, plumbing, hardware/tools, building materials, furniture/appliances and installation services because the investor edition already supplies category-specific conversion logic and these areas benefit strongly from compatibility, local stock, RFQs and diaspora demand.

## Place and nested-market model

Recommended hierarchy and graph:

`Zimbabwe → province/metropolitan province → district → city/town/growth point → suburb/locality → commercial cluster/market → building/section/aisle → store/stall/pickup point`

This is not a rigid single tree. Delivery zones, routes, service areas, seasonal markets and thematic online markets are graph overlays. `market.parent_market_id` enables market-in-market nesting while effective dates preserve moves and reorganisation.

## Data-quality gates

- **Identity:** canonical ID, normalized name, duplicates reviewed.
- **Completeness:** required fields per entity/category.
- **Provenance:** source rights, URL/document, timestamp and observation method.
- **Freshness:** category-specific confirmation window.
- **Consistency:** contradictory claims preserved and queued, never silently overwritten.
- **Integrity:** parent/child and organisation/location joins validated.
- **Trust:** verification scope is explicit; public-source or AI inference is never displayed as verified fact.
- **Coverage:** measure usable category × area cells, not raw record count.

## First 12-week implementation sequence

### Weeks 1-2: foundation

- Apply the database schema and load ISIC/CPC/place seeds.
- Confirm ZIMSTAT boundary access and company-registry search/export terms.
- Approve canonical IDs, claim predicates, source rights and review roles.
- Create gold sets for 500 company matches, 2,000 product matches and 300 place/market relationships.

### Weeks 3-4: ingestion

- Build source adapters and immutable raw snapshots.
- Ingest first official/regulated company cohorts and Harare commercial-place candidates.
- Ingest first merchant catalogues for solar, electrical, plumbing, hardware and building materials.

### Weeks 5-8: resolution and operations

- Ship company, product and place match queues.
- Add category templates, aliases, units, compatibility and offer freshness.
- Start field verification and merchant-claim workflow.
- Measure precision, recall, duplicate rate, orphan rate and review throughput.

### Weeks 9-12: dense launch graph

- Reach useful Harare category-area cells rather than chasing national vanity counts.
- Expose evidence/freshness labels to search and market pages.
- Connect leads, buyer requests, ads, creators and market pages to canonical entities.
- Publish coverage, trust, response and verified-commerce-outcome scorecards.

## What cannot be honestly claimed yet

- 5,000 companies have not been studied and verified merely from the attached document.
- One million product offers have not been supplied or lawfully acquired in this task.
- GeoNames is not a substitute for official Zimbabwe administrative boundaries.
- Global product standards do not provide a complete, freely reusable catalogue of every branded product and feature.
- Social-platform discovery requires terms-of-service, privacy, rights and merchant-confirmation controls.

These are acquisition dependencies, not reasons to delay implementation of the graph, schema, source plan and review system.
