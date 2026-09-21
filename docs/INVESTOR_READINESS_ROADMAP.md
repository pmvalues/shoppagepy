# Shoppage — Investor Readiness Roadmap

**Document:** `docs/INVESTOR_READINESS_ROADMAP.md`
**Date:** 2026-09-21
**Owner:** Founder-operator (Maga) · **Prepared by:** platform analysis
**Basis:** `docs/PLATFORM_READINESS_ANALYSIS_2026-09-21.md` (verified findings, commit `834d997`)
**Status:** Proposed — awaiting founder decision on sequencing and scope

---

## 0. How to read this document

This roadmap answers one question: **what must become true, in what order, for Shoppage to be
(a) safely launched to the public and (b) fundable by a professional investor?**

Each work item carries an ID, a severity, the reason it exists, the change required, and a testable
acceptance criterion. Nothing here is aspirational: every item traces to a verified gap in the
analysis document (`G-nn`).

**Severity:** `P0` = blocks any public launch · `P1` = blocks a funding round · `P2` = blocks scale.

### The two definitions that govern everything

**"Launchable"** means: a member of the public can use the site safely, and a merchant who signs up
gets a durable account, an accurate record, and a working place to do business that does not lose
their data or expose someone else's.

**"Fundable"** means: an investor can verify every number in the pitch from a named query, find no
misrepresentation in the product or the data, and see a cohort of real merchants whose behaviour
produces the metrics the model depends on.

### The single decision that shapes the plan

Shoppage currently has **two assets and one liability**:

| Asset | Value |
|---|---|
| Working pure-Go platform (28,145 lines, 39 tests, builds in seconds, runs on a €4 VPS) | Speed to market, low burn |
| Rights-governed evidence methodology + three real datasets (1M product masters, 93k discovered offers, 25k Zimbabwe market nodes) | The moat investors buy |
| **Liability:** synthetic merchant/mall datasets presented as verified scale | Destroys the round if not cured first |

The plan therefore starts by **removing the liability**, not by adding features.

---

## 1. Phase 0 — Truth reset (P0) · target: 3 working days

Purpose: make it impossible for any external party to be misled by the product, the data or the
documentation. This phase costs almost nothing and converts the largest risk into a credibility
asset.

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **T-01** | Quarantine synthetic datasets | G-05 | Move `sa_nationwide_merchants.sqlite` and the generated mall dataset out of the default runtime path. Load them only when `SHOPPAGE_DEMO_DATA=true`. Remove `FOUNDATION_DATA_DIR` fallbacks that silently attach them | With no env flag set, the store logs no connection to either dataset and `/health` reports only real counts |
| **T-02** | Label placeholder records | G-05, G-06 | Every seed merchant/product/posting shown to a user carries a visible "illustrative demo record" badge; seeds for real retail brands (Builders Warehouse, Cashbuild, AutoZone, SunPower) are removed or clearly fictionalised | No page displays a fabricated CIPC number, phone number, Google rating or `verified: true` for a non-consented merchant |
| **T-03** | Correct the interface claims | G-06 | Replace "1,000,000+ products" and "3,315 Indexed Malls" strings in `home.templ`, `search.templ`, `location.templ` with live counts sourced from the store, or neutral copy | Rendered counts equal `/health` values |
| **T-04** | Correct `README.md` | G-06 | Rewrite the hero claim to the verified runtime; state clearly which datasets are real, which are placeholder, and what is not built | README contains no number that `/health` or a dataset query cannot reproduce |
| **T-05** | Publish `docs/DATA_SOURCES.md` | G-19 | One register per dataset: source, licence, permitted uses, current status (live / quarantined / reference-only), review owner | Every dataset in the repo appears in the register with a status |
| **T-06** | Mark stale documentation | G-17 | Add a status banner to `SECURITY.md`, `docs/LAUNCH_READINESS_PLAN.md`, `docs/MODERNIZATION_ANALYSIS_2026-08.md`, `docs/DATA_RIGHTS_DISPOSITION.md` and `SHOPPAGE_PLATFORM_ARCHITECTURE_AND_SYSTEM_MODEL_v10.0.md`, stating which runtime they describe | No root-level or `docs/` document describes a system other than the Go runtime without a banner |

**Phase 0 exit gate:** an investor can read the repository for one hour and reach only true
conclusions. No fabricated identifier, price, rating or scale claim is reachable from any public
route or document.

---

## 2. Phase 1 — Platform foundations (P0/P1) · target: 3–4 weeks

Purpose: turn the demo into a system that can hold real merchants' data safely. This is the work
that converts "impressive UI" into "software a business can depend on".

### 2.1 Identity, sessions and tenancy

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **P1-1** | Merchant authentication | G-01, G-02, G-11 | Phone/email + password (scrypt) or magic-link session; HMAC-signed HttpOnly cookie; login, logout, password reset; **fail closed** in production when no secret is configured | Anonymous `GET /desk`, `/orders`, `/settings`, `/audit-logs` returns 302 to login; authenticated merchant sees only its own store |
| **P1-2** | Role model and tenant scoping | G-02, G-11 | Roles: `buyer`, `merchant_staff`, `merchant_owner`, `ops`. Every store-scoped query filtered by tenant id derived from the session, never from the URL | Cross-tenant read/write returns 403; a regression test proves it |
| **P1-3** | Ops/admin surface separated | G-01 | Move operational views behind `/ops/*` with an ops-only guard and `x-admin-token` alternative for automation | Public internet cannot reach ops routes without a credential |
| **P1-4** | Audit log | G-11 | Append-only table recording actor, tenant, action, target, IP, timestamp for every mutation | Every state-changing endpoint writes exactly one audit row (test asserted) |

### 2.2 Durability and data integrity

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **P1-5** | Persistence for transactional state | G-03 | SQLite (WAL) via `modernc.org/sqlite` already in the module: tables for merchants, users, products, offers, orders, order_lines, leads/RFQs, chat_threads, chat_messages, audit_log, events. Versioned migrations on startup | Restart the binary mid-journey; the order, the catalogue edit and the chat message are all still there |
| **P1-6** | Real catalogue ownership | G-03, G-05 | Move `data/*.json` out of the code path into the database as seed *fixtures* loaded once, tagged `origin = fixture`, never mixed with merchant-authored records | A merchant's own product and a fixture product are distinguishable by a single column |
| **P1-7** | Backup and restore | G-16 | Nightly `sqlite3 .backup`-style snapshot plus a documented restore runbook; retention policy (7 daily / 4 weekly); restore rehearsed | A restore into a clean directory reproduces the state and the rehearsal is written in `docs/RUNBOOK.md` |
| **P1-8** | Health and readiness that mean something | G-16 | `/healthz` (process up) and `/readyz` (DB writable, fixtures loaded, upstream services reachable) | Readiness returns 503 when the database is unwritable (test asserted) |

### 2.3 Safety of public surfaces

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **P1-9** | Rate limiting | G-07 | Token-bucket per IP + per session on `/api/assistant`, `/offer/submit`, `/feed/post`, `/chat/send`, `/sell/register`, login | 429 with `Retry-After` after the configured burst (test asserted) |
| **P1-10** | CORS and headers | G-08 | Explicit origin allow-list; drop `AllowCredentials` with wildcard; add HSTS, `X-Content-Type-Options`, `X-Frame-Options`, CSP | `Access-Control-Allow-Origin` is never `*` on credentialed routes |
| **P1-11** | Input validation on all writes | G-09 | Schema validation, length caps, HTML escaping, spam honeypot on public forms; phone/email normalisation | Fuzz/abuse test: 100 malformed POSTs produce no 5xx and no stored garbage |
| **P1-12** | AI cost control | G-07 | Assistant requires a session or a signed short-lived token, has a per-session quota, caches identical prompts, and refuses when `GEMINI_API_KEY` is unset | Endpoint returns a clear 503 without a key, and 429 past quota (test asserted) |

### 2.4 Truth in the offer layer

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **P1-13** | No invented offer data | G-04 | Remove `PriceZar: 49.99`, `InStock: true`, `Verified: true`, `Rating: 4.8` and the stock photo from master-catalogue fallback hits; render "Price on request — no live offer yet" | A search with no live offers shows no price, no stock claim, no rating and no photograph attributed to a seller |
| **P1-14** | Offer provenance | G-04, G-13 | Every offer row carries `source`, `observed_at`, `confidence`, `rights_status`; UI shows "last observed {relative time}" | Every rendered offer traces to a row with provenance fields populated |

**Phase 1 exit gate:** two real merchants can be onboarded, sign in, upload a catalogue, receive a
buyer enquiry, and restart the server without losing anything — while an anonymous internet user
can reach no administrative function and sees no invented data anywhere.

---

## 3. Phase 2 — Launch (P0/P1) · target: 2–3 weeks after Phase 1

Purpose: put the platform on a real domain, under real traffic, with the operational and legal
furniture a business needs.

### 3.1 Deployment and operations

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **L-01** | Deployable artefact | G-14 | Split the image from the data: build a small image (no datasets), fetch datasets at start from release storage by checksum, or mount them as a volume. Add `*.sqlite` to `.dockerignore` | Clean-clone build produces an image under 200 MB and starts correctly with checksums verified |
| **L-02** | CI that actually gates the build | G-15 | Add `actions/setup-go` (1.25+), `go vet ./...`, `go test ./...` per module, and a container build step; keep gitleaks | A failing Go test fails CI |
| **L-03** | Environment validation | G-16 | Startup refuses to run in production with a missing `SHOPPAGE_AUTH_SECRET`, missing `SHOPPAGE_ADMIN_TOKEN`, wildcard CORS, or demo data enabled | Misconfigured process exits non-zero with a readable reason |
| **L-04** | Observability | G-12, G-16 | `/metrics` (request counts, latency histogram, error rate), structured access logs with request ids, uptime probe, and error alerting to the founder's phone | A synthetic 5xx is visible in the metrics and raises an alert |
| **L-05** | Runbook | G-16 | `docs/RUNBOOK.md`: deploy, roll back, rotate secrets, restore data, respond to each failure mode | A second person could operate the platform from the runbook alone |
| **L-06** | Two environments | G-16 | Staging and production with separate data and secrets; staging reachable only with basic auth | Deploy to staging, verify, then promote the same artefact |

### 3.2 Legal, POPIA and trust furniture

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **L-07** | POPIA compliance pack | G-19 | PAIA manual, privacy policy, information-officer registration with the Information Regulator, lawful-basis record per data category, data-subject request procedure, personal-number suppression path for any contact field | Published privacy policy + registered information officer; a data-subject deletion request can be executed in one documented procedure |
| **L-08** | Commercial terms | G-20 | `LICENSE` (proprietary), merchant terms of service, buyer terms, data-processing agreement (merchant as responsible party, Shoppage as operator), affiliate/referral disclosure | Every agreement a pilot merchant signs exists as a document in the data room |
| **L-09** | Rights enforcement in the live stack | G-13 | Port the source-rights register into Go: default deny, per-source status, `ai_use_permitted`, read-path and AI-path filters, with tests | An unregistered source cannot be published (test asserted); the disposition document becomes a demonstration rather than a description |
| **L-10** | Trust surfaces that are true | G-04, G-06 | Replace invented trust signals with verified ones: source of the record, last observation time, verification state, reviewer, and a "report an error" path | Every trust badge on screen is traceable to a stored fact |

### 3.3 Discovery and growth basics

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **L-11** | SEO that survives scrutiny | — | Sitemaps regenerated from the database, JSON-LD on product/merchant pages reflecting real availability, canonical tags, `robots.txt` | No structured data asserts availability or price for a record without a live offer |
| **L-12** | Merchant onboarding rehearsal | G-03, G-11 | End-to-end: register → verify → upload catalogue (CSV + manual) → publish → receive enquiry → respond | Completed twice by two different people without founder intervention |
| **L-13** | Buyer journey rehearsal | — | search → product → compare → contact/WhatsApp → lead recorded → merchant responds | Every step produces an event in the event table |

**Phase 2 exit gate:** the platform runs on the real domain with TLS, monitoring, backups and legal
pages; two rehearsals (merchant and buyer) pass; a scan of the public surface finds no
unauthenticated administrative route.

---

## 4. Phase 3 — Traction and proof (P1) · runs in parallel from Phase 1

Purpose: produce the numbers an investor underwrites. Nothing else in this document matters more:
a fund invests in measured behaviour, not in capability.

### 4.1 Instrumentation before onboarding

| ID | Item | Gap | Change required | Acceptance criterion |
|---|---|---|---|---|
| **M-01** | Event log | G-12 | Append-only `events` table: `event_name, actor_type, actor_id, tenant_id, session_id, path, referrer, city, province, props_json, created_at` | Every user-visible action writes exactly one event; the schema is documented |
| **M-02** | Definition-of-metrics document | G-12 | `docs/METRICS.md` with the exact SQL/query for each KPI in §4.3 so any number in the pitch is reproducible | An investor can run any pitch number against the database |
| **M-03** | Funnel query | G-12 | Materialised daily rollup view: sessions → searches → product views → offer views → contacts → leads → merchant responses | One query produces the 8-week funnel chart |

### 4.2 The pilot (the thing the raise pays for)

Target: **30–50 merchants across 2 defined areas** (e.g. one township/high-street cluster and one
wholesale hub), 90 days, founder-assisted onboarding, weekly measurement.

| ID | Item | Change required | Acceptance criterion |
|---|---|---|---|
| **M-04** | Cohort definition | Named list of 30–50 target merchants with contactable owner, category, location and baseline (has catalogue? WhatsApp? POS?) | Cohort table exists with a baseline per merchant |
| **M-05** | Onboarding protocol | Time-boxed script: consent + DPA signed, identity captured, catalogue captured (CSV/photo/manual), first 20 products published, WhatsApp/QR handover, training (15 min) | Median activation cost per merchant measured in rand and hours |
| **M-06** | Freshness loop | Sweeper scheduled (cron/systemd timer) to re-observe prices for onboarded merchants, writing `observed_at` per offer | Offer freshness (% observed in last 7 days) reported weekly |
| **M-07** | Buyer-side test | One paid or incentivised campaign per area (community groups, taxi-rank QR, WhatsApp broadcast) with a unique link per channel to measure cost per lead by channel | Cost per qualified lead by channel is known |
| **M-08** | Paid conversion test | Offer the Growth tier at USD19/month (or rand equivalent) to the cohort; measure trial→paid with a real payment link | Paid conversion rate measured on a real cohort, not modelled |
| **M-09** | Retention and churn | Weekly active merchant definition fixed in advance (e.g. ≥1 catalogue update or ≥1 buyer response per week) | 4-week and 8-week retention reported |
| **M-10** | Two case studies | One merchant where Shoppage-attributed revenue is documented (leads → quotes → orders), one where it failed, with the reason | Two signed case studies, one positive and one honest negative |

### 4.3 KPI definitions (fix these before the pilot, not after)

| KPI | Definition | Why an investor cares |
|---|---|---|
| **Activation cost (AC)** | Fully loaded field cost ÷ merchants activated (published catalogue with ≥20 real products) | Determines whether field-led growth is viable at all |
| **Paid conversion** | Paying merchants ÷ activated merchants, measured at day 30 and day 90 | Tests whether merchants will pay for the value |
| **Monthly contribution per payer** | ARPU × contribution margin (hosting + payments + support) | Sets break-even merchant count: modelled at 310–929 |
| **AC payback (months)** | AC ÷ monthly contribution per payer | Modelled 1.9–4.3 months; this is the core go/no-go number |
| **Offer freshness** | % of published offers observed in the last 7 days | The entire trust proposition rests on this |
| **Buyer→merchant contact rate** | Contacts ÷ sessions, by channel | Demand-side proof |
| **Merchant response rate / time** | % of leads answered; median response time | Service quality that justifies subscription |
| **Attributed merchant revenue** | Documented quotes/orders arising from Shoppage leads (self-reported + evidenced) | Turns a software pitch into a revenue-impact pitch |
| **Retention (W4/W8/W12)** | Weekly active merchants as defined in M-09 | Proves habit, not novelty |
| **Rights-clean coverage** | % of published records with a licensed or first-party source | Proves the moat is legal |

**Phase 3 exit gate:** a 90-day cohort producing AC, paid conversion, payback, retention and
freshness figures — with two case studies — and every figure reproducible from `docs/METRICS.md`.

---

## 5. Phase 4 — The raise (P1) · target: weeks 8–14

Purpose: convert a working, honest, measured platform into a defensible funding case.

### 5.1 The artefacts a fund will ask for

| ID | Artefact | Contents | Status |
|---|---|---|---|
| **F-01** | One-page truth sheet | What is built, what is live, what is not built, what is placeholder, what is licensed | To write in Phase 0 |
| **F-02** | Narrative deck (10–12 slides) | Problem (informal trade is invisible) → wedge (evidence-backed local commerce intelligence) → product demo → pilot results → unit economics → market → team → ask → use of funds | Needs pilot data |
| **F-03** | Financial model | Bottom-up: merchants activated per month × activation cost, paid conversion ramp, ARPU, contribution margin, fixed cost, cash runway, break-even merchant count, sensitivity on AC and conversion | Inputs exist (`analysis/shoppage_viability_model_inputs.md`); needs a live spreadsheet |
| **F-04** | Metrics pack | Every KPI in §4.3 with its query and its chart | Needs M-01…M-09 |
| **F-05** | Data-rights and privacy pack | `DATA_SOURCES.md`, rights register, POPIA policy, DPAs, OFD/ODbL attribution statement, disposal record for quarantined synthetic data | Phase 0 + L-07/L-08 |
| **F-06** | Technical DD pack | Architecture document describing the Go runtime **as built**, test inventory, CI evidence, backup/restore rehearsal log, security posture with known gaps listed honestly | Phase 1–2 output |
| **F-07** | Cap table and corporate pack | Shareholders, share classes, IP assignment from founder, company registration, tax clearance, bank confirmation, any prior convertible notes | Needs professional drafting |
| **F-08** | Risk register | Honest: data-rights risk, single-founder risk, the synthetic-data history and its remedy, dependence on Gemini, dependence on field execution | To write, and to keep visible |

### 5.2 Use of funds (illustrative shape, priced by the model)

| Bucket | Purpose |
|---|---|
| Field activation | Onboarding team and travel for the pilot cohorts — the largest variable cost |
| Product completion | The Phase 1–2 engineering in this document (auth, persistence, billing, observability) |
| Compliance and legal | POPIA, contracts, DPAs, company secretarial, IP assignment |
| Demand generation | Channel tests (community, QR, WhatsApp, radio) with per-channel cost tracking |
| Buffer | 3–6 months of runway beyond the plan |

### 5.3 Investor targeting (categories, not names)

1. **African SME-digitisation and impact funds** — mandate fit is exact: informal retail, digital and
   financial inclusion, measurable activation cost.
2. **South African angel networks and operator angels** — retail, logistics and payments operators
   bring capital *and* merchant introductions.
3. **Development finance institutions and innovation agencies** — matched grant or concessional
   capital for a pilot with a measurable inclusion outcome; often faster than equity at pilot stage.
4. **Strategic corporate investors** — wholesalers, FMCG distributors, mobile network operators and
   payment providers for whom merchant data and digital presence are strategic.

Fit test for all of them: they must accept a **pre-revenue, post-pilot** entry underwritten by
activation cost and payback — not by a directory of rows.

### 5.4 Milestone-based ask structure (recommended)

| Tranche | Milestone that unlocks it | Evidence required |
|---|---|---|
| Tranche 1 | Platform is launchable (Phase 0–2 exits met) and pilot cohort onboarded | Onboarding log, activation-cost measurement, first paying merchant |
| Tranche 2 | Pilot completes with payback under 6 months and paid conversion proven | 90-day KPI pack, two case studies |
| Tranche 3 | Repeatable playbook in a second area | Second cohort results comparable to the first |

This structure de-risks the round for the investor and protects the founder from a forced re-raise
at a worse price if the pilot runs slow.

---

## 6. Sequencing and gates

| Phase | Contents | Duration | Gate to exit |
|---|---|---|---|
| **0. Truth reset** | T-01…T-06 | 3 days | No public route or document can mislead; synthetic data quarantined and labelled |
| **1. Platform foundations** | P1-1…P1-14 | 3–4 weeks | Two real merchants onboarded, data durable, nothing invented, no anonymous admin access |
| **2. Launch** | L-01…L-13 | 2–3 weeks | Live domain, monitored, backed up, legally furnished, both rehearsals passed |
| **3. Traction and proof** | M-01…M-10 (parallel from Phase 1) | 90 days | Cohort KPIs measured and reproducible; two case studies |
| **4. The raise** | F-01…F-08 | Weeks 8–14 | Data room complete; every pitch number reproducible from `docs/METRICS.md` |

**Critical-path note:** Phase 3 is the longest pole and the only phase that cannot be compressed by
writing more code. Instrumentation (M-01) must therefore ship **before** the first merchant is
onboarded, or the first three months of pilot evidence is lost permanently.

---

## 7. Decisions required from the founder

1. **Sequencing** — approve Phase 0 now (3 days, no architectural change, removes the largest risk).
2. **Pilot geography and cohort** — which two areas, how many merchants, who performs the field work.
3. **Data disposition** — confirm the synthetic merchant and mall datasets move to quarantine, and
   confirm the 1M Open Food Facts master stays as a clearly labelled reference layer.
4. **Pricing** — confirm the pilot tier price (USD19/month modelled; a rand price must be set for
   local merchants).
5. **Retailer data** — confirm the scraped Takealot discoveries stay blocked until an agreement
   exists, and decide whether affiliate or Google Merchant Center feeds become the licensed route.
6. **Raise shape** — equity vs tranche structure, and whether a grant or DFI pilot grant runs in
   parallel to shorten the runway requirement.

---

## 8. What happens if none of this is done

| If Shoppage… | Then |
|---|---|
| Ships the current synthetic data publicly | Trademark and misrepresentation exposure from real brands and fabricated statutory numbers; POPIA exposure from random cell numbers that collide with real subscribers |
| Raises on current numbers | Technical DD establishes provenance in the first hour; the round dies and the founder's credibility with that investor network is spent |
| Scrapes more data instead of onboarding merchants | The moat stays a liability — unlicensed, unconsented, unverifiable, unmaintainable |
| Builds features instead of instrumentation | No pilot data, no metrics, no raise: the UI improves while the business stays unprovable |

The shortest credible path is the one above: **label the truth, secure the doors, persist the data,
measure the pilot, then raise on evidence.**

---

*Prepared from verified findings in `docs/PLATFORM_READINESS_ANALYSIS_2026-09-21.md`. No application
code was modified to produce either document.*





