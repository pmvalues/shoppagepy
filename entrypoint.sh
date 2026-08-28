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

echo "==> Auto-seeding Flagship Catalog & Markets..."
python manage.py seed_shoppage_flagships || true

echo "==> Launching Gunicorn Production Server on Port 8000..."
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 120 shoppage.wsgi:application
