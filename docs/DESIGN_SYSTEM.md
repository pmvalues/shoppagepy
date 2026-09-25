# Shoppage — Design System

**Document:** `docs/DESIGN_SYSTEM.md`
**Date:** 2026-09-21 · **Status:** Target specification (partially implemented — see §11.3)
**Applies to:** consumer web (`services/consumer-web`) **and** Merchant OS (`services/merchant-os`)
**Companion documents:** `docs/MERCHANT_CENTRE_SPEC.md`, `docs/PRODUCT_TRANSFORMATION_BLUEPRINT.md`

---

## 1. Why this document exists

Shoppage runs **two unrelated design systems** today:

| | Consumer web | Merchant OS |
|---|---|---|
| Styling | Tailwind v4 utilities · **779 class usages** | Zero Tailwind · one inline `<style>` block inside `layout.templ` |
| Palette | emerald `#059669`, slate neutrals | dark-green "artisan" theme (`--sidebar:#0a2f24`, `--primary:#0e7c56`) |
| Typography | Outfit + Plus Jakarta Sans | Bricolage Grotesque + Instrument Sans |
| Icons | inline SVG / emoji | emoji (`📊 📑 📦 🏢 👥 …`) |
| Assets | embedded `embed.FS`, local CSS | **none** — HTMX was loaded from `unpkg.com` (fixed 2026-09-21: now embedded and served locally) |

A merchant who buys on Shoppage and then signs in to *sell* on Shoppage experiences two different
products. That is the biggest design blocker to looking like a modern platform, and it is also a
maintenance tax: two font stacks, two colour languages, two component vocabularies.

**Decision: one design system, two densities.**

- *Consumer density* — marketing-led, generous spacing, large imagery, mobile-first.
- *Workspace density* — information-led, compact rows, keyboard-first, built for a shop counter on a
  tablet or a warehouse on a desktop.

Both share the same tokens, type scale, radius, elevation, motion and component API. Only spacing
rhythm and control size differ.

---

## 2. Brand foundations

**Personality:** trustworthy, commercial, local, plain-spoken. Not "Silicon Valley startup", not
"enterprise grey". The audience is a shop owner in Midrand or Bulawayo and a buyer comparing prices
on a mid-range Android phone with expensive data.

**Voice rules**

1. Say what is true, including what is not yet available ("No live price yet — ask for a quote").
2. Prices, dates and quantities use local conventions (`R 12 499`, `US$19`, `12 Sep 2026`).
3. No invented trust language ("verified", "guaranteed") unless a stored fact backs it.
4. Verbs over nouns in buttons: "Publish product", "Send quote", "Print manifest".
5. Never blame the user: an error names the cause and the fix.

**Logo & marks:** the emerald wordmark stays. The "verified" ribbon renders **only** when a
verification event exists for that record — a design rule, not a styling preference.

---

## 3. Colour tokens

Declared once in `services/consumer-web/static/css/input.css` inside `@theme static`, compiled to
`internal/assets/css/tailwind.min.css`, and emitted as CSS variables so **both** applications can
consume them (`var(--color-brand-600)`).

### Brand ramp

| Token | Value | Use |
|---|---|---|
| `--color-brand-50 / 100` | `#ecfdf5` / `#d1fae5` | selected states, soft badges |
| `--color-brand-200 / 300` | `#a7f3d0` / `#6ee7b7` | positive borders, chart series |
| `--color-brand-400 / 500` | `#34d399` / `#10b981` | primary hover, accents |
| `--color-brand-600` (= `--color-brand`) | `#059669` | **primary action colour** |
| `--color-brand-700 / 800 / 900` | `#047857` / `#065f46` / `#064e3b` | pressed states, deep surfaces |

### Accent and status

| Token | Value | Use |
|---|---|---|
| `--color-accent` / `--color-accent-soft` | `#d97706` / `#fef3c7` | deals, promotions, "needs attention" |
| `--color-success` / `--color-success-soft` | `#059669` / `#d1fae5` | paid, in stock, a verified fact |
| `--color-warning` / `--color-warning-soft` | `#b45309` / `#fef3c7` | low stock, expiring quote |
| `--color-danger` / `--color-danger-soft` | `#e11d48` / `#ffe4e6` | destructive actions, errors, out of stock |
| `--color-info` / `--color-info-soft` | `#0369a1` / `#e0f2fe` | neutral system notices |

### Neutrals (shared by both apps)

`--color-ink #0f172a` · `--color-ink-2 #334155` · `--color-ink-muted #64748b` ·
`--color-surface #ffffff` · `--color-surface-2 #f8fafc` · `--color-surface-3 #f1f5f9` ·
`--color-line #e2e8f0` · `--color-line-strong #cbd5e1`

### Merchant workspace palette (aliased, not separate)

The artisan palette survives unification as aliases, so the workspace keeps its identity while
sharing one ramp:

`--color-merchant-sidebar #0a2f24` · `--color-merchant-sidebar-2 #0d3a2c` ·
`--color-merchant-primary #0e7c56` · `--color-merchant-primary-strong #0a5c40` ·
`--color-merchant-primary-soft #dcefe4` · `--color-merchant-amber #c47c14` ·
`--color-merchant-rose #b5483a`

**Rules**

1. No hex value in a template — tokens only.
2. Colour never carries meaning alone; pair with an icon or text (colour-blind safety).
3. Dark mode: surface and ink tokens are overridden under `.dark`. Ship the token structure now,
   enable the toggle in v1.1.

---

## 4. Typography

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | Outfit | 600/700/800 | page titles, hero, KPI figures |
| Body / UI | Plus Jakarta Sans | 400–700 | everything else |
| Numeric / code | JetBrains Mono | 500/700 | SKUs, barcodes, waybills, table prices |

Both applications converge on this stack; Bricolage Grotesque is retired once the workspace is
migrated (see §11.4), so merchants and buyers read the same type.

**Scale** (px): `12 13 14 16 18 20 24 30 38 48`. Line-height `1.25` display, `1.5` body.
Numeric columns use tabular figures and right alignment.

**Rules:** maximum two weights per screen region; never below 12px; body ≥16px on mobile; number
columns aligned so digits line up vertically.

---

## 5. Space, radius, elevation, motion

**Spacing** — 4px base: `4 8 12 16 20 24 32 40 56 72`. Consumer sections use 56–72px vertical
rhythm; workspace panels use 16–24px with rows of 44–52px (`comfortable`) or 36–40px (`compact`).

**Radius** — `xs 4` · `sm 6` · `md 8` · `lg 12` · `xl 16` · `2xl 20` · `pill 999`.
Cards `lg/xl`; inputs `md`; buttons `md` (consumer `lg`); modals `2xl`; badges `pill`.

**Elevation** — `--shadow-card` resting cards · `--shadow-raised` hover and dropdowns ·
`--shadow-pop` popovers and command palette · `--shadow-modal` dialogs and drawers.

**Motion** — 120ms micro (hover/focus), 180ms standard (drawers, accordions), 240ms large (modal).
Easing `--ease-standard`; entrances use `--ease-emphasised`. Under
`prefers-reduced-motion: reduce`, transitions degrade to opacity only.

**Control sizing** — `--control-sm 32px` · `--control-md 40px` · `--control-lg 48px`.
Touch targets ≥44×44px on consumer surfaces and all merchant mobile views.

---

## 6. Iconography and imagery

- **Icons:** replace emoji in the workspace with one 1.5px-stroke SVG set, inlined as a templ
  component (`Icon(name string, size int)`). Emoji remain only inside user-generated content.
- **Product imagery:** 1:1 tiles, `object-fit: cover`, lazy-loaded, `srcset` at 200/400/800px,
  explicit width/height to avoid CLS, skeleton while loading.
- **Avatars:** initials on `surface-3`, `ink-2` text; never a broken image.
- **Charts:** brand ramp only, no rainbow palettes, axes labelled in the units merchants think in
  (rand, units, days) — never in arbitrary index numbers.

---

## 7. Layout and navigation patterns

### Consumer shell
Top app bar (search-dominant) + collapsible left rail on desktop + bottom tab bar on mobile
(Home · Deals · Search · Chat · Sell). Content max-width 1440px; grid 12 columns; gutters 16/24px.

### Workspace shell
Persistent left sidebar (220px expanded / 64px collapsed, state remembered), sticky top bar with
store switcher, omnibar and notification bell, content area with a page header (title, breadcrumb,
primary action) and a scrollable body. Right-hand detail drawer for records so users never lose list
context. Target 1280px+ for dense tables; fully usable at 1024px; mobile shows the same modules in
card form.

### Breakpoints
`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`. Design mobile-first, then workspace-first
for merchant tables.

### Navigation rules
1. Maximum **7 top-level items** in any sidebar. Everything else lives in a section's sub-nav.
2. The current location is always visible (breadcrumb + active nav state + page title).
3. Badges show **live counts** from stored data — never a hardcoded number.
4. A user can always get back to the dashboard in one click.

---

## 8. Component inventory (target)

Build these once, in a shared `internal/ui` templ package, and use them in both applications.

| Group | Components |
|---|---|
| **Primitives** | Button (primary/secondary/ghost/danger, 3 sizes, loading + disabled), IconButton, Badge, Chip/Tag, Avatar, Divider, Tooltip, Kbd, Icon |
| **Forms** | Field wrapper (label, hint, error), Input, Textarea, Select, Combobox, Multi-select, Checkbox, Radio, Switch, DatePicker, MoneyInput (ZAR/USD aware), QuantityStepper, FileDrop, FormError summary |
| **Data display** | DataTable (sort, filter, column show/hide, sticky header, row select, bulk bar, empty state), StatCard, KpiTile, ProgressBar, Sparkline, DefinitionList, Timeline, DescriptionList, Pagination |
| **Feedback** | Toast (success/error/info, undo action), Alert, InlineBanner, ConfirmDialog (typed confirmation for destructive money actions), Skeleton, Spinner, EmptyState (illustration + action), ErrorState |
| **Overlays** | Modal, Drawer (right sheet), Popover, DropdownMenu, CommandPalette (⌘K), BottomSheet (mobile) |
| **Navigation** | AppBar, SidebarNav (grouped, collapsible, badges), Tabs, SubNav, Breadcrumb, Pagination, Stepper (wizard) |
| **Commerce (consumer)** | ProductCard, PriceBlock (price, unit, was/now, availability), OfferRow, BuyBox, MerchantCard, TrustPanel, AvailabilityPill, WhatsAppCTA, ShareRow, RecentlyViewedRail |
| **Workspace (merchant)** | OrderRow, OrderStatusPill, ProductRow, StockEditor, LowStockBanner, CustomerRow, QuoteBuilder, InvoicePreview, ManifestSheet, BarcodeScanPanel, SalesChart, ChannelStatusCard, FeedHealthCard, OnboardingChecklist, ActivationProgress |

**Every component ships with:** default / hover / focus-visible / active / disabled / loading /
error / empty where applicable, plus a11y contract (role, keyboard, aria attributes).

---

## 9. Page templates

| Surface | Template | Required elements |
|---|---|---|
| Consumer | Home / discovery | omnibox, category rail, deal rail, trust strip, install prompt, POPIA footer |
| Consumer | Search results | query summary, facet rail (category, price, location, availability), result grid, sort, "no results → ask for a quote" path, pagination |
| Consumer | Product | gallery, title/brand/GTIN, price block with per-offer rows, availability + last-observed time, merchant panel, WhatsApp/contact CTA, RFQ block, related items |
| Consumer | Storefront | merchant header (name, area, hours, contact), searchable catalogue, about, trust facts, share/QR, embed snippet |
| Consumer | Sell / onboarding | value proposition, three-step promise, import options, pricing table, FAQ |
| Workspace | Dashboard | activation checklist (until complete), KPI tiles, low-stock list, unread messages, today's tasks |
| Workspace | List view | filters, saved views, search, bulk bar, table/card toggle, pagination, empty state with primary action |
| Workspace | Record detail | header actions, status stepper, tabs (details, history, notes), audit trail, right drawer for edits |
| Workspace | Editor | two columns (form + live preview), autosave indicator, validation, publish/draft controls |
| Workspace | POS | product search, scan input, cart, payment method, receipt print, offline queue indicator |
| Workspace | Inbox | thread list, conversation pane, quote composer, quick replies, assignment, SLA timer |

---

## 10. Universal states

| State | Rule |
|---|---|
| **Loading** | Skeletons matching the final layout; no full-page spinner after first paint |
| **Empty** | Illustration + one sentence + one primary action; never a bare "No data" |
| **Error** | What happened, what it affects, what to do next, plus retry and a support reference |
| **Offline** | Persistent banner + queued-action count; POS keeps selling and syncs on reconnect |
| **Permission denied** | State which role is required and how to request it — never a blank page |
| **Stale data** | "Last updated {relative}" on any figure older than its freshness threshold |
| **Destructive** | Confirm dialog naming the object; typed confirmation for irreversible money actions |

---

## 11. Implementation rules in Go + templ

### 11.1 Pipeline (in the build, not in someone's memory)

```bash
npm run build:templ   # templ generate in both modules (v0.3.1020, pinned in go.mod)
npm run check:templ   # regenerate, then fail if *_templ.go is stale (CI gate)
npm run build:css     # Tailwind v4: input.css -> internal/assets/css/tailwind.min.css
npm run build         # Go static binary
```

`.templ` is the source of truth; `*_templ.go` is generated. A `.templ` edit committed without
regeneration must fail CI.

### 11.2 Asset rules

1. **No third-party runtime CDN.** HTMX, CSS, fonts and icons are embedded (`embed.FS`) and served
   from the same origin — a shop counter on a flaky link must still work.
2. Versioned asset paths carry `Cache-Control: immutable`; unversioned paths revalidate.
3. Serve a CSP that forbids inline script; allow inline style only where templ requires it.
4. Fonts: self-host WOFF2 latin subsets with `font-display: swap`; the Google Fonts link is a
   transitional fallback only (roadmap item P1-10).

### 11.3 Component authoring rules

- One templ file per component, one exported function, props as a typed struct (`ButtonProps`).
- No business logic in templates — view models are prepared in handlers (`internal/models`).
- Server-rendered partials with HTMX swaps beat client state. Client JS is reserved for: command
  palette, offline queue, barcode scanner, drag-and-drop, charts.
- One handler serves both modes: an `HX-Request` gets a fragment, a normal request gets the full page.

### 11.4 Migration map (today → target)

| Step | Action | Guardrail |
|---|---|---|
| 1 | Tokens extracted as CSS variables (done 2026-09-21) | Existing utility classes unchanged |
| 2 | Create a shared `ui` module; port Button, Badge, Card, Field, DataTable, EmptyState first | Byte-length and visual diff on six key pages |
| 3 | Convert the Merchant OS inline `<style>` to shared tokens, keeping artisan values as aliases | Dashboard renders identically; no layout shift |
| 4 | Replace emoji nav icons with the SVG icon component | Emoji count in templates → 0 outside content |
| 5 | Self-host fonts in both applications | LCP measured before and after |
| 6 | Delete the legacy duplicate stylesheet (`services/consumer-web/static/css/tailwind.min.css`) once unreferenced | No remaining references |

### 11.5 Governance checklist (every UI change)

- [ ] Tokens only — no ad-hoc hex or px for colour, radius or shadow
- [ ] States covered (default, hover, focus-visible, disabled, plus loading/empty/error where relevant)
- [ ] Keyboard reachable, visible focus ring, `aria-*` on custom widgets
- [ ] Works at 360px, 768px and 1280px
- [ ] Numbers, dates and currency formatted per §2 voice rules
- [ ] No new external network dependency
- [ ] Page weight within the §12 budget
- [ ] `npm run check:templ` and `npm test` pass

---

## 12. Performance budget (enforced, not aspirational)

| Metric | Budget |
|---|---|
| CSS transferred (first load, gzipped) | ≤ 25 KB |
| JS transferred (first load, gzipped) | ≤ 60 KB (HTMX ≈ 16 KB gz + app JS) |
| Fonts | ≤ 3 families, ≤ 6 WOFF2 files, ≤ 120 KB total |
| LCP (mid-range Android, fast 3G) | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| HTML per page | ≤ 120 KB uncompressed |
| Server render (p95, warm) | ≤ 150 ms |

A budget breach is a defect, not a future optimisation.

---

## 13. What this document already changed (verified 2026-09-21)

1. `input.css` defines the full token layer with `@theme static`; every token now emits as a CSS
   variable in the compiled stylesheet (verified: `--color-brand-600`, `--color-merchant-sidebar`,
   `--shadow-card`, `--ease-standard`, `--control-md`, `--color-ink-muted`, `--radius-pill` all present).
2. Merchant OS no longer loads HTMX from `unpkg.com`. It is embedded and served at
   `/static/js/htmx.min.js` (`200`, 49,567 bytes; the dashboard HTML contains **zero** CDN references).
3. Google Fonts in the workspace are non-blocking (preload + media swap), so first paint no longer
   waits on a font CDN.
4. `npm run build:templ` and `npm run check:templ` now exist, and all 40 generated template files were
   regenerated with the pinned templ version. They were **stale**; the diff was cosmetic
   (error-message file paths only), which confirms the pipeline is now reproducible.

**Next:** create the shared `ui` package, port the six foundational components, then convert the
workspace shell — see `docs/PRODUCT_TRANSFORMATION_BLUEPRINT.md` §7.





## 14. Merchant workspace implementation (2026-09-25)

What the Merchant OS now ships, and where it lives:

| Area | Implementation |
|---|---|
| Stylesheet | One cached file, `services/merchant-os/internal/assets/css/workspace.css`, served at `/merchant-static/css/workspace.css`. Tokens on `:root`, a full dark theme (system, light or dark from the account menu), type scale 12–38 px, 4 px spacing, status tokens (success, warning, danger, info). The ~1,000-line inline `<style>` block and its four duplicated "polish layers" are gone. |
| Type | Outfit (display) + Plus Jakarta Sans (body) + JetBrains Mono, the same stack as the consumer site. Bricolage/Instrument Sans are retired. |
| Shell | `layout.templ`: 7-section sidebar (`templates/nav.go` is the single map of sections → tabs), page title + breadcrumb, tab strip, account menu, demo banner. Tab swaps refresh the shell out-of-band so the active state can't go stale. |
| Phone | Below 1024 px the sidebar is a drawer; below 768 px a bottom bar appears (Home, Sell, Products, Stock, More), tables become labelled cards (`workspace.js` labels cells from the header row), touch targets are 44 px. |
| Behaviour | `assets/js/workspace.js`: toasts with Undo (server sends `HX-Trigger: {"toast": …}`), menus, copy buttons, keyboard shortcuts (Ctrl K search, Ctrl B sidebar, `g` then `o/p/s/i/c/m/a/h`), offline banner, service worker registration. |
| Offline | `/merchant-sw.js` caches the app shell and serves an offline page; the counter-sale screen queues sales on the device with a client reference so a resend can't double-count. |
| Money & numbers | `models.FormatZAR` / `FormatZARWhole` / `FormatInt` (R 12 499.00, non-breaking-space thousands), identical to the consumer site. No template formats money itself. |
| Figures | Every number comes from `handlers.computeMetrics` (sales, allowance, fees, stock, quotes, attention list, setup checklist). Plans live in `models.Plans`. |
| Listings | `models.ComputeReadiness` scores each product (0–100) against Shoppage, Google, Meta and WhatsApp rules, with a plain-language fix per failed check. Feeds include only products that pass. |

Honesty rules enforced by tests (`internal/handlers/merchant_test.go`): no invented KPIs, infrastructure claims, signatures, waybills, barcodes or AI; stock per location always sums to the product total; figures agree across screens.
