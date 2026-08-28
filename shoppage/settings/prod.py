import os

from .base import *

# Surface the active database engine in logs — a silent SQLite fallback in a
# container means ephemeral data loss on every redeploy.
_active_engine = DATABASES['default']['ENGINE']
print(f"[shoppage] database engine: {_active_engine}")
if 'sqlite' in _active_engine:
    print(
        "[shoppage] WARNING: DATABASE_URL/DATABASE_URI is not set — falling back to "
        "SQLite inside the container. Data will be LOST on redeploy. "
        "Set DATABASE_URI to a PostgreSQL URL for production."
    )

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError(
        'DJANGO_SECRET_KEY environment variable must be set in production. '
        'Refusing to start with a committed fallback secret.'
    )

# Production hosts must be set explicitly; never fall back to a wildcard.
hosts_env = os.environ.get('ALLOWED_HOSTS', '').strip()
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['shoppage.co.za', 'www.shoppage.co.za', 'localhost', '127.0.0.1']

# CSRF Trusted Origins for Dokploy Domains, sslip.io, and custom domains
csrf_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '').strip()
if csrf_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_env.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        'https://*.sslip.io',
        'http://*.sslip.io',
        'https://*.dokploy.app',
        'http://*.dokploy.app',
        'https://*.shoppage.co.za',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ]

# WhiteNoise production static file serving (graceful fallback if not present)
try:
    import whitenoise  # type: ignore
    if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
        MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
except ImportError:
    pass

# SSL and Proxy Headers (for Traefik/Dokploy reverse proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'True').lower() == 'true'

try:
    from .local import *  # type: ignore
except ImportError:
    pass
