"""
Django Base Settings for Shoppage Platform v8.1 (Global AI Commerce Intelligence & Hypermedia Architecture)
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Security
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-shoppage-v8-1-commerce-intelligence-platform-key')
DEBUG = True
ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    # Django core apps
    'shoppage.apps.ShoppageAdminConfig',  # replaces django.contrib.admin (custom AdminSite)
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # Shoppage v8.1 Domain & Authority Plane Apps
    'apps.core',
    'apps.merchants',
    'apps.markets',
    'apps.catalog',
    'apps.offers',
    'apps.rights',
    'apps.evidence',
    'apps.media_hub',
    'apps.referrals',
    'apps.intelligence',
    'apps.api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'django.middleware.http.ConditionalGetMiddleware',
]

ROOT_URLCONF = 'shoppage.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'apps.core.context_processors.shoppage_global_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'shoppage.wsgi.application'
ASGI_APPLICATION = 'shoppage.asgi.application'

# Database
# Default: SQLite for fast zero-dependency local execution; PostgreSQL supported via DATABASE_URL or DATABASE_URI
sqlite_env_path = os.environ.get('SQLITE_DB_PATH')
if sqlite_env_path:
    sqlite_db_name = Path(sqlite_env_path)
elif (BASE_DIR / 'data' / 'db.sqlite3').exists():
    sqlite_db_name = BASE_DIR / 'data' / 'db.sqlite3'
else:
    sqlite_db_name = BASE_DIR / 'db.sqlite3'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': sqlite_db_name,
        'OPTIONS': {
            'timeout': 60,
            'init_command': 'PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 60000;',
        },
    }
}

db_url = os.environ.get('DATABASE_URL') or os.environ.get('DATABASE_URI')
use_sqlite = os.environ.get('USE_SQLITE', '').lower() in ('1', 'true', 'yes')

if not use_sqlite and db_url and (db_url.startswith('postgres://') or db_url.startswith('postgresql://')):
    import urllib.parse
    url = urllib.parse.urlparse(db_url)
    db_name = url.path[1:]
    if '?' in db_name:
        db_name = db_name.split('?')[0]
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': urllib.parse.unquote(db_name),
        'USER': urllib.parse.unquote(url.username or 'postgres'),
        'PASSWORD': urllib.parse.unquote(url.password or ''),
        'HOST': url.hostname or 'localhost',
        'PORT': str(url.port or '5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'connect_timeout': 3,
        },
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-za'
TIME_ZONE = 'Africa/Johannesburg'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (uploaded documents and images)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    # v8.2 Governance: public-surface throttling (Constitution Rule 9)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',
        'search': '60/min',
        'assistant': '20/min',
        'verify': '15/min',
    },
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Caching (v8.2 Performance Layer)
# Redis when REDIS_URL is present (prod), LocMem fallback for dev.
# ---------------------------------------------------------------------------
redis_url = os.environ.get('REDIS_URL') or os.environ.get('REDISCLOUD_URL')
if redis_url:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': redis_url,
            'KEY_PREFIX': 'shoppage',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'shoppage-default',
            'KEY_PREFIX': 'shoppage',
        }
    }

CACHE_TTL = {
    'home': 60,
    'search': 30,
    'directory': 300,
    'fragment': 60,
}

# Canonical public origin. Left empty, the SEO layer derives it from the request
# host so preview/staging URLs stay self-consistent; set it in production.
SHOPPAGE_SITE_URL = os.environ.get('SHOPPAGE_SITE_URL', '').rstrip('/')
SHOPPAGE_PUBLIC_ORIGIN = os.environ.get('SHOPPAGE_PUBLIC_ORIGIN', 'https://shoppage.co.za')

# Search-engine ownership verification (base template head emits these when set)
GOOGLE_SITE_VERIFICATION = os.environ.get('GOOGLE_SITE_VERIFICATION', '')
BING_SITE_VERIFICATION = os.environ.get('BING_SITE_VERIFICATION', '')

# Reverse proxy & SSL headers (Traefik / Dokploy / Cloudflare / Nginx)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
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

# CORS — restrict to known first-party origins (constitution: no open public surface)
CORS_ALLOWED_ORIGINS = [
    SHOPPAGE_PUBLIC_ORIGIN,
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]
CORS_ALLOW_ALL_ORIGINS = False

# Authentication
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = '/merchant/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# Federated live search — internal index + rights-gated external providers (M1)
SHOPPAGE_EXTERNAL_SEARCH = {
    'enabled': os.environ.get('EXTERNAL_SEARCH_ENABLED', '1') == '1',
    'cache_ttl_seconds': int(os.environ.get('EXTERNAL_SEARCH_CACHE_TTL', '86400')),
    'rate_limit_per_minute': int(os.environ.get('EXTERNAL_SEARCH_RATE_LIMIT', '60')),
    'timeout_seconds': float(os.environ.get('EXTERNAL_SEARCH_TIMEOUT', '3')),
    'max_workers': 3,
    'providers': {
        'own_sweep': {'max_results': 4},
        'wikipedia': {'max_results': 4},
        'tinyfish': {'max_results': 4},
        'tinyfish_fetch': {'max_results': 2},
    },
}

# Internal retrieval engine (M2): 'auto' prefers Typesense when configured and
# falls back to the SQL hybrid engine; 'sql' forces SQL; 'typesense' requires it.
SHOPPAGE_SEARCH = {
    'backend': os.environ.get('SHOPPAGE_SEARCH_BACKEND', 'auto'),
    'typesense_url': os.environ.get('TYPESENSE_URL', '').rstrip('/'),
    'typesense_api_key': os.environ.get('TYPESENSE_API_KEY', ''),
    'typesense_collection': os.environ.get('TYPESENSE_COLLECTION', 'products'),
    'timeout_seconds': float(os.environ.get('TYPESENSE_TIMEOUT', '1.5')),
}

# TinyFish live web search — read from TINYFISH_API_KEY; the key lives in the
# gitignored shoppage/settings/local.py, never committed.
TINYFISH_API_KEY = os.environ.get('TINYFISH_API_KEY', '')

# Custom domain settings
SHOPPAGE_COUNTRY_DEFAULT = 'ZA'
SHOPPAGE_CURRENCY_DEFAULT = 'ZAR'

# Admin portal branding & version
SHOPPAGE_VERSION = os.environ.get('SHOPPAGE_VERSION', 'v8.2')
