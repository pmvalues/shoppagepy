**SHOPPAGE v5.0 — THE AMENDED MODEL**
**Product Intelligence, Local Commerce & Media Platform · Binding Business + Architecture Master**
Document status: v4.2 instantiates the v4.1 binding strategy into a complete, buildable system model. Monetisation is architecturally dormant (ads later); launch sequencing, gates and timelines are excluded from this document by instruction and live in a separate execution pack. Country-scoping is native throughout: Zimbabwe is the first jurisdiction instance; the South Africa formal/semi-formal instance is configuration, data and rights — not rearchitecture.

---


## AMENDMENT REGISTER — v4.2 → v5.0

This version incorporates the strategic decisions made after v4.2:

1. **Shoppage is elevated from a commerce-referral OS to a product-intelligence + local-commerce + media + platform ecosystem.**
2. **Google replacement is scoped to product-intent search**, not general web search.
3. **Facebook Groups becomes a strategic behavioural reference** for commerce-centric local communities.
4. **Markets-in-Markets and hyperlocal topology become first-class architecture primitives.**
5. **YouTube Shorts/Shows become first-class Frontstore discovery surfaces**, not an auxiliary marketing feature.
6. **Content becomes graph-native**: Shorts, Shows, episodes and guides attach to canonical products, offers, merchants and markets.
7. **Grok becomes a first-class AI provider adapter** for web/X intelligence, trend detection, research, search interpretation and content assistance, while remaining subordinate to Shoppage evidence/provenance.
8. **An open developer/agency ecosystem becomes a strategic end-state**, with APIs, SDKs/events and capability-scoped extensions designed into the architecture from the beginning.
9. **The existing Payload 3 + Next.js + plain-TypeScript kernel architecture remains the implementation baseline**, with public APIs isolated from Payload internals.
10. **No checkout/order/payment/settlement domain is added to core.**
11. **Reference-company patterns are explicitly bounded** so AI coding agents do not hallucinate foreign domain assumptions into Shoppage.


## PART I — DOCTRINE & BOUNDARIES

### 1. One-sentence model
Shoppage is a product-intelligence and local-commerce discovery network: it builds a canonical product/offer graph, a hyperlocal market-and-community graph, and a product-media graph; lets people search, compare, discover and follow products, markets, merchants, requests, Shorts and Shows; uses AI and real-time signals to improve discovery; and routes the user to the merchant, marketplace, retailer website, WhatsApp conversation, telephone, physical stall or partner checkout that can complete the transaction. The destination owns the sale. Shoppage owns the intelligence and discovery layer.

### 2. Category decision
Shoppage is a **product search engine + local commerce network + product media network + open discovery platform**. It is designed to replace Google for product-intent searches and, in commerce-centric contexts, replace Facebook Groups as the structured place where local buyers, sellers, requests and recommendations meet. It does not attempt to replace Google or Facebook generally. Marketplaces, retailer websites, informal merchants, social sellers, creators and physical markets are first-class destinations and supply partners. Fragmentation is an input to the model, not a competitor to defeat.

### 3. Strategic ambition — the three replacement behaviours

Shoppage deliberately combines three behaviours that are normally separated:

1. **Google-like product intent:** the user asks for a product, specification, brand, use case or need and receives structured product intelligence, current offers, local destinations, alternatives, content and actions.
2. **Facebook-Groups-like local commerce:** the user enters a geographic or community market and sees people, vendors, products, requests, recommendations, events and local signals in a structured commerce graph.
3. **YouTube-Shorts-like passive discovery:** the user can open the Frontstore and consume product-aware Shorts and Shows without first knowing what to search for.

The strategic synthesis is:

```text
Google Shopping      → product discovery
Facebook Groups      → community / local-market discovery
YouTube Shorts       → passive media discovery
Channel3-like graph  → product intelligence infrastructure
PriceRunner/ShopMania→ offer comparison + referral
Lyst                 → merchandising + visual discovery

                         ↓

                    SHOPPAGE GRAPH
                         ↓
       Product + Offer + Market + Community + Media
                         ↓
                 Search / Discover / Act
                         ↓
      Merchant / Website / WhatsApp / Physical destination
```

The target is not to clone any reference company. Reference companies are bounded learning sources for the AI builder; Shoppage's domain model remains authoritative.

### 3A. The core Shoppage flywheel

```text
More canonical products
        ↓
Better product search
        ↓
More product-intent users
        ↓
More markets / communities
        ↓
More vendors and offers
        ↓
More local demand signals
        ↓
Better ranking and recommendations
        ↓
Better Shorts / Shows / merchandising
        ↓
More discovery and referrals
        ↓
More vendors, creators, agencies and developers
        ↓
More data, coverage and utility
        └──────────────────────────────→
```

### 3B. Markets-in-Markets is a core primitive

A market is not merely a radius around coordinates. It is a first-class entity that may contain other commercial entities:

```text
Country
└── City
    └── Area / Neighbourhood
        ├── Shopping Centre
        │   ├── Store
        │   └── Store
        ├── Street Market
        │   ├── Zone
        │   │   └── Aisle
        │   │       └── Stall
        ├── Estate / Building
        │   └── Community businesses
        ├── School / Workplace community
        └── Online-local commerce community
```

Containment is evidence-governed. Proximity alone never creates a market-inside-market relationship.

### 3C. Frontstore doctrine

The public home/discovery surface is a **Frontstore**, not a conventional ecommerce storefront.

Primary entry modes:

- Search
- Shorts
- Shows
- Markets
- Nearby
- Trending
- Requests
- Saved needs
- Product collections
- Guides

The Frontstore may merchandise products, offers, markets, creators and content, but every commercial claim remains governed by provenance and freshness.

### 3. Non-negotiable boundaries (hard kill list)
1. No Cart, Order, Payment, Settlement, Delivery, Wallet, Inventory-custody or Warehouse domain — in schema, API or UI.
2. No claim that Shoppage sold, delivered, guaranteed or refunded anything.
3. No unauthorised crawling or scraping of groups, marketplaces, websites, images or feeds.
4. No AI-published offer without merchant confirmation or an authorised feed.
5. No derived currency conversions; source currency + source timestamp only.
6. No bidirectional sync without explicit field ownership and conflict rules.
7. No organic ranking input from payment or sponsorship fields; sponsored inventory is a separate, labelled, dormant module.
8. No default search experience dominated by reference-only products or unclaimed profiles.
9. No identity dependence on Facebook, WhatsApp, Google or TikTok; external IDs are attached records, never primary keys or recovery routes.
10. No unrestricted bulk export, public plugin marketplace or open intelligence API until extraction, privacy and competition controls pass review.
11. No publication of any ingested source before rights classification; every source defaults to BLOCKED.
12. No field-verification claim without a defined, stored, timestamped, auditable evidence predicate.

### 4. Independence doctrine
Canonical identity, web access, merchant maintenance, search, requests, saved needs, referrals and notifications must function with zero dependency on any external platform. External platforms are acquisition and communication adapters. Owned Demand Share — sessions originating from direct, QR, saved needs, notifications or referrals — is the model's independence measure.

---

## PART II — SYSTEM ARCHITECTURE

### 5. Pinned stack

| Layer | Selection |
|---|---|
| Application shell | Payload 3 (Next.js-native, App Router, React 19) — admin, collections, content, plumbing |
| Domain kernel | Plain TypeScript, framework-free (`packages/kernel`) |
| Language/runtime | TypeScript strict ≥5.5; Node LTS pinned in `.nvmrc` |
| ORM/migrations | Drizzle via Payload's DB instance — single migration authority |
| Database | PostgreSQL 16 (AWS af-south-1), PITR, pgvector |
| Search | Typesense behind an adapter interface; OpenSearch migration path preserved |
| Cache/queue | Redis 7 + BullMQ; idempotency keys on all partner webhooks |
| Storage/CDN | S3 af-south-1 + CloudFront; AVIF/WebP transforms; sensitive-uploads bucket isolated |
| AI gateway | Provider-agnostic adapter layer; model registry; per-request logging |
| Comms adapters | WhatsApp Cloud API (action rail), Africa's Talking (SMS/OTP), Postmark (email) |
| Flags | Unleash — cell scoping, experiments, dormant-module control |
| Observability | OpenTelemetry → Grafana Cloud; Sentry; 60s synthetic checks on Search + Universal Links |
| Repo/CI | pnpm + Turborepo; GitHub Actions; trunk-based; preview envs |
| Boundary enforcement | `eslint-plugin-boundaries` — kernel purity hard-fails CI |
| Testing | Vitest (unit/contract), Playwright (flows), eval harness |
| IaC | Terraform → af-south-1 |

Cost envelope: infrastructure remains a minor line of the operating cost; every managed vendor passes data-location, portability, export, termination and pricing-at-volume tests.

### 6. Six-rule architecture contract
1. **Kernel decoupling.** `packages/kernel` has zero imports from `payload`, `next`, `react`. Payload calls the kernel through ports; never the reverse. Kernel access to Payload collections happens only via a thin `collections-bridge` adapter.
2. **Moat assets in raw Drizzle tables**, not Payload collections: referral ledger, offer/price history, graph edges, entity-resolution candidates, demand events, audit log.
3. **Single migration authority.** Payload's Drizzle instance manages all tables in one migration history.
4. **Payload-managed collections** where free admin pays: merchants, branches, places, markets, productVariants, offers (current state), rightsSources, trustEvidence, claims, corrections, complaints, campaigns, creators, guides, pages, media, users.
5. **Universal Link resolver isolation.** Own route group, no admin middleware, edge-cacheable resolution metadata, separate error budget, p95 TTFB <150ms.
6. **Pinned versions + contract tests.** Any shell upgrade runs the contract suite before acceptance; rollback documented.

### 7. Repository layout

```
shoppage/
├── apps/
│   ├── web/                     # Next.js + Payload 3
│   │   ├── app/(public)/        # search, product, merchant, marketplace, market, request surfaces
│   │   ├── app/l/               # Universal Link resolver (isolated)
│   │   ├── app/api/v1/          # custom REST endpoints
│   │   ├── collections/         # Payload collection configs
│   │   └── payload.config.ts
│   └── workers/                 # BullMQ: feeds, lifecycle, freshness sweep, notifications, eval jobs
├── packages/
│   ├── kernel/
│   │   ├── offers/              # lifecycle + freshness state machine
│   │   ├── referrals/           # ledger writer, resolver logic, dedupe, confidence
│   │   ├── matching/            # entity resolution, request matching
│   │   ├── ranking/             # eligibility, feature stack, weight registry
│   │   ├── rights/              # default-BLOCKED enforcement, field permissions
│   │   ├── graph/               # edges, compatibility, containment
│   │   └── schema/              # Drizzle definitions for kernel tables
│   ├── adapters/                # search/, ai/, whatsapp/, sms/, email/, storage/, collections-bridge/
│   ├── contracts/               # OpenAPI + Zod schemas + event taxonomy
│   ├── eval/                    # fixtures, scorers, harness runner
│   └── config/                  # tsconfig, eslint, boundary rules
├── infra/                       # Terraform
├── docs/
│   ├── ARCHITECTURE.md          # condensed AI context
│   ├── PAYLOAD3_IDIOMS.md       # anti-hallucination: Payload 3 patterns; Payload-2 idioms forbidden
│   ├── DECISIONS/               # immutable ADRs
│   └── RUNBOOKS/
├── CLAUDE.md / .cursor/rules/   # agent instruction files
└── fixtures/                    # synthetic data only; rights-cleared partner data by explicit flag
```

### 8. Module map and responsibilities

| Module | Owns | Excluded |
|---|---|---|
| identity | OTP auth, staff MFA, RBAC scopes (branch/client/source), attached external identity records | Social-login primacy |
| organisations-places | Merchant, branch, place, market hierarchy, stall topology | Inferred stall claims from coordinates |
| catalogue | Canonical variants, aliases, compatibility edges, Reference Library | Seller prices in master |
| offers | Lifecycle, freshness state machine, history writes | Derived conversions |
| rights | Source Rights Register, default-BLOCKED, field permissions, suppression SLA | Post-hoc rights justification |
| feeds | Partner ingestion, raw/canonical separation, adapters, failure isolation | Partner-controlled ranking |
| search | Query normalisation, alias dictionaries, ranking feature stack, eval harness | Learning-to-rank before label sufficiency |
| requests | Structured needs, matching, broadcast controls | Unrestricted broadcasting |
| referrals | Universal Links, ledger, dedupe, confidence | Sale inference from clicks |
| trust | Predicate evidence, expiry, corrections, seal feed | Generic opaque badges |
| campaigns | Creator briefs, QR asset IDs, attribution standards | Outcome commissions before control sufficiency |
| analytics | Demand graph, zero-result queues, cohort aggregates, partner dashboards | Cross-partner confidential leakage |
| sponsored (dormant) | Labelled inventory schema, eligibility checks, separate candidate generator | Any organic-score influence |
| ops-console | Review queues for rights, resolution, claims, complaints, quality | Public exposure of queue internals |

### 9. Reliability & performance doctrine
Text-first first content <1.5s on representative low-end Android; compressed initial transfer <200KB for search results; search, contact, price, freshness, location and action buttons render before media; no installed app or buyer registration for discovery; offline queues preserve merchant updates and buyer requests; critical events queue and retry; feed failures isolate per partner; Search and Universal Links hold highest availability priority.

---

## PART III — COMMERCE INTELLIGENCE GRAPH

### 10. Entity model
Organisation · Merchant · Branch · Marketplace · Seller-on-Marketplace · Market · Zone/Building/Aisle/Cooperative · Stall · Place · Product Family · Variant · Offer · Service · Compatibility Edge · Request · Referral Event · Trust Evidence · Campaign · Outcome · Rights Source. Every claim carries the provenance block (§11). Canonical Shoppage IDs survive changes to phone numbers, social accounts, websites and marketplace listing IDs.

### 11. Provenance block (mandatory on every claim)

```ts
provenance {
  sourceRef        // RightsSource id
  rightsClass      // from Source Rights Register
  confidence       // field-specific, not source-global
  fieldOwner       // who is authoritative for this field
  validFrom / validTo
  reviewer?        // where human review occurred
}
```

Writes lacking the block fail validation. Conflicting claims from different sources coexist as separately attributed records; the system never silently overwrites (§45 doctrine).

### 12. Authoritative-field doctrine (field ownership)

| Field family | Owner |
|---|---|
| Legal identity, registration | Regulator/merchant document |
| Canonical product IDs, graph relationships, aliases | Shoppage |
| Current price and availability | Merchant or authorised feed |
| Editorial brand copy | Merchant website |
| Trust evidence, response history | Shoppage |
| Referral history and attribution | Shoppage |
| Seller governance, checkout terms, buyer protection | Marketplace partner |
| Market roster and topology | Operator records + field evidence + merchant claims (triangulated) |

### 13. Payload-managed collections (field-level)

```ts
ProductVariant {
  canonicalId: ulid; title; brand?; model?; identifiers[];      // GTIN/MPN/local
  category; attributes: jsonb; aliases[];                        // language pack per country
  compatibilityEdgeCount: int;                                   // derived
  status: draft|active|reference;                                // reference ⇒ no availability implication
  provenance                                                     // NO seller price in master
}

Offer {
  id: ulid; variantRef;
  destinationType: merchant|marketplace|retailer_site|stall|request_route;
  destinationRef; branchRef?; marketRef?; stallRef?;             // containment requires evidence
  price { amount?; currency; sourceTimestamp };                  // quote-required: amount null + label
  availabilityState: fresh|confirm_required|quote_required|expired|hidden;
  updateType: price_updated|stock_confirmed|merchant_active|feed_received;
  actionTarget: url|whatsapp_template|tel|directions|request;
  freshness { slaClass; expiresAt; lastConfirmedAt };
  sourceRef; rightsClass; confidence: jsonb;                     // per-field
  reviewState: auto_published|pending_review|rejected|suspended;
  confirmedBy?: userRef; authorizedFeedRef?: feedRef;            // one mandatory
  country: 'ZW'|'ZA'|...;
  provenance
}

Merchant { canonicalId; publicName; contacts[]; branches[]; destinationTypes[];
  claimState: candidate|claimed|disputed|offboarded; claimEvidence[]; country }

RightsSource {                                                     // default BLOCKED
  owner; accessMethod; rightsClass; publicDisplayFields[]; aiUsePermitted: bool;
  retentionDays; attributionRule; suppressionSla; terminationRule;
  status: BLOCKED|CLEARED|SUSPENDED|TERMINATED }

TrustEvidence { predicate; subjectRef; sourceRef; reviewer; verifiedAt; expiresAt; challengeState }

Request { need; quantity?; locationRef; urgency; contactConsent: bool;
  riskCategory; visibility: private|public_consented; status }

Marketplace { partnerId; sellerModel; checkoutTermsUrl; feedState;
  buyerProtection; deliveryScope; acceptedCurrencies[] }          // partner-level trust separate from seller

Market { name; boundary; landmarks; openingPatterns; rosterConfidence;
  categories[]; operatorContacts; safetyNotices; correctionPath }

+ branches, places, claims, corrections, complaints (severity), campaigns, creators,
  guides, pages, media, users
```

### 14. Kernel tables (raw Drizzle — the moat substrate)

```ts
referral_events (partitioned monthly, append-only) {
  eventId: uuidv7; occurredAt; sessionFingerprint; country;
  sourceCampaign?; sourceContent?; sourceAsset?;                   // QR asset IDs
  offerId?; variantId?; destinationType?;
  action: impression|comparison_view|outbound_click|whatsapp_start|call_reveal|
          directions_open|quote_submitted|reserve_intent|destination_ack|
          merchant_responded|destination_callback|buyer_resolved|purchase_confirmed;
  confidence: float; dedupeKey; payload: jsonb }                   // click ≠ sale, always

offer_state_history (partitioned, append-only) {
  offerId; state; price?; currency?; availability; updateType;
  observedAt; sourceRef; rightsClass }

graph_edges {
  fromEntity; toEntity;
  edgeType: compatibility|alias|containment|candidate_link|variant_of;
  evidence: jsonb; reviewState; confidence; createdBy; createdAt }

entity_candidates { leftRef; rightRef; confidence: float; signals: jsonb;
  reviewState: pending|merged|rejected|unmerged; reviewer?; resolvedAt? }

demand_events { query?; filters?; zeroResultReason?; savedNeedRef?; requestRef?;
  locationRef; categoryRef; urgency?; fulfilmentPreference?; occurredAt; country }

audit_events (append-only, trigger-protected) {
  actor; action; subjectType; subjectId; beforeHash; afterHash; occurredAt }

eval_runs { runId; gitSha; modelVersion; fixtureSet; scores: jsonb; gate: pass|fail }
```

### 15. Entity resolution mechanics
Deduplication across names, phones, addresses, coordinates, registration numbers, websites and source history. Outputs are candidate links with confidence and signals — never silent merges. High-impact merges route to human review queues. Merchants can unmerge incorrectly linked branches or organisations; unmerges are logged and preserve downstream history.

### 16. Master catalogue & Reference Library
The catalogue starts from the launch wedge's top demand entities, not decorative volume. A canonical variant holds brand, model, identifiers, specifications, rights-cleared images, units, aliases, compatibility and category attributes; merchant offers attach to variants. Ambiguous items remain families until evidence suffices. Reference products support query understanding, education and compatibility; they are labelled "reference — no current local offer confirmed" and excluded from active-offer, active-merchant and any future revenue metrics.

### 17. Source Rights Register mechanics
Every source enters the register before any processing; BLOCKED is the constructor default. The register records: owner, access method, contractual basis, public-display field permissions, AI-use permission, image/text rights, derivative-data rights, attribution rule, refresh cadence, retention, geographic scope, suppression procedure (24-hour urgent SLA, logged), termination rule. Technical accessibility is never legal permission. Every ingestion path calls `rights.check(sourceId, fields[], intendedUses[])` first.

### 18. Country scoping (replication-native)
Every entity carries `country`. Rights registers, alias dictionaries, language packs, payment-context labels, place topology and marketplace relationships are per-jurisdiction instances. Currency is stored as data (source currency + timestamp). The model instance for a new country reuses 100% of software and 0% of data.

---

## PART IV — CORE ENGINES

### 19. Offer lifecycle

```
received → validated → matched → [review if below threshold] → published
→ refreshed → outcome-monitored → demoted|expired|corrected|suspended|deleted
```

Validation: rights · schema · URL · media scan · prohibited products · destination reputation.
Matching: variant + branch with confidence; below threshold → human review queue.
Publication: source, freshness, destination type explicit.
Refresh: feed, merchant confirmation or authorised agent.
Outcome monitoring: unavailable / wrong-price / broken-destination counters per offer and per destination.
Every transition emits `audit_events`; every public mutation writes `offer_state_history`.

### 20. Freshness state machine

| Offer class | Window | Expiry action | Public label source |
|---|---|---|---|
| Fast-moving manual stock | 24–72h | demote → hide | merchant confirm |
| Marketplace API stock | minutes–hours per feed SLA | flag feed failure, isolate partner | feed received |
| Price-only catalogue offer | ≤7d | show "confirm availability" | price updated |
| Made-to-order product | 14–30d | keep quote-required label | quote-required |
| Service capability | 30–90d | require periodic active confirmation | merchant active |
| Market event offer | event-bound | remove at close | event scope |
| Reference product | n/a | never active | reference only |

A 15-minute repeatable sweep transitions states; expiry writes history and reindexes. Public timestamps render `updateType` verbatim — "price updated", "stock confirmed", "merchant active", "feed received" are distinct facts and never interchangeable. Freshness history is a ranking input and a defensibility asset.

### 21. Source-confidence model
Confidence is field-specific: an API feed may be strong for price but weak for physical branch stock; a merchant confirmation strong for immediate availability but weak for specifications; a manufacturer authoritative for dimensions but irrelevant to local warranty. Search, labels and ranking consume the confidence of the particular field, never a single source score.

### 22. Matching & canonical pipeline
Query/record → alias expansion (language pack) → variant matching with confidence → branch/place binding → destination typing. Ambiguity produces candidate records and uncertainty display, not invented facts.

### 23. Compatibility graph
Edges cover voltage, current, connector, capacity, size, material, application, accessory and installation constraints. Each edge carries evidence and review status. The graph powers alternatives, bundles, request matching and safety-aware guidance ("24V battery → compatible inverter classes → required cable/protection"). Engineering guidance is distinguished from merchant installation advice; disclaimers are attached. AI-generated edges without evidence are forbidden.

### 24. Request Network mechanics
A buyer submits a structured need (text, voice note, image, bill of quantities, form). The request is normalised, location-bounded and risk-screened. Broadcast sequence: first to 3–5 high-fit destinations by category, location, response history and capacity; merchants see only what is necessary to respond; expansion or clarification follows non-response. Repeated low-quality broadcasts are treated as a product defect. Public requests require consent and privacy filtering; high-risk categories are excluded or manually controlled. Requests create demand data before transactions exist: zero-result queries, incompatible offers, supply gaps, price sensitivity, quote requirements.

### 25. Universal Link resolver

```
GET /l/{universalId}
→ resolve canonical entity (cached metadata at edge)
→ append signed attribution params (campaign/content/asset/product/merchant/branch/partner)
→ select most specific valid destination (exact listing > product page > seller page > search)
→ fallback chain when external apps unavailable: web → phone → directions → saved need
→ emit referral_event
```

Links survive copying between Facebook, WhatsApp, SMS, QR and browsers. No misleading intermediate pages, no brand replacement, no forced registration. Broken, unavailable or repeatedly mismatched destinations lose ranking and may be suspended.

### 26. Referral Ledger mechanics
Events are deduplicated (device/session/phone where lawful), timestamped and confidence-scored. Outcome states: contacted · responded · quoted · unavailable · reserved · collected · purchased · abandoned · disputed. Evidence weights: destination callback (signed, defined) > buyer confirmation > merchant self-report > sampled evidence. Any future commercial use must price the event level it actually measures; a click product is never represented as sale proof.

### 27. Ranking engine

**Eligibility filters (hard):** prohibited goods · expired freshness · broken destination · unresolved identity risk · poor product match.

**Feature groups:** lexical/semantic relevance · canonical variant confidence · distance/place relevance · freshness · destination response & accuracy · trust evidence · price context (components, not false landed totals) · fulfilment preference · diversity (no single destination occupies every position when equivalents exist).

**Governance:** weights live in versioned `weights.v{n}.json`, reviewed weekly, ADR on change, rollback preserved for every production version. Revenue is excluded from organic relevance. Destination type receives no automatic preference. Labels such as "freshest nearby offer" must be evidence-backed. Learning-to-rank activates only when ≥5,000 resolved needs provide labels and fairness, sponsor-separation and local-availability hallucination tests pass.

**Anti-gaming:** false freshness confirmations, rotating destination URLs, duplicate sellers, copied images, misleading price fragments, fake branches, coordinated clicks, complaint intimidation, feeds omitting mandatory charges → confidence reduction, expiry, suspension, enforcement labels. Volume or payment grants no exemption.

### 28. Sponsored separation (dormant module)
Separate candidate generator; visible labelling enforced in the serializer; eligibility requires current data and policy compliance; sponsorship changes visibility in allocated inventory only — it cannot alter trust evidence, organic rank, compatibility claims or suppress competitors. Organic results remain adjacent. The module is flag-off; ads connect to this schema later without rearchitecture.

### 29. Zero-result workflow
Sequence: aliases & variant broadening → nearby geography → compatible alternatives → recently confirmed destinations → Reference Library → structured request. The query enters the zero-result queue with a reason code: no local supply · stale supply · unmatched language · catalogue gap · restricted category · location ambiguity · search defect. Data and product teams own distinct reason codes.

### 30. Price anomaly controls
Prices checked against merchant history, comparable variants, currency and category ranges. Anomaly → warning or review, never automatic replacement. Extreme bargains may be genuine. Weak evidence or repeated dishonoured offers render "price requires confirmation".

### 31. Demand graph
Search queries, filters, zero results, saved needs, structured requests, referrals and outcomes form the demand graph. Personal identity is separated from aggregate intelligence. Segmentation: location, category, time, urgency, fulfilment preference. This graph reveals unsolved commerce across destinations — the strategic asset no single marketplace can see.

---

## PART V — TRUST SYSTEM

### 32. Trust Passport predicates

| Predicate | Evidence | Expiry/limitation |
|---|---|---|
| Phone verified | OTP to merchant-controlled number | Does not prove identity or stock |
| Location reviewed | Photos, map, roster or visit | Recheck after move/complaint |
| Marketplace seller active | Partner feed or seller-status callback | Partner-specific only |
| Offer refreshed today | Merchant/feed timestamp | No guarantee of continued stock |
| Responsive merchant | Median response from attributable leads | Requires minimum sample |
| Complaint resolved | Documented closure + buyer/partner evidence | Not proof of absence of others |
| Company evidence supplied | Registration/tax or authorised record | Does not guarantee service quality |

Paid plans never buy predicates. Review services may be paid; outcomes remain evidence-based. The system displays what was checked and what was not; rehabilitation paths exist; no permanent opaque scoring.

### 33. Live Trust Seal (5th Icon)
Dynamic SVG served per merchant from CDN; links to the canonical page; shows factual states ("offers refreshed today", "open now", "median response 22 min") when supported. Degrades to grey when data stale. Never displays stock counts from unauthorised or unreliable sources. Removal is never publicly framed as wrongdoing — value comes from positive live information. Deployed on merchant/partner websites, email signatures (daily-fresh banner image with tracked clicks), WhatsApp About links and printed QR material.

### 34. Complaint triage

| Severity | Examples | Action |
|---|---|---|
| Critical | Impersonation, dangerous product, serious fraud, exposed personal data | Immediate restriction + escalation |
| High | Repeated bait price, wrong destination, harassment, counterfeit allegation | Review within four hours |
| Standard | Stale price, incorrect hours, duplicate branch, broken link | Acknowledge within one business day |
| Low | Description improvement, category correction | Queue by impact and evidence |

### 35. Correction & suppression
Every public record has a correction route capturing disputed field, claimant authority, evidence and urgency. High-risk contact/identity data can be temporarily hidden before final review. Decisions record reviewer, reason and source impact. Source-level errors trigger sample review of related records, not isolated correction. Suppression honours the register's SLA with logged action.

### 36. Duplicate & impersonation controls
Screening: shared telephone numbers, copied images (perceptual hashing), near-identical names, conflicting locations, abnormal claim velocity. Duplicates may be legitimate branches/agents/sellers → evidence request, not automatic ban. Impersonation complaints trigger urgent suppression of high-risk contact actions during ownership review.

---

## PART VI — AI LAYER

### 37. Permitted use cases
Extraction of draft products/offers from images, PDFs, messages, spreadsheets, voice notes · normalisation of titles, units, variants, attributes · duplicate identification for review · alias and multilingual query expansion · request matching · drafting export cards, captions, comparison summaries, merchant action recommendations · prioritisation of stale offers, suspicious prices, copied scam images, support queues · evidence/uncertainty summaries for human reviewers.

### 38. Prohibitions (code-enforced, not policy)
AI may not invent local price, stock, location, verification, warranty or delivery claims · may not publish a merchant offer without confirmation or authorised feed · may not make high-impact fraud, suspension or identity decisions without review and appeal · may not train on a source merely because it was technically collected · may not personalise prices or conceal offers based on inferred vulnerability · may not merge organisations, people or branches at high confidence without evidence controls.

### 39. Gateway architecture
Interface: `extract() · normalize() · embed() · classify() · vision() · draft()`. Provider-agnostic adapters; model registry; per-request logging (model, tokens, cost, source-rights decision). Rights hook blocks `aiUsePermitted=false` sources from prompts. All generative outputs return `Draft<T>`; a `Draft<Offer>` cannot persist without `confirmedBy | authorizedFeedRef` — kernel validation rejects it. Cheapest model passing evaluation per task. Model substitution is one configuration change.

### 40. Evaluation harness
Fixture set of ≥500 country-specific queries across aliases, misspellings, languages, locations, compatibility and zero-result cases. Scorers: correct-entity rate · **local-availability hallucination (zero-regression gate)** · wrong-variant rate · destination accuracy · uncertainty display · unsafe-category handling. Runs in CI on every prompt/model/ranking change; release blocked on failure; results persisted to `eval_runs` and surfaced in governance reporting. A manual WhatsApp/Facebook baseline task set anchors demand-superiority measurement.

---

## PART VII — CONSUMER SURFACES

### 41. Local Commerce Search
Default returns active local offers and reachable destinations, grouped by canonical product/service. Result types are never ambiguous: "Marketplace offer", "Retailer checkout", "WhatsApp seller", "Call to confirm", "Physical stall", "Reference only" — each with explicit process/protection context before the buyer leaves.

| Layer | Public meaning | Rule |
|---|---|---|
| Fresh offer | Price/stock/service claim within category SLA | Primary results |
| Recently confirmed destination | Merchant active; item needs confirmation | Secondary with "confirm" action |
| Corroborated profile | Business/place evidence; no current offer | Supplier discovery, never inventory |
| Reference product | Canonical knowledge only | Separate library; never implies local availability |
| Demand request | Need awaiting supply | Matched privately or published with consent |

### 42. Comparison page & total acquisition context
One canonical product/variant per page: specification summary, local aliases, compatibility, fresh-offer count, price range by currency, locations, destination types, update times. Filters: city, distance, collection, delivery claim, marketplace, merchant type, trust evidence, freshness. Lowest displayed price does not auto-rank; a transparent comparison context combines base price, disclosed mandatory fees, delivery estimate where supplied, stock confidence, update age and destination trust. Where shipping/installation/exchange effects are material, components display instead of a false single landed price: item price · delivery "quoted by merchant" · collection point · stock confirmation age · accepted currencies · warranty owner — with unknowns visible before referral.

### 43. Merchant Page
Canonical Shoppage identity: verified name and contacts, branches, market/mall relationships, current offers, stated payment methods, collection/delivery claims, response time, trust predicates, complaints path, corrections, social/website links, action rail (call, WhatsApp prefilled inquiry, request quote, reserve via destination, directions). Strong-website merchants keep their site as destination; others get a lightweight page usable as the single link in WhatsApp About, social bios, email signatures and QR print.

### 44. Marketplace Page
Categories, seller model, destination checkout, buyer-protection terms, delivery scope, represented currencies, response routes, feed status, fresh-offer coverage. Destination cards state whether an offer is sold by the marketplace, by a third-party seller on it, or merely advertised. Marketplace reputation is never merged with individual seller evidence; destination terms govern the sale.

### 45. Market Page & stall digital twin
Hierarchy: market > zone > building > aisle > cooperative > shop > stall. Market Page: verified boundaries, landmarks, opening patterns, roster confidence, categories, active merchants, navigation, safety notices, operator contacts, correction path. Stall relationships require operator records, rosters, field evidence or merchant proof — coordinates alone are insufficient. Captain changes are logged; conflicts of interest visible.

### 46. Saved Needs & alerts
Saved products, specifications, places or unresolved needs receive event-driven, frequency-controlled alerts: price, stock, new-seller, compatibility, restock, request responses, market events, service reminders. Saved needs are first-party demand assets and direct-return channels.

### 47. Guides & decision support
Practical local pages: inverter/battery compatibility, cable sizing, roofing quantity checks, genuine-vs-counterfeit indicators, aliases, market guides, supplier-selection checklists. Guides route to comparison pages and requests — never an editorial business disconnected from commerce.

### 48. Showcase Shorts
Product-demonstration format attached to products, offers, merchants or markets; every clip terminates in a Universal Link. Formats: compatibility demonstrations, stock walk-throughs, before/after installations, market navigation, price updates. Mandatory: natural stopping points, data controls, visible sponsorship, muted defaults. Video never outranks fresh structured truth via engagement. Merchants embed carousels on their own sites; checkout remains at the destination.

### 49. Language, aliases & input modes
Recognition of brand abbreviations, misspellings, local units, installer shorthand, Shona/Ndebele terms, mixed-language phrases ("magetsi backup for two fridges"). Voice and image input produce draft queries with visible uncertainty. Human-reviewed synonym sets are versioned data assets.

### 50. Low-data & inclusive design
Core path works on low-cost Android, intermittent connectivity, text-first mode. Contact, price, freshness, location and actions load before decorative media. No app install or registration for discovery. Offline queues for merchant updates and buyer requests.

---

## PART VIII — MERCHANT, AGENCY & FIELD OPERATING SYSTEM

### 51. Claim workflow
Preloaded candidate profiles are not active shops. Claiming: phone/email verification → identity/authority evidence → branch selection → source review showing existing data, source class and correction options. Disputes enter controlled review; credible-risk suppression is fast.

### 52. Offer-ingestion modes

| Mode | Best for | Operating rule |
|---|---|---|
| Snap-Extract-Confirm | Informal/micro merchants | AI drafts from image/PDF/voice; merchant confirms before publish |
| Spreadsheet/CSV | SMEs, distributors | Template validation + error report |
| Website/WooCommerce plugin | Existing online retailers | Authorised feed; destination remains merchant site |
| API/POS integration | Large merchants, marketplaces | Field ownership + conflict rules |
| Agent-assisted capture | Markets, low digital maturity | Audit trail, consent, quality sampling |
| Quick freshness confirm | Existing offers | 10-second stock/price state via web or WhatsApp |

### 53. Lead & request inbox; outcome marking
One queue for Shoppage-originated calls, WhatsApp starts, quote requests, directions, matched needs. States: responded · unavailable · quoted · reserved · fulfilled · invalid. Marking quality is sampled and compared with buyer/partner evidence; marking accuracy feeds destination response features.

### 54. Quote & reserve handoff
Quotes structure item, quantity, currency, validity, location, fulfilment method, destination terms. Reserve routes to the merchant/partner process and records an intent event; the destination confirms or rejects. Shoppage structures intent without becoming seller or payment party.

### 55. Export & distribution cards
WhatsApp Status, Facebook, Instagram, email and printable cards carrying product, current price, freshness, branch and Universal Link — sending traffic back through the canonical page for comparison and attribution. No advertising expertise required.

### 56. Business Improvement Score (0–100)
Moves only on buyer-outcome work: offer completeness, freshness, response rate, destination accuracy, correction history, resolved complaints, evidence quality. Never rewards logins, ad spend or volume alone. Renders concrete next actions ("confirm five high-demand offers", "respond to two requests older than one hour").

### 57. Reviews & reputation
No generic anonymous stars. Structured outcomes: response speed, offer accuracy, destination reached, item available, quote honoured, complaint resolved. Transaction reviews from partner callbacks are labelled separately from referral-experience reviews.

### 58. Agency workspace & SLA
Multi-client delegated permissions; freshness health, lead queues, Price Pulse, Demand Radar, missing-product opportunities, content cards, seal installation, client reporting. SLA expectations: client authority records, priority-offer refresh, lead-ageing action, sponsorship disclosure, credential protection, monthly outcome report. Certification pauses when a material share of managed clients goes stale or complaints are ignored. Agencies never claim ownership of merchant profiles.

### 59. Market captains
Onboard stalls, maintain rosters, capture evidence, distribute QR, escalate disputes. Compensation attaches to accepted durable work: claimed merchants still active at 30 days, refreshed high-demand offers, resolved corrections, roster quality — never raw registrations or storefront photographs. Controls: identity badges, territory, audit logs, conflict declarations, complaint route, random rechecks, payment reversals for fraud, prohibition on unofficial fees. Political/operator relationships documented but never override evidence standards.

### 60. Marketplace federation mechanics

**Integration modes:** authorised crawl (contract scope, rate limits, takedown) · scheduled feed (partner is price/availability truth) · API/webhook (incremental, authenticated, quotas) · affiliate network (affiliate terms govern) · manual curated pilot · marketplace widget (scoped aggregates, no competitor leakage).

**Feed Contract:** written terms defining permitted fields, image/description rights, refresh frequency, destination URL rules, seller identity, availability meaning, currencies, returns/buyer-protection representation, retention, error handling, termination. Raw input stored separately from canonical offers. Arrival ≠ publication: validation, malware/URL checks, matching, prohibited-product rules, confidence thresholds. Partner corrections prevail for partner-controlled fields; Shoppage retains audit history and independent trust evidence.

**Deep-link rules:** most specific valid destination; no misleading intermediates, brand replacement or forced registration; broken/mismatched destinations demote and may suspend.

**Attribution callbacks:** privacy-safe events (landing accepted, listing viewed, seller contacted, added to cart, order placed, cancelled) under consent, minimisation and retention rules; the core model does not require transaction-level data.

**Partner analytics:** referred sessions, categories, products, geographic demand, broken links, stale-feed rates, unmatched records, conversion where callbacks exist, benchmark position — observed vs inferred distinguished; no cross-partner confidential leakage; aggregate insights enforce minimum cohort sizes.

**No-custody boundary:** contract of sale, payment, fulfilment, returns, refunds and warranty remain between buyer and destination under its terms. Any future transaction service is a separately governed product with separate legal, financial and operational controls.

**Partner offboarding:** current commercial claims removed/expired per contract; deep links disabled/redirected transparently; permitted aggregate history may remain; no implied live availability; buyer notification only where an alternative destination or request route exists.

---

## PART IX — DISTRIBUTION INFRASTRUCTURE

### 61. Universal Links & QR
Stable links for every product, offer, merchant, marketplace, market, campaign, creator and request. QR assets carry unique asset IDs; the metric is attributable sessions and retention produced by installed assets, never assets printed.

### 62. WhatsApp doctrine
WhatsApp is the dominant merchant action rail: click-to-chat, status cards, quick freshness confirmation, request matching, service notifications. Shoppage creates structured context before the chat and captures outcome states after it — never replaces merchant conversations.

### 63. Facebook Groups doctrine
The group file is a distribution and research map, not an owned audience. No scraping or automated posting without permission. Priority: admin partnerships — answer cards, demand summaries, scam-awareness content, group-specific landing pages, tracked links. Membership sums are never unique reach.

### 64. SEO architecture
Indexable by design: canonical product pages, local offer comparisons, market pages, claimed merchant/marketplace pages, guides, structured data (merchant listing schemas where evidence is current). Thin unclaimed profiles, duplicate product pages and auto-generated text are blocked from indexing. Canonicalisation prevents thin location duplicates.

### 65. Creator mechanics
Fixed-fee briefs during attribution learning: merchant consent, disclosure, canonical links, factual claims, content-live period, fraud checks. Outcome commissions activate only when event definitions, duplication controls, callbacks, disputes and payout reconciliation are reliable. WhatsApp clicks never trigger commission alone: tagged session + consented lead + duplicate checks + merchant response state + sampling audit.

### 66. Buyer acquisition mechanics
Campaigns target existing high-intent behaviours: product queries, group questions, WhatsApp referrals, market QR, contractor lists, diaspora project searches, agency audiences. Every campaign routes to a product, market or request page — never a generic homepage. Attribution standards: source/medium/campaign/content/product/partner identifiers; offline QR asset IDs; direct traffic never force-attributed to the last paid campaign; unattributed and low-confidence activity reported honestly.

---

## PART X — INTELLIGENCE & DORMANT COMMERCIAL SURFACES (ADS-LATER POSTURE)

### 67. Merchant intelligence mechanics
Price Pulse: competitor price positions with source-confidence labels and alert thresholds. Demand Radar: search volumes, zero-result clusters, unresolved requests by cell/category, seasonality. Compatibility upsell signals ("battery sells with inverter X% of the time"). Reports translate activity into conservative evidence — qualified actions, responses, quotes, unavailable outcomes, buyer-resolved events, self-reported transactions — with confidence stated and no click×conversion multiplication.

### 68. Partner intelligence mechanics
Feed-quality diagnostics: missing identifiers, duplicate variants, stale prices, broken links, weak titles, attribute gaps. Local query intelligence: aliases, informal terminology, market areas, zero-result demand. Category opportunity maps; price-position and freshness benchmarks from rights-cleared aggregates. Embeddable comparison, seal, price-history and market widgets.

### 69. Dormant commercial schema (structure only, flag-off)
Referral-credit ledger schema (event classes already captured): outbound click, WhatsApp start, call reveal, quote request, directions — with invalid/duplicate/bot/broken-destination exclusion. Sponsored candidate generator and labelling. Intelligence-product cohort aggregates. No billing integration, no pricing constants, no auction. Ads later connect to this schema; the organic engine is structurally unaffected.

### 70. Metric definitions that prevent self-deception
Profiles are not active merchants · reference products are not available inventory · feed records are not valid offers until processed · clicks are not leads unless sold as CPC · WhatsApp opens are not sales · merchant-marked sales are not independently confirmed transactions · group memberships are not unique reachable users · page views are not qualified demand without intent criteria · gross revenue is not software margin when activation services are included.

### 71. KPI tree (mechanics)
North star: **Resolved Demand Rate** — qualified needs reaching a suitable destination or high-confidence outcome. Supply: Fresh Offer Coverage, active merchants, partner coverage; guardrails: stale/duplicate/wrong-variant rates. Demand: qualified sessions, saved needs, direct repeat; guardrail: bot/low-intent share. Referral: attributable actions, destination success, response; guardrails: broken links, unavailable outcomes. Independence: Owned Demand Share, external-platform concentration. Revenue line exists but remains dormant.

---

## PART XI — SECURITY, PRIVACY, ANTI-EXTRACTION

### 72. Security baseline
MFA (TOTP/WebAuthn) for staff, agencies, high-risk merchant actions · RBAC with branch/client/source scopes · encryption in transit/at rest · secrets vault · HMAC-signed feeds/webhooks · immutable audit events for claims, offer changes, trust decisions, API access · rate limits, bot controls, media scanning, URL-reputation checks, abuse reporting · daily backups, tested restoration, incident severity matrix, notification runbook · data minimisation: never store transaction or identity data merely because a partner can send it.

### 73. Privacy doctrine
Data-controller obligations under Zimbabwe's Cyber and Data Protection Act and S.I. 155 of 2024 licensing tiers (classified by data-subject volume) are model constraints, not footnotes: processing records, data-subject routes, breach procedures, cross-border transfer review (AI inference calls send only pseudonymised, rights-cleared fields — never raw personal data or partner-confidential feeds). The same scaffolding serves POPIA for the South Africa instance.

### 74. Anti-extraction controls
Scoped APIs with quotas · field-level permissions · anomaly detection · cache/crawler policies · non-sequential identifiers (ULIDs) · canary records · contractual enforcement. Public facts are defended by service quality, update relationships and historical evidence — not obstruction alone.

### 75. Incident model
Severity classes with named owners; dual review for high-risk trust actions; notice, reason and appeal for merchants/partners except where safety or law requires immediate restriction; rollback can remove a source, category or campaign without taking down the service.

---

## PART XII — GOVERNANCE MECHANICS (STANDING REVIEWS)

**Daily:** feed failures, stale offers, critical complaints, security, launch-blocking defects.
**Weekly — starts with buyer failures:** top zero-result queries, unavailable referrals, wrong-product complaints, unresolved requests → then supply freshness, partner feeds, merchant response, direct repeat, agency performance, source-rights issues, cash. Feature output is discussed only when it changed one of those outcomes.
**Monthly:** rights review, ranking audit (feature review, destination-type exposure, partner concentration, unexplained rank shifts), privacy/security, revenue-quality readiness, activation cost per lane, source concentration.
**Quarterly:** category/city expansion evidence, model changes, capital plan, independent risk review.

**Data quality sampling:** weekly samples of active offers by source, merchant, category and freshness; test product match, price, currency, destination, branch, public label; requests/complaints oversample risky sources; results produce source-level corrective action and ranking changes; a high-volume feed with poor sample accuracy is paused regardless of catalogue contribution.

**Ranking constitution enforcement:** published plain-language ranking policy; versioned internal specification and change log; offline evaluation before material releases; merchant/partner challenge route for factual errors (not rank demands); conflict disclosure for anyone able to change ranking or approve sponsorship; rollback evidence for every production version.

---

## PART XIII — AI-AGENT OPERATING CONTRACT

**Autonomous:** code/tests within module boundaries; run CI; draft migrations; create synthetic fixtures; draft ADRs and runbooks; intra-module refactors.

**Human approval required (hard stops):** applying migrations to staging/prod; changing pinned versions; editing `ranking/weights.*.json`; altering rights-register defaults or any CLEARED source row; deploying; schema changes to append-only tables; any data deletion; enabling dormant modules (`sponsored`, `ltr`, public APIs); changing kill rules or metric definitions.

**Hallucination defences:** consult `docs/PAYLOAD3_IDIOMS.md` before framework code; Payload-2 (Express) idioms are forbidden; where training data conflicts with current Payload/Next behaviour, fetch current docs or raise a flag — never guess; migrations are drafted, never applied, by the agent; all generated code passes identical CI; schema, ranking, rights and security diffs receive personal senior review.

**Over-build prevention:** anything on the kill list or outside the current work order is out of scope; the agent refuses and logs the request as an ADR candidate.

**Verification commands (agent contract):**

```bash
pnpm install && pnpm build                 # compiles all packages/apps
pnpm test                                  # unit + contract
pnpm test:boundary                         # kernel purity (hard fail on violation)
pnpm db:generate && pnpm db:migrate:dry    # draft + dry-run (apply = human only)
pnpm seed:fixtures                         # synthetic data only
pnpm eval:run --set=core-100               # harness gate
pnpm perf:budget                           # <200KB / FCP check on reference profile
```

---

## PART XIV — MODEL DECISION REGISTER

| Decision | Position |
|---|---|
| Category | Neutral commerce intelligence, comparison and referral OS |
| Transaction custody | None in core; destination owns sale, payment, fulfilment, remedies |
| Architecture | Payload 3 shell + plain-TS kernel; six-rule contract enforced in CI |
| Moat substrate | Raw Drizzle tables for ledger, history, edges, candidates, demand, audit |
| Search | Typesense behind adapter; deterministic weights; LTR conditional on label sufficiency + eval |
| Commerce domains excluded | Cart, order, payment, settlement, delivery, wallet, warehouse — enforced in schema and lint |
| Monetisation | Dormant; ads-later schema in place; no billing, no pricing constants |
| AI | Provider-agnostic gateway; drafts-only typing; eval harness gates every release |
| Identity | Canonical Shoppage IDs; external platform IDs are attached records |
| Sources | Default-BLOCKED rights register; technical access ≠ legal permission |
| Currency | Source currency + timestamp; no derived conversions |
| Country scoping | Native on every entity; Zimbabwe first instance; South Africa instance = configuration + data + rights |
| Ranking | Organic relevance independent of payment; sponsored separate, labelled, dormant |
| Trust | Predicate-specific, expiring, challengeable; no opaque universal badge |

---


---

# PART XV — THE SHOPPAGE DISCOVERY GRAPH

### 68. Three connected graphs

Shoppage is built around three first-class graphs:

```text
                    SHOPPAGE GRAPH
                          │
          ┌───────────────┼────────────────┐
          │               │                │
     PRODUCT GRAPH    MARKET GRAPH     MEDIA GRAPH
          │               │                │
 Product / Variant     Market / Zone      Short
 Brand / Alias        Place / Stall       Show
 Compatibility        Community           Episode
          │               │                │
          └───────────────┼────────────────┘
                          │
                    COMMERCE GRAPH
                          │
                  Offer / Vendor / Request
                          │
                     REFERRAL
```

The same canonical Shoppage IDs connect the graphs. A Short does not create a duplicate product. A market does not create a duplicate merchant. A vendor offer does not mutate the canonical product.

### 69. Product-intent search

Shoppage search must support:

- exact product searches;
- natural-language needs;
- specifications and compatibility;
- local-language and colloquial aliases;
- misspellings;
- voice-derived queries;
- image-derived queries;
- "near me" and market-aware queries;
- comparative queries;
- problem/use-case queries;
- request-style queries.

A query can resolve into multiple result types:

```text
Products
Offers
Merchants
Markets
Communities
Requests
Shorts
Shows
Guides
```

Result types must remain explicit. A reference product must never be presented as a live local offer.

### 70. Search as a Google replacement for product intent

For product-intent queries, the default result should be the answer layer, not a list of generic external links.

Example:

```text
"Samsung A16 128GB near me"

→ canonical variant
→ specifications
→ current local offers
→ nearby merchants
→ physical markets
→ online destinations
→ WhatsApp sellers
→ price observations
→ freshness
→ comparison
→ Shorts
→ Shows
→ alternatives
→ action
```

The user may leave Shoppage immediately for the transaction destination, but should not need to leave merely to understand the product or discover the available commercial options.

### 71. Market/community discovery

A Market Page can function as a commerce-centric community without depending on Facebook.

It may contain:

- merchants;
- products;
- offers;
- requests;
- local recommendations;
- market events;
- Shorts;
- Shows;
- guides;
- corrections;
- operator information;
- safety notices;
- local trends;
- saved/followed status.

The community layer must remain independent of any one social platform. Facebook, WhatsApp, X and other platforms are distribution and communication adapters.

---

# PART XVI — PRODUCT MEDIA NETWORK

### 72. Shorts are first-class discovery objects

A Short is a structured media object attached to one or more canonical entities:

```text
Short
├── Product / Variant
├── Offer
├── Merchant
├── Market
├── Place
├── Creator
└── Campaign
```

Every Short has:

- rights status;
- creator/source;
- publication state;
- disclosure state;
- entity links;
- Universal Link;
- freshness requirements where claims are time-sensitive;
- moderation state;
- content-quality state;
- performance metrics.

### 73. Shorts feed

The Shorts feed is algorithmic but **commerce-truth constrained**.

Engagement can determine discovery order among eligible content, but engagement cannot override:

- offer freshness;
- rights status;
- prohibited-product rules;
- trust predicates;
- product identity;
- variant correctness;
- sponsorship disclosure.

A viral video cannot make a stale price current.

### 74. Shows and episodes

Shows are recurring product/media franchises.

Examples include:

- What's Trending
- Market Walk
- Product Battles
- Under X
- New This Week
- Market of the Week
- Vendor Stories
- How It Works
- Product Setup
- Local Finds

The model supports:

```text
Show
└── Season
    └── Episode
        ├── Products
        ├── Markets
        ├── Vendors
        └── Offers
```

Shows can be editorial, creator-led, merchant-funded or Shoppage-produced, subject to disclosure and rights controls.

### 75. Watch → understand → compare → act

Every product-aware Short/Show should support a path:

```text
WATCH
  ↓
UNDERSTAND
  ↓
COMPARE
  ↓
FIND LOCAL
  ↓
CONTACT / VISIT / REFERRAL
```

The action destination is the merchant or partner. Shoppage does not become the seller merely because the user discovered the product through media.

### 76. Content graph

Content is not a disconnected CMS layer. It is a graph surface over canonical entities.

```text
Creator
  ↓
Short / Show / Guide
  ↓
Product / Market / Merchant
  ↓
Offer / Request
  ↓
Universal Link
```

Payload manages editorial/media workflow and content operations, while the domain kernel owns the graph relationships and commercial truth.

---

# PART XVII — AI & GROK INTELLIGENCE LAYER

### 77. AI doctrine

AI is an intelligence layer over governed data. It is not an authority source.

The AI may:

- discover;
- classify;
- extract;
- normalize;
- translate;
- summarize;
- match;
- rank candidates;
- generate drafts;
- detect trends;
- create content drafts;
- assist merchant onboarding;
- assist search interpretation.

The AI may not silently invent:

- price;
- stock;
- location;
- merchant identity;
- market containment;
- product compatibility;
- verification;
- rights;
- transaction outcome.

### 78. Provider-agnostic architecture

```text
                    AI Gateway
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   OpenAI adapter   xAI/Grok adapter   Other adapter
        │               │                │
        └───────────────┼────────────────┘
                        │
                 Domain tools
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   Product search   Market search   Evidence lookup
   Offer lookup     Demand lookup   Content lookup
   Referral tools   Request match   Rights check
```

No product or ranking module imports a specific model SDK directly.

### 79. Grok's role

Grok is a **high-value intelligence adapter**, particularly for current web/social intelligence and X-native signals. Current xAI documentation exposes web search and X search as server-side tools, and the API supports function calling, structured outputs and custom tools. citeturn0search0turn0search3

Use Grok for:

1. **Trend detection**
   - emerging products;
   - rapidly changing consumer discussion;
   - local or regional attention signals;
   - product narratives and sentiment.

2. **Web intelligence**
   - discovering candidate sources;
   - researching product information;
   - finding current public references;
   - assisting source reconciliation.

3. **X intelligence**
   - detecting product discussions and trends;
   - identifying emerging terminology;
   - monitoring public conversations where legally and contractually permitted.

4. **Content assistance**
   - draft Short scripts;
   - Show outlines;
   - trend summaries;
   - product explainers;
   - multilingual drafts.

5. **Search interpretation**
   - difficult natural-language queries;
   - mixed-language queries;
   - use-case and problem-to-product mapping.

6. **Research agents**
   - bounded research tasks using approved tools;
   - source collection;
   - evidence packets for human review.

### 80. Grok is not the source of truth

Grok's output enters Shoppage as:

```text
External intelligence signal
        ↓
candidate evidence
        ↓
rights check
        ↓
source attribution
        ↓
confidence
        ↓
human / merchant / authorised-feed validation
        ↓
canonical graph
```

For current information, xAI states that Grok requires search tools to access realtime information; the model itself does not magically possess live data. citeturn0search0

Therefore the system must record:

- provider;
- model;
- tool used;
- query;
- source URLs/IDs;
- retrieval timestamp;
- extracted claims;
- confidence;
- rights decision;
- reviewer;
- resulting canonical write, if any.

### 81. Grok trend engine

A dedicated Trend Intelligence pipeline may combine:

```text
Grok / X signals
+
Web signals
+
Shoppage searches
+
Zero-result queries
+
Saved needs
+
Requests
+
Offer velocity
+
Short engagement
+
Show engagement
+
Local market activity
```

into:

```text
Trend Candidate
    ↓
Evidence aggregation
    ↓
Confidence
    ↓
Geographic scope
    ↓
Product/entity resolution
    ↓
Trend state
    ↓
Merchandising / editorial recommendation
```

Trend status never changes canonical product or offer truth.

### 82. AI content generation controls

Generated content must be typed:

```ts
Draft<ShortScript>
Draft<ShowEpisode>
Draft<ProductSummary>
Draft<Guide>
Draft<SearchAnswer>
Draft<TrendExplanation>
```

Only approved workflows may persist public content.

For commercial claims, the draft must resolve to existing canonical evidence. Unsupported claims are displayed as uncertainty or removed.

### 83. Model selection principle

The AI gateway selects the cheapest model that passes the task-specific evaluation. Grok is not mandatory for every task. Its use is strongest where web/X intelligence, agentic research or particular reasoning/content capabilities provide measurable advantage.

Current xAI documentation lists Grok 4.6 with web search, X search, code execution and function calling; xAI also supports custom tools/function calls, which makes a controlled Shoppage tool layer feasible. citeturn0search3turn0search5

---

# PART XVIII — OPEN SHOPPAGE PLATFORM

### 84. Platform strategy

Shoppage should ultimately become an **extension platform**, not merely a closed application.

Third parties may build:

- agency tools;
- vertical discovery applications;
- merchant integrations;
- POS/ERP connectors;
- creator tools;
- AI shopping agents;
- market-management tools;
- analytics;
- product enrichment services;
- WhatsApp applications;
- brand/distributor applications;
- specialist search experiences.

The platform must be designed for this future even if the public developer programme is not opened during MVP.

### 85. Public API boundary

Third parties interact through:

```text
Public API
   ↓
Application services
   ↓
Domain kernel
   ↓
Canonical data
```

Never:

```text
Third party
   ↓
Payload collections
   ↓
raw database tables
```

Payload is an implementation component, not the public domain contract.

### 86. Versioned contracts

Public contracts use:

- OpenAPI;
- Zod runtime schemas;
- versioned API paths;
- idempotency keys;
- explicit scopes;
- rate limits;
- audit events;
- deprecation policy.

Example domains:

```text
/v1/search
/v1/products
/v1/offers
/v1/markets
/v1/merchants
/v1/requests
/v1/content
/v1/referrals
/v1/trends
```

Write access is capability-specific and substantially more restricted than read access.

### 87. Event platform

The event taxonomy should support:

```text
product.updated
offer.updated
offer.expired
merchant.updated
market.updated
request.created
request.matched
short.published
show.episode.published
trend.detected
referral.created
correction.created
rights.changed
```

Events are published from the controlled application layer, not arbitrary database triggers owned by extensions.

### 88. Developer/agency ecosystem

Agencies can operate multi-client workspaces with delegated scopes.

A certified agency may provide:

- merchant onboarding;
- catalogue digitisation;
- content production;
- market mapping;
- freshness operations;
- campaign management;
- merchant support;
- integration implementation.

Agency performance is measured on durable buyer outcomes and data quality, not raw registrations.

### 89. Extension trust model

Every extension has:

- identity;
- owner;
- requested scopes;
- approved scopes;
- version;
- webhook endpoints;
- data-retention declaration;
- privacy declaration;
- security posture;
- rate limits;
- revocation state.

No extension can modify provenance, rights, canonical IDs or organic ranking rules without privileged Shoppage-controlled services.

### 90. Ecosystem moat

The strategic objective is:

```text
Shoppage builds the graph
        ↓
Others build applications on the graph
        ↓
More applications
        ↓
More merchants / users / creators
        ↓
More graph coverage
        ↓
More useful search and discovery
        ↓
More platform demand
```

This turns the Shoppage graph into infrastructure rather than merely a feature of one frontend.

---

# PART XIX — FRONTSTORE INFORMATION ARCHITECTURE

### 91. Frontstore

The default public surface should include:

```text
SEARCH
Products · brands · needs · markets · merchants

SHORTS
Algorithmic product/media discovery

SHOWS
Recurring product and market programming

MARKETS
Nearby and followed markets / communities

TRENDING
Products, categories and local signals

REQUESTS
Products/services people are actively seeking

SAVED
Saved products, needs, markets and alerts

GUIDES
Practical decision support
```

The user does not have to choose between "search engine" and "social feed". Both are native entry points.

### 92. Personalisation

Personalisation may use:

- explicit follows;
- saved products;
- saved needs;
- selected location;
- search history;
- content interactions;
- market affinity;
- category affinity;
- referral outcomes.

Personalisation must not use confidential partner data across partners or infer sensitive characteristics unnecessarily.

### 93. Localisation

The Frontstore should adapt to:

- country;
- city;
- neighbourhood;
- market;
- language;
- local aliases;
- local units;
- local currency as displayed from source;
- connectivity conditions.

The underlying canonical graph remains globally structured.

---

# PART XX — COMMERCIAL MODEL

### 94. Destination-first monetisation

The core commercial principle remains:

> Shoppage monetises discovery and measurable commercial value, not transaction custody.

Potential revenue surfaces include:

- vendor subscriptions;
- agency workspaces;
- premium analytics;
- data/enrichment services;
- creator/campaign services;
- referral fees where contractually appropriate;
- API usage;
- enterprise integrations;
- clearly labelled sponsored discovery later.

Native checkout is not required for the business to be economically valuable.

### 95. Sponsored inventory

Sponsored inventory remains separate from organic ranking.

The candidate-generation pipeline must be separate:

```text
Organic candidate generator
          +
Sponsored candidate generator
          ↓
Policy / disclosure layer
          ↓
Clearly labelled result
```

Payment never improves organic relevance.

### 96. Platform revenue

Later platform economics may include:

- API usage;
- premium search;
- enrichment;
- AI consumption;
- developer plans;
- agency plans;
- enterprise connectors;
- creator tools.

These should be introduced only after usage, rights, privacy and competitive controls are sufficient.

---

# PART XXI — DATA, RIGHTS & COMPETITION CONTROLS FOR THE OPEN PLATFORM

### 97. Data minimisation

Public APIs expose the minimum information necessary for the stated use case.

Do not expose:

- raw partner confidential feeds;
- individual merchant-sensitive analytics;
- private requests;
- hidden trust evidence;
- internal moderation data;
- unrestricted graph dumps.

### 98. Partner isolation

Partner A must not infer confidential Partner B information through API responses.

Aggregate benchmarks require minimum cohort thresholds.

### 99. Competitive neutrality

Shoppage may aggregate competitors, but must not secretly favour:

- its own future merchant services;
- paying vendors;
- affiliated destinations;
- one marketplace;
- one social platform;
- one AI provider.

Ranking policies remain documented and auditable.

---

# PART XXII — UPDATED AI-CODER CONTRACT

### 100. Architecture rules

The AI coding agent must treat the following as immutable:

1. Destination owns transaction.
2. Graph owns provenance.
3. Freshness governs commercial truth.
4. Product, offer, market and content are distinct entities.
5. Markets-in-markets are evidence-governed.
6. Content references canonical entities; it does not duplicate them.
7. AI outputs are drafts unless independently authorised.
8. Grok is an adapter, never a domain dependency.
9. Public extensions use contracts, never internal database coupling.
10. Payload is shell/plumbing/admin/content infrastructure; the domain kernel owns the moat.

### 101. Forbidden implementation shortcuts

The agent must not:

- put commerce logic into arbitrary Payload hooks;
- create a second product master inside the media layer;
- make X/Facebook/WhatsApp IDs primary identities;
- treat engagement as evidence of price/stock;
- write AI-generated offers directly into production;
- infer market containment from distance alone;
- expose raw database tables as public APIs;
- let extensions write canonical graph tables directly;
- create cart/order/payment/settlement schemas in core;
- silently invent missing fields;
- use stale Payload-2 patterns for Payload 3.

### 102. Additional test suites

The evaluation harness must include:

```text
Product identity
Variant correctness
Offer freshness
Local availability hallucination
Market containment
Market-in-market correctness
Content-to-product linking
Content rights
Grok/web source attribution
Trend false-positive rate
Referral destination accuracy
Extension permission boundaries
Partner data isolation
```

### 103. New acceptance gates

No release passes if it causes:

- material increase in local-availability hallucination;
- incorrect product/variant linking;
- unauthorised source publication;
- content with unsupported commercial claims;
- market relationships without evidence;
- cross-partner confidential leakage;
- extension privilege escalation;
- organic ranking contamination by sponsorship;
- direct coupling from kernel to an AI provider.

---

# PART XXIII — REVISED DOMAIN MAP

### 104. Core domain modules

```text
identity
organisations
places
markets
communities
catalogue
offers
feeds
search
requests
matching
referrals
trust
rights
content
shorts
shows
creators
campaigns
analytics
trends
extensions
api
ops-console
```

### 105. Domain ownership

```text
PRODUCT GRAPH
  Product
  Variant
  Brand
  Alias
  Compatibility

COMMERCE GRAPH
  Offer
  Merchant
  Branch
  Marketplace
  Destination

MARKET GRAPH
  Market
  Zone
  Building
  Aisle
  Stall
  Community

MEDIA GRAPH
  Short
  Show
  Episode
  Creator
  Guide

DEMAND GRAPH
  Search
  Saved Need
  Request
  Match
  Referral

TRUST GRAPH
  Evidence
  Rights
  Corrections
  Complaints
  Freshness
```

All are connected through canonical IDs and evidence-governed edges.

---

# PART XXIV — UPDATED COMPETITIVE REFERENCE MODEL

### 106. Reference companies

The AI builder may use these as bounded conceptual references:

| Reference | Borrow only |
|---|---|
| Google Shopping | Product search, merchant aggregation, comparison |
| Facebook Groups | Local/community market formation and distribution behaviour |
| YouTube Shorts | Passive vertical discovery and media consumption mechanics |
| Lyst | Visual merchandising and discovery |
| PriceRunner / ShopMania | Offer comparison and referral |
| Channel3 | Product graph / AI-commerce infrastructure |

The AI builder must never import their transaction assumptions, ranking rules, identity dependencies or legal/rights practices into Shoppage without an explicit ADR.

### 107. Shoppage synthesis

```text
Google
  product intent
       +
Facebook Groups
  community/local market
       +
YouTube
  media discovery
       +
Product graph
  canonical intelligence
       +
Local commerce
  markets + vendors + offers
       +
AI
  interpretation + intelligence
       +
Open platform
  agencies + developers
       =
SHOPPAGE
```

---

# PART XXV — UPDATED SCALE MODEL

### 108. Existing data foundation

The current implementation evidence establishes a useful scale starting point:

- 1,000,000 global product identities;
- 950,334 checksum-valid GTINs;
- 466,276 product family keys;
- 25,210 Zimbabwe place/market nodes;
- 25,209 parent edges;
- 118 explicit marketplace/mall discovery records;
- 6,101 organisation/activity candidates;
- 5,899 mapped activity records.

These are **reference/data-foundation milestones**, not claims that all products are locally available or all organisations are currently verified. The implementation report explicitly distinguishes global reference products from observed Zimbabwe offers and states that the market hierarchy still requires evidence/reconciliation. fileciteturn7file2L1-L24

### 109. Scale target

The architecture should therefore assume:

```text
Global product graph: millions → tens/hundreds of millions
Offers: millions → hundreds of millions
Markets/places: millions globally
Content: millions
Events: billions over time
API calls: high-volume external traffic
```

The system must scale by projection, partitioning, caching and bounded APIs rather than by making every public request traverse the entire graph.

---

# PART XXVI — FINAL AMENDED STRATEGIC MODEL

### 110. What Shoppage is

Shoppage is:

> **A global product-intelligence and local-commerce discovery network organised around products, people, places, markets and media.**

It combines:

```text
PRODUCT SEARCH
Google-like product intent

+
MARKET DISCOVERY
Facebook-Groups-like local commerce communities

+
MEDIA DISCOVERY
YouTube-Shorts-like passive product discovery

+
PRODUCT INTELLIGENCE
Canonical graph + offers + compatibility + provenance

+
HYPERLOCAL COMMERCE
Markets-in-markets + stalls + vendors + communities

+
AI INTELLIGENCE
Grok/web/X + other providers through a governed AI gateway

+
REFERRAL
Merchant / marketplace / website / WhatsApp / physical destination

+
OPEN PLATFORM
Agencies + developers + integrations + applications
```

### 111. What Shoppage owns

Shoppage owns:

- canonical identity;
- product intelligence;
- graph structure;
- market topology;
- evidence and provenance;
- freshness state;
- local discovery;
- search;
- recommendations;
- requests;
- Shorts/Shows discovery;
- referral infrastructure;
- platform contracts;
- extension governance.

### 112. What Shoppage does not own

Shoppage does not own:

- the sale;
- payment;
- checkout;
- fulfilment;
- refunds;
- merchant custody;
- inventory custody;
- marketplace buyer protection;
- external social audiences.

### 113. The strategic moat

The moat is not "having many listings".

It is the combination of:

```text
Canonical Product Graph
          +
Offer / Freshness Graph
          +
Market / Community Graph
          +
Media Graph
          +
Demand Graph
          +
Trust / Rights Graph
          +
Referral Graph
          +
AI Intelligence
          +
Third-party Ecosystem
```

This produces a compounding **Commerce Intelligence Graph** that becomes increasingly difficult to reproduce as coverage, evidence, local topology, demand history, content relationships and developer integrations accumulate.

### 114. Ultimate user promise

For a product:

> **"Find it."**

For a need:

> **"Figure it out."**

For a local market:

> **"Discover what's happening there."**

For a merchant:

> **"Be found, understood and contacted."**

For a creator:

> **"Turn product attention into structured discovery."**

For an agency:

> **"Operate commerce discovery for many clients."**

For a developer:

> **"Build on the commerce graph."**

### 115. Final strategic position

Shoppage should aim to become:

> **the discovery layer between people and commerce — where product search, local markets, community demand, product media and merchant destinations converge.**

The long-term ambition is not to own every transaction.

It is to own **the moment before the transaction**.

That is the strategic territory from which Shoppage can replace Google for product-intent discovery, replace Facebook Groups in commerce-centric local communities, use YouTube-like media mechanics for passive product discovery, and eventually become infrastructure on which agencies and developers build new commerce applications.


**MODEL VERDICT — v5.0:** Shoppage is now defined as a **product-intelligence, local-commerce, media and extension platform**, not merely a shopping comparison/referral service. Its core is a governed Commerce Intelligence Graph connecting canonical products, live offers, merchants, hyperlocal markets, communities, requests, Shorts, Shows, demand, trust, rights and referrals. Google Shopping, Facebook Groups, YouTube Shorts, Lyst, PriceRunner/ShopMania and product-graph platforms are reference patterns only; none is the domain model. Grok is a provider adapter for real-time web/X intelligence, research and content assistance, never an authority source. Agencies and developers are future platform participants through versioned APIs, events and capability-scoped extensions, never direct database access. The core transaction boundary remains unchanged: **the destination owns the sale; Shoppage owns discovery and intelligence; the graph owns provenance; freshness, not volume, is the truth standard.**