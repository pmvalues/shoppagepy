"""Merchant catalog crawl & health: impressions, verification, rotation, discovery, surfaces."""

from unittest import mock

from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.evidence.models import EvidenceArtifact
from apps.merchants.models import Merchant
from apps.offers.models import (
    CrawlRun,
    DiscoveredOffer,
    UrlHealthRecord,
    UrlHealthStateChoices,
    UrlImpression,
    VendorProduct,
)
from apps.offers.services.crawler import (
    crawl_rotation,
    discover_merchant_urls,
    health_summary,
    record_url_impression,
    verify_record,
    verify_url,
)
from apps.rights.models import RightsClassChoices, RightsSource, RightsStatusChoices
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone


def _make_rights():
    RightsSource.objects.create(
        name='tinyfish', rights_class=RightsClassChoices.PARTNER_CONTRACTUAL_FEED,
        status=RightsStatusChoices.CLEARED, ai_use_permitted=True,
    )


def _fake_fetch_json(*, price='R 4 999.00', final_url='https://store.co.za/inverter'):
    return {
        'results': [{
            'url': 'https://store.co.za/inverter',
            'final_url': final_url,
            'title': 'Solar Inverter 5kW',
            'language': 'en',
            'text': f'Price: {price} incl VAT. In stock now at the store.',
            'image_links': ['https://store.co.za/img/inverter.jpg'],
        }],
        'errors': [],
    }


class CrawlerBaseTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_crawl_1', name='Crawl Mart', category='hardware_tools',
            website_url='https://store.co.za', claim_state='claimed',
            verification_state='fully_verified',
        )
        self.product = MasterProduct.objects.create(
            canonical_id='p_crawl_1', category_ref='hardware_tools',
            title='Solar Inverter 5kW', brand='VoltCo', status=ProductStatusChoices.ACTIVE,
        )
        self.dof = DiscoveredOffer.objects.create(
            canonical_id='dof_crawl_1', master_product=self.product, merchant=self.merchant,
            merchant_name='Crawl Mart', source_website='store.co.za',
            source_url='https://store.co.za/inverter', discovered_price_amount=4999.0,
            availability_text='In stock', confidence_score=0.9,
        )


class ImpressionTestCase(CrawlerBaseTestCase):
    def test_impression_marks_url_for_refresh_once_per_hour(self):
        recorded = record_url_impression(
            'https://store.co.za/inverter', product=self.product, merchant=self.merchant,
            source='product_page',
        )
        self.assertTrue(recorded)
        self.assertEqual(UrlImpression.objects.count(), 1)
        rec = UrlHealthRecord.objects.get(url='https://store.co.za/inverter')
        self.assertIsNotNone(rec.refresh_requested_at)
        self.assertEqual(rec.refresh_count, 1)
        # Same hour → gated: no second row, no double count.
        record_url_impression(
            'https://store.co.za/inverter', product=self.product, merchant=self.merchant,
            source='product_page',
        )
        self.assertEqual(UrlImpression.objects.count(), 1)
        rec.refresh_from_db()
        self.assertEqual(rec.refresh_count, 1)

    def test_impression_without_url_is_noop(self):
        self.assertFalse(record_url_impression(''))


class VerifyRecordTestCase(CrawlerBaseTestCase):
    def test_success_updates_health_offer_and_evidence(self):
        _make_rights()
        rec = UrlHealthRecord.objects.create(
            url='https://store.co.za/inverter', merchant=self.merchant,
            master_product=self.product, discovered_offer=self.dof,
            expected_hostname='store.co.za',
        )
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: _fake_fetch_json(price='R 4 999.00'),
        )):
            outcome = verify_record(rec)
        self.assertTrue(outcome['crawled'])
        self.assertEqual(outcome['state'], UrlHealthStateChoices.HEALTHY)
        self.assertEqual(outcome['price'], '4999.00')
        rec.refresh_from_db()
        self.assertEqual(rec.last_title, 'Solar Inverter 5kW')
        self.assertEqual(rec.last_availability_text, 'in stock')
        self.assertEqual(rec.last_image_url, 'https://store.co.za/img/inverter.jpg')
        self.assertIsNone(rec.price_drift_amount)  # first observation → no drift
        self.assertIsNone(rec.refresh_requested_at)
        self.assertEqual(rec.last_http_status, 200)

        # Second check with a different price records drift.
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: _fake_fetch_json(price='R 4 599.00'),
        )):
            verify_record(rec)
        rec.refresh_from_db()
        self.assertEqual(str(rec.price_drift_amount), '-400.00')
        self.assertEqual(str(rec.last_price_amount), '4599.00')

        self.dof.refresh_from_db()
        self.assertEqual(str(self.dof.discovered_price_amount), '4599.00')
        self.assertEqual(
            EvidenceArtifact.objects.filter(source_identifier='https://store.co.za/inverter').count(),
            2,
        )

    def test_off_domain_resolution_is_flagged(self):
        _make_rights()
        rec = UrlHealthRecord.objects.create(
            url='https://store.co.za/inverter', merchant=self.merchant,
            master_product=self.product, expected_hostname='store.co.za',
        )
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None,
            json=lambda: _fake_fetch_json(final_url='https://evil-other.co.za/phish'),
        )):
            outcome = verify_record(rec)
        self.assertTrue(outcome['off_domain'])
        rec.refresh_from_db()
        self.assertEqual(rec.state, UrlHealthStateChoices.OFF_DOMAIN)
        self.assertEqual(rec.final_url, 'https://evil-other.co.za/phish')

    def test_failure_marks_failed_with_error(self):
        _make_rights()
        rec = UrlHealthRecord.objects.create(
            url='https://store.co.za/404-page', merchant=self.merchant, expected_hostname='store.co.za',
        )
        fake_json = {
            'results': [],
            'errors': [{'url': 'https://store.co.za/404-page', 'error': 'HTTP 404', 'status': 404}],
        }
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: fake_json,
        )):
            outcome = verify_record(rec)
        self.assertFalse(outcome['crawled'])
        self.assertEqual(outcome['state'], UrlHealthStateChoices.FAILED)
        rec.refresh_from_db()
        self.assertEqual(rec.last_http_status, 404)
        self.assertIn('404', rec.error_text)

    def test_unavailable_tier_degrades_gracefully(self):
        RightsSource.objects.all().delete()
        rec = UrlHealthRecord.objects.create(url='https://store.co.za/inverter', merchant=self.merchant)
        with mock.patch('requests.post') as request_post:
            outcome = verify_record(rec)
        request_post.assert_not_called()
        self.assertEqual(outcome['state'], UrlHealthStateChoices.FAILED)
        rec.refresh_from_db()
        self.assertIn('unavailable', rec.error_text)

    def test_verify_url_creates_ledger_row(self):
        _make_rights()
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: _fake_fetch_json(),
        )):
            outcome = verify_url('https://store.co.za/inverter')
        self.assertTrue(outcome['crawled'])
        rec = UrlHealthRecord.objects.get(url='https://store.co.za/inverter')
        self.assertEqual(rec.state, UrlHealthStateChoices.HEALTHY)
        self.assertEqual(rec.source, 'interactive_verify')


class RotationTestCase(CrawlerBaseTestCase):
    def test_rotation_prioritizes_impression_requests_and_records_run(self):
        _make_rights()
        dirty = UrlHealthRecord.objects.create(
            url='https://store.co.za/inverter', merchant=self.merchant,
            discovered_offer=self.dof, refresh_requested_at=timezone.now(), source='sweep',
        )
        old = UrlHealthRecord.objects.create(
            url='https://store.co.za/other', merchant=self.merchant, source='sweep',
        )
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: _fake_fetch_json(),
        )):
            outcome = crawl_rotation(limit=10, merchant=self.merchant, trigger='periodic', pacing=0.0)
        self.assertEqual(outcome['attempted'], 2)
        self.assertEqual(outcome['ok'], 2)
        self.assertEqual(outcome['failed'], 0)
        self.assertEqual([c['record_id'] for c in outcome['checked']], [dirty.canonical_id, old.canonical_id])
        run = CrawlRun.objects.get(run_id=outcome['run_id'])
        self.assertEqual(run.urls_attempted, 2)
        self.assertEqual(run.urls_ok, 2)
        self.assertEqual(run.status, 'completed')
        dirty.refresh_from_db()
        self.assertIsNone(dirty.refresh_requested_at)  # drained by the crawl


class DiscoveryTestCase(CrawlerBaseTestCase):
    def test_discover_tracks_new_urls_without_duplicates(self):
        _make_rights()
        VendorProduct.objects.create(
            merchant=self.merchant, master_product=self.product, vendor_sku='SKU-1',
            match_source=VendorProduct.MatchSourceChoices.SWEEP,
        )
        fake_json = {'results': [
            {'domain': 'store.co.za', 'title': 'Solar Inverter 5kW', 'snippet': 's',
             'url': 'https://store.co.za/solar-inverter-5kw'},
            {'domain': 'other.co.za', 'title': 'Inverter Deal', 'snippet': 's',
             'url': 'https://other.co.za/deal'},
        ]}
        with mock.patch('requests.get', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: fake_json,
        )):
            first = discover_merchant_urls(self.merchant, products_limit=3, hits_per_query=3)
            second = discover_merchant_urls(self.merchant, products_limit=3, hits_per_query=3)
        self.assertGreaterEqual(first['queries'], 2)  # merchant query + per-product queries
        self.assertGreaterEqual(first['found'], 2)
        self.assertEqual(second['found'], 0)  # idempotent — no duplicates
        self.assertEqual(UrlHealthRecord.objects.filter(merchant=self.merchant).count(), 2)
        self.assertEqual(
            UrlHealthRecord.objects.get(url='https://store.co.za/solar-inverter-5kw').expected_hostname,
            'store.co.za',
        )


class HealthSummaryTestCase(CrawlerBaseTestCase):
    def test_rollup_counts_and_rows(self):
        UrlHealthRecord.objects.create(url='https://a.store.co.za', merchant=self.merchant, state='healthy', last_success_at=timezone.now())
        UrlHealthRecord.objects.create(url='https://b.store.co.za', merchant=self.merchant, state='failed')
        UrlHealthRecord.objects.create(
            url='https://c.store.co.za', merchant=self.merchant, state='healthy',
            last_success_at=timezone.now() - timezone.timedelta(days=30),
        )
        UrlHealthRecord.objects.create(url='https://d.store.co.za', merchant=self.merchant, state='unknown')
        UrlHealthRecord.objects.create(
            url='https://e.store.co.za', merchant=self.merchant, state='healthy',
            last_success_at=timezone.now(), refresh_requested_at=timezone.now(),
        )
        summary = health_summary(self.merchant)
        self.assertEqual(summary['total'], 5)
        self.assertEqual(summary['healthy'], 3)
        self.assertEqual(summary['failed'], 1)
        self.assertEqual(summary['off_domain'], 0)
        self.assertEqual(summary['never_checked'], 1)
        self.assertEqual(summary['stale'], 1)
        self.assertEqual(summary['refresh_pending'], 1)
        self.assertIsNone(summary['last_run'])
        self.assertEqual(len(summary['urls']), 5)
        states = {row['url']: row['state'] for row in summary['urls']}
        self.assertEqual(states['https://b.store.co.za'], 'failed')
        self.assertEqual(states['https://c.store.co.za'], 'stale')


class CrawlSurfaceTestCase(CrawlerBaseTestCase):
    """Public API + merchant dashboard surfaces."""

    def test_merchant_health_api(self):
        UrlHealthRecord.objects.create(url='https://store.co.za/inverter', merchant=self.merchant, state='healthy', last_success_at=timezone.now())
        response = self.client.get(f"/api/v1/merchants/{self.merchant.canonical_id}/health/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['merchant'], 'Crawl Mart')
        self.assertEqual(data['health']['total'], 1)
        self.assertEqual(data['health']['healthy'], 1)
        self.assertEqual(data['health']['urls'][0]['url'], 'https://store.co.za/inverter')

    def test_merchant_health_api_unknown_merchant_404(self):
        response = self.client.get('/api/v1/merchants/does_not_exist/health/')
        self.assertEqual(response.status_code, 404)

    def test_verify_endpoint_writes_health_ledger(self):
        _make_rights()
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: _fake_fetch_json(),
        )):
            response = self.client.post(
                '/api/v1/verify-price/', {'url': 'https://store.co.za/inverter'},
                content_type='application/json',
            )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['verified'])
        rec = UrlHealthRecord.objects.get(url='https://store.co.za/inverter')
        self.assertEqual(rec.state, UrlHealthStateChoices.HEALTHY)

    def test_dashboard_renders_catalog_health_tab(self):
        from django.contrib.auth.models import User

        user = User.objects.create_user('crawl_owner', password='x')
        self.merchant.owner = user
        self.merchant.save(update_fields=['owner'])
        UrlHealthRecord.objects.create(
            url='https://store.co.za/inverter', merchant=self.merchant, state='failed',
            error_text='HTTP 404', last_crawled_at=timezone.now(),
        )
        self.client.force_login(user)
        response = self.client.get(f'/merchant/dashboard/?merchantId={self.merchant.canonical_id}')
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn('Catalog Health', body)
        self.assertIn('store.co.za/inverter', body)
        self.assertIn('Failed Checks', body)
        self.assertIn('discover', body)
