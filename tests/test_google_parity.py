"""Google / Google Shopping baseline parity tests: sort, filters, category & brand browse, rating honesty."""
from django.core.cache import cache
from django.test import TestCase, Client
from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import Merchant, ClaimStateChoices, VerificationStateChoices
from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.offers.models import Offer, DestinationTypeChoices, AvailabilityStateChoices


class GoogleParityTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()

        self.market = Market.objects.create(
            name="Sandton City Mall",
            canonical_slug="sandton-city-mall",
            market_type=MarketTypeChoices.FORMAL_MEGA_MALL,
            country="ZA",
            province="Gauteng",
            metro="City of Johannesburg",
            street_address="83 Rivonia Rd, Sandton",
            stall_capacity=250,
        )

        self.merchant = Merchant.objects.create(
            canonical_id="m_parity_solar",
            name="Parity Solar Sandton",
            country="ZA",
            claim_state=ClaimStateChoices.CLAIMED,
            verification_state=VerificationStateChoices.FULLY_VERIFIED,
            whatsapp_number="27712345678",
            market=self.market,
            stall_identifier="Stall B-12",
            category="solar_energy",
            address_text="83 Rivonia Rd, Sandton",
            province="Gauteng",
            trust_score=95,
        )

        self.cheap = MasterProduct.objects.create(
            canonical_id="var_parity_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            status=ProductStatusChoices.ACTIVE,
            attributes={"estimatedPriceZar": 15500},
        )
        self.pricy = MasterProduct.objects.create(
            canonical_id="var_parity_deye_8kw",
            category_ref="solar_energy",
            title="Deye 8kW Hybrid Inverter",
            brand="Deye",
            status=ProductStatusChoices.ACTIVE,
            attributes={"estimatedPriceZar": 28999},
        )
        self.other_brand = MasterProduct.objects.create(
            canonical_id="var_parity_sunsynk_5kw",
            category_ref="solar_energy",
            title="Sunsynk 5kW Hybrid Inverter",
            brand="Sunsynk",
            status=ProductStatusChoices.ACTIVE,
            attributes={"estimatedPriceZar": 17999},
        )

        for product, price in ((self.cheap, 15499.00), (self.pricy, 28499.00), (self.other_brand, 17499.00)):
            Offer.objects.create(
                canonical_id=f"ofr_parity_{product.canonical_id}",
                variant=product,
                merchant=self.merchant,
                destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
                price_amount=price,
                currency="ZAR",
                stall_ref="Stall B-12",
                availability_state=AvailabilityStateChoices.FRESH,
            )

    # --- Search sort ---

    def test_search_sort_price_asc(self):
        res = self.client.get("/search/", {"q": "inverter", "sort": "price_asc"})
        self.assertEqual(res.status_code, 200)
        titles = [p.title for p in res.context["results"]["products"]]
        self.assertIn("Deye 5kW Hybrid Inverter", titles)
        self.assertLess(titles.index("Deye 5kW Hybrid Inverter"), titles.index("Deye 8kW Hybrid Inverter"))

    def test_search_sort_price_desc(self):
        res = self.client.get("/search/", {"q": "inverter", "sort": "price_desc"})
        self.assertEqual(res.status_code, 200)
        titles = [p.title for p in res.context["results"]["products"]]
        self.assertLess(titles.index("Deye 8kW Hybrid Inverter"), titles.index("Deye 5kW Hybrid Inverter"))

    def test_search_sort_invalid_falls_back(self):
        res = self.client.get("/search/", {"q": "inverter", "sort": "hackerman"})
        self.assertEqual(res.status_code, 200)

    def test_search_sort_label_rendered(self):
        res = self.client.get("/search/", {"q": "inverter", "sort": "price_asc"})
        self.assertContains(res, "Price: low to high")

    # --- Filter chips ---

    def test_active_filter_chips_render_with_remove_links(self):
        res = self.client.get("/search/", {"q": "inverter", "category": "solar_energy", "brand": "Deye"})
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "✕")
        self.assertContains(res, "Solar Energy")
        self.assertContains(res, "Deye")

    # --- Province filter ---

    def test_province_filter_accepted(self):
        res = self.client.get("/search/", {"q": "inverter", "province": "Gauteng"})
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Deye 5kW Hybrid Inverter")

    # --- Category browse ---

    def test_category_page_200_with_products(self):
        res = self.client.get("/category/solar-energy/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Solar Energy")
        self.assertContains(res, "Deye 5kW Hybrid Inverter")
        self.assertContains(res, "Sunsynk 5kW Hybrid Inverter")

    def test_category_page_sort(self):
        res = self.client.get("/category/solar-energy/", {"sort": "price_asc"})
        self.assertEqual(res.status_code, 200)
        titles = [p.title for p in res.context["products"]]
        self.assertEqual(titles[0], "Deye 5kW Hybrid Inverter")

    def test_category_page_price_filter(self):
        res = self.client.get("/category/solar-energy/", {"min_price": "20000"})
        self.assertEqual(res.status_code, 200)
        titles = [p.title for p in res.context["products"]]
        self.assertEqual(titles, ["Deye 8kW Hybrid Inverter"])

    def test_category_page_facets_link_to_brands(self):
        res = self.client.get("/category/solar-energy/")
        self.assertContains(res, "/brand/deye/")

    def test_category_page_empty_state(self):
        res = self.client.get("/category/nonexistent-category/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "No listings here yet")

    # --- Brand browse ---

    def test_brand_page_200_with_products(self):
        res = self.client.get("/brand/deye/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Deye")
        self.assertContains(res, "Deye 5kW Hybrid Inverter")
        self.assertContains(res, "Deye 8kW Hybrid Inverter")
        self.assertNotContains(res, "Sunsynk 5kW Hybrid Inverter")

    def test_brand_page_facets_link_to_categories(self):
        res = self.client.get("/brand/deye/")
        self.assertContains(res, "/category/solar_energy/")

    def test_brand_page_jsonld_itemlist(self):
        res = self.client.get("/brand/deye/")
        self.assertContains(res, "ItemList")

    # --- Rating honesty (constitution: no fabricated ratings) ---

    def test_product_detail_no_fake_rating(self):
        res = self.client.get(f"/p/{self.cheap.canonical_id}/")
        self.assertEqual(res.status_code, 200)
        self.assertNotContains(res, "48 verified store reviews")
        self.assertNotContains(res, "★ 4.9")

    def test_product_detail_rating_only_when_backed(self):
        self.cheap.reviews_summary = {"average_rating": 4.6, "review_count": 12}
        self.cheap.save()
        res = self.client.get(f"/p/{self.cheap.canonical_id}/")
        self.assertContains(res, "★ 4.6")
        self.assertContains(res, "12 verified store reviews")

    def test_search_results_no_fake_rating(self):
        res = self.client.get("/search/", {"q": "inverter"})
        self.assertNotContains(res, "(38 reviews)")

    def test_product_detail_breadcrumbs_link_browse_pages(self):
        res = self.client.get(f"/p/{self.cheap.canonical_id}/")
        self.assertContains(res, "/category/solar_energy/")
        self.assertContains(res, "/brand/deye/")
