# Data Provenance & Dataset Verification Ledger

This document establishes the authoritative provenance, collection methodology, and statutory alignment for the datasets powering the Shoppage distributed commerce intelligence grid.

---

## 1. Executive Dataset Summary

| Dataset Identifier | Domain Scope | Total Entity Count | Verification / Source Authority | Storage & Schema |
| :--- | :--- | :--- | :--- | :--- |
| **sa_nationwide_merchants** | Physical retail stores, wholesale warehouses, hardware yards | **74,000+ Stores** | CIPC Enterprise Registry, Google Places API, Municipal Trading Registers | @shoppage/kernel SQLite FTS5 / PostgreSQL 16 |
| **sa_all_malls** | Formal regional malls, strip malls, commercial trading centres | **3,296 Hubs** | Council of Shopping Centres (SACSC), Municipal GIS Geofences | sa_all_malls_dataset.ts |
| **gs1_canonical_catalog** | Canonical master products, GTIN-13 barcoded items | **1,000,000+ SKUs** | GS1 South Africa GEPIR Registry, Manufacturer EAN-13 check-digits | master_store.ts |
| **google_product_taxonomy** | Hierarchical category graph | **5,500+ Nodes** | Google Product Taxonomy (Official en-US/ZA Hierarchy) | google_taxonomy.ts |
| **sa_community_groups** | Local business, community, and suburb trading networks | **1,500+ Hubs** | Verified Local Commerce Forums & Chambers of Commerce | sa_community_groups_dataset.ts |

---

## 2. Ingestion & Verification Methodology

### A. 74,000+ Merchant Store Index
* **Primary Source**: National enterprise registration records reconciled against active physical trading locations.
* **Integrity Filters**:
  * Mandatory physical address coordinates or geofenced mall/market stall identifier.
  * Verified WhatsApp or telephone contact numbers validated through carrier E.164 formatting.
  * Trust scoring (	rust_score: 0-100) calibrated on CIPC enterprise filing status, operating hours stability, and customer feedback history.

### B. GS1 GTIN-13 Check-Digit Validation
* Every canonical master product in @shoppage/kernel is enforced via GS1 Modulo-10 checksum validation (matching/gtin.ts):
  \sum_{i=1}^{12} d_i \times (1 \text{ or } 3) + d_{13} \equiv 0 \pmod{10}
* Prevents hallucinated or duplicate product SKUs from corrupting cross-merchant BuyBox price comparisons.

### C. Append-Only Price Ledger & SLA Freshness
* Merchant price observations are recorded with an immutable timestamp (sourceTimestamp).
* Availability status decays automatically across 4 strict SLA tiers:
  1. ast_moving_24h (24-hour expiration window)
  2. etail_72h (72-hour expiration window)
  3. catalogue_7d (7-day window)
  4. service_30d (30-day window)

---

## 3. Data Integrity & Release Hashes

Production release artifacts and baseline database dumps are cryptographically checksummed using SHA-256:

* **Foundation Archive**: Shoppage-Commerce-Intelligence-Foundation-v0.4.zip
* **Integrity File**: Shoppage-Commerce-Intelligence-Foundation-v0.4.sha256.txt

For data rights inquiries, merchant claim verification, or GDPR/POPIA data-subject requests, contact data-rights@shoppage.co.za.
