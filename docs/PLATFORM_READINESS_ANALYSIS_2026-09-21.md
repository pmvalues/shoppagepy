# Shoppage — Platform Readiness Analysis

**Document:** `docs/PLATFORM_READINESS_ANALYSIS_2026-09-21.md`
**Date:** 2026-09-21
**Runtime analysed:** working tree at commit `834d997` (branch `main`), Windows dev host
**Method:** read-only inspection of the running system — source, live HTTP responses, startup logs,
and direct reads of the shipped datasets. Every claim below carries its evidence.
**Companion document:** `docs/INVESTOR_READINESS_ROADMAP.md` (what to do, in what order, with gates)

---

## 0. Executive verdict

### What Shoppage actually is today

A **fast, well-built, single-tenant Go commerce demo with a genuinely good interface layer** — five
Go services (~28,100 lines), a compiled Templ/HTMX front end, a 34-module merchant back-office,
WebSocket chat, an AI assistant, SEO surfaces, a PWA manifest, and a 19 MB static binary that builds
and tests green.

It is **not yet a platform**, and **not yet fundable**, for five structural reasons:

1. **The live product serves 16 merchants and 181 products.** `GET /health` on the running server
   returns `{"merchants":16,"products":181}` while the interface advertises "1,000,000+ products"
   and the README advertises "74,000+ verified South African stores".
2. **The headline datasets are synthetic, not ingested.** The 3.1M "merchants" and 3,315 "malls"
   are produced by `random`-based Python scripts — including fabricated CIPC registration numbers,
   fabricated phone numbers, fabricated Google ratings and a fabricated `source_origin`. See §3.
   This is the highest-risk item in the repository and must be resolved before any investor,
   retailer or regulator sees the data.
3. **Nothing a user does is persisted, and nothing is authenticated.** Merchant back-office, POS
   register, banking settings, orders, posts and chat are all in-memory maps behind unauthenticated
   routes. `/desk`, `/orders`, `/settings`, `/audit-logs` are proxied publicly by the gateway with
   no session check at all.
4. **There is no money layer.** No billing, no entitlement enforcement, no tenant identity, no
   payment integration in the live stack. The business model is documented, not implemented.
5. **There is no measurement.** No analytics, no event log, no metrics endpoint, no funnel. A round
   cannot be raised on a product that cannot produce one defensible number.

### What is genuinely good — and genuinely defensible

- **Real, rights-clean, non-replicable work exists:** the 1,000,000-record canonical product master
  (Open Food Facts-derived), the 93,021 real offer discoveries, the Zimbabwe place/market graph
  (GeoNames + OSM), and — most importantly — **the evidence and review discipline itself**
  (source, licence, predicate scope, review state, unresolved conflicts) documented in
  `Shoppage-Implementation-Progress-Report-2026-07-10.md`. That methodology is the moat; the
  synthetic fillers are the liability.
- **Engineering velocity is real:** five services, working build, working tests, working Dockerfile,
  working Caddy config, and differentiated product depth (buybox, volume tiers, RFQ, storefront
  mirroring, embeddable catalogue, Google Merchant Center and Meta feeds).
- **The unit-economics hypothesis is sound and unusually honest**
  (`analysis/shoppage_viability_model_inputs.md`): 0% take-rate and zero payment custody,
  USD19/month Growth tier, break-even 310–929 paying merchants, activation-cost payback modelled at
  1.9–4.3 months.

### The blunt read

This repository currently holds **two competing narratives**: a truthful, evidence-obsessed data
methodology project, and a synthetic-scale marketing story. The first is investable. The second
fails technical due diligence within the first hour and cannot be fixed by shipping more features.
§4 lists 22 verified gaps; `docs/INVESTOR_READINESS_ROADMAP.md` sequences the fix.

---

## 1. Method and evidence base

Executed against the live system and datasets on 2026-09-21:

```text
go version                                          -> go1.27.0 windows/amd64
npm test                                            -> exit 0 (5 Go packages ok)
npm run build                                       -> exit 0 (bin/shoppage.exe, 19.1 MB)
go run ./services/consumer-web/cmd/server/main.go    -> serving :3000, startup log captured
GET http://localhost:3000/health                     -> 200, JSON payload captured (§2)
GET http://localhost:3000/search?q=solar             -> 200, 55,576 bytes, 362 ms
GET http://localhost:3000/desk                       -> 200, 93,776 bytes (unauthenticated back-office)
python tmp/check_db3.py                              -> dataset provenance + schema (§3)
```

Supporting artefacts (local, gitignored): `tmp/run_out.log`, `tmp/check_db.py`, `tmp/check_db2.py`,
`tmp/check_db3.py`.

Runtime truth was established by **reading the code and the wire**, not the documentation. That
distinction matters here: most of the markdown in the repository root describes a **different,
archived TypeScript/Next.js system** (gaps G-17 to G-20).

---

## 2. Verified runtime truth table

| # | Claim made somewhere | Where it is claimed | Verified reality (2026-09-21) | Evidence |
|---|---|---|---|---|
| 1 | "Pre-loaded with 74,000+ verified South African stores" | `README.md:4` | Serving **16** merchants | `/health` → `merchants:16`; `services/consumer-web/data/merchants.json` = 16 records |
| 2 | "1,000,000+ GS1 canonical products" | `README.md:4`; `home.templ:27,409`; `search.templ:218` | Serving **181** products, 24 of them using Unsplash stock photos | `/health` → `products:181`; `products.json` |
| 3 | "3,315 geofenced shopping malls" | `README.md`; `location.templ:53` | 3,315 rows but only 3,310 unique names, **generated** from suburb lists; 1,017 tagged `neighborhood_convenience_centre` | `scripts/ingestion/shoppage_build_sa_all_malls.py:259-274`; `tmp/check_db3.py` |
| 4 | "3.1M nationwide registered merchants" | `README.md:39`; store startup log | 3.1M rows exist but are **synthetic**, and only 3 SQL statements in the entire runtime read them | `scripts/ingestion/shoppage_ingest_all_sa_2_5m.py:261-405`; `store.go:589,987,1251` |
| 5 | "GS1 GTIN-13 canonical catalogue" | `DATA_RIGHTS_DISPOSITION.md:28` | Product master is **Open Food Facts**-derived (`off:` IDs, French names), not GS1-licensed | `tmp/check_db2.py` PRODUCTS sample |
| 6 | "244 passing monorepo tests (127 kernel, 96 web, 11 contracts…)" | `SHOPPAGE_PLATFORM_ARCHITECTURE_AND_SYSTEM_MODEL_v10.0.md:8,564` | Live stack has **39 test functions across 5 packages**; the 244-test suite belongs to the archived TypeScript app | `go test ./...` per module; `_test.go` inventory |
| 7 | "Tests: All Suites Passing"; `npm test`; `go test ./services/...` | `README.md:11,70-73` | `npm test` is green (exit 0). The README's raw Go alternative **fails**: `pattern ./services/...: directory prefix . does not contain modules listed in go.work` | command output |
| 8 | HMAC sessions, scrypt credentials, tenant isolation, dev-auth refused in production | `SECURITY.md:23-63,67-75` | None of it exists in the live Go runtime; all citations point at `apps/web/src/lib/auth.ts`, which is untracked local archive (`archive/` is in `.gitignore`) | `SECURITY.md`; `git ls-files 'archive/*'` = 0 |
| 9 | "All public surfaces are rate-limited" | `SECURITY.md:108-119` | No rate limiter exists in any Go service | `cmd/server/main.go` of all five services (chi core middleware only) |
| 10 | "Default-deny source rights register; read-path and AI-path enforcement" | `SECURITY.md:151-159`; `DATA_RIGHTS_DISPOSITION.md:86-93` | Register lives in the **archived** `packages/kernel/src/rights/register.ts`; the Go store never opens `sa_discovered_offers.sqlite` at all | `store.go:53-105` opens only 2 of 4 databases |
| 11 | "12-tab Merchant OS command center" | `README.md:91` | Runs and renders 34 module templates — for **one hardcoded demo tenant** with in-memory state | `services/merchant-os/internal/handlers/merchant.go:43-70` ("initializes demo data for Mitrend Products") |
| 12 | "System Health API — live telemetry" | `README.md:96` | Works and is honest: `{"deals":30,"malls":3315,"merchants":16,"products":181,"engine":"pure-go","status":"healthy","version":"1.23"}` | `/health` payload |
| 13 | "microsecond response times (<1ms)" | `README.md:18` | Measured 362 ms for `/search?q=solar`, 110 ms for `/search?q=cheese` (full page render over HTTP) | `Measure-Command` output |
| 14 | BuyBox comparison, "Instant EFT settlement", checkout, order tracking | templates; `consumer.go:987,1186` | Fully rendered, fully simulated; orders and posts live in maps and vanish on restart | no `INSERT`/`UPDATE`/`os.WriteFile` anywhere under `services/**/*.go` |
| 15 | "docker compose up -d --build" on a €4/month VPS | `README.md:104-117` | Build context carries **8.6 GB** of `*.sqlite` (`.dockerignore` excludes `*.sqlite3` and `*.zip`, **not** `*.sqlite`); those datasets are gitignored, so any clean checkout builds an image **without** them | `.dockerignore:30-37`; `Dockerfile:28,80`; `.gitignore` |
| 16 | CI builds and tests the platform | `.github/workflows/deploy.yml` | CI runs `npm ci && npm test && npm run build` with **no Go setup step**, no toolchain pin, and no Docker build | `.github/workflows/deploy.yml:25-51` |
| 17 | "Go 1.25+"; `go.work` = go 1.25.0 | `README.md:6`; `go.work:1` | Correct on this host (Go 1.27 satisfies it), but nothing pins or verifies it in CI or the Docker builder beyond `golang:1.25-alpine` | `Dockerfile:5` |
| 18 | Gateway is a "unified platform" | `main.go:156-201` | True. The gateway also proxies 22 merchant back-office route groups with zero authentication | `main.go:170-195` |
| 19 | CORS is restricted to first-party origins | `SECURITY.md:11`; `.env.example:11` | Live gateway sets `AllowedOrigins: ["*"]` **with** `AllowCredentials: true` | `main.go:68-75`; `merchant-os main.go:38-44` |
| 20 | Redis / Postgres / Typesense are part of the stack | `.env.example:23-42` | No Go service imports or contacts Postgres, Redis or Typesense; `docker-compose.yml` no longer runs them | `docker-compose.yml` (Go services only); `.env.example` is stale |

---

## 3. Dataset provenance register (the critical section)

Direct inspection of every dataset shipped with the repository:

| Dataset | Size | Rows | Provenance | Verdict |
|---|---|---|---|---|
| `global_food_master_products.sqlite` | 1,032 MB | 1,000,000 masters | **Real** — Open Food Facts derived (`off:000000000054`, "Limonade artisanale a la rose") | **Keep.** Usable as a reference layer under ODbL with attribution and share-alike handling |
| `sa_nationwide_merchants.sqlite` | 5,628 MB | ~3.1M (`swept_merchants`) | **Synthetic.** Names `f"{prefix} {suffix} ({suburb})"`; addresses from `random.randint(1,950)` + random street type; phones `+27` + random digits; `google_rating = random.uniform(4.1, 5.0)`; `google_reviews_count = random.randint(15,950)`; `cipc_number`, `csd_number`, `cidb_number`, `wireman_number`, `tax_pin`, `bbbee_level` generated; `source_origin` picked at random from a source list | **Quarantine.** Contains fabricated statutory identifiers attached to real brand names |
| `sa_malls_and_shopping_centres.sqlite` + `data/malls.json` | 3.2 MB / 1.8 MB | 3,315 | **Synthetic.** `f"{suburb} Mall"`, `f"{suburb} Shopping Centre"`, `f"{suburb} Crossing & Lifestyle Plaza"` over a hand-written suburb list; genuine centres (V&A Waterfront, Gateway, Canal Walk, Menlyn) mixed in | **Quarantine / rebuild from licensed sources** |
| `sa_discovered_offers.sqlite` | 105 MB | 93,021 | **Real** scrape of Takealot sitemaps (`source_origin: sitemap_harvest`), **price stored as `-1.0`**, status `discovered` | **Keep, but unusable as offers** — no price, no stock, no rights |
| `zimbabwe_place_market_nodes.csv`, `zimbabwe_places_geonames.csv` | 9.4 MB | 25,210 nodes | **Real** — GeoNames ZW extract + OSM, with per-edge review states | **Keep** — the strongest genuine data asset |
| `services/consumer-web/data/*.json` (live seed) | 560 KB | 16 merchants, 181 products, 183 posts, 30 deals, 4 shorts | **Demo content.** Invented records using real brand names ("Builders Warehouse Sandton Trade Counter", "Cashbuild Crown Mines Wholesalers", "AutoZone Commercial Parts Depot", "SunPower Solutions Crown Mines"), each marked `"verified": true`, with invented CIPC numbers and 4.9 ratings | **Quarantine before public traffic** |
| `mitrend_midrand_showroom` (157 products) | — | 157 | Merchant-authorised first-party catalogue | **Keep** — currently the only clean commercial dataset |

### Why this is the top risk, not a detail

1. **Fabricated statutory identifiers.** `cipc_number` values such as `2018/489102/07` are randomly
   generated. Publishing them — or displaying them in a "fully verified" merchant passport — is
   misrepresentation. Random 9-digit cell numbers under `+27` **will collide with real
   subscribers**, which turns a data-quality issue into a POPIA problem.
2. **Attribution to Google.** `google_rating` and `google_reviews_count` are random numbers stored
   under Google-branded column names. Google Places content cannot be redistributed or re-branded,
   and this is not Google Places content — it is invented.
3. **Real trademarks inside invented records.** The live seed presents well-known retail brands as
   Shoppage-verified sellers with fabricated ratings. Any one of those brands can act on sight.
4. **Due diligence failure.** A fund's technical DD runs precisely the queries in §1. Discovering
   that "3.1M merchants" means 3.1M randomly generated rows ends the conversation regardless of UI
   quality. **Disclosing it yourself, with a remediation plan, is survivable — and it is the only
   version of this that builds credibility.**

### The honest data position to adopt from today

> Shoppage owns a genuine, rights-governed evidence methodology and three real reference assets
> (1M Open Food Facts product masters, 93k discovered offers, a 25k-node Zimbabwe market graph).
> Its South African merchant and mall layers are **placeholder data awaiting licensed ingestion**,
> and are labelled as such in the product.

That statement is defensible in a data room. "3.1M verified merchants" is not.

### Additional data-quality findings worth recording

- 5 duplicate mall names (3,315 rows / 3,310 unique) indicate a de-duplication gap in the generator.
- 1,017 of 3,315 "malls" are `neighborhood_convenience_centre`; only 19 are `formal_mega_mall`.
  The dataset is not a mall register by any commercial definition.
- Only ~62% of product masters carry a brand and ~43% a category (from
  `Shoppage-Implementation-Progress-Report-2026-07-10.md`), so the product master is real but
  sparse.
- 883,674 of 1,000,000 product records are flagged as having one or more enrichment gaps — the
  platform's own reporting already describes them honestly; keep that discipline.

---

## 4. Gap register

**Severity:** `P0` = blocks any public launch · `P1` = blocks a funding round · `P2` = blocks scale.
Every gap was found by reading the running code; none are speculative.

| ID | Gap | Severity | Evidence |
|---|---|---|---|
| G-01 | Merchant back-office is publicly reachable and fully writable over the gateway | **P0** | `consumer-web/cmd/server/main.go:170-195` mounts `/desk`, `/merchant`, `/orders`, `/catalog`, `/inventory`, `/pos`, `/settings`, `/audit-logs` with no auth middleware |
| G-02 | Merchant OS itself has no authentication, authorisation or tenancy of any kind | **P0** | `merchant-os/cmd/server/main.go:29-127`; 60+ mutating `POST` routes (price change, banking, POS checkout) |
| G-03 | All state is in-memory; every order, product edit, post, chat and setting is lost on restart | **P0** | no `INSERT`/`UPDATE`/`os.WriteFile` under `services/**/*.go`; `store.go:20-51`, `merchant.go:43-70` |
| G-04 | Fabricated prices and stock shown as verified offers for long-tail searches | **P0** | `store.go:597-611`: `PriceZar: 49.99`, `InStock: true`, `Verified: true`, `Rating: 4.8`, Unsplash image, description "1,000,000+ Master Product Index" |
| G-05 | Synthetic merchant/mall datasets carrying fabricated CIPC numbers, phone numbers and Google ratings | **P0** | §3; `shoppage_ingest_all_sa_2_5m.py:261-405`, `shoppage_build_sa_all_malls.py:259-274` |
| G-06 | Public interface advertises scale the runtime does not have | **P0** | `home.templ:27,409`; `search.templ:218`; `location.templ:53`; `README.md:4,39` |
| G-07 | No rate limiting on any surface, including the paid AI endpoint and public `POST` endpoints | **P0** | all five `main.go` routers; `/api/assistant`, `/offer/submit`, `/feed/post` |
| G-08 | CORS `AllowedOrigins:["*"]` combined with `AllowCredentials:true` | **P0** | `consumer-web/main.go:68-75` |
| G-09 | Write endpoints accept unauthenticated, unvalidated, unthrottled submissions | **P0** | `consumer.go:161,780,933,987` (`/feed/post`, `/offer/submit`, review submit, instant checkout) |
| G-10 | No billing, entitlement or plan enforcement — "Launch Free (R0/mo)" is a string in demo state | **P1** | `merchant.go:65`; `UpdatePlan` mutates memory only |
| G-11 | No tenant identity: one hardcoded store, no users, no sessions, no audit trail | **P1** | `merchant.go:43-70` |
| G-12 | No analytics, event log, metrics endpoint or funnel — nothing measurable | **P1** | no analytics/metrics code in any service; chi `Logger` only |
| G-13 | Rights register, AI-use gating and dev-auth controls described in `SECURITY.md` exist only in archived TS code | **P1** | `SECURITY.md` citations vs `archive/` (untracked) |
| G-14 | Deployment artefact is broken by design: 8.6 GB dataset either inflates the image or is silently absent | **P1** | `.dockerignore:30-37`; `Dockerfile:28,80`; `.gitignore` excludes `shopping/data/study` |
| G-15 | CI does not build the Go binaries, does not run `go vet`/`go test` explicitly, does not build the image | **P1** | `.github/workflows/deploy.yml:25-51` |
| G-16 | No backups, no restore procedure, no monitoring, no alerting, no error tracking | **P1** | no backup/ops scripts; `SECURITY.md:143` lists error tracking as a known gap |
| G-17 | Live documentation describes an archived stack (Next.js/React/Postgres/Typesense) | **P1** | `SECURITY.md`, `docs/LAUNCH_READINESS_PLAN.md`, `docs/MODERNIZATION_ANALYSIS_2026-08.md`, `SHOPPAGE_PLATFORM_ARCHITECTURE_AND_SYSTEM_MODEL_v10.0.md` |
| G-18 | Test coverage is thin and uneven: 39 test functions; gateway, sweeper, search and store have almost none | **P1** | `_test.go` inventory: 31 merchant, 3 engine, 3 cleaner, 1 hub, 1 consumer |
| G-19 | No POPIA posture for personal data (random cell numbers, contacts, claim flow) | **P1** | `DATA_RIGHTS_DISPOSITION.md:107-120` (open item WS-2.5, never completed) |
| G-20 | No legal artefacts in the repo: no `LICENSE` file, no privacy policy, no terms, no PAIA manual | **P1** | `git ls-files` contains no `LICENSE` entry; README badge links a file that does not exist |
| G-21 | Sweeper engine is not scheduled and writes nothing; freshness is therefore a claim, not a mechanism | **P2** | `sweeper-engine/**` = 374 lines, no persistence, no cron |
| G-22 | Repo hygiene: 12 GB working directory, 600 MB zip artifacts in root, 442 TypeScript files from the retired stack still in `packages/` | **P2** | directory sizes; `git ls-files '*.ts'` = 94 tracked; `packages/*/package.json` v7.0.0 with `tsc`/`vitest` |

### Detail on the three gaps that matter most

**G-01/G-02 — the back-office is effectively a public admin panel.** `/desk` returns HTTP 200 with
93,776 bytes of merchant dashboard HTML to an anonymous curl, and every mutating route behind it
(`/settings/banking`, `/pos/checkout`, `/catalog/{id}/price`, `/inventory/{id}/adjust`,
`/settings/save`) is reachable. On a public host this is not "an unauthenticated demo"; it is an
open write surface that any scanner will find within hours of DNS being pointed at the server.

**G-04 — invented prices presented as real offers.** When local search finds nothing, the store
falls back to the 1M product master and decorates each hit with `PriceZar: 49.99`, `InStock: true`,
`Verified: true`, `Rating: 4.8` and a stock photograph. A buyer comparing "R49.99" against a real
shelf price has a grievance with Shoppage. The fix is to render a zero-price record honestly
("Price on request — no live offer yet") rather than to invent a number.

**G-14 — the deployment story does not survive contact with a clean checkout.** The Go services
read `FOUNDATION_DATA_DIR`; the datasets are gitignored; the Dockerfile `COPY`s a directory that in
CI does not exist. Three outcomes are possible today depending on the machine: a 9 GB image, a
failed build, or a running container quietly serving 181 products while the interface claims a
million. Only the third is dangerous, and it is the most likely.

---

## 5. The five missing pillars (what "a proper platform" means here)

| Pillar | Definition of done | Current state |
|---|---|---|
| **1. Identity & tenancy** | Users, sessions, roles (buyer / merchant staff / merchant owner / ops), every query scoped to a tenant, every mutation attributed | Absent. One hardcoded store, no user model, no session |
| **2. Durability** | Every order, catalogue edit, lead, chat message and audit event committed to storage; backup and restore rehearsed | Absent. Entirely in-memory; restart wipes state |
| **3. Money & entitlement** | Plans, subscription state, entitlement enforcement, and a payment provider integration with signature-verified webhooks | Absent. Plan is a display string |
| **4. Truth & rights** | Every published field traceable to a licensed source; unlicensed and placeholder data labelled as such; no invented price, rating or identifier | Absent in the live stack; the *methodology* for it exists in the data-foundation docs |
| **5. Observability & analytics** | Request metrics, error tracking, uptime probe, and a product-event funnel (search → offer view → contact → order) with a queryable event log | Absent |

A platform is not the sum of its pages; it is these five pillars with pages on top. Shoppage today
has the pages — a genuinely above-average set of them — and almost none of the pillars.

---

## 6. What a fund finds in the first two hours (ranked)

Ordered by how fast it damages the raise:

1. **"Where do the 3.1M merchants come from?"** Today: random generation. Fix: quarantine, re-label,
   and present the honest count of licensed, consented records.
2. **"Can I log into the merchant dashboard?"** Today: no login exists; the dashboard is open. Fix:
   auth + tenancy (Phase 1, item P1-1).
3. **"Where is a real completed order?"** Today: nowhere; orders are memory. Fix: persistence
   (Phase 1, item P1-2) plus one end-to-end pilot order.
4. **"What does a merchant pay you, and what have they paid?"** Today: nothing has ever been
   charged; billing is a string. Fix: billing module + first paying merchant.
5. **"Show me retention and funnel."** Today: no instrumentation exists. Fix: the metrics spec in
   the roadmap before the first pilot merchant is onboarded.
6. **"Who owns the code and the data?"** Today: no `LICENSE` file, no privacy policy, no assignment
   deeds, no data-supply agreements, and 94 tracked TypeScript files from a retired stack. Fix:
   legal pack and repo hygiene.
7. **"What about the retailer data you scraped?"** Today: the good-faith
   `docs/DATA_RIGHTS_DISPOSITION.md` exists, but the enforcement code it describes is not in the
   live stack. Fix: port the register to Go and the answer becomes a demonstration.

None of these are fatal. All of them are fatal **if discovered** rather than **disclosed**.

---

## 7. What is genuinely investable

Strip away the synthetic layers and a real thesis remains — and it is stronger than the inflated
version, because it survives scrutiny:

**The wedge.** Township, informal and wholesale trade in South Africa and the wider region is
digitally invisible: no catalogue, no price transparency, no structured presence, and near-zero
structured coverage from Google Shopping. Shoppage's differentiator is not listing scale; it is
**evidence-backed local commerce intelligence** — a record that states what is verified, by whom,
from which source, when, and under which review state.

**The asset that compounds.** The evidence graph plus the review workflow. Every merchant that
self-onboards adds first-party data no competitor can copy and no rightsholder can revoke. A
thousand consented merchants with real catalogues is worth more than three million fabricated rows,
and it is the only version that survives diligence.

**The economic shape.** 0% take-rate and zero payment custody (no PCI scope, no float risk),
subscription revenue (USD19/month Growth tier modelled), field-assisted activation, and a
capital-efficient pilot with modelled break-even at 310–929 paying merchants. Software margins with
a services-led go-to-market: precisely the shape an African SME-digitisation investor understands.

**The honest funding story.** *"We have a working platform, a rights-governed data methodology,
three real reference datasets, and we are asking for capital to run a 90-day pilot with a defined
cohort that will produce activation cost, paid conversion, retention and offer-freshness numbers we
can underwrite."* That is a fundable pre-seed/seed narrative. "We have 3.1M merchants" is not — it
invites a diligence process that will destroy the round.

**Non-negotiable pre-conditions for the raise:** the Phase 0 and Phase 1 exit gates in
`docs/INVESTOR_READINESS_ROADMAP.md`.

---

## 8. Immediate next 10 working days (task list)

| Day | Task | Deliverable | Acceptance |
|---|---|---|---|
| 1 | Quarantine synthetic data: remove the 3.1M merchant DB and generated mall file from the default runtime path behind an explicit `SHOPPAGE_DEMO_DATA=true` flag; label demo records as *illustrative* in the UI | `docs/DATA_SOURCES.md` + UI label | No synthetic CIPC number, phone number or Google rating is reachable from any public route |
| 1 | Truth-reset interface strings (`home.templ`, `search.templ`, `location.templ`) and `README.md` to verified counts | corrected copy | Rendered pages match `/health` |
| 2 | Remove fabricated offer decoration at `store.go:597-611`; render zero-price master hits as "no live offer" | code + test | A search with no local hits shows no invented price, stock or rating |
| 2–3 | Auth gate: session cookie and role guard for `/desk`, `/merchant/*` and ops routes; fail closed in production | middleware + tests | Anonymous `/desk` gets 401/302; a merchant sees only its own tenant |
| 3–4 | Rate limits and CORS tightening on `/api/assistant`, `/offer/submit`, `/feed/post`, `/chat/send` | middleware + tests | 429 with `Retry-After`; `AllowedOrigins` explicit |
| 4–6 | Persistence: SQLite (WAL) for orders, leads, catalogue edits, chat and audit log, with migrations and a backup script | `internal/db` package + `scripts/backup.sh` | Restart preserves state; restore rehearsed and logged |
| 6–7 | Analytics + metrics: `/metrics`, `/api/ops/ready`, product-event table, funnel query | instrumentation | Funnel query returns non-zero rows for a scripted journey |
| 7–8 | Billing: plan table, entitlement checks, one provider with signature-verified webhook (sandbox first) | billing module | Sandbox subscription toggles entitlement; replayed webhook rejected |
| 8–9 | CI/deploy: add Go setup, `go vet`, `go test`, image build; move datasets to release storage with checksum fetch; add health probe | workflow + deploy doc | CI green on a clean clone; container starts with datasets fetched by checksum |
| 9–10 | Investor pack v1: honest one-pager, KPI definitions, 90-day pilot plan, data-room index, risk register | roadmap Phase 4 artefacts | Every number in the pack reproducible from a named query |

---

## 9. Appendix — raw evidence

### A. Live health payload (2026-09-21)

```json
{"data":{"deals":30,"malls":3315,"merchants":16,"products":181},
 "engine":"pure-go","status":"healthy","version":"1.23"}
```

### B. Startup log (abridged)

```text
✓ [Store] Loaded 3315 nationwide malls from data\malls.json
✓ [Store] Loaded 30 retailer specials from data\deals.json
✓ [Store] Loaded 181 canonical products from data\products.json
✓ [Store] Loaded 16 merchants from data\merchants.json
✓ [Store] Loaded 183 social feed posts from data\posts.json
✓ [Store] Loaded 4 video shorts from data\shorts.json
✓ [Store] Connected live to 3.1M Merchants SQLite (…/sa_nationwide_merchants.sqlite)
✓ [Store] Connected live to 1.0M Products SQLite (…/global_food_master_products.sqlite)
```

### C. Service inventory

| Service | Go files | Lines | Test files | Notes |
|---|---:|---:|---:|---|
| `consumer-web` | 23 | 12,198 | 1 | gateway, consumer UI, AI assistant, SEO, PWA |
| `merchant-os` | 34 | 14,296 | 1 | 34 generated templ modules, single demo tenant |
| `search-core` | 5 | 656 | 1 | trigram index, seeded catalogue |
| `chat-gateway` | 6 | 621 | 1 | in-memory WebSocket hub |
| `sweeper-engine` | 5 | 374 | 1 | crawler pool + normalizer, unscheduled |
| **Total** | **73** | **28,145** | **5** | 39 test functions |

### D. Repository hygiene

```text
tracked files:            381
tracked Go files:         74
tracked TypeScript files: 94    (retired packages/*, v7.0.0, tsc + vitest)
tracked archive/ files:   0     (archive/apps_web is gitignored, local only)
.git size:                10.9 MB  (clean history — good news for diligence)
working directory size:   ~12 GB   (8.6 GB datasets + zips + 485 MB installer)
LICENSE file:             absent
```

### E. Contradiction map (documentation vs runtime)

| Document | Describes | Reality |
|---|---|---|
| `SECURITY.md` | Next.js HMAC sessions, scrypt, tenant isolation, rights register | archived TypeScript app; none of it in the Go runtime |
| `docs/LAUNCH_READINESS_PLAN.md` | 221 tests / 36 suites, Phase 1 complete | those suites are archived; its own recommended Phase 2 item (backups) is still unstarted |
| `docs/MODERNIZATION_ANALYSIS_2026-08.md` | Django 5.1 + HTMX + Postgres roadmap | superseded twice over |
| `SHOPPAGE_PLATFORM_ARCHITECTURE_AND_SYSTEM_MODEL_v10.0.md` | Next.js 16.3 "ACTIVE"; Postgres/Redis/Typesense provisioned | runtime is pure Go; those containers do not exist in `docker-compose.yml` |
| `README.md` | 74,000 stores, 1M products, €4/month deploy | 16 merchants, 181 products, image build broken by 8.6 GB dataset handling |
| `.env.example` | Postgres, Redis, Typesense, Payload, WhatsApp, Stripe/Paystack | no Go service reads any of these keys |

**Rule to adopt:** every document is either *current* (describes the Go runtime), *target* (clearly
marked as not built yet), or *historical* (moved to `docs/archive/`). Nothing at repository root
should be ambiguous, because investors read the root first.

---

*End of analysis. Sequencing, exit gates and the investor pack are in
`docs/INVESTOR_READINESS_ROADMAP.md`.*





