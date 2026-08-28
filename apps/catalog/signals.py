"""Keep the FTS index and cached search context in step with the catalog."""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .fts import delete_row, upsert_row
from .models import MasterProduct


@receiver(post_save, sender=MasterProduct)
def sync_product_index(sender, instance, **kwargs):
    upsert_row(instance)


@receiver(post_delete, sender=MasterProduct)
def drop_product_index(sender, instance, **kwargs):
    delete_row(instance.pk)
