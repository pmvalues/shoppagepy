"""
Backfill VendorProduct listings from the pre-existing commercial graph:

  * one listing per distinct (merchant, variant) pair across confirmed offers,
  * offers and promotions pointed at their listing,
  * swept offers matched to a merchant resolved onto (or given) a listing.

The historical model has no custom save(), so canonical_id is generated here.
"""

import uuid

from django.db import migrations


def _new_listing(VendorProduct, merchant_id, master_product_id, vendor_sku='', match_source='manual', confidence=0.85):
    return VendorProduct(
        canonical_id=f'vp_{uuid.uuid4().hex[:12]}',
        merchant_id=merchant_id,
        master_product_id=master_product_id,
        vendor_sku=vendor_sku,
        condition='new',
        unit_descriptor='',
        match_source=match_source,
        match_confidence=confidence,
    )


def backfill_vendor_products(apps, schema_editor):
    VendorProduct = apps.get_model('offers', 'VendorProduct')
    Offer = apps.get_model('offers', 'Offer')
    Promotion = apps.get_model('offers', 'Promotion')
    DiscoveredOffer = apps.get_model('offers', 'DiscoveredOffer')

    seen = {}
    pairs = Offer.objects.order_by().values_list('merchant_id', 'variant_id').distinct()
    for merchant_id, variant_id in pairs:
        key = (merchant_id, variant_id)
        if key not in seen:
            vp = _new_listing(VendorProduct, merchant_id, variant_id)
            vp.save()
            seen[key] = vp

    offers = Offer.objects.filter(vendor_product__isnull=True).only(
        'id', 'merchant_id', 'variant_id'
    )
    for offer in offers:
        listing = seen.get((offer.merchant_id, offer.variant_id))
        if listing is None:
            continue
        offer.vendor_product_id = listing.pk
        offer.save(update_fields=['vendor_product', 'updated_at'])

    promos = Promotion.objects.filter(vendor_product__isnull=True).only(
        'id', 'merchant_id', 'variant_id'
    )
    for promo in promos:
        listing = seen.get((promo.merchant_id, promo.variant_id))
        if listing is None:
            continue
        promo.vendor_product_id = listing.pk
        promo.save(update_fields=['vendor_product', 'updated_at'])

    sweeps = DiscoveredOffer.objects.filter(
        vendor_product__isnull=True, merchant__isnull=False
    ).only('id', 'merchant_id', 'master_product_id', 'sku', 'confidence_score')
    for sweep in sweeps:
        key = (sweep.merchant_id, sweep.master_product_id)
        listing = seen.get(key)
        if listing is None:
            listing = _new_listing(
                VendorProduct, sweep.merchant_id, sweep.master_product_id,
                vendor_sku=(sweep.sku or '')[:100],
                match_source='sweep',
                confidence=sweep.confidence_score or 0.85,
            )
            listing.save()
            seen[key] = listing
        elif not listing.vendor_sku and sweep.sku:
            listing.vendor_sku = sweep.sku[:100]
            listing.save(update_fields=['vendor_sku', 'updated_at'])
        sweep.vendor_product_id = listing.pk
        sweep.save(update_fields=['vendor_product', 'updated_at'])


def noop(apps, schema_editor):  # pragma: no cover - reverse is intentionally a no-op
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('offers', '0006_vendorproduct_discoveredoffer_vendor_product_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_vendor_products, noop),
    ]
