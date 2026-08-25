# Zimbabwe offer acquisition strategy

## Current evidence

The global master layer is populated, but no global source can substitute for local seller observations. On 10 July 2026, the public Open Prices country endpoint reported Zimbabwe with zero locations and zero prices. Public Zimbabwe marketplaces and supermarket sites demonstrate that online catalogues exist, but a visible catalogue is not permission for bulk reuse.

## Acquisition order

1. Merchant-authorized CSV, JSON, API, SFTP or object-storage feeds.
2. Distributor and manufacturer catalogue agreements, including GTIN/MPN and branch availability.
3. POS and ecommerce platform connectors installed with merchant authorization.
4. Field, receipt and price-tag observations with explicit evidence and contributor terms.
5. Public pages only where terms, robots controls and applicable law permit the intended collection and reuse.

## Feed contract

`config/merchant_offer_feed_contract.json` defines the canonical observation grain and validation rules. `templates/merchant_offer_feed.csv` is the onboarding template. The ingestion script:

- validates required evidence, timestamps, currency, price and stock state;
- generates an idempotent observation identity;
- resolves checksum-valid GTINs to the global master database;
- preserves valid GTINs that are not yet in the master;
- sends missing or invalid identities to a review queue;
- keeps price and availability as time-varying offer observations.

## Partnership targets discovered, not scraped

Current web discovery identified active Zimbabwe-facing catalogues and platforms including SPAR Zimbabwe, Wabba and Vhazhu, plus retail/POS integrators. These are commercial partnership candidates. Their public pages are not treated as bulk-feed licences.

## Scale path to one million offers

One million offer observations is an operational volume target, not a one-time scrape. For example, 100 participating branches with 10,000 active SKUs each already represent one million branch-SKU observations at a single refresh. Daily or weekly snapshots create a much larger historical evidence graph while the master-product count stays lower through resolution.
