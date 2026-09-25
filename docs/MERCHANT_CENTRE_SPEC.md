# Shoppage — Merchant Centre Specification

**Document:** `docs/MERCHANT_CENTRE_SPEC.md`
**Date:** 2026-09-21 · **Status:** Target specification (current state audited in §2)
**Scope:** the merchant-facing workspace (`services/merchant-os`) — its information architecture,
modules, activation flow, interaction standards and build order
**Companions:** `docs/DESIGN_SYSTEM.md` · `docs/PRODUCT_TRANSFORMATION_BLUEPRINT.md`

---

## 1. North star

> A merchant should be able to run their entire trading day from one screen: answer a buyer, quote a
> wholesale order, check stock, take a counter sale, print a manifest, and see what sold — without
> opening a spreadsheet, a notebook or WhatsApp Web.

Design consequences that follow from that sentence:

1. **Inbox and orders are first-class**, not buried. A merchant's day starts with "who is waiting for
   me?" — that question must be answerable in under five seconds from the dashboard.
2. **Counter speed matters.** A sale must be completable in ≤3 taps in POS mode, and must work with
   no internet.
3. **Every number is actionable.** KPIs link to the filtered list behind them; a KPI you cannot drill
   into is decoration.
4. **Nothing is invented.** No placeholder badges, no fake counters, no fabricated ratings.

### Target users (design for all three, in this order)

| Persona | Context | Primary needs |
|---|---|---|
| **Township / high-street trader** | Phone-first, prepaid data, one person doing everything | Fast catalogue creation, WhatsApp enquiries, cash sales, simple stock counts |
| **Wholesale / import trader** | Tablet or laptop in a warehouse, bulk quantities, credit customers | Quote builder, volume pricing, customer ledgers, pick & pack, manifests |
| **Hardware / trade supplier** | Desktop, contractor customers, long SKU lists | Deep catalogue, search, bulk price updates, RFQ conversion, feeds to Google |

---

## 2. Current state audit (evidence-based, 2026-09-21)

| Area | Current | Problem |
|---|---|---|
| Navigation | **22 flat items** grouped only by three labels (Operate / Grow / Configure) with 21 emoji icons | Beyond human scanning limit; nothing is discoverable; groups are labels, not workspaces |
| Badges | Hardcoded (`12` orders, `3` inventory, `Quotes`, `Live`) | Fake urgency; erodes trust in every other number on screen |
| Styling | One ~1,100-line inline `<style>` block inside `layout.templ`; zero Tailwind | Cannot reuse components; every page ships the same CSS inline; no caching |
| Assets | No static route existed; HTMX from `unpkg.com` CDN (**fixed 2026-09-21**) | Broken offline story; external dependency in the critical path |
| Typography | Bricolage Grotesque + Instrument Sans (blocking Google Fonts link) | Diverges from consumer; blocking CDN; offline fragility |
| Data | One hardcoded demo tenant (`loc_mitrend_midrand`) in memory | No tenancy, no persistence — every action is lost on restart |
| Onboarding | None — no first-run flow, no empty states | A new merchant lands in a populated demo dashboard and cannot tell what is real |
| Roles | None | Staff and owner see the same 22 modules, including banking settings |
| Search/omni | Static "omnibar" component, no command palette behaviour | No keyboard path; no cross-entity search |
| Mobile | Desktop layout shrunk | Unusable on the phone a township trader actually owns |

Everything below is the correction.

### 2.1 Status after the 2026-09-25 overhaul

| Area | Now |
|---|---|
| Navigation | 7 sections (Home, Sell, Products, Stock, Fulfilment, Customers, Marketing) with a tab strip per section; Settings and Activity log in the account menu. Badges are live counts that hide at zero. |
| Home | "Needs you" list (messages, payments, packing, quotes, low stock, returns, listing problems), each linking to where it's resolved; setup checklist computed from store state; KPIs link to filtered lists. |
| Data | All figures computed from records; demo data is internally consistent (per-location stock, valid GS1 barcodes, a month of order history) and labelled as demo on every screen. |
| Listings | "Where you sell" shows each product against each channel with the exact fix; feeds publish only compliant products. |
| Assistant | Rules-based and labelled as such; suggestions show their data and need approval; applied changes can be undone. |
| Quotes | Priced from the catalogue and volume tiers, price held until expiry, one click to an order at the quoted price. |
| Stock | Per-location stock, reason-coded movements, counts, transfers that move stock on receipt, dispatch deducts stock. |
| Mobile | Drawer + bottom bar, card tables, offline counter sales. |
| Import | Spreadsheet (CSV) catalogue import with loose column matching. |
| Still open | Roles & permissions, persistence per tenant beyond the snapshot store, a real language model behind the assistant, courier and WhatsApp API integrations, photo → product. |

---

## 3. Target information architecture

**Seven top-level destinations**, each with its own sub-nav. Nothing else appears in the sidebar.

| # | Workspace | Purpose | Sub-nav |
|---|---|---|---|
| 1 | **Home** | What needs my attention now | Dashboard · Tasks · Notifications |
| 2 | **Sell** | Demand and conversations | Inbox · Quotes & RFQs · Orders · Invoices · Returns |
| 3 | **Products** | Value on the shelf | Catalogue · Bulk import · Categories · Price lists · Media library |
| 4 | **Stock** | Physical reality | Inventory · Counts & audits · Transfers · Suppliers · Purchase orders |
| 5 | **Fulfilment** | Getting it out the door | Pick & Pack · Manifests · Deliveries · Collections |
| 6 | **Customers** | Who buys and what they owe | Customers · Ledger · Segments · Campaigns |
| 7 | **Grow** | Getting found and getting better | Storefront & SEO · Channels & Feeds · Promotions · Analytics · Automations |

Plus, in the top bar rather than the sidebar: **store switcher**, **omnibar (⌘K)**, **notifications**,
**help**, and a **Settings** menu (Store profile · Team & roles · Billing & plan · Banking ·
Integrations · Audit log · Danger zone).

### Mapping from today's 22 items (nothing is lost)

| Today's item | Target location |
|---|---|
| Overview | Home → Dashboard |
| Orders | Sell → Orders |
| Products | Products → Catalogue |
| Inventory | Stock → Inventory |
| Customers | Customers → Customers |
| Pick & Pack | Fulfilment → Pick & Pack |
| Carrier Manifests | Fulfilment → Manifests |
| Stock Transfers | Stock → Transfers |
| Barcode & Audits | Stock → Counts & audits |
| Analytics | Grow → Analytics |
| Promotions | Grow → Promotions |
| B2B Wholesale (RFQs) | Sell → Quotes & RFQs |
| POS Trade Counter | Sell → POS (also a top-bar quick launch) |
| Channels & WhatsApp | Grow → Channels & Feeds |
| Google & Meta Feeds | Grow → Channels & Feeds |
| SEO & Content | Grow → Storefront & SEO |
| Media & Documents | Products → Media library |
| Flow Automations | Grow → Automations |
| AI Studio | Grow → Automations → AI Assist (contextual, not a destination) |
| Direct Messages | Sell → Inbox |
| Audit Trail | Settings → Audit log |
| Settings | Settings menu (top bar) |

**Navigation rules**
1. Sidebar shows 7 items; a badge appears only when a live count > 0.
2. Every list view is addressable (`/orders?status=awaiting_payment`) so links can be shared.
3. POS and Inbox are reachable from the top bar in one click, from anywhere.
4. The current workspace's sub-nav is a horizontal tab strip beneath the page header.

---

## 4. Activation: the first ten minutes

The most important flow in the product. A merchant who never publishes a real catalogue never
becomes a customer, and activation cost is the number the whole investment case rests on.

**Target:** catalogue live (≥10 real products) within **10 minutes** of first sign-in, on a phone,
without help.

| Step | Screen | Action required | Success signal | Event |
|---|---|---|---|---|
| 1 | Welcome | Confirm business name, area, category (3 fields) | Saved | `onboarding_started` |
| 2 | Identity | Registration number **optional**; owner phone/ID OTP | Owner verified | `owner_verified` |
| 3 | Catalogue | Choose one: **CSV upload** · **phone-camera capture** · **search the 1M reference catalogue** · **manual add** | ≥10 products in draft | `catalogue_import_started` |
| 4 | Price & stock | Inline table: price + quantity per row | 10 rows priced | `catalogue_priced` |
| 5 | Publish | One button; store URL and QR generated | Store live | `store_published` (**activation**) |
| 6 | Share | WhatsApp broadcast template, QR poster PDF, embed snippet | First share | `store_shared` |
| 7 | First sale | Guided counter sale, or send a test quote | First order or quote | `first_transaction` |

**Rules**
- The wizard is resumable and skippable; the dashboard keeps a checklist until step 7.
- Every empty state in the product points at the next incomplete step.
- Camera capture is the informal-trader differentiator: a photo plus a price is a product.
- Instrumentation ships **before** the first merchant is invited (roadmap item M-01).

**TTFV** = `store_published − onboarding_started`; report median and p90 weekly. This number proves or
disproves the field-cost model.

---

## 5. Module specifications

Purpose, screens, actions, empty state, permissions and phase per module. Phase key: `v1.0`
launchable · `v1.1` growth · `v1.2` intelligence.

### 5.1 Home → Dashboard `v1.0`
- **Purpose:** answer "what needs me now?" in five seconds.
- **Blocks:** activation checklist (until complete) · KPI tiles (new enquiries, open quotes, orders to
  fulfil, revenue this month) · "Needs attention" list (unanswered messages, overdue quotes, low stock,
  failed feed syncs) · recent activity · quick actions (New product, New quote, Open POS, Scan).
- **Rule:** every tile and attention row links to the filtered list behind it.
- **Empty:** "No products yet — publish your first ten in about ten minutes" + wizard CTA.
- **Permissions:** staff see a scoped version (fulfilment items only).

### 5.2 Sell → Inbox `v1.0`
- **Purpose:** one place for buyer conversations across WhatsApp, chat and RFQ.
- **Screens:** thread list (unassigned / mine / waiting / closed), conversation pane, quote composer,
  customer side panel.
- **Actions:** reply, quick replies, attach product, build quote, assign, snooze, mark won/lost,
  convert to order, log outcome.
- **Rules:** a thread unanswered past the store SLA escalates to the dashboard; response time is
  measured and visible to the owner.
- **Empty:** "No conversations yet — share your store link."

### 5.3 Sell → Quotes & RFQs `v1.0`
- **Purpose:** turn enquiries into priced, accepted, convertible quotes (the B2B core).
- **Screens:** quote list; quote builder (line items with volume tiers, delivery, validity, terms);
  RFQ inbox; PDF/WhatsApp send; accepted-quote → order conversion.
- **Actions:** create from RFQ or scratch, apply price list/tier, set validity, send, revise, accept,
  convert, record payment terms.
- **Rules:** a quote locks price for its validity window; conversion creates the order and reserves
  stock atomically.
- **Empty:** "No quotes yet — build one from a conversation."

### 5.4 Sell → Orders, Invoices, Returns `v1.0`
- **Screens:** order list with saved views (awaiting payment, to pack, ready, collected, delivered);
  order detail with status stepper; invoice preview/print; returns (RMA) intake.
- **Actions:** advance status, record payment, print invoice, create waybill, partial fulfil, cancel
  with reason, issue credit note.
- **Rules:** status transitions are the only approved path; each writes an audit entry with actor and
  timestamp; money actions require owner rights.

### 5.5 Products → Catalogue `v1.0`
- **Screens:** product list (search, filters by status/category/stock, column toggle, bulk bar);
  product editor (two columns, live storefront preview); variants; media library.
- **Actions:** add, inline edit, bulk price/stock update, duplicate, archive, publish/unpublish, CSV
  import/export, generate from photo, match to reference catalogue, SEO fields.
- **Rules:** a product is *draft* until it has price, image and stock state; completeness shows as a
  checklist, never a hidden requirement.

### 5.6 Stock → Inventory, Counts, Transfers, Suppliers, POs `v1.0 / v1.1`
- **v1.0:** stock levels with reason-coded adjustments; low-stock thresholds and alerts; counts and
  audits with variance reporting; transfers between locations.
- **v1.1:** suppliers with lead times; purchase orders; receive against PO; cost price and margin per
  product; stock valuation.
- **Rules:** every stock change is reason-coded (`sale`, `return`, `damage`, `count`, `transfer`,
  `received`) and lands in the audit trail. No silent edits.

### 5.7 Fulfilment → Pick & Pack, Manifests, Deliveries `v1.0`
- **Screens:** pick list grouped by zone with check-off; packing with weight/dimensions; manifest sheet
  per carrier (printable, scannable); delivery and collection scheduling.
- **Actions:** generate pick list, mark picked/packed, print labels/manifest, hand to carrier, record
  proof of delivery, mark collected with signature or OTP.
- **Rules:** orders can be partially fulfilled; a printed manifest is immutable.

### 5.8 Sell → POS Trade Counter `v1.0`
- **Purpose:** take a counter sale faster than opening a till app.
- **Screens:** single-screen POS (search/scan → cart → payment → receipt); held carts; shift summary;
  offline queue indicator.
- **Actions:** scan or search, quantity edit, discount within role limit, cash/card/EFT/store credit,
  split payment, print or WhatsApp receipt, park a cart, refund.
- **Rules:** works **fully offline** — sales queue locally and sync on reconnect with client-side ids
  so duplicates cannot be created. A network outage must never stop a sale.

### 5.9 Customers → Customers, Ledger, Segments, Campaigns `v1.0 / v1.1`
- **v1.0:** customer records with order history, channels, notes, credit terms and balance; ledger of
  invoices and payments; CSV export.
- **v1.1:** segments (spend, recency, area, category); campaigns over WhatsApp/SMS/email with cost and
  attribution; opt-out handling.
- **Rules:** contact details are personal information — capture consent, honour opt-outs, support
  export and deletion on request (POPIA alignment).

### 5.10 Grow → Storefront & SEO `v1.0`
- **Purpose:** give every merchant a digital presence that ranks.
- **Screens:** storefront editor (theme, banner, about, hours, location), SEO panel (title, meta, slug,
  structured-data preview), custom domain, embed snippet, QR poster.
- **Actions:** publish/unpublish, mobile and desktop preview, copy embed code, download QR poster,
  connect domain, ping sitemap.
- **Rules:** only verified facts render as structured data; the preview must match the published page
  exactly.

### 5.11 Grow → Channels & Feeds `v1.0`
- **Purpose:** syndicate the catalogue to where buyers already are.
- **Screens:** channel cards (Google Merchant Center, Meta catalogue, WhatsApp catalogue, marketplace
  feeds, own-site embed) with feed health and per-item errors.
- **Actions:** connect, map categories and attributes, sync now, download feed, view rejections,
  fix-and-resubmit.
- **Rules:** every rejection shows the exact reason per SKU in plain language with a one-click fix.
  A silently failing feed is worse than no feed.

### 5.12 Grow → Promotions `v1.0`
- **Screens:** discount codes, volume/tier pricing, bundles, time-boxed specials, clearance.
- **Actions:** create, schedule, limit (per customer, total), stacking rules, pause, performance report.
- **Rules:** a promotion shows its computed margin effect before it can be saved.

### 5.13 Grow → Analytics `v1.0 / v1.1`
- **v1.0:** sales over time, top products, dead stock, quote conversion, response time, channel mix —
  each with one plain-language insight ("You quoted 14 times and won 5; average response was 6 hours —
  quoting within an hour wins about twice as often").
- **v1.1:** cohort retention, customer value, product margin, area demand, simple forecast.
- **Rules:** every chart drills to underlying rows; no vanity metrics; CSV export everywhere.

### 5.14 Grow → Automations and AI assist `v1.1 / v1.2`
- **v1.1:** rules — low-stock alert to owner, out-of-hours auto-reply, follow-up on unanswered quotes,
  restock reminder, seasonal offer.
- **v1.2:** AI assist with explicit, reviewable actions — draft descriptions from a photo, suggest
  categories/attributes, draft quote messages, summarise a conversation, flag duplicate SKUs.
- **Non-negotiable rules:** AI never writes canonical data without human confirmation; every AI output
  is labelled as a suggestion and stays editable; AI never invents prices, stock, ratings or
  identifiers; AI use is per-merchant opt-out.

### 5.15 Settings (top-bar menu)
Store profile · Team & roles · Billing & plan (usage, invoices, upgrade) · Banking & payments ·
Integrations (WhatsApp, carriers, accounting export) · Audit log (filterable, exportable) ·
Security (password, sessions, 2FA) · Danger zone (export all data, close store).

---

## 6. Roles and visibility

| Capability | Owner | Manager | Sales staff | Warehouse staff | Accountant |
|---|---|---|---|---|---|
| Dashboard | full | operational | own targets | fulfilment only | financial only |
| Inbox / quotes | ✓ | ✓ | ✓ | — | read |
| Orders | ✓ | ✓ | ✓ | fulfil only | read |
| Products & prices | ✓ | ✓ | draft only | — | read |
| Bulk price change | ✓ | ✓ | — | — | — |
| Stock adjustments | ✓ | ✓ | sale only | ✓ | — |
| POS / refunds | ✓ | ✓ (limit) | ✓ (no refund) | — | — |
| Customers & ledger | ✓ | ✓ | ✓ | — | ✓ |
| Storefront & channels | ✓ | ✓ | — | — | — |
| Team & roles | ✓ | invite only | — | — | — |
| Billing, banking | ✓ | — | — | — | read |
| Audit log | ✓ | ✓ | own actions | own actions | financial |

Rules: least privilege by default; every role change is audited; deactivation ends sessions
immediately; sensitive actions (banking, bulk price, bulk delete, refunds above a limit) require
re-authentication.

---

## 7. Interaction standards

1. **Omnibar (⌘K / Ctrl-K)** searches products, orders, customers, quotes and pages; every action is
   keyboard-reachable from anywhere.
2. **Saved views** for every list (`/orders?view=to_pack`), shareable as links and pinnable to Home.
3. **Bulk first:** select → act on many (price, stock, publish, tag, fulfil). One-at-a-time editing is
   the exception, not the only path.
4. **Inline edit** with optimistic UI and rollback on failure; a toast confirms or reverts.
5. **Undo** for reversible actions (archive, status change, pause promotion) for 10 seconds.
6. **Drawers over modals** for record detail, so list context survives.
7. **No dead ends:** every error offers retry or support; every empty state offers an action.
8. **Money guardrails:** totals before committing, typed confirmation for irreversible money actions,
   audit entry capturing before → after values.
9. **Mobile parity:** every v1.0 module works at 360px; POS, Inbox, Orders and Stock are thumb-first;
   the workspace installs as a PWA with an offline app shell.
10. **Print/PDF** for invoice, quote, manifest, QR poster and stock-count sheet — merchants live on
    paper as much as on screens.

---

## 8. Competitive parity matrix

Benchmarked against the tools merchants already use. `✓` = at or above parity · `~` = partial · `—`
= absent today · `n/a` = deliberately out of scope.

| Capability | Shopify Admin | Takealot Seller | Amazon SC | Google Business Profile | Pemofy | **Shoppage today** | **Target v1.0** |
|---|---|---|---|---|---|---|---|
| Guided onboarding / setup checklist | ✓ | ~ | ✓ | ~ | ~ | — | **✓** |
| Product catalogue + variants | ✓ | ✓ | ✓ | ~ | ✓ | ~ (demo) | **✓** |
| Bulk import/export (CSV) | ✓ | ✓ | ✓ | — | ~ | ~ | **✓** |
| Photo → product | ~ | — | ~ | — | ~ | — | **✓ (differentiator)** |
| Inventory levels + adjustments | ✓ | ✓ | ✓ | — | ✓ | ~ | **✓** |
| Multi-location transfers | ✓ | ~ | ✓ | — | ~ | ~ | **✓** |
| Orders + status workflow | ✓ | ✓ | ✓ | — | ✓ | ~ | **✓** |
| Quotation builder (B2B) | ~ (apps) | — | ~ | — | ~ | ~ | **✓ (differentiator)** |
| WhatsApp-first customer comms | ~ (apps) | — | — | ~ | ~ | ~ | **✓ (differentiator)** |
| Offline-capable POS | ~ (Shopify POS) | — | — | — | — | ~ | **✓ (differentiator)** |
| Pick & pack / manifests | ✓ | ~ | ✓ | — | ~ | ✓ | **✓** |
| Customer ledger / credit terms | ~ | — | ~ | — | ~ | ~ | **✓** |
| Feed syndication + health | ✓ | n/a | n/a | n/a | ~ | ✓ | **✓** |
| Storefront + SEO + custom domain | ✓ | — | — | ~ | ✓ | ~ | **✓** |
| Analytics with plain-language insight | ✓ | ~ | ✓ | ~ | ~ | ~ | **✓** |
| Roles & team permissions | ✓ | ~ | ✓ | ✓ | ~ | — | **✓** |
| Audit log | ✓ | ~ | ✓ | ~ | ~ | ✓ | **✓** |
| Billing & plan management | ✓ | n/a | n/a | n/a | ~ | — | **✓** |
| Automations / workflow rules | ✓ | — | ~ | — | ~ | ~ | **v1.1** |
| AI assist (reviewable) | ✓ | — | ✓ | ~ | ~ | ~ | **v1.2** |
| Marketplace checkout custody | ✓ | ✓ | ✓ | — | — | n/a | **n/a (0% take-rate)** |

**Read:** Shoppage already matches the incumbents on the "operations" half (feeds, pick & pack, audit)
and is empty on the "credentials" half (roles, billing, onboarding). The three genuinely defensible
differentiators are **quotation-first B2B**, **WhatsApp-native conversations**, and **offline POS** —
none of which Shopify, Takealot or Google Business Profile do well in this market.

---

## 9. Build order

### M0 — Foundations (week 1–2) · blocks everything else
| Deliverable | Acceptance |
|---|---|
| Shared design tokens applied to the workspace shell | Sidebar, top bar and one list view render from tokens; emoji icons replaced |
| `internal/ui` package with Button, Badge, Card, Field, DataTable, EmptyState | Used by at least three migrated screens |
| Auth + tenant context in every handler | Anonymous access to any workspace route redirects to login |
| Persistence for merchants, users, products, orders | Restart preserves a created product and order |
| Roles enforced server-side | A staff user cannot open Settings → Banking |
| Event log + `/metrics` | A scripted journey produces the expected events |

### M1 — Sellable workspace (week 3–5) · v1.0
Onboarding wizard · Home dashboard with live KPI tiles and attention list · Catalogue list + editor
with CSV import · Inventory with reason-coded adjustments · Orders with status stepper and invoice ·
Inbox with quotes · POS offline · Roles UI · Billing page (read-only plan state until payments land).

**Exit:** a real merchant onboards, imports 20 products, receives an enquiry, sends a quote, converts it
to an order, takes a counter sale offline and prints an invoice — with nothing lost on restart.

### M2 — Efficient workspace (week 6–8) · v1.0.x
Bulk operations · saved views · omnibar/command palette · pick & pack + manifests · customer ledger ·
storefront/SEO editor · feed health with fix actions · promotions with margin preview · PDF/print
suite · PWA install + offline shell · mobile parity pass.

**Exit:** a merchant with 500 SKUs and 50 orders/week operates without a spreadsheet; every list is
filterable, shareable and drillable.

### M3 — Growth workspace (week 9–12) · v1.1
Analytics with insight lines and drill-down · segments and campaigns · automations · suppliers and
purchase orders · multi-location stock valuation · team activity reporting.

**Exit:** the merchant can answer "what should I do differently next month?" from inside the product.

### M4 — Intelligence (post-pilot) · v1.2
AI assist (photo → product, description drafts, duplicate detection, conversation summaries) with
review-only semantics and per-merchant opt-out; demand signals from aggregated search; price
benchmarks where rights-cleared data exists.

**Entry criteria (deliberately gated):** see `docs/PRODUCT_TRANSFORMATION_BLUEPRINT.md` §9 — no AI
feature is built before auth, persistence, instrumentation and rights enforcement are live.



