# Shoppage — National Commerce Intelligence Grid & Merchant OS

> **0% Take-Rate Distributed Commerce Infrastructure for Physical Retail & B2B Wholesale**  
> *Pre-loaded with 74,000+ verified South African stores, 3,296 geofenced shopping malls, and 1,000,000+ GS1 canonical products.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload_CMS-3.0-blue?style=flat)](https://payloadcms.com/)
[![SQLite FTS5](https://img.shields.io/badge/Search-SQLite_FTS5-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/fts5.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-117%20Passing%20(100%25)-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)
[![Security: Audited](https://img.shields.io/badge/Security-Hardened-success?style=flat)](SECURITY.md)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## 🏛️ System Architecture

Shoppage operates as a **single, unified TypeScript / Node.js runtime**, eliminating microservice serialization lag and delivering **sub-1ms in-process search latency** across nationwide merchant indexes and catalog graphs.

`mermaid
flowchart TD
    subgraph UI_Layer["1. User & Merchant Surfaces (Next.js 16 App Router)"]
        A1["Universal Search & Google Shopping Grid (/search)"]
        A2["7-Tab Merchant Digital Flagship (/m/[id])"]
        A3["WooCommerce Merchant Centre OS (/merchant/dashboard)"]
        A4["Platform SuperAdmin Governance (/admin/dashboard)"]
        A5["Buyer Sourcing RFQ Desk (/requests)"]
    end

    subgraph Core_Engine["2. In-Process Core Kernel (@shoppage/kernel & Payload CMS 3.0)"]
        B1["SQLite DatabaseSync + FTS5 (<1ms Search Engine)"]
        B2["GS1 GTIN-13 Canonical BuyBox Matrix"]
        B3["Google Product Taxonomy (5,000+ Nodes)"]
        B4["Payload CMS Multi-Tenant Document Store"]
        B5["Stage 6 Load-Shedding Solar Math Engine"]
    end

    subgraph Batch_Toolkit["3. Data Engineering & Scraper Toolkit (/scripts)"]
        C1["CIPC Registry & 2.5M Enterprise Scraper"]
        C2["Nationwide Mall & Market Geofence Ingestion"]
        C3["Live Retail Web Price Sweepers"]
    end

    UI_Layer --> Core_Engine
    Batch_Toolkit -. "Seeds & Updates Datasets" .-> Core_Engine
`

---

## 🚀 Quick Start & Testing

### Prerequisites
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher

### 1. Installation
Clone the repository and install all workspace dependencies:

`ash
git clone https://github.com/pmvalues/shoppagepy.git
cd shoppagepy
npm install
`

### 2. Run Test Suite
Execute the entire TypeScript test suite across @shoppage/kernel, @shoppage/contracts, @shoppage/adapters, @shoppage/eval, and @shoppage/web:

`ash
npm test
`
> **Test Coverage**: 117 tests across 25 suites verifying GS1 GTIN-13 check-digits, Google Merchant Center XML feeds, nationwide search latency, and AI overview intent parsing.

### 3. Run Development Server
Start the unified Next.js 16 web application with Payload CMS 3.0:

`ash
npm run dev
`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
Compile all TypeScript monorepo packages and generate the optimized Next.js production build:

`ash
npm run build
npm run start
`

---

## 🔑 Key Portals & URLs

| Portal | URL Path | Description |
| :--- | :--- | :--- |
| **Consumer Search & SERP** | [/](http://localhost:3000) & [/search](http://localhost:3000/search) | Universal omnibox search, Google Shopping 5-column grid, AI Knowledge Graph, and BuyBox price comparisons. |
| **Mitrend Flagship Showroom** | [/m/loc_mitrend_midrand](http://localhost:3000/m/loc_mitrend_midrand) | 157 live catering & packaging products, interactive live broadcast studio, 9:16 video shorts, and WhatsApp Quick Cart. |
| **Merchant Centre OS** | [/merchant/dashboard](http://localhost:3000/merchant/dashboard) | Full store operating system (product catalog, inventory, orders, customer CRM, and Google Shopping XML syndication). |
| **Platform SuperAdmin** | [/admin/dashboard](http://localhost:3000/admin/dashboard) | National telemetry across 74K stores, 1M+ catalog inspector, CIPC compliance audit queue, and store masquerade. |
| **Operations Admin (Payload)** | [/admin](http://localhost:3000/admin) | Payload CMS 3.0 Headless Admin for collection governance, merchant verification, and audit review. |
| **Buyer Wholesale RFQ** | [/requests](http://localhost:3000/requests) | Demand-first buyer RFQ portal broadcasting tenders to local verified suppliers. |
| **Malls & Trading Hubs** | [/malls](http://localhost:3000/malls) | Geofenced directory of 3,296 shopping centres and commercial hubs across all 9 provinces. |

---

## 💼 Commercial Model (0% Take-Rate + High-Margin Ads & SaaS)

Shoppage counter-positions against legacy marketplace toll-booths by charging **0% commission** on merchant transactions (zero take-rate on buyer-merchant trade). Transaction checkout occurs merchant-to-buyer directly (via WhatsApp Quick Cart, showroom visits, or direct store gateways). 

Platform income is generated through a high-margin dual monetization engine: **Digital Advertising & Sponsored Placements** and **Tiered Merchant OS SaaS Subscriptions**:

1. **Digital Advertising & Sponsored Discovery (Core Income Engine)**:
   * **Local Showroom Geo-Ads**: 25km radius geofenced keyword bidding driving walk-ins and local customer footfall.
   * **Sponsored SERP Top-Rail & BuyBox Boosts**: Cost-per-click (CPC) and impression bidding for prominent product search placement.
   * **9:16 Video Short Sponsored Discovery**: Video studio ad placements across consumer discovery feeds.
   * **Brand & Category Takeovers**: Co-op supplier and manufacturer brand sponsorships across 5,500+ category taxonomy nodes.
2. **Merchant OS SaaS Plans**:
   * **Free Starter (R0/month)**: 1 branch, standard search indexing, WhatsApp direct chat, basic Merchant Centre dashboard.
   * **Business (R199/month)**: Up to 3 branches, CIPC Verified Trust Badge, Google Merchant Center XML feed syndication, priority SERP placement.
   * **Business Pro (R499/month)**: Up to 10 branches, 9:16 video studio live broadcast, automated multi-channel inventory sync, priority BuyBox placement.
   * **Enterprise (Quote-based)**: Unlimited branches, multi-mall flagship syndication, wholesale RFQ tender desk, dedicated Key Account Manager, custom API integration.
3. **CIPC Verified Trust Seals**: Enterprise statutory compliance verification and priority SERP placement.
4. **Wholesale RFQ Match Fees**: Commercial procurement lead-matching fees for verified contractor tenders.

---

## 📂 Project Structure

```
.
├── apps/
│   └── web/                   # Next.js 16 App Router Web Application & Payload CMS 3.0
│       ├── src/app/           # 28 Production Pages and Route Handlers
│       ├── src/cms/           # Payload CMS 3.0 Collections & Typed Service
│       ├── src/components/    # Reusable UI Components (Omnibox, SERP, Studio)
│       └── src/lib/           # AI Intelligence Layer & Live Scraper Sweepers
├── packages/
│   ├── contracts/             # Shared TypeScript Domain Types & Interfaces
│   ├── kernel/                # Core In-Memory SQLite FTS5 Engine & Datasets
│   ├── adapters/              # External Ingestion & Feed Adapters (Google XML, WhatsApp)
│   └── eval/                  # Search Quality & Latency Benchmark Suite
├── scripts/                   # Standalone Python Data Ingestion & Sweeper Toolkit
│   ├── ingestion/             # 2.5M Enterprise & Mall Registry Ingestion
│   ├── scrapers/              # Retail Web Price Sweepers & Maps Scrapers
│   └── analytics/             # FTS5 Index Optimization & Quality Audits
├── .github/workflows/         # Automated Quality Gates & Deployment CI (117+ Tests)
├── SECURITY.md                # Security Policy, Responsible Disclosure & Transport Guardrails
└── Dockerfile                 # Production Container Definition
```

---

## 🏛️ Architecture Note: Single Runtime

Early platform versions (v1–v6) were prototyped in Python/Django. The entire data kernel, canonical GTIN check-digit resolution and operations admin were subsequently migrated to TypeScript to achieve **sub-1ms in-process search latency** and eliminate cross-service serialization.

The Django prototype has been **removed from this repository**. The runtime is 100% TypeScript/Node.js (Next.js 16 + Payload CMS 3.0), validated by the automated spec suite and hardened with standard HTTP security headers. Python survives only as a standalone data-engineering toolkit under `scripts/` (ingestion, scraping, index analytics) — it is not part of the web runtime.

---

## 🛡️ License

Copyright © 2026 Shoppage (Pty) Ltd. All rights reserved. Proprietary and Confidential.
