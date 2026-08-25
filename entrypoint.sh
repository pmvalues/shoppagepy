#!/usr/bin/env bash
set -e

echo "==> Running Database Migrations..."
python manage.py migrate --noinput

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput

echo "==> Ensuring Admin Superuser..."
python manage.py create_admin_user || true

echo "==> Launching Gunicorn Production Server on Port 8000..."
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 120 shoppage.wsgi:application
