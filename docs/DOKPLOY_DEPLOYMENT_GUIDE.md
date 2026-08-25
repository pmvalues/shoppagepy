# Shoppage Django Platform — Dokploy Deployment Guide (v8.1)

This guide walks you through deploying the **Shoppage Django Platform** to your Dokploy server.

---

## 1. Prerequisites
- A running **Dokploy** instance (hosted on a VPS like Hetzner, DigitalOcean, Linode, AWS, etc.).
- Access to the GitHub repository: `https://github.com/pmvalues/shoppagepy.git`.
- A domain or subdomain configured to point to your Dokploy server (e.g. `shoppage.co.za` or `app.yourdomain.com`).

---

## 2. Deployment Method: Dokploy Application (Recommended)

Dokploy can deploy the project directly from the GitHub repository using the optimized multi-stage `Dockerfile`.

### Step 1: Create a New Project & Application in Dokploy
1. Log in to your **Dokploy Dashboard**.
2. Click **Projects** &rarr; **Create Project** (e.g. `Shoppage`).
3. Click **Create Service** &rarr; select **Application**.
4. Set Application Name: `shoppage-web`.

---

### Step 2: Connect GitHub Repository
1. In the Application settings, go to the **Source** tab.
2. Select **GitHub** (or Git).
3. Set **Repository URL**: `https://github.com/pmvalues/shoppagepy.git`
4. Set **Branch**: `main`
5. Set **Build Type**: `Dockerfile`
6. Set **Dockerfile Path**: `./Dockerfile`

---

### Step 3: Configure Environment Variables
Navigate to the **Environment** tab in Dokploy and paste the following environment variables:

```env
# Django Core Settings
DJANGO_SETTINGS_MODULE=shoppage.settings.prod
DJANGO_SECRET_KEY=generate-a-strong-random-50-character-secret-key
DJANGO_DEBUG=False

# Host & CSRF Configuration (Replace with your actual domain)
ALLOWED_HOSTS=shoppage.co.za,*.shoppage.co.za,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://shoppage.co.za,https://*.shoppage.co.za,https://*.dokploy.app

# Database Configuration (Optional: Use internal PostgreSQL or SQLite)
# If using PostgreSQL in Dokploy:
# DATABASE_URI=postgres://user:password@shoppage-postgres:5432/shoppage_db

# Security Headers (Enable if your domain uses HTTPS via Traefik/Dokploy)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Cache & Redis (Optional)
# REDIS_URL=redis://shoppage-redis:6379

# Commerce WhatsApp & AI Keys (Optional)
XAI_API_KEY=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

---

### Step 4: Configure Domain & Routing in Dokploy
1. Go to the **Domains** tab in Dokploy.
2. Click **Add Domain**.
3. Enter your domain (e.g. `shoppage.co.za` or `app.yourdomain.com`).
4. Set **Container Port**: `8000`.
5. Enable **HTTPS / SSL** (Dokploy will automatically issue a free Let's Encrypt SSL certificate).

---

### Step 5: Deploy & Initialise
1. Click **Deploy**.
2. Dokploy will pull the code from GitHub, build the multi-stage Docker container, install dependencies, run migrations, collect static files, and start Gunicorn on port `8000`.
3. Once deployed, open the **Terminal / Console** tab inside Dokploy for `shoppage-web` and seed the national catalog if needed:

```bash
# Seed 3,296 Malls & Commercial Hubs
python manage.py seed_all_malls_and_markets --count 3296

# Seed 1,000,000 Products & 3,100,000 Merchants
python manage.py seed_national_scale_grid --products 1000000 --merchants 3100000

# Create an Admin Superuser
python manage.py createsuperuser
```

---

## 3. Alternative: Multi-Container Stack via Dokploy Compose

If you wish to deploy Django along with PostgreSQL 16 (`pgvector`), Redis 7, and Typesense:

1. In Dokploy, click **Create Service** &rarr; select **Docker Compose**.
2. Select **Git** and point to `https://github.com/pmvalues/shoppagepy.git` using `docker-compose.yml`.
3. Fill in the `.env` secrets.
4. Click **Deploy Stack**.

---

## 4. Post-Deployment Verification Checklist

- [ ] **Home Page**: `https://your-domain.com/` loads instantly with hero search and stats.
- [ ] **Malls Directory**: `https://your-domain.com/malls/` displays 3,296 commercial hubs.
- [ ] **Merchant Centre**: `https://your-domain.com/merchant/dashboard/` opens the 5-tab reactive OS.
- [ ] **Admin Command Center**: `https://your-domain.com/admin/` with WCAG AAA high contrast theme.
