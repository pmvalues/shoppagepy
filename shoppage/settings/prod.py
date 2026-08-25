import os
from .base import *

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'shoppage-prod-secret-key-change-me-in-dokploy')

# Allow all hosts or comma-separated list from Dokploy
hosts_env = os.environ.get('ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]

# CSRF Trusted Origins for Dokploy Domains
csrf_env = os.environ.get('CSRF_TRUSTED_ORIGINS', 'https://*.dokploy.app,https://*.shoppage.co.za,http://localhost:8000')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_env.split(',') if o.strip()]

# WhiteNoise production static file serving
if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# SSL and Proxy Headers (for Traefik/Dokploy reverse proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False').lower() == 'true'

try:
    from .local import *
except ImportError:
    pass
