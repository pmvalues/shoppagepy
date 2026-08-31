import os

from .base import *

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY', '')
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY environment variable is required in production.")

# Reverse proxy & SSL headers (Traefik / Dokploy / Cloudflare / Nginx)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# CSRF & Session Security
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'True').lower() == 'true'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Production hosts configuration (strict host matching)
hosts_env = os.environ.get('ALLOWED_HOSTS', '').strip()
if hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in hosts_env.split(',') if h.strip() and h.strip() != '*']
else:
    ALLOWED_HOSTS = ['shoppage.co.za', 'www.shoppage.co.za']

# Comprehensive CSRF Trusted Origins
trusted_origins = [
    'https://shoppage.co.za',
    'https://www.shoppage.co.za',
    'http://shoppage.co.za',
    'http://www.shoppage.co.za',
    'https://*.shoppage.co.za',
    'http://*.shoppage.co.za',
    'https://*.dokploy.app',
    'http://*.dokploy.app',
    'https://*.sslip.io',
    'http://*.sslip.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost',
    'http://127.0.0.1',
]

# Merge any environment variable origins
csrf_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '').strip()
if csrf_env:
    for item in csrf_env.split(','):
        item = item.strip().rstrip('/')
        if item and item not in ('*', 'http://*', 'https://*'):
            if not item.startswith('http://') and not item.startswith('https://'):
                trusted_origins.append(f'https://{item}')
                trusted_origins.append(f'http://{item}')
            else:
                trusted_origins.append(item)

# Merge allowed hosts as trusted origins
for host in ALLOWED_HOSTS:
    if host and host not in ('*', 'localhost', '127.0.0.1'):
        clean_host = host.strip().lstrip('.').rstrip('/')
        if not clean_host.startswith('http://') and not clean_host.startswith('https://'):
            trusted_origins.append(f'https://{clean_host}')
            trusted_origins.append(f'http://{clean_host}')
            trusted_origins.append(f'https://*.{clean_host}')
            trusted_origins.append(f'http://*.{clean_host}')

# Deduplicate while preserving order and filtering out any invalid bare wildcards
CSRF_TRUSTED_ORIGINS = [
    o for o in list(dict.fromkeys(trusted_origins))
    if o not in ('https://*', 'http://*', '*')
]

# WhiteNoise production static file serving (graceful fallback if not present)
try:
    import whitenoise  # type: ignore
    if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
        MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
except ImportError:
    pass

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() == 'true'

try:
    from .local import *  # type: ignore
except ImportError:
    pass

