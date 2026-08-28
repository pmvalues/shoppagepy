"""Publishing-conformance tests.

These lock the guarantees the audit found missing: structured data and feeds may
publish only attributes a record actually holds, canonical URLs are single-valued,
fabricated signals are gone, and merchant consent gates catalogue syndication.
"""

import json
import re

from apps.catalog.models import MasterProduct, ProductImage, ProductStatusChoices
from apps.core.hours import day_rows, normalize_hours, open_status
from apps.core.seo import product_jsonld
from apps.intelligence.ranking import ranked_search
from apps.intelligence.services import generate_google_merchant_center_feed
from apps.markets.models import Market, MarketTypeChoices
from apps.merchants.models import ClaimStateChoices, Merchant, VerificationStateChoices
from apps.offers.models import (
    AvailabilityStateChoices,
    DestinationTypeChoices,
    Offer,
    PriceObservation,
    SlaClassChoices,
)
from django.test import TestCase

LD_JSON = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)


def ld_payloads(response):
    return [json.loads(match) for match in LD_JSON.findall(response.content.decode())]


class PublishingConformanceTestCase(TestCase):
    def setUp(self):
        self.market = Market.objects.create(
            name='Dragon City', canonical_slug='dragon-city',
            market_type=MarketTypeChoices.WHOLESALE_MARKET,
            country='ZA', province='Gauteng', metro='City of Johannesburg',
            locality='Crown Mines', postal_code='2092',
            opening_hours={'mon': {'open': '08:30', 'close': '17:00'}},
            timezone='Africa/Johannesburg',
        )
        self.merchant = Merchant.objects.create(
            canonical_id='m_conf_solar', name='Conformance Solar', country='ZA',
            claim_state=ClaimStateChoices.CLAIMED,
            verification_state=VerificationStateChoices.FULLY_VERIFIED,
            whatsapp_number='27712345678', market=self.market,
            locality='Sandton', postal_code='2196', province='Gauteng',
            address_text='83 Rivonia Rd', timezone='Africa/Johannesburg',
            opening_hours={day: {'open': '09:00', 'close': '17:00'}
                           for day in ('mon', 'tue', 'wed', 'thu', 'fri')},
            trust_score=90,
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_conf_inverter', category_ref='solar_energy',
            title='Conformance 5 kW Hybrid Inverter & Controller',
            brand='Conform', model_number='CONF-5K', gtin13='6971234567895',
            mpn='CONF-5K', status=ProductStatusChoices.ACTIVE,
            description='A deliberately described inverter used by the conformance suite.',
            attributes={'ratedPowerKw': 5.0},
            family_ref='fam_conf',
        )
        ProductImage.objects.create(
            product=self.product, url='https://cdn.example/conf-5k.jpg',
            alt_text='Conformance inverter', width=1200, height=1200,
        )
        self.offer = Offer.objects.create(
            canonical_id='ofr_conf_1', variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=12345.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
            sla_class=SlaClassChoices.RETAIL_72H,
        )

    # --- structured data -----------------------------------------------------
    def test_product_graph_publishes_image_description_and_real_offer_state(self):
        res = self.client.get(f'/p/{self.product.canonical_id}/')
        self.assertEqual(res.status_code, 200)
        graph = ld_payloads(res)[0]
        self.assertEqual(graph['@type'], 'Product')
        self.assertEqual(graph['image'], ['https://cdn.example/conf-5k.jpg'])
        self.assertIn('deliberately described', graph['description'])
        self.assertEqual(graph['gtin13'], '6971234567895')
        self.assertEqual(graph['offers']['@type'], 'Offer')
        self.assertEqual(graph['offers']['availability'], 'https://schema.org/InStock')
        # Nothing invented: no aggregate rating exists on this record.
        self.assertNotIn('aggregateRating', graph)

    def test_breadcrumb_graph_accompanies_entity_graph(self):
        res = self.client.get(f'/p/{self.product.canonical_id}/')
        types = [payload['@type'] for payload in ld_payloads(res)]
        self.assertIn('BreadcrumbList', types)

    def test_invalid_gtin_is_never_published(self):
        product = MasterProduct.objects.create(
            canonical_id='var_conf_bad_gtin', category_ref='solar_energy',
            title='Bad Barcode Unit', brand='Conform', gtin13='1234567890123',
            status=ProductStatusChoices.ACTIVE,
        )
        self.assertEqual(product.gtin_pairs, [])
        graph = product_jsonld(product)
        self.assertNotIn('gtin13', graph)
        res = self.client.get(f'/p/{product.canonical_id}/')
        self.assertContains(res, 'No GS1 barcode on record')

    def test_store_graph_carries_hours_locality_and_timezone(self):
        res = self.client.get(f'/m/{self.merchant.canonical_id}/')
        graph = ld_payloads(res)[0]
        self.assertEqual(graph['@type'], 'Store')
        self.assertEqual(graph['address']['addressLocality'], 'Sandton')
        self.assertEqual(graph['address']['postalCode'], '2196')
        self.assertTrue(graph['openingHoursSpecification'])
        self.assertEqual(graph['openingHoursSpecification'][0]['opens'], '09:00')

    # --- head / canonical ----------------------------------------------------
    def test_pages_have_distinct_titles_descriptions_and_canonicals(self):
        product_page = self.client.get(f'/p/{self.product.canonical_id}/')
        merchant_page = self.client.get(f'/m/{self.merchant.canonical_id}/')
        product_head = product_page.content.decode()
        merchant_head = merchant_page.content.decode()
        self.assertIn('<link rel="canonical" href="http://testserver/p/var_conf_inverter/">', product_head)
        self.assertIn('<link rel="canonical" href="http://testserver/m/m_conf_solar/">', merchant_head)
        self.assertNotIn('https://shoppage.co.za/m/', product_head)
        self.assertNotIn(product_page.context['meta_description'], merchant_page.context['meta_description'])
        self.assertTrue(product_page.context['meta_description'])

    def test_search_results_are_noindex(self):
        res = self.client.get('/search/?q=conformance')
        self.assertIn('noindex', res.content.decode())

    # --- feeds ---------------------------------------------------------------
    def test_feed_publishes_required_and_honest_attributes(self):
        xml = generate_google_merchant_center_feed(self.merchant.canonical_id, 'https://shoppage.co.za')
        self.assertIn('<rss xmlns:g="http://base.google.com/ns/1.0"', xml)
        self.assertIn('<g:image_link>https://cdn.example/conf-5k.jpg</g:image_link>', xml)
        self.assertIn('<g:availability>in_stock</g:availability>', xml)
        self.assertIn('<g:expiration_date>', xml)
        self.assertIn('<g:item_group_id>fam_conf</g:item_group_id>', xml)
        self.assertIn('<g:link>https://shoppage.co.za/p/var_conf_inverter/</g:link>', xml)
        self.assertIn('<g:mobile_link>https://shoppage.co.za/l/ofr_conf_1</g:mobile_link>', xml)
        self.assertIn('<g:gtin13>6971234567895</g:gtin13>', xml)
        # Ampersand in the title must be escaped, not emitted raw.
        self.assertIn('Inverter &amp; Controller', xml)
        self.assertNotIn('Inverter & Controller<', xml)

    def test_feed_reflects_out_of_stock_and_drops_hidden_offers(self):
        self.offer.availability_state = AvailabilityStateChoices.OUT_OF_STOCK
        self.offer.save()
        hidden = Offer.objects.create(
            canonical_id='ofr_conf_hidden', variant=self.product, merchant=self.merchant,
            price_amount=9999.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.HIDDEN,
        )
        xml = generate_google_merchant_center_feed(self.merchant.canonical_id, 'https://x.test')
        self.assertIn('<g:availability>out_of_stock</g:availability>', xml)
        self.assertNotIn(hidden.canonical_id, xml)

    def test_feed_requires_a_claimed_profile(self):
        candidate = Merchant.objects.create(
            canonical_id='m_conf_candidate', name='Unclaimed Trader',
            claim_state=ClaimStateChoices.CANDIDATE,
            verification_state=VerificationStateChoices.UNVERIFIED,
        )
        Offer.objects.create(
            canonical_id='ofr_conf_candidate', variant=self.product, merchant=candidate,
            price_amount=1000.00, currency='ZAR',
        )
        res = self.client.get('/api/feeds/google-merchant-center/m_conf_candidate/')
        self.assertEqual(res.status_code, 404)

    def test_feed_url_by_primary_key_redirects_to_canonical(self):
        res = self.client.get(f'/api/feeds/google-merchant-center/{self.merchant.id}/')
        self.assertEqual(res.status_code, 301)
        self.assertIn(self.merchant.canonical_id, res.url)

    def test_feed_response_is_cacheable(self):
        res = self.client.get('/api/feeds/google-merchant-center/m_conf_solar/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('max-age', res['Cache-Control'])
        self.assertEqual(res['X-Robots-Tag'], 'noindex, nofollow')

    # --- no fabricated signals ----------------------------------------------
    def test_product_page_does_not_invent_retailer_offers_or_price_history(self):
        from apps.offers.models import DiscoveredOffer

        before = DiscoveredOffer.objects.count()
        res = self.client.get(f'/p/{self.product.canonical_id}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(DiscoveredOffer.objects.count(), before)
        body = res.content.decode()
        self.assertIn('No measured price history yet', body)

    def test_price_change_records_an_observation_and_makes_history_real(self):
        self.assertEqual(PriceObservation.objects.filter(offer=self.offer).count(), 1)
        self.offer.price_amount = 11111.00
        self.offer.save()
        self.assertEqual(PriceObservation.objects.filter(offer=self.offer).count(), 2)
        history = self.offer.price_range(30)
        self.assertEqual(float(history['low']), 11111.0)
        self.assertEqual(float(history['high']), 12345.0)
        self.assertTrue(history['meaningful'])

    def test_seal_for_unknown_merchant_is_not_another_merchants_seal(self):
        res = self.client.get('/api/seal/m_does_not_exist/')
        self.assertEqual(res.status_code, 404)

    # --- search index and freshness -----------------------------------------
    def test_new_product_is_searchable_without_a_manual_rebuild(self):
        fresh = MasterProduct.objects.create(
            canonical_id='var_conf_fresh', category_ref='solar_energy',
            title='Zebralink Quantum Charge Controller', brand='Zebralink',
            status=ProductStatusChoices.ACTIVE,
        )
        from django.db import connection

        if connection.vendor == 'sqlite':
            # Dev path: the SQLite FTS5 index is kept in step by signals.
            from apps.catalog.fts import fts_search_ids

            self.assertIn(str(fresh.pk), fts_search_ids('zebralink', 50))
        else:
            # Production path: ranked_search reads indexed base-table columns,
            # so a new row is searchable immediately with no rebuild.
            from apps.intelligence.ranking import ranked_search

            results = ranked_search('zebralink', limit=50)
            self.assertIn(fresh.pk, {sp.product.pk for sp in results['products']})

    def test_search_reflects_a_price_change_immediately(self):
        first = self.client.get('/search/?q=conformance')
        self.assertContains(first, '12,345')
        self.offer.price_amount = 4321.00
        self.offer.save()
        second = self.client.get('/search/?q=conformance')
        self.assertContains(second, '4,321')
        self.assertNotContains(second, 'R 12,345')

    def test_search_total_reports_the_retrieval_window_honestly(self):
        from apps.intelligence.ranking import ranked_search

        results = ranked_search('conformance', limit=5)
        self.assertIn('result_cap', results)
        self.assertIn('is_capped', results)
        self.assertLessEqual(results['total_products'], results['result_cap'])

    def test_province_filter_is_applied(self):
        other_merchant = Merchant.objects.create(
            canonical_id='m_conf_west', name='Western Conformance', country='ZA',
            province='Western Cape', locality='Cape Town',
            verification_state=VerificationStateChoices.PHONE_VERIFIED,
        )
        product = MasterProduct.objects.create(
            canonical_id='var_conf_west_only', category_ref='solar_energy',
            title='Conformance West Unit', brand='Conform',
            status=ProductStatusChoices.ACTIVE,
        )
        Offer.objects.create(
            canonical_id='ofr_conf_west', variant=product, merchant=other_merchant,
            price_amount=5000.00, currency='ZAR',
        )
        gauteng = ranked_search('conformance', limit=20, province='Gauteng')
        titles = {sp.product.title for sp in gauteng['products']}
        self.assertNotIn('Conformance West Unit', titles)

    # --- hours ---------------------------------------------------------------
    def test_shopify_products_json_reflects_real_offers(self):
        res = self.client.get('/api/products.json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content)
        self.assertIn('products', data)
        product = next(p for p in data['products'] if p['handle'] == 'var_conf_inverter')
        self.assertEqual(product['vendor'], 'Conform')
        self.assertEqual(product['images'][0]['src'], 'https://cdn.example/conf-5k.jpg')
        self.assertTrue(product['body_html'])
        variant = product['variants'][0]
        self.assertEqual(variant['price'], '12345.00')
        self.assertTrue(variant['available'])

    def test_hours_helpers_are_conservative_about_missing_data(self):
        self.assertEqual(normalize_hours({}), {})
        self.assertIsNone(open_status({}, 'Africa/Johannesburg'))
        rows = day_rows({'mon': {'open': '09:00', 'close': '17:00'}})
        self.assertEqual(rows[0], ('Monday', '09:00–17:00'))
        self.assertEqual(rows[1][1], 'Not confirmed')

    def test_hours_are_computed_in_the_records_timezone(self):
        merchant = Merchant.objects.create(
            canonical_id='m_conf_hours', name='After Hours Traders', country='US',
            timezone='America/New_York',
            opening_hours={day: {'open': '09:00', 'close': '17:00'}
                           for day in ('mon', 'tue', 'wed', 'thu', 'fri')},
        )
        from datetime import datetime

        from zoneinfo import ZoneInfo
        saturday_local = datetime(2026, 8, 29, 12, 0, tzinfo=ZoneInfo('America/New_York'))
        status = open_status(merchant.opening_hours, merchant.resolved_timezone, at=saturday_local)
        self.assertFalse(status['is_open'])
        self.assertEqual(status['timezone'], 'America/New_York')
