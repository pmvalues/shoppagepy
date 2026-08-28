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


def install(model_labels) -> None:
    from django.apps import apps

    for label in model_labels:
        try:
            model = apps.get_model(label)
        except LookupError:
            continue
        post_save.connect(bump_data_version, sender=model, dispatch_uid=f'bump:{label}:save')
        post_delete.connect(bump_data_version, sender=model, dispatch_uid=f'bump:{label}:delete')
