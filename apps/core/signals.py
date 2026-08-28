"""Cache invalidation for context-level query caches.

Serving cached search context keyed only by URL meant a merchant price change
(or a rolled-back test database) kept answering the previous result set. Cached
keys now carry a data version that any commerce write advances.
"""

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

DATA_VERSION_KEY = 'sp:data_version'


def bump_data_version(**kwargs) -> None:
    try:
        cache.incr(DATA_VERSION_KEY)
    except ValueError:
        cache.set(DATA_VERSION_KEY, 1, None)


def data_version() -> int:
    try:
        return int(cache.get(DATA_VERSION_KEY) or 1)
    except (TypeError, ValueError):
        return 1


def configure_sqlite_pragmas(sender, connection, **kwargs):
    if connection.vendor == 'sqlite':
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA synchronous = NORMAL;")
            cursor.execute("PRAGMA journal_mode = WAL;")
            cursor.execute("PRAGMA cache_size = -64000;")
            cursor.execute("PRAGMA temp_store = MEMORY;")
            cursor.execute("PRAGMA mmap_size = 268435456;")


def install(model_labels) -> None:
    from django.apps import apps
    from django.db.backends.signals import connection_created

    connection_created.connect(configure_sqlite_pragmas, dispatch_uid='core:sqlite_pragmas')

    for label in model_labels:
        try:
            model = apps.get_model(label)
        except LookupError:
            continue
        post_save.connect(bump_data_version, sender=model, dispatch_uid=f'bump:{label}:save')
        post_delete.connect(bump_data_version, sender=model, dispatch_uid=f'bump:{label}:delete')
