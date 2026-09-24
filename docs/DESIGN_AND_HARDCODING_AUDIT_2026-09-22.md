# Shoppage — Hardcoding & Chief-Designer Audit

**Date:** 2026-09-22 · **Reviewer method:** both services built from current source and run locally; every page captured in a real headless-Chrome browser at 1440 px and 390 px; every finding below verified by reading the cited code, not by grep alone. Screenshots in `tmp/shots/`.

---

## 0. Two traps found while reviewing (fix these first, they invalidate demos)

1. **The shipped binaries are stale.** `bin/merchant-os.exe` (built 21 Sep) returns **404 for `/auth/login` and `/desk`** and renders tab partials without the dashboard shell, while current source has full session auth and a proper shell. Anyone demoing from `bin/` is demoing an older, auth-less product. Rebuild before any investor session.
2. **The README is stale in the other direction.** It states merchant routes have "no authentication". Source now has HMAC-signed, fail-closed session auth (`internal/auth/session.go:96-109`, `RequireSession` at :138). Update the README so due diligence doesn't read a false weakness.

---

## 1. Verdict

**Hardcoding is not minimal — it is structural, and it splits into two very different classes:**

- **Class A — demo seed data (acceptable, mostly labelled).** Fixture store profile in `fixtures/store.json` with env overrides; seeded catalogue/orders so the UI is explorable; the dashboard footer even says "demo view with illustrative data". This is honest demo scaffolding.
- **Class B — fabricated truth presented as real (unacceptable).** Invented CIPC registration numbers, blanket "Verified / In Stock / 4.9★" stamps on every product, a checkout that prints "Payment Settled" with no payment rail, "live" order tracking for orders that never existed, hardcoded GMV/conversion/visitor KPIs, an "AI Copilot" that is a single `fmt.Sprintf`, and channel-sync/feed-validation handlers that log success while doing zero I/O. This is the class that fails institutional due diligence, and it is present on both surfaces.

**Design: the two halves are not the same product.**

- **Merchant OS ("Pemofy OS") is genuinely strong** — coherent forest-green system, clear IA (Operate / Grow / Configure), disciplined cards, tables and chips. With real data behind it, it is investor-presentable today.
- **Consumer web is functional but dated and visibly defective** — dead product-image URLs (verified HTTP 404), a results card whose price/button row overflows the card, `R 0.00` prices, empty rail sections, infrastructure bragging shown to shoppers, and large dead canvas. It reads 2018 marketplace, not 2026.

---

## 2. Hardcoding inventory (verified)

### Class B — fabricated truth (fix before any investor demo)

| # | Location | What it does |
|---|---|---|
| 1 | `consumer-web/internal/store/store.go:675` | **Invents CIPC registration numbers** by formula: `fmt.Sprintf("2021/%06d/07", (len(name)*142857)%899999+100000)`, with `CipcVerified: true`. Fabricating a government identifier is a legal exposure, not demo data. |
| 2 | `store.go:668-686, 702-714` | Every search item is stamped `City: "Crown Mines, Johannesburg"`, `Rating: 4.9`, `InStock: true`, `Verified: true`, `PickupMall: "Cresta / Mall of Africa"`, `TradesCount: 142 + len(name)*9` regardless of real data. |
| 3 | `consumer-web/internal/handlers/consumer.go:986-1036` | `HandleInstantCheckout` — comment literally says "simulates automated instant settlement"; order no. from `Unix()%10000`, waybill from `UnixNano()%1000000`, hardcoded buyer phone/address, status **"Payment Settled"**. No payment integration exists. |
| 4 | `store.go:1512-1560` + `consumer.go:1189` | Two seeded orders (incl. `ORD-2026-1042`) served by `/track` as live tracking; `/track` with no query **defaults to the demo order** "for instant preview". |
| 5 | `merchant-os/internal/templates/overview.templ:12-45` | Headline KPIs are HTML literals — "R8,420", "27 orders", "AOV R312", "Live visitors 43" — with hand-drawn SVG sparklines. The `data` parameter is unused. |
| 6 | `merchant-os/internal/templates/analytics.templ:24-42` | "R1,248,500 GMV", "68.4% conversion (22 of 32 quotes)", "R342,000 pipeline / 18 active leads" hardcoded in markup, ignoring `data.Analytics` (state holds 2 leads). |
| 7 | `merchant-os/internal/handlers/merchant.go:1801-1814` | `AskCopilot` returns **one fixed `fmt.Sprintf` paragraph** for any prompt. No model, no HTTP call anywhere in the service. |
| 8 | `merchant.go:2798-2821` | `SyncChannels` sets `Status="Active"` and writes an audit log "Catalog pushed to GMC… WhatsApp… Takealot B2B" with **zero network I/O**. (`ValidateFeeds` at :2845 likewise marks every SKU "100% compliant" unconditionally.) |
| 9 | `consumer-web/internal/templates/layout.templ:545-548` | Footer shows shoppers "< 3.0 ms · Pure Go 1.27 Engine · **3,109,299 nationwide merchants & 1,005,190 master products indexed**" — static strings, and infrastructure messaging in a consumer UI. |
| 10 | `consumer-web/internal/templates/home.templ:542-546` | Hardcoded retailer footprints "Makro (22 Superstores)", "SPAR (900+ Supermarkets)" etc., plus :516 "Guaranteed in-store stock". |
| 11 | `consumer-web/internal/ai/gemini.go:66-74` | With no `GEMINI_API_KEY` the assistant silently returns canned keyword replies while the UI still brands it "Gemini AI Assistant". |

### Class C — hardcoding that blocks scale / multi-tenancy

| # | Location | What it does |
|---|---|---|
| 12 | `merchant-os/internal/handlers/merchant.go:57-939` | ~880 lines of the entire demo business (SKUs, orders, customers with invented CIPC/VAT, chats, "verified" payment proofs) baked into Go source; `StoreID: "loc_mitrend_midrand"` literal on every record. |
| 13 | merchant-os whole service | **No persistence at all** — no `database/sql`, no SQLite; one global in-memory struct, so one tenant and everything lost on restart. |
| 14 | `store.go:1083-1117, 1304`; `consumer.go:446` | One-off branches on merchant IDs `loc_mitrend_midrand` / `loc_sunpower_crownmines`; storefront fallback shows 12 arbitrary products so a page "is never empty" (wrong-tenant inventory). |
| 15 | `store.go:740` | Search call hardcodes `http://localhost:8082`, ignoring the `SEARCH_CORE_URL` env var that `main.go` supports. Chat template likewise hardcodes `localhost:8083` / `ws://localhost:8080`; sitemap, robots, schema.org and embed snippets hardcode `http://localhost:3000`. |
| 16 | `merchant-os/internal/auth/session.go:96-108` | Auth is good (HMAC, constant-time, fail-closed) but is a **single global platform-admin credential** — no per-merchant users, no roles, despite the spec describing roles. |

### Verified clean (worth saying out loud to investors)

No secrets or API keys in source (`GEMINI_API_KEY` env-only). No `math/rand` fakes in Go. No TODO/FIXME/lorem/"coming soon". Auth fails closed. `config.go` fully env-driven. Fixture identity externalised to `store.json` with env overrides. One design-token file intended as single source (`consumer-web/static/css/input.css`).

**Audit totals** (both surfaces, spot-verified): 24 CRITICAL, 16 MAJOR, 15 MINOR. The 11 Class-B rows above are the ones I read line-by-line myself.

---

## 3. Chief-designer review

### Consumer web — desktop (1440 px)

- **Composition:** three-column marketplace with a large empty canvas below the fold on every page; `/shorts` places four posters at the top of ~1,500 px of nothing. Pages don't own their viewport.
- **Imagery:** the weakest element. Trending cards show tiny catalogue thumbnails floating in large pale-grey voids; on `/search` several Unsplash IDs return **HTTP 404** (verified), so cards render broken-image glyphs with alt text spilling over the image box. No `onerror` fallback exists.
- **Colour:** emerald primary colliding with hot-pink discount pills (`-31%`, `HOT`, `Top Specials (30)`). Reads discount-bin retail, not institutional commerce.
- **Trust signalling is inverted:** the right rail brags about engine latency and Go version to *shoppers*, while the actual trust signals (real stock, real verification) are fabricated.
- **Empty states:** on `/search` the "Trending in SA Trade" and "Commercial Guilds" rails render as bare headers with no items and no empty-state treatment.

### Consumer web — search results card (real layout bug)

`search.templ:168-192`: the price block plus "🤝 Offer" plus "BuyBox" sit in one `flex … justify-between` row with no `flex-wrap` and no `min-w-0`. At the 4-column desktop width the buttons **overflow the card boundary** into the gutter (visible in `tmp/shots/search-desktop.png`). Same row also renders `R 0.00` for zero-priced items, which reads as "free".

### Consumer web — mobile (390 px)

Reflows correctly to a single column with a bottom tab bar — this part is fine (an earlier "mobile broken" impression was a capture artifact and is retracted). But it is monotonous: six near-identical stacked cards, weak imagery, and a **SARS VAT number in the footer**. Functional, not viral.

### `/shorts` — the viral bet, currently not a feed

Four static 9:16 posters in a row, fabricated view/like counts, no snap-scroll, no autoplay, no swipe, no creator identity. As the flagship "viral" surface it is a gallery, not a feed.

### Merchant OS — the good news

Genuinely well-designed: confident dark-green sidebar with grouped IA, consistent card grammar, monospace for identifiers, sensible chips and status colours, a well-composed ledger table. This is the surface to show investors.

Defects a chief designer would still flag:

- **Two design systems, not one.** Merchant ships its own inline `<style>` token set with **Bricolage Grotesque / Instrument Sans**, while the consumer token file mandates **Plus Jakarta Sans / Outfit** and states "no ad-hoc hex values in templates" — a rule the merchant templates break throughout (`#4fe0a4`, `rgba(79,224,164,.15)` …). `docs/DESIGN_SYSTEM.md` claims a single source of truth; there are two.
- **Number formatting is inconsistent** inside one card: "R48250.00 / R50,000.00".
- **Dead vertical space** on short tabs (Analytics ends at ~40% of viewport height).
- **The polish is undermined by the data:** every headline KPI is a literal, so the beautiful dashboard is a painting of a dashboard.

---

## 4. Ranked highest-leverage fixes

1. **Delete fabricated truth (Class B).** Replace invented CIPC/verified/in-stock/rating stamps with real values or an explicit, visible "demo data" badge; make checkout say "demo — no payment processed"; stop defaulting `/track` to a seeded order; compute merchant KPIs from state or show "no data yet". This single move converts the demo from a due-diligence liability into a credibility asset.
2. **Fix search rendering.** Add an image `onerror` branded placeholder; let the price/button row wrap or stack (`flex-wrap` + `min-w-0`); suppress or flag `R 0.00`; give rails real empty states or hide them.
3. **Unify to one design system.** Move the merchant inline `<style>` tokens into the shared ramp, pick one type pairing, and decide whether pink is the accent or goes. One brand voice across Shoppage and Pemofy OS.
4. **Make Shorts an actual vertical feed** — snap-scrolling 9:16, muted autoplay, real merchant media, real counts once media exists. This is the only surface with viral mechanics.
5. **Persistence + tenant isolation in merchant-os** (SQLite, per-tenant state) so edits survive restart and a second merchant can exist at all.
6. **Gate AI honestly.** No `GEMINI_API_KEY` → disable/hide Copilot and the assistant instead of serving canned text under the Gemini brand.
7. **Replace every `localhost` literal** with `cfg.PublicBaseURL` / service-discovery env (sitemap, embeds, schema.org, search-core, chat websocket).
8. **Compose pages to fill the canvas** — constrain max-width, add section rhythm, kill the dead space on `/shorts`, `/search`, and short merchant tabs.

**Investor-presentable today:** Merchant OS screenshots, with the caveat that its numbers are illustrative. **Not presentable:** consumer search results and any code read that reaches Class B. **After items 1-3:** the whole product becomes demo-safe and the design story becomes coherent.
