# SHOPPAGE v8.1 — GLOBAL AI COMMERCE INTELLIGENCE & HYPERMEDIA MASTER CONSTITUTION

**File:** `SHOPPAGE_GLOBAL_INVESTMENT_GRADE_MODEL_v8.1.md`  
**Status:** Binding Strategic, Product, Architecture, Data, AI Governance, Security, Operating and Investment Constitution  
**Supersedes:** v7.0 and prior v8.0 hybrid-polygot baseline  
**Primary launch jurisdiction:** Republic of South Africa (ZA)  
**Expansion:** Pan-African commercial corridors → global multi-jurisdiction deployments  
**Architectural baseline:** Django 6.x + Python 3.13/3.14 + HTMX 2.x + Alpine.js 3.x + PostgreSQL + OpenSearch + Redis + Celery/Django Channels/SSE + governed AI services

---

## 0. PURPOSE AND STATUS

This document is the binding engineering and product constitution for Shoppage.

It defines:

- what Shoppage is and is not;
- the boundaries between discovery, authority, intelligence and action;
- the canonical data model and evidence model;
- the application and browser architecture;
- search and AI governance;
- scale requirements for millions of merchants and billions of offers;
- merchant-agent safety and execution controls;
- security, privacy and jurisdiction requirements;
- observability, evaluation, deployment and disaster recovery;
- commercial and investment assumptions.

The constitution is deliberately stricter than ordinary product documentation. An AI coding agent must treat constitutional rules as higher priority than local implementation convenience.

Where a future requirement conflicts with this constitution, the implementation must stop at the conflict and produce an Architectural Exception Request (AER). Silent architectural drift is prohibited.

---

# PART I — PRIME DIRECTIVE

## 1. Strategic Definition

Shoppage is a **global commerce intelligence and discovery network**.

It captures high-intent product discovery, normalizes product and market information, enriches merchant catalogues, resolves product identity, matches buyers to supply, exposes evidence-backed local offers, captures demand signals and routes buyers to external commercial destinations.

Shoppage is **not a conventional transactional marketplace**.

Its strategic unit is:

> **Evidence-backed commercial intent routed to the best authorized external destination.**

Shoppage owns the discovery, intelligence, evidence, routing and workflow layer. The external merchant, retailer, marketplace or partner owns the commercial transaction after routing.

## 2. Core Economic Boundary

Shoppage does not become the merchant of record for third-party goods.

Shoppage must not own or custody:

- buyer product payments;
- merchant settlement funds;
- inventory for resale;
- product fulfilment;
- warehouse operations;
- product escrow;
- product refunds;
- delivery execution as a primary service;
- buyer checkout for third-party merchandise.

Permitted adjacency includes:

- outbound retailer links;
- external checkout links;
- WhatsApp conversations;
- click-to-call;
- physical directions;
- quote requests;
- reservation intent;
- merchant acknowledgement;
- partner destination acknowledgement;
- Shoppage SaaS subscription billing through an external payment provider.

## 3. Strategic Priorities

Every implementation decision is optimized in this order unless an explicit exception is approved:

1. Evidence-backed truth.
2. User safety and privacy.
3. Search and discovery relevance.
4. Mobile usability and performance.
5. Merchant productivity and retention.
6. Data integrity and provenance.
7. Unit economics and operational cost control.
8. Global jurisdiction portability.
9. Engineering maintainability.
10. Feature breadth.

---

# PART II — CONSTITUTIONAL HARD KILL RULES

Any violation of a hard-kill rule is a SEV1 defect until proven otherwise.

| # | Rule | Enforcement principle |
|---|---|---|
| 1 | No cart, order, product payment, merchant settlement, escrow, product wallet, inventory custody or fulfilment domain. | Domain schema, routes, commands and UI must not create these concepts. |
| 2 | Shoppage must not claim that it sold, delivered, warranted, guaranteed or refunded third-party products unless it actually provides and legally assumes that service under a separately approved business model. | Copy, JSON-LD, AI responses and schemas must remain destination-neutral. |
| 3 | No unauthorized crawling, scraping or ingestion of private groups, chats, proprietary feeds or protected data. | Rights gate blocks data before promotion. |
| 4 | No AI-generated active offer without merchant confirmation or an authorized partner feed. | Draft/promotion gate. |
| 5 | No silent currency conversion for source facts. Preserve source currency, source amount and observation timestamp. | Raw source fields are immutable. Any conversion is clearly derived and labeled. |
| 6 | Advertising must never silently improve organic ranking. Sponsored placements are separate, labeled and independently measurable. | Separate ranking path and audit trail. |
| 7 | Reference-only products and unclaimed profiles must not dominate default search when verified commercial supply exists. | Ranking policy and regression tests. |
| 8 | Shoppage identity must not depend on an external social, messaging or marketplace account. | Canonical Shoppage IDs are authoritative. |
| 9 | No unrestricted bulk exports. | Entitlement, throttling, canary records, audit and anomaly detection. |
| 10 | Every ingested source defaults to `blocked` until rights classification allows processing. | Ingestion pipeline gate. |
| 11 | Geographic proximity alone cannot establish market containment. | `near` and `containedIn` remain distinct relationships. |
| 12 | No verification claim without timestamped, auditable evidence. | Evidence graph required. |
| 13 | No agent-initiated external communication without merchant preauthorization and the applicable communication consent. | Communication policy gate. |
| 14 | No AI-generated commercial, technical, safety, warranty, compatibility or performance claim without supporting evidence. | Claim/evidence validator. |
| 15 | No autonomous price or stock mutation outside explicit merchant rules, source authority and hard floor/ceiling limits. | Domain command policy. |
| 16 | LLMs must not be used in the critical path for deterministic basic search where conventional retrieval is sufficient. | Search router. |
| 17 | No unnecessary PII may be sent to external AI providers. Redaction, purpose limitation and required consent/legal basis apply. | PII policy middleware and gateway. |
| 18 | No unbounded agent execution. Every run has token, tool-call, time, concurrency and monetary/credit budgets. | Runtime enforcement and automatic halt. |
| 19 | No AI system may directly write canonical truth. | AI outputs terminate in candidate/draft state. |
| 20 | No canonical deletion/merge or high-impact legal/identity change may be performed autonomously. | Human approval or separately authorized deterministic workflow. |
| 21 | No production feature may bypass audit, observability or authorization to improve speed of delivery. | Definition of done gate. |
| 22 | No browser-side state may be treated as canonical state. | Server authority remains mandatory for mutations. |

---

# PART III — ARCHITECTURAL THESIS

## 1. The Four Planes

Shoppage is a four-plane system:

```text
┌──────────────────────────────────────────────────────────────┐
│ EXPERIENCE PLANE                                            │
│ Django templates + HTMX + Alpine + specialist JS            │
│ Public discovery + Merchant OS + Internal operations        │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ AUTHORITY PLANE                                              │
│ Django application + domain services + PostgreSQL            │
│ Identity + permissions + canonical truth + governance        │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ DISCOVERY PLANE                                              │
│ OpenSearch + Redis + read projections                        │
│ Lexical + semantic + structured + geo + ranking              │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ INTELLIGENCE PLANE                                           │
│ Python workers/services + governed AI gateway                │
│ Enrichment + ML + OCR + matching + agents + evaluation       │
└──────────────────────────────────────────────────────────────┘
```

### Constitutional interpretation

- **Django owns the application authority plane.**
- **PostgreSQL owns canonical truth.**
- **OpenSearch owns discovery performance, not truth.**
- **Redis owns cache/transient acceleration, not truth.**
- **Python intelligence systems generate evidence-backed candidates and drafts.**
- **No AI service bypasses Django domain commands to mutate canonical state.**

## 2. Why Django Is the Core Application Platform

The public Shoppage experience is predominantly document-centric:

- product pages;
- merchant pages;
- market pages;
- category pages;
- brand pages;
- offer comparison pages;
- request pages;
- SEO landing pages;
- media pages.

These surfaces should default to server-rendered HTML with progressive enhancement.

The Merchant OS contains a smaller but commercially critical application-heavy slice:

- agent command center;
- draft review workspace;
- workflow/campaign builder;
- request negotiation inbox;
- telemetry dashboards.

These surfaces remain in Django, but may use specialist browser components and real-time protocols. React/Next.js is an **exception path**, not a core dependency.

This preserves a single primary application authority while allowing sophisticated browser interaction where it actually provides material value.

---

# PART IV — BROWSER AND FRONTEND CONSTITUTION

## 1. Rendering Principle

Default rendering model:

```text
Django template
→ semantic HTML
→ HTMX for server interaction
→ Alpine for local state
→ specialist JS for specialist widgets
```

Do not introduce React merely because an interface has client-side state.

### State hierarchy

```text
Canonical state
    ↓
Django/PostgreSQL

Server interaction
    ↓
HTMX

Local UI state
    ↓
Alpine

Specialist in-memory state
    ↓
Dedicated component library

React
    ↓
Only through approved AER
```

## 2. JavaScript Policy

The objective is **minimum necessary browser JavaScript**, not an artificial zero-JavaScript target.

The public frontstore should avoid mandatory hydration and avoid shipping an application runtime where plain HTML/HTMX/Alpine is sufficient.

Production browser assets should be self-hosted and version-pinned. A Node.js runtime and a Node-based application build pipeline are not mandatory runtime dependencies.

## 3. Approved Specialist Libraries

Default permitted specialist components include:

- Tabulator or equivalent data grid for high-volume draft review;
- SortableJS or equivalent for ordered drag/drop workflows;
- a vetted charting library for dashboards;
- media/audio/PDF components where required;
- Web Components where a reusable isolated browser component is more appropriate than a framework;
- React only under the AER process.

Every added browser dependency must record:

- bundle cost;
- license;
- security posture;
- maintenance status;
- mobile impact;
- reason it cannot be implemented acceptably with existing primitives.

## 4. Performance Targets

Targets are measured SLOs, not marketing claims.

### Public discovery

- edge/cache-hit TTFB p95: target ≤ 150 ms;
- search API p95: target ≤ 300 ms;
- core public page LCP p75: target ≤ 2.5 s;
- INP p75: target ≤ 200 ms;
- public core-page initial JavaScript: target ≤ 50 KB compressed, with explicit exceptions for media-heavy surfaces;
- no mandatory client hydration for ordinary SEO/content pages.

### Local interaction

- simple Alpine interaction handler target: <16 ms execution under normal device conditions;
- autocomplete server-processing target: ≤50 ms p95 under warm production conditions;
- end-to-end autocomplete target is measured separately from server processing and must include realistic mobile-network tests.

### Universal links

- cache-hit server processing p95: <100 ms target;
- database fallback p99: <250 ms target;
- action recording must never block redirect completion.

No performance number is considered verified until measured in a reproducible benchmark environment.

---

# PART V — APPLICATION AND DOMAIN ARCHITECTURE

## 1. Monolithic Authority, Polyglot Intelligence

The default production architecture is intentionally asymmetric:

```text
Django application
    = one canonical application authority

Python workers/services
    = intelligence, batch, ML, OCR, agents

PostgreSQL
    = truth

OpenSearch
    = discovery
```

Separate Python services are created only where workload isolation, dependency isolation or scaling requirements justify the process boundary.

Do not create microservices merely to create microservices.

## 2. Domain Logic

Use:

```text
apps/<bounded_context>/domain/
apps/<bounded_context>/application/
apps/<bounded_context>/models/
apps/<bounded_context>/api/
apps/<bounded_context>/templates/
```

Views must remain thin.

Models define persistence structure and straightforward invariants.

Domain services own business rules.

Application services orchestrate use cases and transactions.

Commands perform authoritative state transitions.

Policies perform authorization and governance decisions.

## 3. Pure Domain Logic

Business logic that can remain framework-independent should be represented in ordinary Python objects/value objects/policies.

Pydantic is used primarily for:

- API boundary schemas;
- integration contracts;
- AI structured output;
- event payload validation;
- ingestion validation.

Django models remain the persistence authority for normal application tables.

---

# PART VI — DATABASE AND DATA-PLANE CONSTITUTION

## 1. PostgreSQL Is Canonical Truth

PostgreSQL stores authoritative records for:

- merchants;
- merchant users and roles;
- canonical products;
- product families;
- aliases;
- offers;
- market graph;
- evidence;
- requests;
- campaigns;
- agent runs;
- drafts;
- permissions;
- audit events;
- configuration;
- billing state for Shoppage services.

Search indexes and caches are derived systems.

## 2. Data Tiers

Shoppage distinguishes four classes:

### Tier A — Canonical truth

Authoritative, transactional, governed.

### Tier B — Current read projections

Examples:

```text
offer_current
merchant_search_profile
product_search_projection
market_current
request_current
```

Optimized for reads.

### Tier C — Discovery indexes

OpenSearch documents and ranking features.

### Tier D — Analytical/telemetry data

Aggregated or append-only data for measurement, trend analysis and evaluation.

A Tier C or Tier D record can never silently become Tier A.

## 3. Billion-Offer Architecture

Offer data is explicitly split into:

```text
offer_state_history
       ↓
offer_current
       ↓
search_offer_projection
```

### `offer_state_history`

Append-only historical transitions.

Partition by time; country/jurisdiction may be included in partition strategy where it materially improves management and query isolation.

### `offer_current`

Current authoritative projection used for operational reads.

### `search_offer_projection`

Search-optimized representation used by OpenSearch.

The public UI must not scan raw offer history.

## 4. ORM and Raw SQL Policy

Django ORM is the default for ordinary application tables and maintainable business operations.

Raw SQL/psycopg is required for explicitly designated hot paths, including as appropriate:

- COPY ingestion;
- append-only event ingestion;
- partition maintenance;
- bulk state transitions;
- large analytical queries;
- high-throughput projection operations.

A table is not "raw SQL only" merely because it is important. Hot-path designation must be explicit and benchmark-backed.

## 5. Bulk Ingestion

All bulk sources follow:

```text
source
→ rights classification
→ raw staging
→ schema validation
→ deduplication
→ normalization
→ evidence/provenance assignment
→ candidate promotion
→ canonical transaction
→ outbox event
→ projection
```

Never use Python/Django object loops for multi-million-row ingestion where `COPY` or bulk SQL is appropriate.

Every import must have a deterministic `dedupe_key` or equivalent idempotency strategy.

---

# PART VII — PRODUCT GRAPH

## 1. Canonical Product Hierarchy

```text
Global Taxonomy
    ↓
Category
    ↓
Product Family
    ↓
Canonical Product / Variant
    ↓
Identifiers / Attributes / Evidence
```

A canonical product is an identity and specification object, not a merchant offer.

## 2. Product Entity

```python
class CanonicalProduct(BaseModel):
    id: str
    family_ref: str
    category_ref: str
    title: str
    brand: str
    identifiers: ProductIdentifiers
    attributes: dict[str, object]
    status: Literal["draft", "active", "reference_only"]
    provenance: ProvenanceBlock
```

Aliases, compatibility edges, media and evidence are separate related entities. They must not be eagerly embedded as arbitrarily large collections in the canonical product record.

## 3. Product Alias Governance

AI may propose:

- colloquial aliases;
- multilingual variants;
- typo corrections;
- merchant terminology;
- query-derived phrase candidates.

Promotion into an approved alias requires policy validation and appropriate evidence/confidence.

## 4. Compatibility Governance

Compatibility edges are especially high-risk because incorrect technical guidance can create safety and financial harm.

States:

```text
candidate
verified
rejected
```

AI may create candidate edges.

Verified edges require authoritative evidence such as:

- manufacturer documentation;
- engineering review;
- authorized merchant confirmation with corroboration;
- approved technical source.

---

# PART VIII — MARKET AND SPATIAL GRAPH

## 1. Hierarchy

```text
Global
→ Country
→ Province/State
→ Metro/Municipality
→ Corridor/District
→ MarketNode
→ Zone/Wing/Building
→ Aisle/Cluster
→ Stall/Shop/Spaza/Kiosk
```

## 2. Relationship Semantics

Distinct relationships include:

```text
containedIn
near
serves
operatesAt
hasZone
hasStall
```

`near` does not imply `containedIn`.

## 3. Evidence Requirements

Containment may rely on:

- official floor plans;
- market authority confirmation;
- lease/occupancy documentation;
- field GPS/polygon evidence;
- field photographs;
- merchant confirmation plus corroborating evidence.

Every verified containment relationship stores:

```text
who verified
when verified
which evidence
confidence
review state
```

---

# PART IX — EVIDENCE GRAPH: THE PRIMARY TRUST MOAT

## 1. Evidence Is a First-Class Domain

Provenance alone answers:

> "Where did this record come from?"

The evidence graph answers the more valuable question:

> "What evidence supports this particular commercial or technical claim at this particular time?"

## 2. Evidence Model

Conceptual entities:

```text
EvidenceArtifact
EvidenceObservation
EvidenceClaim
EvidenceDecision
EvidenceLink
```

An evidence record may contain:

- source type;
- source identifier;
- captured timestamp;
- source timestamp;
- artifact hash;
- location/page/section reference;
- rights classification;
- reviewer;
- confidence;
- expiration/reverification date.

## 3. Claim Governance

Every high-risk factual claim must be traceable to evidence.

Examples:

- price;
- stock;
- specification;
- warranty;
- compatibility;
- location;
- merchant verification;
- availability;
- campaign eligibility.

The AI answer layer may summarize a claim only if the claim can be resolved to approved evidence.

---

# PART X — SEARCH AND AI DISCOVERY

## 1. Search Strategy

Shoppage uses a layered retrieval system:

```text
1. Query normalization
2. Intent classification where useful
3. Entity extraction
4. Alias expansion
5. Lexical retrieval
6. Semantic retrieval
7. Structured filters
8. Geo constraints
9. Candidate merge
10. Rerank
11. Policy enforcement
12. Result block assembly
13. Grounded answer generation when requested
```

Basic exact/keyword searches should remain deterministic.

## 2. Search Infrastructure

Typesense may be used for rapid MVP development.

OpenSearch is the strategic production search platform for large-scale hybrid lexical/semantic/structured retrieval.

The search abstraction must expose capabilities explicitly. It must not pretend all search engines have identical semantics.

## 3. Search Index Classes

Use separate logical indexes or clearly separated document types for:

```text
products
offers
merchants
markets
requests
media
```

The search response composer joins evidence-backed identifiers across these indexes rather than treating one giant document as the source of truth.

## 4. Ranking Governance

Initial ranking features may include:

- lexical relevance;
- semantic relevance;
- freshness;
- evidence quality;
- local relevance;
- merchant responsiveness;
- compatibility fit;
- demand signals.

Weights are **configuration**, not constitutional truths.

Every ranking version has:

- version identifier;
- feature definitions;
- configuration;
- evaluation dataset;
- approval date;
- rollback configuration.

Ranking changes require golden-query evaluation and regression reporting.

Sponsored ranking is a separate policy path and may not alter organic relevance scores invisibly.

## 5. AI Search Answer Contract

LLM-generated answers must contain:

- canonical identifiers;
- claim/evidence references;
- evidence freshness;
- uncertainty where material;
- explicit statement when evidence is unavailable.

The model must never invent:

- price;
- stock;
- warranty;
- delivery time;
- compatibility;
- merchant location;
- product performance.

Search must remain usable if the AI provider fails.

---

# PART XI — INTELLIGENCE PLANE

## 1. Responsibilities

Python intelligence workloads include:

- catalogue enrichment;
- entity resolution;
- identifier validation;
- alias mining;
- category classification;
- attribute extraction;
- OCR;
- PDF/specification parsing;
- BOQ parsing;
- speech transcription;
- embeddings;
- candidate matching;
- trend detection;
- ranking feature generation;
- recommendation features;
- merchant agents;
- AI evaluation.

## 2. Intelligence Output Boundary

Intelligence services may create:

```text
candidate
suggestion
observation
signal
draft
```

They may not directly create:

```text
active canonical offer
verified compatibility
verified market containment
verified merchant identity
legal/compliance status
published external communication
```

## 3. Draft Contract

```python
class Draft(BaseModel):
    draft_id: str
    draft_type: str
    merchant_id: str | None
    product_id: str | None
    payload: dict[str, object]
    confidence: float
    provenance: ProvenanceBlock
    review_state: str
    created_at: datetime
    expires_at: datetime | None
```

All drafts are governed by Django application commands before promotion.

---

# PART XII — AGENTIC MERCHANT OPERATING SYSTEM

## 1. Product Definition

The Merchant OS is not merely administration.

It is a governed execution environment where merchants can use AI agents to:

- improve catalogue quality;
- discover demand gaps;
- create marketing drafts;
- prepare localized campaigns;
- draft responses to buyer requests;
- inspect competitor signals;
- generate content/media scripts;
- monitor commercial opportunities.

The Merchant OS is a primary SaaS retention and monetization surface.

## 2. Agent Classes

Initial agents:

```text
Feed Autopilot
SEO Strategist
Hyperlocal Campaigner
Request Negotiator
Media Director
Competitor Sentinel
Trend Advisor
```

## 3. Agent Execution Pipeline

```text
merchant instruction
→ policy check
→ plan
→ bounded tool calls
→ evidence retrieval
→ draft/result
→ validation
→ merchant approval or eligible auto-approval
→ authoritative command
→ audit/event
```

The browser never receives unrestricted internal chain-of-thought.

## 4. Agent Event Stream

The user-facing event protocol uses structured execution events:

```python
class AgentEventType(str, Enum):
    RUN_STARTED = "run_started"
    PLAN_READY = "plan_ready"
    TOOL_EXECUTING = "tool_executing"
    TOOL_COMPLETED = "tool_completed"
    EVIDENCE_CHECK = "evidence_check"
    DRAFT_GENERATED = "draft_generated"
    AWAITING_MERCHANT = "awaiting_merchant"
    RUN_PAUSED = "run_paused"
    RUN_RESUMED = "run_resumed"
    RUN_COMPLETED = "run_completed"
    RUN_FAILED = "run_failed"
    RUN_CANCELLED = "run_cancelled"
```

Each event must include:

- `event_id`;
- `run_id`;
- `trace_id`;
- `sequence_number`;
- `event_type`;
- human-readable localized message;
- structured payload;
- timestamp.

Sequence numbers allow the client to reconcile missed events.

## 5. SSE vs WebSockets

Use SSE for:

- one-way agent progress;
- streamed execution events;
- long-running job progress;
- notifications.

Use WebSockets for genuinely bidirectional flows such as:

- live collaborative interaction;
- high-frequency conversational sessions;
- presence;
- interaction patterns where the browser must continuously send messages over the same connection.

Django Channels is the real-time transport layer, not the durable event store.

Durable events originate from canonical state/outbox records.

## 6. Merchant OS UI Architecture

### Agent Command Center

Django shell + Alpine local state + SSE event stream.

### Draft Review Workspace

Django shell + JSON endpoint + Tabulator + server-side approval commands.

### Campaign Builder

Django forms + Alpine + SortableJS for ordered workflows.

A true node/edge workflow editor requires an explicit specialist component decision.

### Request Negotiation Inbox

Django + HTMX + Alpine + SSE/Channels + media viewers.

### Telemetry

Server-side aggregation + charting component. Avoid shipping raw telemetry to browsers.

## 7. Auto-Approval Policy

Auto-approval is allowed only when all relevant constraints are satisfied.

Examples:

- alias candidate above threshold and low-risk category;
- title cleanup with no new factual claim;
- metadata optimization using already verified facts;
- authorized feed normalization.

Never auto-approve:

- new price claims;
- new stock claims from untrusted sources;
- compatibility verification;
- warranty claims;
- market containment;
- merchant legal-identity changes;
- external communications.

---

# PART XIII — REQUESTS AND DEMAND LIQUIDITY

## 1. Buyer Requests Are First-Class Objects

A buyer may submit:

- text;
- voice;
- photo;
- product image;
- BOQ/PDF;
- structured specification;
- location and radius.

Requests are normalized into a structured need but the original source remains preserved where legally and operationally appropriate.

## 2. Matching Order

```text
1. canonical product/family
2. active offers
3. merchant capability
4. geography/service radius
5. evidence quality
6. responsiveness
```

If no qualifying supply exists, the request becomes a demand signal rather than fabricated supply.

---

# PART XIV — ACTION LEDGER AND UNIVERSAL LINKS

## 1. Action Ledger

The action ledger is append-only and idempotent.

Actions may include:

```text
impression
search_result_view
answer_view
comparison_view
short_view
show_view
merchant_profile_view
market_page_view
outbound_click
whatsapp_start
call_reveal
directions_open
quote_submitted
reserve_intent
destination_ack
merchant_responded
buyer_resolved
purchase_confirmed_external
```

The ledger is an analytical/attribution system, not canonical product truth.

## 2. Ingestion Pattern

```text
browser/server event
→ queue/buffer
→ durable ingestion
→ partitioned append-only storage
→ rollups
```

No synchronous action-ledger write may block a buyer redirect or core public response.

## 3. Universal Link

Pattern:

```text
/l/{universal_id}
```

Resolution:

```text
validate
→ Redis
→ DB fallback
→ policy
→ async event
→ destination redirect
```

Anti-abuse controls:

- signed links where appropriate;
- rate limits;
- fingerprinting within lawful privacy bounds;
- canary records;
- anti-enumeration controls.

---

# PART XV — PUBLIC FRONTSTORE

## 1. Core Surfaces

```text
Omnibox
AI answer panel
Product page
Offer comparison
Merchant profile
Market explorer
Stall page
Request board
Shorts
Shows
Trending radar
Category pages
Brand pages
Sponsored discovery
```

## 2. Hypermedia Principle

Public interactions should default to:

```text
request HTML fragment
→ validate on server
→ return fragment
→ swap DOM
```

Examples:

- autocomplete;
- province filters;
- sort controls;
- pagination;
- comparison state;
- request forms;
- merchant actions.

## 3. AI Availability

AI answer generation is an enhancement, not a dependency for basic discovery.

If AI inference is unavailable:

```text
search still works
filters still work
product pages still work
merchant pages still work
outbound actions still work
```

---

# PART XVI — SEO AND HYPERMEDIA DISCOVERY GRAPH

## 1. URL Taxonomy

```text
/p/{productId}/{slug}
/fam/{familyId}/{slug}
/merchant/{merchantId}/{slug}
/market/{country}/{province}/{metro}/{slug}
/stall/{stallId}/{slug}
/category/{slug}
/brand/{slug}
/search?q=...
/requests/{requestId}/{slug}
/shorts/{shortId}/{slug}
/shows/{showId}/{slug}
```

## 2. SEO Rules

- server-rendered HTML for indexable pages;
- canonical URLs;
- hreflang where supported;
- verified structured data only;
- no fake ratings/reviews;
- no fake availability;
- no Shoppage-as-seller wording unless true;
- thin internal search pages noindexed where appropriate;
- automated sitemap lifecycle tied to page eligibility and freshness;
- internal graph links between products, offers, merchants, markets and related demand.

## 3. JSON-LD Governance

Allowed when evidence supports the fields:

- Product;
- Offer;
- Organization;
- Place;
- ItemList;
- BreadcrumbList;
- VideoObject;
- FAQPage only when genuinely curated and supported.

---

# PART XVII — MEDIA GRAPH

## 1. Media Is Evidence-Adjacent, Not Evidence-Authoritative

A video can demonstrate or explain a product but cannot override authoritative commercial state.

For example:

```text
10M views
≠
current stock
```

A media object is linked to canonical entities and evidence where appropriate.

## 2. Media Processing

Use asynchronous workers for:

- image transforms;
- video transcoding;
- transcription;
- OCR;
- thumbnail generation;
- metadata extraction;
- content safety checks.

Public pages use poster-first, lazy media loading and adaptive delivery.

---

# PART XVIII — API CONSTITUTION

## 1. API Framework

Django Ninja is the default typed API layer within the Django application.

Use it where a browser component, integration or service needs JSON rather than HTML.

The HTML/HTMX path remains the default for ordinary public interactions.

## 2. Versioning

Public APIs use `/v1`.

Breaking changes require a new major API version.

Additive schema changes are permitted when backward compatible.

## 3. Command/Query Separation

Commands:

```text
change canonical state
```

Queries:

```text
read projections/search data
```

A query endpoint must not mutate canonical state.

A command must be authorized, idempotent where appropriate and auditable.

## 4. Error Contract

```json
{
  "type": "https://shoppage.dev/errors/offer-not-active",
  "title": "Offer not active",
  "status": 409,
  "traceId": "trace_...",
  "detail": "The requested offer is not currently active.",
  "retryable": false
}
```

---

# PART XIX — SECURITY, PRIVACY AND JURISDICTION

## 1. Authentication

Preferred:

- passkeys;
- MFA for privileged roles;
- WhatsApp OTP where legally and operationally appropriate.

Sessions:

- HttpOnly;
- Secure;
- SameSite appropriate to flow;
- short-lived elevated privileges.

## 2. Authorization

RBAC roles initially include:

```text
super_admin
compliance_officer
market_operator
merchant_owner
merchant_staff
agency_admin
agency_operator
field_agent
support_agent
readonly_analyst
```

Every command must verify both tenant scope and role/policy.

## 3. Privacy

Controls include:

- data minimization;
- purpose limitation;
- retention schedules;
- consent/legal-basis records;
- deletion workflows;
- export workflows where applicable;
- processor register;
- cross-border transfer controls;
- AI gateway PII redaction;
- no PII in ordinary logs.

## 4. Jurisdiction Policy Engine

Jurisdiction is not merely metadata.

The platform must support policy objects covering:

```text
privacy
marketing consent
communications
AI restrictions
merchant verification
commercial disclosures
retention
cross-border transfers
data residency
sector-specific controls
```

Avoid scattered country-specific conditionals. Prefer a policy engine/configuration layer with explicit jurisdiction overrides.

---

# PART XX — OBSERVABILITY AND OPERATIONS

## 1. Core Metrics

```text
search latency
search zero-result rate
retrieval recall
ranking NDCG
grounded answer rate
answer citation completeness
offer freshness
projection lag
action ingestion lag
universal link latency
agent run cost
agent approval rate
draft rejection rate
hallucination rate
policy violation rate
queue depth
webhook failure rate
error rate
AI token usage
AI provider latency
```

## 2. Tracing

Every request carries a trace identifier across:

```text
browser
→ Django
→ domain service
→ search
→ queue
→ intelligence service/worker
→ provider
→ projection
```

## 3. Operational Alerts

Examples:

- projection lag > target;
- search p95 regression;
- action-event loss;
- agent budget violation;
- hallucination-eval regression;
- webhook signature failures;
- suspicious export volume;
- AI provider outage;
- database replication lag;
- OpenSearch cluster health degradation.

---

# PART XXI — TESTING AND AI EVALUATION

## 1. Test Pyramid

```text
unit
contract
integration
E2E
load
security
AI evaluation
DR restore
```

## 2. Golden Dataset

Maintain representative queries covering:

- exact SKU;
- colloquial language;
- multilingual queries;
- misspellings;
- voice transcription errors;
- BOQ requests;
- technical compatibility;
- geographic intent;
- budget intent;
- zero-result queries;
- ambiguous queries.

## 3. AI Evaluation Metrics

```text
intent accuracy
entity extraction F1
retrieval recall@k
ranking NDCG
grounded citation rate
unsupported-claim rate
freshness correctness
policy violation rate
agent task completion
merchant approval rate
cost per successful task
```

AI features may not ship based solely on qualitative impressions.

---

# PART XXII — DEPLOYMENT AND INFRASTRUCTURE

## 1. Environments

```text
local
preview
staging
production
dr
```

## 2. Runtime Topology

Minimum production separation:

```text
Django web/ASGI
Celery workers
Celery beat/scheduler where needed
Redis
PostgreSQL
OpenSearch
Object storage
CDN
observability stack
```

Workers must be independently scalable from web processes.

CPU-heavy AI tasks must never occupy normal request workers.

## 3. Secrets

No secrets in Git.

Required secret classes include:

```text
DATABASE_URL
REDIS_URL
SEARCH credentials
OBJECT STORAGE credentials
AI gateway credentials
communication provider credentials
Sentry/OTEL credentials
```

## 4. Deployment Safety

Every production release requires:

- immutable application build;
- migration gate;
- reversible migration plan where feasible;
- search reindex strategy;
- feature flags for high-risk features;
- rollback strategy;
- health checks;
- backup verification;
- audit trail.

---

# PART XXIII — DISASTER RECOVERY AND DATA LIFECYCLE

## 1. Backup Classes

Back up independently:

- PostgreSQL canonical data;
- critical object storage metadata/media;
- search configuration/index definitions;
- secrets/configuration in the approved secret-management system.

Search indexes are rebuildable and therefore lower-tier than canonical PostgreSQL backups.

## 2. Recovery Objectives

Define RPO/RTO per service rather than using one blanket number.

Example targets for planning:

```text
Canonical PostgreSQL: strictest RPO/RTO
Search: rebuildable; looser RPO
Action analytics: replayable from durable event data
AI drafts: recoverable or intentionally ephemeral by class
Media: restore from object storage/versioning
```

## 3. Retention

Retention must be configured by data class and jurisdiction.

AI drafts expire according to policy unless approved or required for audit.

Raw voice/audio is retained only as long as operational purpose and consent/legal basis require.

---

# PART XXIV — COMMERCIAL MODEL AND INVESTMENT DISCIPLINE

## 1. Revenue Horizons

### Horizon 1 — Merchant SaaS

- verified merchant plans;
- Agentic OS subscriptions;
- compute/agent credits;
- agency workspaces;
- premium analytics;
- enterprise workflow seats.

### Horizon 2 — Commercial Intelligence

- enterprise intelligence APIs;
- sponsored discovery slots that remain separate from organic ranking;
- qualified referral economics;
- market intelligence products;
- brand intelligence/campaign products.

### Horizon 3 — Data Platform

- global product graph APIs;
- market graph APIs;
- demand intelligence APIs;
- developer extensions;
- ecosystem services.

## 2. Unit Economics

Investment cases must distinguish:

```text
revenue
variable AI cost
variable search cost
variable messaging cost
media/storage cost
payment processing cost
support allocation
sales/marketing cost
platform gross margin
contribution margin
```

Gross-margin percentages are **targets/scenarios**, not constitutional facts.

Shoppage has no inventory or third-party merchant settlement working-capital model under this constitution. That does not mean the company has zero operating working-capital needs.

## 3. Forecast Discipline

Operational forecasts must label every metric as one of:

```text
observed
historical
benchmark-derived
bottom-up model
scenario
management target
unknown
```

Unverified market-size numbers must never be presented as facts.

---

# PART XXV — SCALE MODEL

## 1. Scale Dimensions Are Independent

Capacity planning must model separately:

```text
canonical products
product variants
merchant accounts
merchant locations
offers
offer state transitions
markets/spatial nodes
buyer requests
action events
AI agent runs
media objects
search queries
```

"100M products" and "billions of offers" are different engineering problems.

## 2. Billion-Offer Read Path

Public requests should normally follow:

```text
CDN/cache
→ OpenSearch / Redis
→ bounded projection fetch
→ Django HTML/JSON composition
```

Never:

```text
public page
→ raw offer history scan
```

## 3. Pagination

Public APIs use opaque cursor/keyset pagination.

No `OFFSET` pagination over large high-volume datasets.

---

# PART XXVI — GOVERNED AI GATEWAY

## 1. Provider Abstraction

Supported classes may include:

- frontier hosted models;
- specialist models;
- local/self-hosted models;
- embedding models;
- speech/OCR models.

The application must not be tightly coupled to one model provider.

## 2. Model Routing

Routing priority:

```text
deterministic code
→ small/specialist model
→ capable general model
→ frontier model
```

Use frontier reasoning only where the incremental value justifies cost/latency.

## 3. AI Gateway Responsibilities

- PII redaction;
- provider policy;
- model selection;
- timeout;
- token budgets;
- retry policy;
- logging of metadata, not sensitive prompt content by default;
- cost attribution;
- circuit breaking;
- provider failover where appropriate;
- structured-output enforcement.

---

# PART XXVII — AGENT SAFETY AND COST CONTROLS

## 1. Run Budget

Each run has:

```text
max duration
max tool calls
max tokens
max model spend/credits
max concurrency
max external actions
```

## 2. Halt Conditions

Stop when:

- budget is exhausted;
- evidence confidence is insufficient;
- required merchant authority is absent;
- policy check fails;
- model repeatedly produces invalid structured output;
- external provider fails beyond retry threshold;
- requested action enters a prohibited category.

## 3. Agent Sandboxing

Agents access only declared tools.

Tool arguments are schema validated.

Uploaded merchant/buyer content is untrusted input.

Prompt injection cannot override system/developer policy.

---

# PART XXVIII — REACT ESCAPE HATCH

React and Next.js are not part of the mandatory core stack.

They may be introduced only through an Architectural Exception Request demonstrating one or more of:

1. state complexity that specialist non-React components cannot economically manage;
2. WebGL/canvas or sustained 60-fps interaction requirements;
3. a mature specialist component with material productivity/security/accessibility benefits unavailable in the established stack;
4. a customer-facing application whose interaction model demonstrably exceeds the hypermedia model.

If approved:

- React remains isolated;
- canonical state remains Django/PostgreSQL-owned;
- communication uses typed JSON APIs;
- the component is mounted as an explicit island;
- the dependency and bundle cost are measured;
- the exception has a named owner and review date.

---

# PART XXIX — MULTI-JURISDICTION ARCHITECTURE

## 1. Jurisdiction Expansion Formula

```text
Global Core
+
Jurisdiction Policy
+
Local Compliance
+
Local Data/Rights
+
Local Taxonomy/Language
+
Local Market Graph
+
Local Merchant/Partner Network
+
Jurisdiction-specific infrastructure where required
```

## 2. Country Configuration

Initial target jurisdictions may include:

```text
ZA — South Africa
ZW — Zimbabwe
KE — Kenya
NG — Nigeria
UK — United Kingdom
US — United States
IN — India
LATAM markets
SEA markets
```

These are strategic expansion directions, not claims of regulatory readiness.

Each rollout requires a jurisdiction readiness assessment before launch.

---

# PART XXX — DEFINITION OF DONE

A feature is complete only when:

```text
[ ] Domain behaviour defined.
[ ] Authorization and tenant policy defined.
[ ] Database schema/migration added where necessary.
[ ] Canonical/projection boundaries explicit.
[ ] API/HTML contract defined.
[ ] Audit events added where necessary.
[ ] Observability added.
[ ] Security review completed.
[ ] Relevant tests pass.
[ ] Performance target measured.
[ ] AI evaluation added where applicable.
[ ] Failure/rollback behaviour defined.
[ ] Documentation updated.
[ ] No hard-kill rule violated.
```

---

# PART XXXI — BUILD ORDER

## Phase 0 — Foundation

```text
Django 6 project
PostgreSQL
Redis
ASGI
CI/CD
Observability
security baseline
static asset pipeline
base design system
```

## Phase 1 — Authority Graph

```text
Jurisdictions
products/families
merchants
markets
offers
provenance
Evidence Graph
Drafts
RBAC
outbox
```

## Phase 2 — Public Discovery

```text
product pages
merchant pages
market pages
OpenSearch integration
search UI
filters
SEO graph
universal links
action ledger
```

## Phase 3 — Merchant OS Foundation

```text
merchant onboarding
product/offer management
verification
feed quality
analytics
request inbox
approval queue
```

## Phase 4 — Intelligence

```text
Python workers
enrichment
entity resolution
matching
OCR/PDF/BOQ
embeddings
AI gateway
evaluation harness
```

## Phase 5 — Agentic OS

```text
agent runs
typed execution events
SSE
agent tools
draft review
auto-approval
campaign workflows
cost controls
```

## Phase 6 — Scale Hardening

```text
offer partitioning
COPY pipelines
search sharding
read projections
load testing
chaos testing
security testing
DR restoration
```

---

# PART XXXII — ACCEPTANCE TESTS

The platform must demonstrate at minimum:

1. A colloquial buyer query returns grounded canonical products and eligible local offers.
2. Basic keyword search works without an LLM call.
3. Search remains available when the AI provider is unavailable.
4. A confirmed offer reaches public discovery through the outbox/projection pipeline.
5. A universal link redirects within the performance target and records an asynchronous action event.
6. An AI agent cannot publish an unapproved offer.
7. An AI agent cannot invent a price, stock level, warranty, compatibility claim or location.
8. An AI agent cannot initiate unauthorized external communication.
9. Market containment cannot be inferred from proximity alone.
10. Rights-blocked ingestion cannot reach canonical state.
11. PII is redacted before external AI processing unless explicitly authorized and necessary.
12. Draft approval results in a governed domain command, not a browser-side mutation.
13. Agent event streams recover from dropped browser connections without corrupting run state.
14. Billion-offer public reads use projections/search rather than raw history scans.
15. Search ranking changes can be evaluated and rolled back.
16. No public flow creates cart, checkout, settlement or product-payment custody.
17. Production data can be restored through a tested disaster-recovery procedure.
18. A jurisdiction can be configured without adding scattered country-specific branches across the codebase.

---

# PART XXXIII — INVESTMENT-GRADE CLAIM DISCIPLINE

This document separates architecture from investment claims.

The following are **not constitutional facts unless evidenced by current data**:

- total addressable market values;
- informal-economy size;
- merchant counts;
- market counts;
- projected MRR;
- gross-margin percentages;
- product counts by date;
- adoption rates;
- referral conversion rates.

Every investment model must attach:

```text
source
measurement date
geographic scope
definition
methodology
assumption set
sensitivity range
```

The engineering constitution may define targets, but targets must never masquerade as observed market facts.

---

# PART XXXIV — THE SHOPPAGE DATA MOAT

The long-term moat is not merely a large catalogue.

It is the combination of:

```text
Product Graph
+
Offer State History
+
Merchant Capability Graph
+
Market Graph
+
Demand Graph
+
Evidence Graph
+
Action/Outcome Graph
```

This produces a compounding information advantage.

Example of the future Shoppage intelligence layer:

```text
Product X
→ canonical identity verified
→ 3,842 eligible merchant offers
→ 216 local market locations
→ median observed response time
→ demand growth by corridor
→ common buyer intents
→ compatibility evidence
→ offer freshness distribution
→ referral/action outcomes
```

This is a commerce intelligence asset, not simply a product catalogue.

---

# PART XXXV — FINAL CONSTITUTIONAL DIRECTIVE

```text
1. Shoppage is a commerce intelligence and discovery network, not a transactional marketplace.

2. Django 6 + Python 3.13/3.14 is the core application platform.

3. HTMX + Alpine is the default browser interaction model.

4. Specialist JavaScript is permitted where it materially improves application-grade interaction.

5. React/Next.js is an exception path, not a foundation dependency.

6. PostgreSQL is the canonical authority for governed state.

7. OpenSearch owns discovery performance, not canonical truth.

8. Redis accelerates; it does not become the authority.

9. Python intelligence services create candidates, evidence, signals and drafts; they do not bypass authority.

10. Every AI-generated factual claim must be grounded in evidence or explicitly marked uncertain/missing.

11. Every agent is bounded, auditable, policy-controlled and economically metered.

12. Every canonical mutation is authorized, transactional, observable and auditable.

13. Billion-offer scale is handled through staging, projections, partitioning, search infrastructure and asynchronous processing—not by allowing public requests to query raw history.

14. Basic discovery must continue operating when AI fails.

15. Public ranking must remain organically neutral to advertising.

16. Shoppage does not assume inventory, settlement or fulfilment liability under this constitution.

17. Jurisdiction expansion is implemented through policy and data boundaries, not scattered country-specific logic.

18. Investment claims are assumptions until sourced and validated.

19. The primary product moat is the evidence-backed commerce intelligence graph.

20. Architectural simplicity is a strategic asset: introduce new frameworks only when they create measurable value that the existing system cannot deliver economically and safely.
```

---

# APPENDIX A — REFERENCE REPOSITORY SHAPE

```text
shoppage/
├── config/
│   ├── settings/
│   ├── urls.py
│   └── asgi.py
│
├── apps/
│   ├── accounts/
│   ├── merchants/
│   ├── catalog/
│   ├── offers/
│   ├── markets/
│   ├── requests/
│   ├── evidence/
│   ├── campaigns/
│   ├── agents/
│   ├── actions/
│   ├── search/
│   └── media/
│
├── templates/
├── static/
│   ├── js/
│   ├── css/
│   └── vendor/
│
├── services/
│   ├── intelligence/
│   ├── ingestion/
│   ├── matching/
│   ├── embeddings/
│   └── evaluation/
│
├── workers/
│   ├── tasks/
│   └── schedules/
│
├── infra/
├── evals/
├── scripts/
├── tests/
└── docs/
```

---

# APPENDIX B — REFERENCE ENVIRONMENT VARIABLES

```text
DJANGO_SETTINGS_MODULE
DATABASE_URL
REDIS_URL
OPENSEARCH_URL
OPENSEARCH_USERNAME
OPENSEARCH_PASSWORD
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY
AI_GATEWAY_URL
AI_PROVIDER_KEYS
WHATSAPP_PROVIDER_CONFIG
EMAIL_PROVIDER_CONFIG
OTEL_EXPORTER_ENDPOINT
SENTRY_DSN
FEATURE_FLAGS
JURISDICTION_DEFAULT
```

Secrets must be injected through approved secret management and never committed.

---

# APPENDIX C — OFFICIAL TECHNICAL BASELINE TO VERIFY AT IMPLEMENTATION TIME

The implementation team must pin exact patch versions at build time rather than assuming that the major version alone is sufficient.

At the time of this constitution's revision:

- Django 6.0 is the current major Django line and supports Python 3.12–3.14. Django's official release notes also record ongoing 6.0 security releases, so patch-level updates are mandatory. 
- Django async support requires ASGI for the intended efficient long-running request model; synchronous ORM operations must not be used unsafely inside asynchronous code.
- HTMX 2 supports SSE and WebSocket functionality through extensions.
- OpenSearch provides hybrid lexical/vector search capabilities suitable for the strategic discovery architecture.

The coding agent must re-check current supported patch releases and security advisories before production deployment.

---

# END OF CONSTITUTION
