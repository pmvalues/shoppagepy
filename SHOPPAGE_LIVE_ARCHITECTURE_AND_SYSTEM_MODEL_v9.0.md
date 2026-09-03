# SHOPPAGE v9.0 — LIVE PRODUCTION SYSTEM ARCHITECTURE & OPERATING MODEL

**Document:** `SHOPPAGE_LIVE_ARCHITECTURE_AND_SYSTEM_MODEL_v9.0.md`  
**Status:** Authoritative Production System Architecture & Technical Baseline  
**Supersedes:** `SHOPPAGE_GLOBAL_INVESTMENT_GRADE_MODEL_v8.1.md` (Constitutional Theory) and `v7.0`  
**Current Production Runtime:** Next.js 16.3 (App Router) + React 19 + Payload CMS 3.88 + SQLite DatabaseSync FTS5 + PostgreSQL 16 (pgvector) + Redis 7 + Typesense 26.0 + Google Gemini 3.6 Flash (Server-Side Agentic Intelligence)  
**Primary Jurisdiction:** Republic of South Africa (ZA)  
**Test Suite Verification:** 124 Tests Passing (100% Green across 5 monorepo packages)

---

## 0. Executive Summary: What Changed After v8.1

The **v8.1 Master Constitution** was drafted as an idealized specification proposing a complete rewrite into Django 6.x + Python 3.14 + HTMX + OpenSearch. While the business boundaries of v8.1 (such as 0% take-rate, zero custody of funds, and the Evidence Graph) remain strategically foundational, **the actual codebase evolved post-v8.1 into a high-performance, unified TypeScript/Node.js production engine**.

### Why the Post-v8.1 Evolution Succeeded in Code:
1. **Interactive Commerce UX:** African trade is dynamic, visual, and social. Implementing the Twitter/X-style **Shoppagetime** discovery timeline, interactive 9:16 Video Shorts, real-time Wholesale Trade Cart drawers, and instant filterable Google Shopping grids required seamless client reactivity that pure HTMX struggled to deliver cleanly without custom client-side glue.
2. **Sub-1ms In-Process Search:** Rather than maintaining a costly external OpenSearch cluster during early rollout, `@shoppage/kernel` implemented `node:sqlite` `DatabaseSync` with FTS5, querying **1,000,000+ canonical products and 74,000+ stores in under 1ms** directly within the Node process memory space.
3. **Grounded Gemini 3.6 Flash Integration:** Replaced static rules engines with a zero-hallucination, server-side LLM assistant running on Gemini 3.6 Flash with native tool-calling (`searchCatalog`, `getOffers`, `findStores`, `calcRuntime` for Eskom load-shedding, and `searchExternalLiveWeb`).
4. **Authentic South African Commercial Datasets:** Replaced theoretical placeholders with 3,296 geofenced malls, the Mitrend Midrand flagship showroom (157 live catering/packaging lines), and 121,000+ real retailer specials scraped from Takealot, Makro, Builders Warehouse, Leroy Merlin, and Solar Advice.
5. **Self-Bootstrapping Dokploy Deployment:** Built a multi-stage Docker container with automated bootstrapper (`scripts/fetch-production-data.mjs`) that pulls and inflates split SQLite datasets into persistent Docker volumes on container boot.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client_Surfaces["1. Frontend Presentation Layer (Next.js 16 App Router)"]
        UI_Feed["Shoppagetime Social Feed (/ & /time)"]
        UI_Search["Google Shopping 5-Column Grid (/search)"]
        UI_PDP["Canonical BuyBox Detail (/p/[id])"]
        UI_Store["Merchant Flagship Showroom (/m/[id])"]
        UI_RFQ["Wholesale RFQ Desk (/requests)"]
        UI_Cart["Trade Cart Drawer (Multi-Merchant WhatsApp)"]
        UI_Malls["3,296 Malls & Markets (/malls & /market/[id])"]
    end

    subgraph App_Core["2. Application Core & API Gateway (apps/web)"]
        API_Assoc["Grounded Gemini AI (/api/assistant)"]
        API_CMS["Payload CMS 3.88 & CSV Importer (/api/cms/*)"]
        API_Feeds["Google Merchant Center XML (/api/feeds/*)"]
        API_V1["REST V1 (Products, Merchants, Markets, RFQs)"]
        API_Link["Universal Link Redirector (/l/[id])"]
    end

    subgraph Kernel_Layer["3. In-Process Core Kernel (@shoppage/kernel)"]
        K_Master["MasterProductStore (1M+ GS1 GTIN-13)"]
        K_Merch["NationwideMerchantStore (74K Stores)"]
        K_Disc["DiscoveredOffersStore (121K Scraped Offers)"]
        K_Malls["SouthAfricaMallsStore (3,296 Malls)"]
        K_Rank["Hybrid Ranking & Candidate Matcher"]
        K_Tax["Google Product Taxonomy (5,000+ Nodes)"]
    end

    subgraph Persistence_Layer["4. Multi-Tier Data & Persistence"]
        DB_Sqlite["In-Process SQLite Datasets (FTS5 WAL Mode)"]
        DB_Pg["PostgreSQL 16 + pgvector (Long-term Authority)"]
        DB_Redis["Redis 7 (Session & Cache Broker)"]
        DB_Typesense["Typesense 26.0 (Fuzzy & Geo Search)"]
    end

    Client_Surfaces --> App_Core
    App_Core --> Kernel_Layer
    Kernel_Layer --> Persistence_Layer
```

---

## 2. Monorepo Structure & Package Anatomy

The platform is organized as a Turborepo-managed monorepo with 5 core workspaces:

```text
Shoppage Platform/
├── apps/
│   └── web/                                # Next.js 16 App Router + Payload CMS 3.88
│       ├── src/app/                        # 18 Application Routes & API Endpoints
│       ├── src/components/                 # 25+ Specialized React 19 UI Components
│       ├── src/lib/                        # Intelligence, LLM, Feed, CSV Import, Media
│       └── src/cms/                        # Payload CMS Service & SQLite Storage
│
├── packages/
│   ├── contracts/                          # TypeScript Domain Interfaces & Types
│   ├── kernel/                             # In-process Stores, Ranking, Seeds, Sweepers
│   ├── adapters/                           # External Services (WhatsApp, Typesense)
│   ├── eval/                               # Search & Intelligence Evaluation Harness
│   └── config/                             # Shared TypeScript & Tooling Configs
│
├── shoppage-commerce-intelligence-foundation/
│   └── data/study/                         # 5 Production SQLite Datasets
│
├── scripts/
│   ├── fetch-production-data.mjs           # Bootstrapper: seeds datasets on container launch
│   ├── scrapers/                           # Sitemap harvesters & retail price sweepers
│   └── ingestion/                          # SA mall & merchant catalog loaders
│
├── Dockerfile                              # Multi-stage production container
└── docker-compose.yml                      # Web, PostgreSQL, Redis, Typesense stack
```

### Workspace Responsibilities

| Package | Role | Key Exports / Modules |
| :--- | :--- | :--- |
| `@shoppage/contracts` | Canonical types & contracts | `MasterProduct`, `Merchant`, `Offer`, `DiscoveredOffer`, `ReferralActionEvent`, `TradeCart` |
| `@shoppage/kernel` | Core data engine & stores | `MasterProductStore`, `NationwideMerchantStore`, `DiscoveredOffersStore`, `SouthAfricaMallsStore`, `ranking`, `enrichment` |
| `@shoppage/adapters` | External protocol bridges | WhatsApp deep-link builder with attribution tokens, Typesense client |
| `@shoppage/eval` | Accuracy & regression tests | Search benchmark queries, GTIN conformance suites |
| `@shoppage/web` | Full-stack web application | Next.js 16 SSR/SSG/ISR, Payload CMS 3.88, Gemini LLM agent, UI components |

---

## 3. Core Feature Surfaces & User Journeys

### A. Shoppagetime Commercial Discovery Feed (`/` and `/time`)
* **Concept:** Adapts the Twitter/X social timeline into an authentic commercial discovery stream for South African trade.
* **5 Filter Tabs:**
  1. **For You:** Algorithmically ranked live offers, price drops, merchant restocks, and proof videos.
  2. **Products:** Instant filterable catalog with category chips (*Solar & Power, Phones & Tech, Packaging, Hardware, Automotive, FMCG*).
  3. **Deals:** Price-drop specials with historical percentage discounts.
  4. **Markets:** Directory of malls and wholesale centers with 1-tap "Follow" and "Favorite" (persisted in localStorage).
  5. **Shorts:** 9:16 vertical product teardowns, unboxings, and installation proof videos.
* **Interactive Post Cards (`FeedPost.tsx`):** Every post includes verified store badges, price tags, WhatsApp direct chat buttons, and social reaction counters (likes, reposts, bookmarks).

### B. The Universal Wholesale Trade Cart Drawer (`TradeCartDrawer.tsx`)
* **Problem Solved:** Overcomes the limitation of 1-item-at-a-time directory links without violating the 0% take-rate rule.
* **Capabilities:**
  - **Multi-Merchant Cart:** Buyers add inverters, cables, and packaging from different stalls to a single trade cart.
  - **1-Tap WhatsApp Checkout:** Formats the entire cart into a clean, numbered WhatsApp message:
    > *"Hello, I want to lock in this wholesale trade order via Shoppage:*  
    > *1. Deye 5kW Hybrid Inverter x2 — R 29,000*  
    > *2. JA Solar 550W Panel x10 — R 19,500*  
    > *Total Order Value: R 48,500*  
    > *Please confirm availability and collection/delivery options."*
  - **Formal Proforma Tax Invoice RFQ:** Automatically posts the cart to `/api/v1/requests` to request formal CIPC-compliant tax invoices for corporate buyers.

### C. Grounded Gemini 3.6 Flash Agentic Assistant (`/api/assistant`)
* **Engine (`apps/web/src/lib/llm.ts` & `intelligence.ts`):** Direct server-side integration over HTTP (no heavy SDK overhead).
* **System Directive:** Strict zero-hallucination policy. Must answer **ONLY** from tool results. Never invents prices, stock, or phone numbers.
* **5 Native Executable Tools:**
  1. `searchCatalog`: Searches the 1M+ GS1 product catalog with category and price filters.
  2. `getOffers`: Retrieves verified merchant prices and stockist details for a canonical product.
  3. `findStores`: Locates physical trade stores by name, keyword, or province.
  4. `calcRuntime`: Sizing engine that calculates load-shedding backup battery runtime in hours based on battery capacity (kWh) and household load (Watts).
  5. `searchExternalLiveWeb`: Live fallback scraper querying major South African retailers (Takealot, Makro, Builders) for 100% search coverage.

### D. Google Shopping Style Search Engine (`/search`)
* **Layout:** Full-width 5-column responsive grid modeled after Google Shopping.
* **Components:**
  - **Sponsored Carousel:** Featured promotional stockists with horizontal scrolling.
  - **BuyBox Multi-Seller Matrix:** Shows competing prices for the same GTIN across multiple stores.
  - **AI Overview Panel:** Real-time synthesis of product specs and compatibility.
  - **Local 3-Pack:** Geofenced nearby physical stores carrying the item.

### E. Mitrend Midrand Flagship Showroom (`/m/loc_mitrend_midrand`)
* **Live Implementation:** 157 authentic catering, bakery, and packaging products.
* **Features:** Tabbed catalog (Baking, Hot Foods, Packaging, Equipment), WhatsApp Quick-Cart, live streaming broadcast studio integration, and physical directions to Midrand Commercial Park.

### F. Nationwide Malls & Markets Directory (`/malls` & `/market/[id]`)
* **Data:** 3,296 geofenced South African shopping malls and commercial centers across all 9 provinces (Gauteng, Western Cape, KZN, Eastern Cape, etc.).
* **Features:** Interactive spatial map, mall tenant rosters, and store directory.

### G. Sourcing & RFQ Desk (`/requests`)
* **Functionality:** High-intent buyer request desk where contractors and buyers submit bills of quantities (BOQ), photos, or voice specs to receive competing quotes from verified local suppliers.

---

## 4. Ingest, Scraping & Discovered Offers Engine

The platform operates a hybrid dual-catalog engine:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE DUAL CATALOG ENGINE                  │
│                                                             │
│   1. Canonical Master Products (GS1 GTIN-13 Standards)      │
│      1,000,000+ items (EAN-13 check-digits, clean specs)    │
│                                                             │
│   2. Discovered Offers Store (Live Retail Specials)         │
│      121,000+ real URLs scraped from Takealot, Makro,       │
│      Builders, Leroy Merlin, Solar Advice, iStore           │
└─────────────────────────────────────────────────────────────┘
```

### High-Speed Sitemap Harvester (`scripts/scrapers/shoppage_harvest_vendor_sitemaps.py`)
* Asynchronously parses XML sitemaps from South Africa's top retailers.
* Extracts live product titles, SKUs, canonical URLs, and promotional prices.
* Populates `sa_discovered_offers.sqlite`, allowing Shoppage to show instant price comparisons between formal e-commerce retailers and local physical merchants.

---

## 5. CMS Loop & Bulk CSV Importer

To solve the merchant onboarding bottleneck:
* **Payload CMS 3.88 Integration (`apps/web/src/cms/service.ts`):**
  - Uses `node:sqlite` `DatabaseSync` to persist CMS documents (`sa_cms_documents.sqlite`) with high-speed in-memory caching.
  - Exposes headless document collections for merchants, products, media, and orders.
* **CSV Bulk Importer (`apps/web/src/lib/csv-import.ts`):**
  - RFC 4180-compliant streaming CSV parser with validation for South African phone numbers (`07x`, `08x`, `+27`), required provinces, and numerical prices.
  - Allows merchants and field agents to upload hundreds of products in seconds via `/admin/dashboard` or `/api/cms/import`.

---

## 6. The 5 Production SQLite Datasets

Data is partitioned into 5 high-speed SQLite databases running in WAL (Write-Ahead Logging) mode inside `shoppage-commerce-intelligence-foundation/data/study`:

| SQLite Database | Contents & Scale | Storage / Compression |
| :--- | :--- | :--- |
| **`sa_discovered_offers.sqlite`** | 121,000+ scraped live retailer offers & specials | Ingested via sitemap scrapers; zipped in releases |
| **`sa_malls_and_shopping_centres.sqlite`** | 3,296 geofenced malls with coordinates & tenant counts | Seeded from OSM & municipal spatial data |
| **`sa_nationwide_merchants.sqlite`** | 74,000+ verified South African stores & commercial entities | 8-part split zip archive (~200MB) |
| **`global_food_master_products.sqlite`** | 1,000,000 unique GS1 products with GTIN-13 check-digits | 3-part split zip archive (~150MB) |
| **`sa_cms_documents.sqlite`** | Dynamic user-imported merchants, products, and CMS state | Generated and persisted locally on Docker volume |

### Production Auto-Bootstrapper (`scripts/fetch-production-data.mjs`)
When running inside Docker:
1. Verifies if the 5 `.sqlite` files exist in the mounted volume.
2. If missing, automatically downloads split zip parts from GitHub release assets (`data-v1`).
3. Reassembles multi-part chunks, unzips them via `node:zlib` `inflateRawSync`, and initializes the databases.
4. Non-blocking: if network fails, gracefully falls back to bundled seed constants.

---

## 7. Security, Governance & Constitutional Compliance

Even with the evolution to Next.js 16, **the core constitutional safety guardrails of v8.1 are rigorously maintained**:

1. **0% Take-Rate / Zero-Custody Rule:** The platform never takes custody of buyer product payments, holds escrow, or manages delivery logistics. The Trade Cart generates WhatsApp chat strings or RFQ quote records—commercial transactions are completed directly with the merchant.
2. **Server-Side Secret Isolation:** The `GEMINI_API_KEY`, database credentials, and CMS secrets are strictly server-side (`apps/web/src/lib/llm.ts`). No client component ever has access to API keys.
3. **Evidence-Backed Claims:** The Gemini assistant's system prompt strictly prohibits hallucinating prices, stock levels, or physical addresses.
4. **POPIA Compliance:** Merchant phone numbers and contact details are limited to public commercial contact numbers; private personal information is excluded from public search endpoints.

---

## 8. Test Suite Verification & Quality Matrix

The current codebase is verified by **124 automated tests** across 5 workspaces:

```text
 ✓ @shoppage/contracts:  11 tests passed (100%)
 ✓ @shoppage/eval:        1 test passed (100%)
 ✓ @shoppage/adapters:    7 tests passed (100%)
 ✓ @shoppage/kernel:     82 tests passed (100%)
 ✓ @shoppage/web:        23 tests passed (100%)
────────────────────────────────────────────────────
 TOTAL:                 124 tests passed (100% Green)
```

### Critical Conformance Tests Verified:
- **GS1 GTIN-13 Check-Digit Conformance:** Verified via `gtin.test.ts`.
- **Sub-1ms FTS5 Search Latency:** 1M product index query benchmarks in `master_store.test.ts`.
- **Sitemap & Price Sweeper Integrity:** Discovered offers link generation verified in `discovered_offers.test.ts`.
- **Gemini LLM Error Handling:** Verified in `intelligence.test.ts` (rate limits map to retryable errors, auth failures fail fast).
- **CSV Bulk Import Conformance:** RFC 4180 quote escaping and phone normalization verified in `csv-import.test.ts`.

---

## 9. Production Deployment Topology

The application is deployed via Docker / Dokploy:

```yaml
# Summary of docker-compose.yml
services:
  web:
    build: .
    ports: ["3000:3000"]
    volumes:
      - foundation_data:/app/shoppage-commerce-intelligence-foundation/data/study
    environment:
      - NODE_ENV=production
      - GEMINI_MODEL=gemini-3.6-flash
      - DATABASE_URI=postgres://shoppage:pass@postgres:5432/shoppage_db
      - REDIS_URL=redis://:pass@redis:6379/0
      - TYPESENSE_URL=http://typesense:8108

  postgres:
    image: pgvector/pgvector:pg16
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  typesense:
    image: typesense/typesense:26.0
    volumes: [typesense_data:/data]
```

---

## 10. Summary & Version Sign-Off

Shoppage **v9.0** represents the transition from abstract constitutional theory into a **validated, high-performance, live-tested commercial grid**. By combining Next.js 16's responsive UI with in-process SQLite databases and grounded Gemini agentic intelligence, Shoppage provides South African buyers and merchants with sub-second price transparency, frictionless WhatsApp ordering, and zero transactional liability.
