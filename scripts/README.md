# Shoppage Python Data Engineering & Sweeping Toolkit

This directory contains standalone, batch Python scripts for bulk public data ingestion, nationwide merchant sweeping, discovered offers scraping, and scale verification.

> **Architecture Note**: The production web application, search engine, merchant dashboard, and storefronts run 100% on **Next.js 14 + Payload CMS + `@shoppage/kernel` (Node.js)**. These Python scripts are offline data pipelines used to ingest, scrape, and build the underlying SQLite and JSON datasets.

---

## Environment Setup

Install the required Python data engineering dependencies:

```bash
pip install -r requirements.txt
```

---

## 1. Bulk Ingestion Pipelines (`scripts/ingestion/`)

| Script | Purpose |
| :--- | :--- |
| `shoppage_ingest_all_sa_2_5m.py` | Ingests 2.5 million South African business records from national registries. |
| `shoppage_ingest_full_public_scale.py` | Full-scale public registry ingestion pipeline. |
| `shoppage_ingest_public_registries.py` | Ingests CSD, CIDB, and CIPC enterprise databases. |
| `shoppage_inject_sa_products_catalog.py` | Ingests and seeds master products with GS1 GTINs into the SQLite catalog. |
| `shoppage_build_sa_all_malls.py` | Builds the nationwide database of South African shopping malls, centres, and markets. |
| `shoppage_link_all_merchants_to_markets.py` | Links physical merchants to trading nodes (Dragon City, Oriental Plaza, Sandton City, etc.). |
| `shoppage_stream_1m_products.py` | High-throughput memory-efficient streaming for 1M+ canonical products. |

---

## 2. Web Scrapers & Sweepers (`scripts/scrapers/`)

| Script | Purpose |
| :--- | :--- |
| `shoppage_sweep_sa_merchants.py` | Sweeps Google Maps, OpenStreetMap Overpass API, and public directories for local verified stores. |
| `shoppage_sweep_all_discovered_offers.py` | Sweeps external online retailers (Takealot, Makro, Builders, SunPower) to discover live market prices. |
| `shoppage_enrich_all_merchants.py` | Enriches merchant profiles with phone numbers, operating hours, and coordinates. |

---

## 3. Analytics & Index Verification (`scripts/analytics/`)

| Script | Purpose |
| :--- | :--- |
| `shoppage_evidence_analysis.py` | Evaluates evidence confidence scores and data provenance across catalog records. |
| `verify_3m_enrichment.py` | Audits and verifies quality metrics across 3M+ enriched attributes. |
| `verify_scale.py` | Benchmark query latency and index scale on SQLite FTS5 databases. |
| `optimize_indexes.py` | Rebuilds and vacuum-optimizes SQLite FTS5 full-text search indexes for production. |
