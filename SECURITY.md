# Security Policy

This document describes the security controls of the **running Go platform**
(`services/*`, `pkg/platform`) as of 2026-09-25. Every control cites the file
that implements it and the test that guards it. Anything not yet mitigated is
listed under **Known gaps** — the posture is not overstated.

## Reporting a vulnerability

Email **security@shoppage.co.za**. Please give us a reasonable window to fix
an issue before disclosing it publicly.

## 1. Production is the default

| Control | Implementation | Test |
|---|---|---|
| Any `SHOPPAGE_ENV` other than `development`/`dev`/`local`/`test` — including unset — is production | `pkg/platform/env/env.go` (`IsProduction`) | `env_test.go` |
| Missing `SHOPPAGE_AUTH_SECRET` / `SHOPPAGE_ADMIN_*` are bootstrapped at startup (operator-set values win); the process no longer refuses to start without them | `services/merchant-os/internal/auth/bootstrap.go` | `auth_test.go` (`TestBootstrapFillsMissingAuthWhenUnconfigured`), `merchant-os/app/app_test.go` |
| Production refuses to start without `DATABASE_URL` (explicit `SHOPPAGE_ALLOW_EPHEMERAL=true` override for demos) | `pkg/platform/db/env.go` | verified by running the binary |

## 2. Merchant OS authentication

| Control | Implementation |
|---|---|
| HMAC-SHA256 signed session tokens with expiry; constant-time comparison; fails closed without a secret | `services/merchant-os/internal/auth/session.go` |
| Session cookie `HttpOnly`, `SameSite=Lax`, and `Secure` in production (TLS ends at Caddy, so `r.TLS` alone is not used) | `session.go`, `handlers/merchant.go` (`Login`) |
| Login limited to 10 attempts per minute per client IP | `services/merchant-os/app/app.go` |
| All workspace routes require a session | `app.go` (`protected` router) |

## 3. Network edge and client identity

| Control | Implementation |
|---|---|
| Only Caddy publishes ports (80/443); app and database are on internal Docker networks | `docker-compose.yml` |
| Automatic HTTPS, HSTS, `www` → apex redirect | `Caddyfile` |
| Client IP comes from the TCP peer; `X-Forwarded-For` is honoured only when the peer is a trusted proxy (`TRUSTED_PROXIES`, default loopback + private ranges). Replaces chi's deprecated, spoofable `RealIP` | `pkg/platform/web/clientip.go` — `web_test.go` |
| Host installs (systemd) trust only `127.0.0.1` | `deploy/shoppage.service` |

## 4. Browser protections

| Control | Implementation |
|---|---|
| Cross-site state-changing requests are rejected (CSRF), using Go's `http.CrossOriginProtection` (`Sec-Fetch-Site` / `Origin`) | `pkg/platform/web/security.go` |
| Content-Security-Policy, `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/embed/*` stays frameable by merchant sites | `security.go` |
| Chat WebSocket upgrades accepted only from the page's own host or `ALLOWED_ORIGINS` (blocks cross-site WebSocket hijacking); clients cannot claim the `system` role | `services/chat-gateway/internal/handlers/chat.go` — `origin_test.go` |
| Assistant output and product fields are HTML-escaped in the HTMX card | `services/consumer-web/internal/handlers/consumer.go` — `TestAssistantCardEscapesReply` |
| CORS never allows `*` | `env.AllowedOrigins` |

## 5. Abuse and cost controls

Per client IP, per process (`pkg/platform/web/ratelimit.go`). Exceeding a limit returns `429`.

| Surface | Limit |
|---|---|
| Every route (safety net) | 600 / min |
| `/api/assistant` (may call a paid model) | 20 / min |
| `/offer/submit`, `/feed/post`, `/store/review`, `/checkout/instant` | 20 / min |
| `/sell/register` | 5 / min |
| `/auth/login` | 10 / min |
| `/ws/chat` new connections | 30 / min (plus per-message limits inside each connection) |

- **AI spend cap:** at most `GEMINI_DAILY_LIMIT` live model calls per UTC day (default 2,000), then offline rules. `services/consumer-web/internal/ai/gemini.go` (`DailyBudget`). Also set a hard quota on the Google Cloud key.
- **Search index writes** (`/api/index/batch`) require `SEARCH_INDEX_TOKEN`; disabled in production without it. `services/search-core/app/app.go`.
- **Metrics** (`/metrics`) require `METRICS_TOKEN`; hidden in production without it.

## 6. Data integrity

- Orders, supplier registrations, reviews and feed posts are written to PostgreSQL **before** they are shown or confirmed; if the write fails the user gets `503`, never a false confirmation. `services/consumer-web/internal/store/persist.go`.
- Merchant OS writes are made durable before the response is sent. `services/merchant-os/app/app.go` (`persistWrites`).
- Order numbers and review IDs are random (`site.NewID`), not clock-derived, so they cannot collide and overwrite each other.
- A supplier registration can never replace an existing storefront. `store.AddMerchant`.
- Schema changes are versioned migrations embedded in the binary. `pkg/platform/db/migrations/`.

## 7. Supply chain and build

- CI runs gitleaks, `gofmt`, `go vet`, race-enabled tests (including PostgreSQL integration tests), a templ drift check, `govulncheck` for every module, and a container build. `.github/workflows/deploy.yml`.
- Go 1.27.1; runtime image `alpine:3.24`, non-root user. `Dockerfile`.
- systemd unit runs with `ProtectSystem=strict`, no capabilities and a single writable state path. `deploy/shoppage.service`.

## Known gaps

| Gap | Impact | Next step |
|---|---|---|
| One platform-admin credential; no per-merchant users, roles or MFA; the admin password is compared from the environment, not stored as a hash | No per-user audit trail; a leaked password grants the whole desk | Per-user accounts with hashed passwords (argon2id) and roles |
| An unconfigured instance bootstraps the known demo desk credentials instead of refusing to start | Anyone who knows the defaults can log into the desk of a fresh deployment | Set `SHOPPAGE_ADMIN_EMAIL` / `SHOPPAGE_ADMIN_PASSWORD` / `SHOPPAGE_AUTH_SECRET` on every instance |
| Chat `userId` and `merchant`/`agent` roles are self-declared by the client | A buyer can impersonate a merchant in a chat room | Issue signed chat tokens from the authenticated session |
| CSP allows `'unsafe-inline'` scripts (templates use inline scripts and handlers) | CSP limits script origins but does not stop injected inline script | Move inline JS to static files, then use nonces |
| Rate limits and the AI budget are per process | Limits multiply if you run several replicas | Shared counters (e.g. Redis) before horizontal scaling |
| Merchant workspace is saved as one JSONB document per tenant | Whole-document, last-writer-wins saves; fine for one tenant, not for many concurrent editors | Normalised tables per entity |
| Chat history (SQLite) and merchant media uploads live on the `/app/state` volume, not in PostgreSQL | Not covered by database backups | Back up the volume, or move both to PostgreSQL / object storage |
| No WAF or DDoS protection in front of Caddy | Volumetric attacks reach the origin | CDN/WAF in front of the host |
| POPIA review of the merchant datasets not done | Personal information may be present | See `docs/DATA_RIGHTS_DISPOSITION.md` |
| Database backups are not automated by this repository | Data loss on host failure | Managed PostgreSQL with point-in-time recovery, or scheduled `pg_dump` |
