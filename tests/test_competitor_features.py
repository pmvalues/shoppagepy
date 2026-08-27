from django.test import TestCase, Client
from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import Merchant, ClaimStateChoices, VerificationStateChoices
from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.offers.models import Offer, DestinationTypeChoices, AvailabilityStateChoices
from apps.media_hub.models import Short, ModerationStateChoices
from apps.intelligence.services import (
    get_brand_knowledge_card,
    get_tiered_moq_pricing,
    detect_intent,
    build_overview,
)

class CompetitorFeaturesTestCase(TestCase):
    def setUp(self):
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
            canonical_id="m_solar_bros",
            name="SolarBros Sandton",
            country="ZA",
            claim_state=ClaimStateChoices.CLAIMED,
            verification_state=VerificationStateChoices.FULLY_VERIFIED,
            whatsapp_number="27712345678",
            market=self.market,
            stall_identifier="Stall B-12",
            category="solar_energy",
            address_text="83 Rivonia Rd, Sandton",
            province="Gauteng",
            trust_score=96,
            google_rating=4.9,
            google_reviews_count=48,
            operating_hours_json={
                "mon": ["00:00", "23:59"], "tue": ["00:00", "23:59"],
                "wed": ["00:00", "23:59"], "thu": ["00:00", "23:59"],
                "fri": ["00:00", "23:59"], "sat": ["00:00", "23:59"],
                "sun": ["00:00", "23:59"],
            },
        )

        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            model_number="SUN-5K-SG03LP1-EU",
            gtin13="6971234567895",
            status=ProductStatusChoices.ACTIVE,
            attributes={"ratedPowerKw": 5.0, "estimatedPriceZar": 15500},
            compliance={"sabsApproved": True, "nrs097Certified": True, "warrantyYears": 5},
        )

        self.offer = Offer.objects.create(
            canonical_id="ofr_sb_deye_5kw",
            variant=self.product,
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=15499.00,
            currency="ZAR",
            stall_ref="Stall B-12",
            availability_state=AvailabilityStateChoices.FRESH,
        )

        self.short = Short.objects.create(
            canonical_id="sh_deye_5kw_test",
            title="Deye 5kW Inverter Teardown & Load Test",
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1508873696983-2df57046475a",
            merchant=self.merchant,
            master_product=self.product,
            moderation_state=ModerationStateChoices.APPROVED,
        )

    def test_google_pillar_search_and_knowledge_card(self):
        # 1. Brand Knowledge Card extraction
        card = get_brand_knowledge_card("deye")
        self.assertIsNotNone(card)
        self.assertEqual(card['short_name'], 'Deye')
        self.assertIn("NRS 097-2-1 Grid Certified", card['certifications'])
        self.assertTrue(card['b2b_wholesale_ready'])

        # 2. Omnibox Live Search Dropdown HTML endpoint
        res = self.client.get('/search/live/?q=deye')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Deye")
        self.assertContains(res, "SolarBros Sandton")
        self.assertContains(res, "15,499")

        # 3. Main Search View with AI Overview & Knowledge Card
        res = self.client.get('/search/?q=deye')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Shoppage AI Overview")
        self.assertContains(res, "Deye")

    def test_google_shopping_pillar_comparison_matrix(self):
        res = self.client.get(f'/p/{self.product.canonical_id}/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Deye 5kW Hybrid Inverter")
        self.assertContains(res, "15,499")
        self.assertContains(res, "SolarBros Sandton")
        self.assertContains(res, "NRS 097-2-1 Grid Certified")
        self.assertContains(res, "Continuous Backup Calculator")

    def test_alibaba_pillar_b2b_wholesale_moq_and_rfq(self):
        # 1. MOQ Tier calculation
        tiers = get_tiered_moq_pricing(15500.0)
        self.assertEqual(len(tiers), 4)
        self.assertEqual(tiers[0]['moq'], 1)
        self.assertEqual(tiers[1]['moq'], 10)
        self.assertLess(tiers[1]['unit_price'], 15500.0)
        self.assertGreater(tiers[1]['discount_pct'], 0)

        # 2. Search in Price Comparison Mode
        res = self.client.get('/search/?q=deye')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Products &amp; Verified Price Matrix")
        self.assertContains(res, "Compare Sellers")

        # 3. RFQ Tender Board page
        res = self.client.get('/requests/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "National Commercial RFQ Tender Board")
        self.assertContains(res, "Active Buyer Tenders")

    def test_gmb_pillar_spatial_map_and_storefront_profile(self):
        # 1. Spatial Malls Directory & Map Data
        res = self.client.get('/malls/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Sandton City Mall")
        self.assertContains(res, "Spatial Commerce Grid")
        self.assertContains(res, "spatial-map-container")

        # 2. Storefront Profile with GMB Features
        res = self.client.get(f'/m/{self.merchant.canonical_id}/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "SolarBros Sandton")
        self.assertContains(res, "Open Now")
        self.assertContains(res, "Popular Visiting Times")
        self.assertContains(res, "Trust Score: 96/100")

    def test_youtube_shorts_pillar_shoppable_video_feed(self):
        # 1. Shorts Directory / Video Player
        res = self.client.get('/shorts/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Shoppable Proof Shorts")
        self.assertContains(res, "Deye 5kW Inverter Teardown")
        self.assertContains(res, "Deye 5kW Hybrid Inverter")

        # 2. Creator Studio Short Upload POST
        upload_data = {
            'title': 'Dyness BX51100 Unboxing & Battery Test',
            'video_url': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
            'merchant_name': 'SolarBros Sandton',
            'whatsapp': '27712345678',
            'product_id': self.product.canonical_id,
        }
        res = self.client.post('/shorts/', upload_data, follow=True)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Short.objects.filter(title='Dyness BX51100 Unboxing & Battery Test').exists())
