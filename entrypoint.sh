#!/usr/bin/env bash
set -e

# Ensure write permissions for database, cache, and media
mkdir -p /app/staticfiles /app/media /app/data
chmod -R 777 /app 2>/dev/null || true

echo "==> Running Database Migrations..."
python manage.py migrate --noinput

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput

echo "==> Ensuring Admin Superuser..."
python manage.py create_admin_user || true

echo "==> Auto-seeding Flagship Products, Malls, Merchants, Shows & Shorts..."
python manage.py seed_shoppage_flagships || true

echo "==> Seeding all 3,296 Shopping Centres, Wholesale Hubs & Taxi Ranks..."
python manage.py seed_all_malls_and_markets || true

echo "==> Rebuilding FTS5 Search Index..."
python manage.py rebuild_catalog_fts || true

echo "==> Launching Gunicorn Production Server on Port 8000..."
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 120 shoppage.wsgi:application
