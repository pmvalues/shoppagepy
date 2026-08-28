from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.markets.models import Market, MarketTypeChoices
from apps.media_hub.models import (
    ModerationStateChoices,
    Short,
    Show,
    ShowCategoryChoices,
    ShowStatusChoices,
)
from apps.merchants.models import ClaimStateChoices, Merchant, VerificationStateChoices
from apps.offers.models import AvailabilityStateChoices, DestinationTypeChoices, Offer
from django.test import Client, TestCase


class AllViewsE2ETestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.market = Market.objects.create(
            name="Sandton City Mall",
            canonical_slug="sandton-city-johannesburg",
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
        )

        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw_hybrid",
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
            canonical_id="ofr_solar_bros_deye_5kw",
            variant=self.product,
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=15499.00,
            currency="ZAR",
            stall_ref="Stall B-12",
            availability_state=AvailabilityStateChoices.FRESH,
        )

        self.show = Show.objects.create(
            canonical_id="ep_01",
            title="Dragon City Wholesale Walk",
            slug="dragon-city-wholesale-walk",
            series_name="Market Walk South Africa",
            category=ShowCategoryChoices.MARKET_WALK,
            thumbnail_url="https://images.unsplash.com/photo-1567449303078-57ad995bd301",
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
            status=ShowStatusChoices.ACTIVE,
        )

        self.short = Short.objects.create(
            canonical_id="sh_01",
            title="Deye 5kW Inverter Teardown",
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1508873696983-2df57046475a",
            merchant=self.merchant,
            master_product=self.product,
            moderation_state=ModerationStateChoices.APPROVED,
        )

        from apps.merchants.models import Draft, DraftTypeChoices, ReviewStateChoices
        self.draft = Draft.objects.create(
            draft_id="dft_test_01",
            draft_type=DraftTypeChoices.ALIAS_EXPANSION,
            merchant=self.merchant,
            product=self.product,
            payload={"alias": "Deye inverter"},
            review_state=ReviewStateChoices.PENDING,
        )

    def test_all_routes(self):
        # Protected merchant routes now require authentication; log in as the
        # merchant owner so dashboard/claim/draft-action resolve to 200.
        from django.contrib.auth import get_user_model
        User = get_user_model()
        owner = User.objects.create_user('routeowner', 'routeowner@shoppage.co.za', 'pw')
        self.merchant.owner = owner
        self.merchant.save(update_fields=['owner_id'])
        self.client.force_login(owner)

        urls = [
            ('/', 200),
            ('/search/?q=deye', 200),
            ('/search/live/?q=deye', 200),
            (f'/p/{self.product.canonical_id}/', 200),
            ('/malls/', 200),
            (f'/markets/{self.market.canonical_slug}/', 200),
            ('/merchants/', 200),
            (f'/m/{self.merchant.canonical_id}/', 200),
            ('/merchant/claim/', 200),
            ('/merchant/dashboard/', 200),
            (f'/merchant/draft/{self.draft.draft_id}/action/', 200),
            ('/shows/', 200),
            (f'/shows/{self.show.slug}/', 200),
            ('/shorts/', 200),
            ('/requests/', 200),
            ('/agency/', 200),
            ('/api/v1/search/?q=deye', 200),
            ('/api/v1/products/', 200),
            (f'/api/v1/products/{self.product.canonical_id}/', 200),
            ('/api/v1/merchants/', 200),
            (f'/api/v1/merchants/{self.merchant.canonical_id}/', 200),
            ('/api/v1/markets/', 200),
            (f'/api/feeds/google-merchant-center/{self.merchant.canonical_id}/', 200),
            (f'/api/seal/{self.merchant.canonical_id}/', 200),
            ('/api/agent/stream/', 200),
            (f'/l/{self.offer.canonical_id}/', 302),
            ('/admin/login/', 200),
        ]

        for url, expected_status in urls:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, expected_status, f"URL {url} returned status {res.status_code}, expected {expected_status}")

    def test_django_admin_authenticated(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin_user = User.objects.create_superuser('testadmin', 'test@shoppage.co.za', 'testpassword')
        self.client.force_login(admin_user)

        res = self.client.get('/admin/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Shoppage National Commercial Intelligence Grid")
        self.assertContains(res, "Merchants")
        self.assertContains(res, "Master Products")
        self.assertContains(res, "Markets &amp; Shopping Centres")
        self.assertContains(res, "Confirmed Offers")
        self.assertContains(res, "Evidence Claims")

        admin_changelists = [
            '/admin/markets/market/',
            '/admin/merchants/merchant/',
            '/admin/catalog/masterproduct/',
            '/admin/offers/offer/',
            '/admin/offers/discoveredoffer/',
            '/admin/evidence/evidenceclaim/',
            '/admin/evidence/evidenceartifact/',
            '/admin/merchants/draft/',
            '/admin/merchants/agentrun/',
            '/admin/media_hub/show/',
            '/admin/media_hub/short/',
        ]
        for url in admin_changelists:
            with self.subTest(admin_url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, 200, f"Admin URL {url} returned {res.status_code}")
