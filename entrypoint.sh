#!/usr/bin/env bash

# Ensure write permissions for static, media, and data
mkdir -p /app/staticfiles /app/media /app/data
chmod -R 777 /app 2>/dev/null || true

echo "==> Waiting for Database Readiness..."
python -c "
import time, os, sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoppage.settings.prod')
django.setup()
from django.db import connection

for attempt in range(1, 31):
    try:
        connection.ensure_connection()
        print(f'==> Database reachable ({connection.vendor}) on attempt {attempt}!')
        sys.exit(0)
    except Exception as e:
        print(f'==> Waiting for database... (attempt {attempt}/30): {e}')
        time.sleep(1)
print('==> Database wait timed out, continuing startup...')
" || true

echo "==> Running Database Migrations..."
python manage.py migrate --noinput || true

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput || true

echo "==> Ensuring Admin Superuser..."
python manage.py create_admin_user || true

# ---------------------------------------------------------------------------
# Bootstrap seeding & sweeping (flagships, malls, retailer/merchant sweeps,
# FTS rebuild) runs in the BACKGROUND after gunicorn is already serving.
# Running it inline used to block the container for many minutes on every
# deploy/restart, which the reverse proxy reported as 502 Bad Gateway.
# Set RUN_BOOTSTRAP_SEED=false to skip it entirely.
# ---------------------------------------------------------------------------
if [ "${RUN_BOOTSTRAP_SEED:-true}" = "true" ]; then
  echo "==> Launching background bootstrap (seeds + sweeps + FTS rebuild)..."
  (
    echo "[$(date -u +%FT%TZ)] bootstrap started"
    python manage.py seed_shoppage_flagships
    python manage.py seed_all_malls_and_markets
    python manage.py sweep_major_retailers
    python manage.py sweep_live_merchants --limit 5000
    python manage.py rebuild_catalog_fts
    echo "[$(date -u +%FT%TZ)] bootstrap finished"
  ) > /app/data/bootstrap.log 2>&1 &
else
  echo "==> RUN_BOOTSTRAP_SEED=false — skipping background bootstrap."
fi

echo "==> Launching Gunicorn Production Server on Port 8000..."
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 120 shoppage.wsgi:application
