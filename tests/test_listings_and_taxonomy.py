"""Vendor listing + Google taxonomy layers: loader, closure, backfill, feed wiring."""

import tempfile
from pathlib import Path

from apps.catalog.models import Category, CategoryPath, MasterProduct, ProductStatusChoices
from apps.intelligence.services import _gmc_product_category, generate_google_merchant_center_feed
from apps.merchants.models import Merchant
from apps.offers.models import Offer, VendorProduct
from django.core.management import call_command
from django.db import IntegrityError
from django.test import TestCase

TINY_TAXONOMY = """# Google_Product_Taxonomy_Version: test
1 - Electronics
2 - Electronics > Communications
3 - Electronics > Communications > Mobile Phones
4 - Hardware
5 - Hardware > Tools
"""


class LoadTaxonomyCommandTestCase(TestCase):
    def setUp(self):
        with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as fh:
            fh.write(TINY_TAXONOMY)
            self.taxonomy_file = fh.name

    def tearDown(self):
        Path(self.taxonomy_file).unlink(missing_ok=True)

    def _load(self):
        call_command('load_google_taxonomy', file=self.taxonomy_file)

    def test_loads_tree_with_levels_and_parents(self):
        self._load()
        self.assertEqual(Category.objects.count(), 5)
        mobile = Category.objects.get(google_id=3)
        self.assertEqual(mobile.level, 2)
        self.assertEqual(mobile.parent.name, 'Communications')
        self.assertEqual(mobile.path, 'Electronics > Communications > Mobile Phones')

    def test_closure_table_self_inclusive(self):
        self._load()
        mobile = Category.objects.get(google_id=3)
        pairs = {row.ancestor_id: row.depth for row in CategoryPath.objects.filter(descendant=mobile)}
        self.assertEqual(len(pairs), 3)  # itself + 2 ancestors
        electronics = Category.objects.get(google_id=1)
        self.assertEqual(pairs[electronics.pk], 2)

    def test_relaunch_is_idempotent(self):
        self._load()
        self._load()
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(CategoryPath.objects.count(), 9)  # self + ancestor rows, full tree


class AssignCategoriesCommandTestCase(TestCase):
    def setUp(self):
        call_command('load_google_taxonomy', file=self._write_taxonomy())
        self.product = MasterProduct.objects.create(
            canonical_id='var_solar_1', category_ref='solar_energy',
            title='Deye 5kW Hybrid Solar Inverter', brand='Deye',
            status=ProductStatusChoices.ACTIVE,
        )

    def tearDown(self):
        Path(self.taxonomy_file).unlink(missing_ok=True)

    def _write_taxonomy(self):
        tax = TINY_TAXONOMY + """6 - Hardware > Power & Electrical Supplies
7 - Hardware > Power & Electrical Supplies > Power Inverters
"""
        with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as fh:
            fh.write(tax)
            self.taxonomy_file = fh.name
        return self.taxonomy_file

    def test_assigns_keyword_specific_leaf(self):
        call_command('assign_google_categories')
        self.product.refresh_from_db()
        self.assertEqual(self.product.master_category.path,
                         'Hardware > Power & Electrical Supplies > Power Inverters')

    def test_does_not_overwrite_existing_assignment(self):
        leaf = Category.objects.get(path='Hardware > Power & Electrical Supplies > Power Inverters')
        self.product.master_category = leaf
        self.product.save()
        call_command('assign_google_categories')
        self.product.refresh_from_db()
        self.assertEqual(self.product.master_category_id, leaf.pk)

    def test_feed_emits_google_product_category_id(self):
        call_command('assign_google_categories')
        self.product.refresh_from_db()
        self.assertEqual(_gmc_product_category(self.product), '7')


class VendorProductTestCase(TestCase):
    def setUp(self):
        self.merchant = Merchant.objects.create(
            canonical_id='m_test_1', name='Test Hardware', category='hardware_tools',
            claim_state='claimed', verification_state='fully_verified',
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_test_1', category_ref='hardware_tools',
            title='Test Drill 13mm', brand='TestCo',
            status=ProductStatusChoices.ACTIVE,
        )

    def test_offer_save_resolves_and_creates_listing(self):
        offer = Offer.objects.create(
            canonical_id='ofr_test_1', variant=self.product, merchant=self.merchant,
            price_amount=999.99, currency='ZAR',
        )
        self.assertIsNotNone(offer.vendor_product_id)
        self.assertEqual(VendorProduct.objects.count(), 1)
        listing = VendorProduct.objects.get(pk=offer.vendor_product_id)
        self.assertEqual(listing.merchant_id, self.merchant.pk)
        self.assertEqual(listing.master_product_id, self.product.pk)
        self.assertTrue(listing.canonical_id.startswith('vp_'))

    def test_listing_unique_per_merchant_product(self):
        VendorProduct.objects.create(merchant=self.merchant, master_product=self.product, vendor_sku='A1')
        with self.assertRaises(IntegrityError):
            VendorProduct.objects.create(merchant=self.merchant, master_product=self.product, vendor_sku='A2')

    def test_feed_id_from_vendor_sku(self):
        listing = VendorProduct.objects.create(
            merchant=self.merchant, master_product=self.product, vendor_sku='TC-13MM',
        )
        Offer.objects.create(
            canonical_id='ofr_test_2', variant=self.product, merchant=self.merchant,
            vendor_product=listing, price_amount=1050.00, currency='ZAR',
        )
        feed = generate_google_merchant_center_feed(self.merchant.canonical_id)
        self.assertIn('<g:id>TC-13MM</g:id>', feed)
        self.assertIn(f'<g:item_group_id>{self.product.canonical_id}</g:item_group_id>', feed)
