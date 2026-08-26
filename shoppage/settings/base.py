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
    'django.contrib.admin',
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
if db_url and (db_url.startswith('postgres://') or db_url.startswith('postgresql://')):
    import urllib.parse
    url = urllib.parse.urlparse(db_url)
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': url.path[1:],
        'USER': url.username,
        'PASSWORD': url.password,
        'HOST': url.hostname,
        'PORT': url.port or '5432',
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

# Canonical site URL used by SEO layer (sitemaps, JSON-LD, canonical tags)
SHOPPAGE_SITE_URL = os.environ.get('SHOPPAGE_SITE_URL', 'https://shoppage.co.za')

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# Custom domain settings
SHOPPAGE_COUNTRY_DEFAULT = 'ZA'
SHOPPAGE_CURRENCY_DEFAULT = 'ZAR'
