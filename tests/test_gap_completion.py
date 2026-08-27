"""Completion tests for the six Google-parity gaps:

1. Google taxonomy wiring (apps.catalog.taxonomy)
2. Product images in feeds/templates
3. Approval-grade Google Merchant Center feed
4. Native reviews + structured opening hours
5. Spell correction / did-you-mean
6. Merchant insights dashboard
"""
from django.core.cache import cache
from django.test import TestCase, Client

from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import Merchant, ClaimStateChoices, VerificationStateChoices
from apps.catalog.models import (
    MasterProduct, ProductStatusChoices, Review, ReviewModerationChoices, aggregate_reviews,
)
from apps.offers.models import Offer, DestinationTypeChoices, AvailabilityStateChoices
from apps.referrals.models import ReferralEvent, ReferralActionChoices
from apps.catalog.taxonomy import (
    resolve_google_category, google_category_by_id, breadcrumb_path, all_categories, CATEGORY_REF_MAP,
)
from apps.intelligence.services import (
    generate_google_merchant_center_feed, suggest_query, _feed_availability,
)


class Gap1TaxonomyTestCase(TestCase):
    def test_taxonomy_tree_loaded(self):
        self.assertGreaterEqual(len(all_categories()), 5500)

    def test_resolve_known_category_ref(self):
        result = resolve_google_category('solar_energy')
        self.assertIsNotNone(result)
        gid, name, full_path = result
        self.assertEqual(gid, 127)
        self.assertIn('Power', name)

    def test_resolve_unknown_returns_none(self):
        self.assertIsNone(resolve_google_category('does_not_exist'))

    def test_override_id_takes_precedence(self):
        result = resolve_google_category('solar_energy', override_id=632)
        self.assertEqual(result[0], 632)

    def test_breadcrumb_path_returns_root_to_leaf(self):
        path = breadcrumb_path(127)
        self.assertTrue(path)
        self.assertEqual(path[0][0], path[0][0])  # root present
        self.assertEqual(path[-1][0], 127)

    def test_google_category_by_id(self):
        row = google_category_by_id(267)
        self.assertIsNotNone(row)
        self.assertIn('Mobile Phones', row[1])


class Gap2ImagesTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.market = Market.objects.create(
            name="Test Mall", canonical_slug="test-mall", market_type=MarketTypeChoices.FORMAL_MEGA_MALL,
            country="ZA", province="Gauteng",
        )
        self.merchant = Merchant.objects.create(
            canonical_id="m_img_test", name="Img Test Store", country="ZA",
            claim_state=ClaimStateChoices.CLAIMED, verification_state=VerificationStateChoices.FULLY_VERIFIED,
            market=self.market, category="solar_energy", province="Gauteng", trust_score=90,
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_img_test", category_ref="solar_energy", title="Img Test Inverter",
            brand="Deye", status=ProductStatusChoices.ACTIVE, image_url="https://cdn.example.com/p.jpg",
            google_category_id=127, attributes={"estimatedPriceZar": 15000},
        )
        Offer.objects.create(
            canonical_id="ofr_img_test", variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP, price_amount=14999.00,
            currency="ZAR", availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_feed_emits_image_link(self):
        xml = generate_google_merchant_center_feed('m_img_test')
        self.assertIn('<g:image_link>https://cdn.example.com/p.jpg</g:image_link>', xml)

    def test_product_detail_renders_image(self):
        res = self.client.get(f"/p/{self.product.canonical_id}/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'https://cdn.example.com/p.jpg')


class Gap3GmcFeedTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.market = Market.objects.create(
            name="Feed Mall", canonical_slug="feed-mall", market_type=MarketTypeChoices.FORMAL_MEGA_MALL,
            country="ZA", province="Gauteng",
        )
        self.merchant = Merchant.objects.create(
            canonical_id="m_feed_test", name="Feed Test Store", country="ZA",
            claim_state=ClaimStateChoices.CLAIMED, verification_state=VerificationStateChoices.FULLY_VERIFIED,
            market=self.market, category="solar_energy", province="Gauteng", trust_score=90,
            delivery_options=[{"name": "Standard", "price": 0}],
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_feed_test", category_ref="solar_energy", title="Feed Test Inverter",
            brand="Deye", status=ProductStatusChoices.ACTIVE, google_category_id=127,
            attributes={"estimatedPriceZar": 15000},
        )
        self.fresh_offer = Offer.objects.create(
            canonical_id="ofr_feed_fresh", variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP, price_amount=14999.00,
            currency="ZAR", availability_state=AvailabilityStateChoices.FRESH,
        )
        self.quote_offer = Offer.objects.create(
            canonical_id="ofr_feed_quote", variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP, price_amount=None,
            currency="ZAR", availability_state=AvailabilityStateChoices.QUOTE_REQUIRED,
        )

    def test_availability_mapping(self):
        self.assertEqual(_feed_availability(AvailabilityStateChoices.FRESH), 'in_stock')
        self.assertEqual(_feed_availability(AvailabilityStateChoices.CONFIRM_REQUIRED), 'preorder')
        self.assertEqual(_feed_availability(AvailabilityStateChoices.OUT_OF_STOCK), 'out_of_stock')
        self.assertIsNone(_feed_availability(AvailabilityStateChoices.QUOTE_REQUIRED))
        self.assertIsNone(_feed_availability(AvailabilityStateChoices.HIDDEN))

    def test_feed_includes_google_product_category(self):
        xml = generate_google_merchant_center_feed('m_feed_test')
        self.assertIn('<g:google_product_category>', xml)
        self.assertIn('Power', xml)

    def test_feed_identifier_exists_when_no_gtin_mpn(self):
        xml = generate_google_merchant_center_feed('m_feed_test')
        self.assertIn('<g:identifier_exists>false</g:identifier_exists>', xml)

    def test_feed_excludes_quote_required_offer(self):
        xml = generate_google_merchant_center_feed('m_feed_test')
        self.assertIn('ofr_feed_fresh', xml)
        self.assertNotIn('ofr_feed_quote', xml)

    def test_feed_emits_shipping_when_delivery_options(self):
        xml = generate_google_merchant_center_feed('m_feed_test')
        self.assertIn('<g:shipping>', xml)

    def test_platform_feed_all(self):
        xml = generate_google_merchant_center_feed('all')
        self.assertIn('<rss', xml)
        self.assertIn('ofr_feed_fresh', xml)

    def test_feed_item_group_id_and_product_type(self):
        xml = generate_google_merchant_center_feed('m_feed_test')
        self.assertIn('<g:item_group_id>var_feed_test</g:item_group_id>', xml)
        self.assertIn('<g:product_type>', xml)


class Gap4ReviewsHoursTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.market = Market.objects.create(
            name="Rev Mall", canonical_slug="rev-mall", market_type=MarketTypeChoices.FORMAL_MEGA_MALL,
            country="ZA", province="Gauteng",
        )
        self.merchant = Merchant.objects.create(
            canonical_id="m_rev_test", name="Rev Test Store", country="ZA",
            claim_state=ClaimStateChoices.CLAIMED, verification_state=VerificationStateChoices.FULLY_VERIFIED,
            market=self.market, category="solar_energy", province="Gauteng", trust_score=90,
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_rev_test", category_ref="solar_energy", title="Rev Test Inverter",
            brand="Deye", status=ProductStatusChoices.ACTIVE, attributes={"estimatedPriceZar": 15000},
        )

    def test_aggregate_reviews(self):
        for r in (5, 4, 5):
            Review.objects.create(product=self.product, rating=r, moderation_state=ReviewModerationChoices.APPROVED)
        summary = aggregate_reviews(self.product.reviews.all())
        self.assertEqual(summary['count'], 3)
        self.assertEqual(summary['avg'], 4.7)
        self.assertEqual(summary['distribution']['5'], 2)

    def test_review_save_refreshes_summary(self):
        Review.objects.create(product=self.product, rating=5, moderation_state=ReviewModerationChoices.APPROVED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.reviews_summary['count'], 1)
        self.assertEqual(self.product.reviews_summary['avg'], 5.0)

    def test_review_post_creates_approved_review(self):
        res = self.client.post(
            f"/p/{self.product.canonical_id}/",
            {'review_submit': '1', 'rating': '4', 'author_name': 'Test Buyer', 'title': 'Good', 'body': 'Nice'},
        )
        self.assertEqual(res.status_code, 302)
        self.assertEqual(self.product.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED).count(), 1)

    def test_review_honeypot_blocks(self):
        self.client.post(
            f"/p/{self.product.canonical_id}/",
            {'review_submit': '1', 'rating': '5', 'website': 'spam@example.com'},
        )
        self.assertEqual(self.product.reviews.count(), 0)

    def test_merchant_review_post(self):
        res = self.client.post(
            f"/m/{self.merchant.canonical_id}/",
            {'review_submit': '1', 'rating': '5', 'body': 'Great store'},
        )
        self.assertEqual(res.status_code, 302)
        self.assertEqual(self.merchant.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED).count(), 1)

    def test_product_detail_lists_reviews(self):
        Review.objects.create(product=self.product, rating=5, title='Top', body='Excellent',
                              moderation_state=ReviewModerationChoices.APPROVED)
        res = self.client.get(f"/p/{self.product.canonical_id}/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Excellent')
        self.assertContains(res, 'Verified Buyer Reviews')

    def test_is_open_now_always_open(self):
        self.merchant.operating_hours_json = {d: ['00:00', '23:59'] for d in
                                              ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']}
        open_now, _ = self.merchant.is_open_now()
        self.assertTrue(open_now)

    def test_is_open_now_unknown_when_no_hours(self):
        self.merchant.operating_hours_json = {}
        open_now, label = self.merchant.is_open_now()
        self.assertIsNone(open_now)

    def test_jsonld_includes_opening_hours(self):
        from apps.core.seo import merchant_jsonld
        self.merchant.operating_hours_json = {'mon': ['08:00', '17:00']}
        data = merchant_jsonld(self.merchant)
        self.assertIn('openingHours', data)
        self.assertIn('Mo 08:00-17:00', data['openingHours'])


class Gap5SpellCorrectionTestCase(TestCase):
    def setUp(self):
        cache.clear()
        MasterProduct.objects.create(
            canonical_id="var_spell_1", category_ref="solar_energy", title="Sunsynk 5kW Hybrid Inverter",
            brand="Sunsynk", status=ProductStatusChoices.ACTIVE, attributes={"estimatedPriceZar": 17000},
        )

    def test_suggest_query_corrects_misspelling(self):
        suggestion = suggest_query('sunsyk inverter')
        self.assertIsNotNone(suggestion)
        self.assertIn('sunsynk', suggestion)

    def test_suggest_query_none_when_correct(self):
        self.assertIsNone(suggest_query('sunsynk'))

    def test_suggest_query_none_when_too_short(self):
        self.assertIsNone(suggest_query('ab'))


class Gap6InsightsTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.market = Market.objects.create(
            name="Ins Mall", canonical_slug="ins-mall", market_type=MarketTypeChoices.FORMAL_MEGA_MALL,
            country="ZA", province="Gauteng",
        )
        self.merchant = Merchant.objects.create(
            canonical_id="m_ins_test", name="Ins Test Store", country="ZA",
            claim_state=ClaimStateChoices.CLAIMED, verification_state=VerificationStateChoices.FULLY_VERIFIED,
            market=self.market, category="solar_energy", province="Gauteng", trust_score=90,
        )
        self.product = MasterProduct.objects.create(
            canonical_id="var_ins_test", category_ref="solar_energy", title="Ins Test Inverter",
            brand="Deye", status=ProductStatusChoices.ACTIVE, attributes={"estimatedPriceZar": 15000},
        )
        self.offer = Offer.objects.create(
            canonical_id="ofr_ins_test", variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP, price_amount=14999.00,
            currency="ZAR", availability_state=AvailabilityStateChoices.FRESH,
        )
        ReferralEvent.objects.create(merchant=self.merchant, offer=self.offer,
                                     action=ReferralActionChoices.WHATSAPP_START)
        ReferralEvent.objects.create(merchant=self.merchant, offer=self.offer,
                                     action=ReferralActionChoices.OUTBOUND_CLICK)

    def test_dashboard_context_has_insights(self):
        res = self.client.get("/merchant/dashboard/", {"merchantId": "m_ins_test"})
        self.assertEqual(res.status_code, 200)
        insights = res.context['insights']
        self.assertEqual(insights['total'], 2)
        self.assertIn('all_time', insights)
        self.assertIn('top_offers', insights)

    def test_dashboard_renders_insights_section(self):
        res = self.client.get("/merchant/dashboard/", {"merchantId": "m_ins_test"})
        self.assertContains(res, 'Merchant Insights')
