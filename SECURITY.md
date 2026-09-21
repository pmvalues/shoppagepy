> **⚠ STATUS (2026-09-21): HISTORICAL — this document describes the archived TypeScript/Next.js application, not the live runtime.**
> The running platform is 100% Go (`services/*`); nothing cited below exists in it today.
> Verified current state, gaps and remediation: `docs/PLATFORM_READINESS_ANALYSIS_2026-09-21.md`.
> **Do not use this document as a description of the platform's security posture.**

# Security Policy & Responsible Disclosure

Shoppage (Pty) Ltd operates a zero-tolerance policy towards unmitigated security
vulnerabilities across our commerce intelligence platform, merchant operating systems,
and public edge services.

**This document describes controls that are implemented and verified in the codebase.**
Each claim cites the file that implements it. Claims that are aspirational or
incomplete are listed in §6 Known Gaps rather than implied to be complete.

---

## 1. Reporting a Vulnerability

* **Email**: security@shoppage.co.za
* **Response Time**: Initial acknowledgment within 24 hours; severity assessment and
  triage update within 72 hours.
* **Coordination**: We request that you observe responsible disclosure principles and do
  not disclose vulnerabilities publicly until a patch has been verified and deployed.

---

## 2. Authentication & Session Integrity

| Control | Implementation |
|---|---|
| Session tokens signed with HMAC-SHA256 via Web Crypto | `apps/web/src/lib/auth.ts` (`signSession`, `computeHmacSignature`) |
| Signature verified with constant-time comparison | `apps/web/src/lib/auth.ts` (`verifySession`) |
| Session expiry enforced server-side | `apps/web/src/lib/auth.ts` (`expiresAt` check) |
| Cookies are HttpOnly, SameSite=Lax, Secure in production | `apps/web/src/lib/auth.ts` (`setSessionCookie`) |
| Plaintext credential comparison avoided | `apps/web/src/lib/auth.ts` (`safeEqual`) |
| Login endpoint rate limited (brute-force mitigation) | `apps/web/src/app/api/auth/login/route.ts` |

### Development authentication is explicitly opt-in

Development convenience passwords (`admin123`, the masked placeholder) are accepted
**only** when `SHOPPAGE_ALLOW_DEV_AUTH=true` is set deliberately, and are **refused
outright** when `NODE_ENV=production`. Development mode is never inferred from
`NODE_ENV` being absent. A merchant with no configured secret cannot authenticate at
all outside dev mode.

*Implementation:* `apps/web/src/lib/auth.ts` (`isDevAuthEnabled`, `verifyCredentials`)
*Regression guard:* `apps/web/test/security.test.ts` (WS-1.1 suite)

---

## 3. Secrets & Credential Management

1. **No hardcoded secrets.** Production secrets, signing keys and API tokens are
   injected via the deployment platform's encrypted secret store.
2. **Startup validation.** The server refuses to start under `NODE_ENV=production` if
   any secret is missing, too short, a known placeholder, shared between merchants, or
   if dev auth is enabled.
   *Implementation:* `apps/web/src/server/env-check.ts`
3. **Automated secret scanning.** CI runs gitleaks on every push and pull request and
   blocks the build on any finding.
   *Implementation:* `.github/workflows/deploy.yml`, `.gitleaks.toml`
4. **Rotation.** Any leaked credential must be invalidated at the provider and rotated
   across active deployments.

> **Note on git history:** verified 2026-09-10 that `.env.local` was never committed.
> Only `.env.example` appears in history across all checkpoints. Snapshot rotation is
> therefore sufficient; no history rewrite is required.

---

## 4. Authorization & Tenant Isolation

| Control | Implementation |
|---|---|
| Route guards for `/admin/dashboard` and `/merchant/dashboard` | `apps/web/src/middleware.ts` |
| Merchant-to-store tenant scoping (cross-tenant reads redirected) | `apps/web/src/middleware.ts` |
| Cross-tenant writes rejected with 403 | `apps/web/src/app/api/cms/[collection]/route.ts` |
| Verified session identity propagated to handlers | `apps/web/src/middleware.ts` (`x-auth-user-id`, `x-auth-user-role`) |
| Platform admin credentials cannot authenticate as a merchant | `apps/web/src/lib/auth.ts` (`verifyCredentials`) |
| Privileged merchant reads/mutations require a session and enforce tenant scope | `apps/web/src/server/api-auth.ts` (`requireMerchantScope`) |
| Ops and ingestion routes require a SuperAdmin session or `x-admin-token` | `apps/web/src/server/api-auth.ts` (`requireSuperAdminOrAdminToken`) |
| Buyer-facing intake (leads, proforma) stays public but rate limited | `apps/web/src/app/api/merchants/leads/route.ts`, `apps/web/src/app/api/orders/proforma/route.ts` |

*Tests:* `apps/web/test/security.test.ts` (tenant isolation + middleware guards), `apps/web/test/api_authz.test.ts` (WS-1.6 route authorization)

---

## 5. Network Transport, Edge Hardening & Abuse Control

### HTTP security headers — verified present

*Implementation:* `apps/web/next.config.mjs`

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| X-DNS-Prefetch-Control | `on` |

### Rate limiting — verified present

A shared limiter governs public surfaces with per-policy ceilings. Exceeding a limit
returns `429` with `Retry-After`.

*Implementation:* `apps/web/src/server/rate-limit.ts` (`enforceRateLimit`, `RATE_LIMITS`)

| Surface | Limit |
|---|---|
| `/api/search` (LLM-backed) | 20 / min |
| `/api/assistant` | 20 / min |
| `/api/v1/search`, `/api/v1/products`, `/api/v1/merchants` | 120 / min |
| `/api/search/autocomplete` | 240 / min |
| `/api/auth/login` | 10 / min |
| `/api/v1/requests` | 20 / min |
| `/api/orders/proforma` (storefront create) | 30 / min |
| `/api/merchants/leads` (storefront intake) | 120 / min |

> **Limitation:** the limiter is **in-process memory**, so the effective limit is
> per-instance, not global. It is correct for a single-instance deployment and must be
> replaced with a Redis-backed implementation before horizontal scaling. Tracked as WS-4B.

### Webhook authentication — verified present

Subscription webhooks are authenticated by HMAC signature before any processing
(Paystack SHA-512, Stripe timestamped SHA-256); unverified requests receive `401`.
Every verified event is persisted exactly once and subscription transitions are applied
for entitlement checks.

*Implementation:* `apps/web/src/app/api/billing/webhook/route.ts`, `apps/web/src/server/billing-store.ts`
*Regression guard:* `apps/web/test/billing_webhook.test.ts`

---

## 6. Known Gaps

These are **not** mitigated today. They are listed so the posture is not overstated.

| Gap | Impact | Tracking |
|---|---|---|
| Rate limiter is per-instance, not distributed | Limits multiply across replicas | WS-4B (Redis) |
| Rate-limit key trusts `x-forwarded-for` and the container publishes port 3000 | A direct connection can spoof the client IP and bypass per-IP limits | Deploy config before launch |
| No WAF or edge DDoS protection evidenced | Volumetric attacks reach the origin | WS-3.4 |
| No automated dependency/vulnerability scanning in CI | Supply-chain risk unmonitored | WS-6 |
| No error tracking or structured alerting | Breaches may go unnoticed | WS-3.4 |
| Merchant authentication is a shared-secret map, not per-user identity | No per-user audit trail; no MFA | Post-launch |
| No POPIA personal-data audit of the merchant dataset | Sole-trader numbers may be present | WS-2.5 |

---

## 7. Data Governance

Shoppage enforces a **default-deny** source rights register. A data source absent from
the register cannot be published.

| Control | Implementation |
|---|---|
| Source rights register with default-BLOCKED posture | `packages/kernel/src/rights/register.ts` |
| Read-path enforcement (public search and per-product accessors) | `packages/kernel/src/repository/discovered_offers_store.ts` |
| AI-path enforcement (`isAiProcessing` excludes non-consenting sources) | `apps/web/src/lib/external_discovery.ts` |
| Third-party retail catalogues blocked pending agreement | `docs/DATA_RIGHTS_DISPOSITION.md` |

**0% Take-Rate / Zero-Custody:** Shoppage does not process or hold buyer credit-card
payments or merchant funds. Transactions complete directly between merchant and buyer,
minimising PCI-DSS scope and transactional liability.

---

## 8. Security Update Log

| Date | Scope | Status |
|---|---|---|
| 2026-09-11 | WS-1.6 API authorization: merchant/ops/ingestion routes now require a session + tenant scope or `x-admin-token`; CMS customer/order reads locked; billing webhooks persisted idempotently; claim flow issues scrypt-hashed credentials and never echoes operator env secrets; `/api/ops/ready` added; Docker runtime aligned to Node 22 (`node:sqlite`) | **Completed** |
| 2026-09-10 | WS-1.1 dev auth bypass removed; WS-1.2 secrets rotated + startup validation; WS-1.3 rate limiting applied to all public surfaces; WS-1.5 gitleaks CI; WS-2 rights register instantiated and enforced; WS-3.1 database integrity verified | **Completed** |
| Q3 2026 | Secret sanitization, HTTP security headers, CI quality gates | Enforced |

For compliance, enterprise verification or audit reports, contact
compliance@shoppage.co.za.
