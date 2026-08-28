"""
Tests for the fully-fledged Merchant Centre (GMC + Amazon Seller Central + Shopify parity).

Covers:
  * Order / OrderItem / Promotion / ShippingRate / MerchantCentreSettings models
  * GMC-style feed diagnostics (diagnose_offer_feed_status)
  * Dashboard GET context (all new variables present, 200 response)
  * POST action handlers (order status, promotions, reviews, profile, shipping)
  * Feed count aggregation
"""
from decimal import Decimal

from django.test import TestCase, Client
from django.utils import timezone

from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import (
    Merchant, ClaimStateChoices, VerificationStateChoices,
    Order, OrderItem, Promotion, ShippingRate, MerchantCentreSettings,
    OrderStatusChoices, PromotionTypeChoices, PromotionScopeChoices,
    diagnose_offer_feed_status,
)
from apps.catalog.models import MasterProduct, ProductStatusChoices, Review, ReviewModerationChoices
from apps.offers.models import Offer, DestinationTypeChoices, AvailabilityStateChoices


class MerchantCentreModelTestCase(TestCase):
    def setUp(self):
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
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            model_number="SUN-5K-SG03LP1-EU",
            gtin13="6971234567895",
            status=ProductStatusChoices.ACTIVE,
            image_url="https://example.com/deye.jpg",
            google_category_id=1234,
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

    def test_order_item_line_total_autocomputed(self):
        order = Order.objects.create(
            reference="ORD-2026-0001",
            merchant=self.merchant,
            buyer_name="Thabo M.",
        )
        item = OrderItem.objects.create(
            order=order,
            offer=self.offer,
            title="Deye 5kW Hybrid Inverter",
            sku="SUN-5K",
            quantity=3,
            unit_price=Decimal("15499.00"),
        )
        self.assertEqual(item.line_total, Decimal("46497.00"))

    def test_order_recalc_persists_totals(self):
        order = Order.objects.create(
            reference="ORD-2026-0002",
            merchant=self.merchant,
            buyer_name="Kagiso N.",
            shipping_fee=Decimal("250.00"),
        )
        OrderItem.objects.create(
            order=order, title="Battery", quantity=2, unit_price=Decimal("5000.00"),
        )
        OrderItem.objects.create(
            order=order, title="Inverter", quantity=1, unit_price=Decimal("15499.00"),
        )
        order.recalc()
        order.refresh_from_db()
        self.assertEqual(order.subtotal, Decimal("25499.00"))
        self.assertEqual(order.total, Decimal("25749.00"))

    def test_promotion_is_live(self):
        promo = Promotion.objects.create(
            merchant=self.merchant,
            title="Winter Sale",
            promo_type=PromotionTypeChoices.PERCENTAGE,
            value=Decimal("10"),
            active=True,
        )
        self.assertTrue(promo.is_live())

        # Inactive promotion is not live
        promo.active = False
        self.assertFalse(promo.is_live())

        # Expired promotion is not live
        promo.active = True
        promo.ends_at = timezone.now() - timezone.timedelta(days=1)
        self.assertFalse(promo.is_live())

        # Future promotion is not live
        promo.ends_at = None
        promo.starts_at = timezone.now() + timezone.timedelta(days=1)
        self.assertFalse(promo.is_live())

    def test_shipping_rate_creation(self):
        rate = ShippingRate.objects.create(
            merchant=self.merchant,
            method="Standard Courier",
            zone="Gauteng",
            rate=Decimal("99.00"),
            free_above=Decimal("1000.00"),
            eta_days=3,
        )
        self.assertEqual(str(rate), "Standard Courier · Gauteng · R99.00")
        self.assertEqual(self.merchant.shipping_rates.count(), 1)

    def test_centre_settings_get_or_create(self):
        settings, created = MerchantCentreSettings.objects.get_or_create(merchant=self.merchant)
        self.assertTrue(created)
        settings.tax_rate = Decimal("15.00")
        settings.save()
        settings2, created2 = MerchantCentreSettings.objects.get_or_create(merchant=self.merchant)
        self.assertFalse(created2)
        self.assertEqual(settings2.tax_rate, Decimal("15.00"))


class FeedDiagnosticsTestCase(TestCase):
    def setUp(self):
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
            market=self.market,
            category="solar_energy",
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            image_url="https://example.com/deye.jpg",
            google_category_id=1234,
            status=ProductStatusChoices.ACTIVE,
        )

    def _make_offer(self, **kwargs):
        defaults = dict(
            canonical_id="ofr_test",
            variant=self.product,
            merchant=self.merchant,
            price_amount=15499.00,
            currency="ZAR",
            availability_state=AvailabilityStateChoices.FRESH,
        )
        defaults.update(kwargs)
        return Offer.objects.create(**defaults)

    def test_approved_when_fresh_priced_imaged_categorised(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.FRESH, price_amount=15499.00)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'approved')
        self.assertEqual(diag['issues'], [])

    def test_disapproved_when_hidden(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.HIDDEN)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'disapproved')
        self.assertTrue(any(i['code'] == 'not_eligible' for i in diag['issues']))

    def test_disapproved_when_expired(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.EXPIRED)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'disapproved')

    def test_disapproved_when_missing_price(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.FRESH, price_amount=None)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'disapproved')
        self.assertTrue(any(i['code'] == 'missing_price' for i in diag['issues']))

    def test_limited_when_out_of_stock(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.OUT_OF_STOCK)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'limited')
        self.assertTrue(any(i['code'] == 'out_of_stock' for i in diag['issues']))

    def test_pending_when_quote_required(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.QUOTE_REQUIRED)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'pending')
        self.assertTrue(any(i['code'] == 'quote_required' for i in diag['issues']))

    def test_limited_when_confirm_required(self):
        offer = self._make_offer(availability_state=AvailabilityStateChoices.CONFIRM_REQUIRED)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'limited')
        self.assertTrue(any(i['code'] == 'confirm_required' for i in diag['issues']))

    def test_limited_when_missing_image(self):
        self.product.image_url = None
        self.product.save()
        offer = self._make_offer(availability_state=AvailabilityStateChoices.FRESH)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'limited')
        self.assertTrue(any(i['code'] == 'missing_image' for i in diag['issues']))

    def test_limited_when_missing_google_category(self):
        self.product.google_category_id = None
        self.product.save()
        offer = self._make_offer(availability_state=AvailabilityStateChoices.FRESH)
        diag = diagnose_offer_feed_status(offer)
        self.assertEqual(diag['status'], 'limited')
        self.assertTrue(any(i['code'] == 'missing_google_category' for i in diag['issues']))


class MerchantCentreDashboardTestCase(TestCase):
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
            market=self.market,
            category="solar_energy",
            operating_hours_json={"mon": ["08:00", "17:00"]},
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_deye_5kw",
            category_ref="solar_energy",
            title="Deye 5kW Hybrid Inverter",
            brand="Deye",
            image_url="https://example.com/deye.jpg",
            google_category_id=1234,
            status=ProductStatusChoices.ACTIVE,
        )
        self.offer = Offer.objects.create(
            canonical_id="ofr_sb_deye_5kw",
            variant=self.product,
            merchant=self.merchant,
            price_amount=15499.00,
            currency="ZAR",
            availability_state=AvailabilityStateChoices.FRESH,
        )
        Review.objects.create(
            merchant=self.merchant, rating=5, title="Great", body="Loved it",
            moderation_state=ReviewModerationChoices.PENDING,
        )

    def test_dashboard_get_200_and_context(self):
        resp = self.client.get('/merchant/dashboard/', {'merchantId': 'm_solar_bros'})
        self.assertEqual(resp.status_code, 200)
        for var in (
            'merchant', 'offers', 'orders', 'promotions', 'shipping_rates',
            'centre_settings', 'reviews_pending', 'reviews_approved',
            'feed_diagnostics', 'feed_counts', 'order_status_choices',
            'promotion_type_choices', 'promotion_scope_choices', 'weekday_choices',
        ):
            self.assertIn(var, resp.context, f"Missing context var: {var}")

    def test_dashboard_feed_counts(self):
        resp = self.client.get('/merchant/dashboard/', {'merchantId': 'm_solar_bros'})
        feed_counts = resp.context['feed_counts']
        self.assertEqual(feed_counts['approved'], 1)
        self.assertEqual(feed_counts['limited'], 0)
        self.assertEqual(feed_counts['disapproved'], 0)
        self.assertEqual(feed_counts['pending'], 0)

    def test_update_order_status_post(self):
        order = Order.objects.create(
            reference="ORD-2026-0003", merchant=self.merchant, buyer_name="Nomsa D.",
        )
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'update_order_status',
            'order_id': order.id,
            'status': OrderStatusChoices.SHIPPED,
        })
        self.assertEqual(resp.status_code, 302)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatusChoices.SHIPPED)

    def test_create_promotion_post(self):
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'create_promotion',
            'title': 'Spring Sale',
            'promo_type': PromotionTypeChoices.PERCENTAGE,
            'value': '15',
            'code': 'SPRING15',
            'scope': PromotionScopeChoices.STOREWIDE,
            'min_order_amount': '500',
            'active': 'on',
        })
        self.assertEqual(resp.status_code, 302)
        promo = Promotion.objects.get(title='Spring Sale')
        self.assertEqual(promo.value, Decimal("15"))
        self.assertTrue(promo.active)

    def test_toggle_promotion_post(self):
        promo = Promotion.objects.create(
            merchant=self.merchant, title="Toggle Me",
            promo_type=PromotionTypeChoices.PERCENTAGE, value=Decimal("5"), active=True,
        )
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'toggle_promotion', 'promo_id': promo.id,
        })
        self.assertEqual(resp.status_code, 302)
        promo.refresh_from_db()
        self.assertFalse(promo.active)

    def test_delete_promotion_post(self):
        promo = Promotion.objects.create(
            merchant=self.merchant, title="Delete Me",
            promo_type=PromotionTypeChoices.PERCENTAGE, value=Decimal("5"),
        )
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'delete_promotion', 'promo_id': promo.id,
        })
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Promotion.objects.filter(id=promo.id).exists())

    def test_moderate_review_post(self):
        review = Review.objects.create(
            merchant=self.merchant, rating=4, title="Nice", body="Good",
            moderation_state=ReviewModerationChoices.PENDING,
        )
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'moderate_review', 'review_id': review.id, 'decision': 'approve',
        })
        self.assertEqual(resp.status_code, 302)
        review.refresh_from_db()
        self.assertEqual(review.moderation_state, ReviewModerationChoices.APPROVED)

    def test_add_shipping_rate_post(self):
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'add_shipping_rate',
            'method': 'Same-Day',
            'zone': 'Sandton',
            'rate': '150',
            'free_above': '2000',
            'eta_days': '1',
            'active': 'on',
        })
        self.assertEqual(resp.status_code, 302)
        rate = ShippingRate.objects.get(method='Same-Day')
        self.assertEqual(rate.rate, Decimal("150"))
        self.assertEqual(rate.eta_days, 1)

    def test_update_profile_post(self):
        resp = self.client.post('/merchant/dashboard/', {
            'action': 'update_profile',
            'telephone': '27111234567',
            'email': 'shop@solarbros.co.za',
            'hours_mon_open': '08:00',
            'hours_mon_close': '17:00',
            'hours_sat_open': '09:00',
            'hours_sat_close': '13:00',
            'delivery_options': 'Courier, Collection',
            'payment_methods': 'EFT, Card',
            'about_text': 'Leading solar installer in Gauteng.',
            'return_policy': '7-day returns.',
            'tax_rate': '15',
        })
        self.assertEqual(resp.status_code, 302)
        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.telephone, '27111234567')
        self.assertEqual(self.merchant.operating_hours_json.get('mon'), ['08:00', '17:00'])
        self.assertEqual(self.merchant.operating_hours_json.get('sat'), ['09:00', '13:00'])
        self.assertIn('Courier', self.merchant.delivery_options)
        settings = MerchantCentreSettings.objects.get(merchant=self.merchant)
        self.assertEqual(settings.tax_rate, Decimal("15.00"))
