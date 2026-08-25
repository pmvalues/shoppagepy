import pytest
from django.test import TestCase, Client
from django.urls import reverse
from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import Merchant, ClaimStateChoices, VerificationStateChoices
from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.offers.models import Offer, DiscoveredOffer, DestinationTypeChoices, AvailabilityStateChoices
from apps.rights.models import RightsSource
from apps.media_hub.models import Show, Short
from apps.referrals.models import ReferralEvent
from apps.intelligence.services import (
    detect_intent,
    parse_price_value,
    semantic_search,
    ask_assistant,
    generate_google_merchant_center_feed,
    generate_trust_seal_svg,
)

class ShoppagePlatformTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # 1. Market
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

        # 2. Merchant
        self.merchant = Merchant.objects.create(
            canonical_id="m_test_solar",
            name="Test Solar Sandton",
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

        # 3. Product
        self.product = MasterProduct.objects.create(
            canonical_id="var_test_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            model_number="SUN-5K-SG03LP1-EU",
            gtin13="6971234567895",
            status=ProductStatusChoices.ACTIVE,
            attributes={"ratedPowerKw": 5.0, "estimatedPriceZar": 15500},
            compliance={"sabsApproved": True, "nrs097Certified": True, "warrantyYears": 5},
        )

        # 4. Offer
        self.offer = Offer.objects.create(
            canonical_id="ofr_test_01",
            variant=self.product,
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=15499.00,
            currency="ZAR",
            stall_ref="Stall B-12",
            availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_intent_detection(self):
        intent = detect_intent("Deye inverter under R20000 in Sandton")
        self.assertEqual(intent['brand'], 'deye')
        self.assertEqual(intent['category'], 'solar_energy')
        self.assertEqual(intent['max_price'], 20000)
        self.assertEqual(parse_price_value("20 grand"), 20000)
        self.assertEqual(parse_price_value("1.5k"), 1500)

    def test_semantic_search(self):
        res = semantic_search("deye inverter", limit=5)
        self.assertGreaterEqual(res['total_products'], 1)
        self.assertEqual(res['products'][0].brand, 'Deye')

    def test_assistant_reply(self):
        reply = ask_assistant("Deye 5kW inverter price")
        self.assertIn("Deye", reply['reply'])
        self.assertGreaterEqual(len(reply['products']), 1)

    def test_universal_link_resolver_whatsapp_redirect(self):
        response = self.client.get(f"/l/{self.offer.canonical_id}/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("https://wa.me/27712345678", response.url)
        self.assertIn("Deye", response.url)
        
        # Verify referral event was logged in ledger
        event = ReferralEvent.objects.filter(offer=self.offer).first()
        self.assertIsNotNone(event)
        self.assertEqual(event.action, 'whatsapp_start')

    def test_product_detail_page(self):
        response = self.client.get(f"/p/{self.product.canonical_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Deye 5kW Hybrid Inverter")
        self.assertContains(response, "15,499")
        self.assertContains(response, "Test Solar Sandton")

    def test_google_merchant_center_feed(self):
        feed_xml = generate_google_merchant_center_feed(self.merchant.canonical_id)
        self.assertIn("<rss xmlns:g=\"http://base.google.com/ns/1.0\"", feed_xml)
        self.assertIn("Deye 5kW Hybrid Inverter", feed_xml)
        self.assertIn("6971234567895", feed_xml)

    def test_trust_seal_svg(self):
        svg = generate_trust_seal_svg(self.merchant)
        self.assertIn("<svg", svg)
        self.assertIn("SHOPPAGE TRUST VERIFIED", svg)
        self.assertIn("95/100", svg)

    def test_api_endpoints(self):
        # Search API
        res = self.client.get("/api/v1/search/?q=deye")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data['products']), 1)

        # Products API
        res = self.client.get(f"/api/v1/products/{self.product.canonical_id}/")
        self.assertEqual(res.status_code, 200)

        # Seal API
        res = self.client.get(f"/api/seal/{self.merchant.canonical_id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'image/svg+xml; charset=utf-8')
