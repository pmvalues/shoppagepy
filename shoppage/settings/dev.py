from .base import *

DEBUG = True
SECRET_KEY = 'django-insecure-shoppage-dev-environment-key-for-local-testing'
ALLOWED_HOSTS = ['*']

try:
    from .local import *
except ImportError:
    pass
