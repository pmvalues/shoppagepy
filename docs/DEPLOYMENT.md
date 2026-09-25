# Deploying Shoppage

Shoppage ships as **one static Go binary** that serves the consumer site and
mounts Merchant OS, the chat gateway and the search core in-process. In
production it runs behind Caddy (automatic HTTPS) with PostgreSQL as the
system of record.

```
Internet ──► Caddy :80/:443 ──► shoppage :3000 ──► PostgreSQL :5432
             (TLS, HSTS)        (one process)       (internal network only)
                                 └─ /app/state volume: chat history (SQLite), media uploads
```

## Option A — Docker Compose (recommended)

Requirements: a Linux host with Docker, and DNS `A`/`AAAA` records for
`shoppage.co.za` and `www.shoppage.co.za` pointing at it.

```bash
cp .env.example .env
# Fill in: POSTGRES_PASSWORD, SHOPPAGE_AUTH_SECRET (openssl rand -base64 48),
#          SHOPPAGE_ADMIN_EMAIL, SHOPPAGE_ADMIN_PASSWORD (12+ chars)
# Optional: GEMINI_API_KEY, SENTRY_DSN, METRICS_TOKEN
docker compose up -d --build
docker compose logs -f shoppage     # JSON logs; look for "listening"
curl -fsS https://shoppage.co.za/readyz
```

Compose refuses to start if a required secret is empty, and the app refuses to
start in production with weak or default credentials or without a database.

**Upgrades:** `git pull && docker compose up -d --build`. Migrations run
automatically at startup and are versioned in `pkg/platform/db/migrations/`.

**Backups:** back up the `pgdata` volume (or run `pg_dump`) **and** the
`shoppage_state` volume (chat history and uploaded media).

## Option B — Dokploy

1. Create an **Application** from this repository, build type **Dockerfile**,
   target `shoppage` (the default final stage).
2. Create a **PostgreSQL** service in the same project and copy its internal
   connection string into `DATABASE_URL`.
3. Set the environment from `.env.example` (`SHOPPAGE_ENV=production`,
   `SHOPPAGE_AUTH_SECRET`, `SHOPPAGE_ADMIN_*`, `SHOPPAGE_PUBLIC_URL`,
   `ALLOWED_ORIGINS`, …).
4. Mount a persistent volume at `/app/state`.
5. Add the domain in Dokploy (its Traefik terminates TLS). Traefik reaches the
   container over Dokploy's private network, which `TRUSTED_PROXIES` trusts
   by default. Do **not** also publish port 3000 on the host.
6. Put the Dokploy deploy webhook in the GitHub secret `DOKPLOY_WEBHOOK_URL`.
   CI calls it only after every check passes on `main`.

## Option C — systemd on a VM (no Docker)

```bash
make build                                   # bin/shoppage (static, linux/amd64)
sudo useradd --system --home /opt/shoppage shoppage
sudo install -d -o shoppage /opt/shoppage/state
sudo install -m 0755 bin/shoppage /opt/shoppage/shoppage
sudo cp -r services/consumer-web/data /opt/shoppage/data
sudo install -d -m 0750 /etc/shoppage
sudo install -m 0600 .env /etc/shoppage/shoppage.env   # with DATABASE_URL set
sudo cp deploy/shoppage.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now shoppage
```

Run Caddy on the same host with the `Caddyfile`, changing the upstream from
`shoppage:3000` to `127.0.0.1:3000`. The unit trusts forwarded headers only
from `127.0.0.1`.

## Configuration reference

| Variable | Required | Purpose |
|---|---|---|
| `SHOPPAGE_ENV` | — | `production` (default when unset) or `development`/`test` |
| `DATABASE_URL` | prod | PostgreSQL connection string |
| `SHOPPAGE_AUTH_SECRET` | prod | 32+ character session signing key |
| `SHOPPAGE_ADMIN_EMAIL`, `SHOPPAGE_ADMIN_PASSWORD` | prod | Merchant OS sign-in (password 12+ chars) |
| `SHOPPAGE_PUBLIC_URL`, `ALLOWED_ORIGINS` | prod | Canonical origin; CORS and cross-origin POST allow-list |
| `TRUSTED_PROXIES` | — | CIDRs allowed to set `X-Forwarded-For` (default private ranges; `none` to disable) |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_DAILY_LIMIT` | — | AI assistant; default model `gemini-3.6-flash`, 2,000 calls/day |
| `SENTRY_DSN` | — | Error reporting |
| `METRICS_TOKEN` | — | Bearer token for `/metrics` (hidden in production without it) |
| `LOG_LEVEL` | — | `debug`, `info` (default), `warn`, `error` |
| `CHAT_DB_PATH`, `MERCHANT_DATA_DIR` | — | Paths on the state volume (set by the image) |
| `FOUNDATION_DATA_DIR` | — | Read-only mount of the bulk SQLite reference datasets |
| `MERCHANT_OS_URL`, `CHAT_GATEWAY_URL`, `SEARCH_CORE_URL` | — | Split deployment only: route that component to a separate service |

## Operations

| Endpoint | Use |
|---|---|
| `/healthz` | Liveness and catalogue counts (container `HEALTHCHECK`) |
| `/readyz` | Readiness, including a database ping (`503` when the DB is down) |
| `/metrics` | Prometheus: `http_requests_total`, `http_request_duration_seconds`, `http_panics_total`, `ai_model_calls_total`, `ai_budget_exhausted_total`, Go runtime and process metrics |

Logs are structured JSON on stdout, one line per request, carrying
`request_id`, `route`, `status`, `duration_ms` and the resolved client `ip`.

## Split deployment (optional)

Each component still has its own entry point and Docker target
(`merchant-os`, `chat-gateway`, `search-core`). To move one out, deploy that
target and set the matching `*_URL` on the main binary; everything else stays
in-process. You should only need this if one component has to scale
independently.
