import os
import traceback
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoppage.settings.prod')

_init_error = None
try:
    _django_app = get_wsgi_application()
except Exception:
    _init_error = traceback.format_exc()
    _django_app = None


def application(environ, start_response):
    if _init_error:
        start_response('500 Internal Server Error', [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Cache-Control', 'no-cache, no-store, must-revalidate'),
        ])
        return [f"CRITICAL WSGI INIT ERROR:\n\n{_init_error}".encode('utf-8')]

    try:
        return _django_app(environ, start_response)
    except Exception:
        err_tb = traceback.format_exc()
        start_response('500 Internal Server Error', [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Cache-Control', 'no-cache, no-store, must-revalidate'),
        ])
        return [f"CRITICAL RUNTIME WSGI ERROR:\n\n{err_tb}".encode('utf-8')]

