from apps.catalog.models import MasterProduct, ProductImage, ProductStatusChoices
from apps.intelligence.services import (
    get_brand_knowledge_card,
    get_tiered_moq_pricing,
)
from apps.markets.models import Market, MarketTypeChoices
from apps.media_hub.models import ModerationStateChoices, Short
from apps.merchants.models import ClaimStateChoices, Merchant, VerificationStateChoices
from apps.offers.models import AvailabilityStateChoices, DestinationTypeChoices, Offer
from django.test import Client, TestCase


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
            locality="Sandton",
            postal_code="2196",
            province="Gauteng",
            timezone="Africa/Johannesburg",
            opening_hours={day: {"open": "08:00", "close": "22:00"}
                           for day in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")},
            profile_categories=["Solar power company", "Battery store"],
            trust_score=96,
            google_rating=4.9,
            google_reviews_count=48,
        )

        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            model_number="SUN-5K-SG03LP1-EU",
            gtin13="6971234567895",
            status=ProductStatusChoices.ACTIVE,
            description=(
                "Single-phase 5 kW hybrid inverter with dual MPPT trackers, ≤4 ms UPS "
                "switchover and generator input, certified to NRS 097-2-1 for grid-tied use."
            ),
            bullet_points=[
                "5 kW continuous output, 10 kW peak",
                "Dual MPPT with 6,500 W PV input",
                "NRS 097-2-1 certified for SA grid-tie",
            ],
            attributes={"ratedPowerKw": 5.0, "estimatedPriceZar": 15500},
            compliance={"sabsApproved": True, "nrs097Certified": True, "warrantyYears": 5},
        )
        ProductImage.objects.create(
            product=self.product,
            url="https://example.invalid/deye-sun-5k.jpg",
            alt_text="Deye SUN-5K-SG03LP1-EU hybrid inverter",
            width=1600,
            height=1600,
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
        assert card is not None
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
        body = res.content.decode()
        self.assertContains(res, "How a buyer tender appears")
        # The board has no RFQ model behind it, so it must not pose as live demand.
        for fabricated in ('Active Buyer Tenders', 'Live Matching',
                           'Submit Quote on WhatsApp', 'Posted by Verified EPC Contractor'):
            self.assertNotIn(fabricated, body)
        self.assertIn('not open for quotes', body)

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
        self.assertContains(res, "Trust Score: 96/100")

        status = self.merchant.open_now
        self.assertIsNotNone(status, 'Structured hours must produce a live status')
        self.assertContains(res, 'Open Now' if status['is_open'] else 'Closed')
        self.assertContains(res, 'Africa/Johannesburg')
        self.assertContains(res, '08:00')
        self.assertNotContains(res, 'Hours not confirmed')
        # The invented foot-traffic chart is gone; nothing claims data we do not have.
        self.assertNotContains(res, "Popular Visiting Times")
        self.assertContains(res, 'Sandton')
        self.assertContains(res, '2196')
        self.assertContains(res, 'Solar power company')

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
