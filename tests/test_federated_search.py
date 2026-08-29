"""Federated live search: providers, rights gate, cache, merge, API + page wiring."""

import os
from unittest import mock

from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.evidence.models import EvidenceArtifact
from apps.intelligence.connectors.tinyfish import TinyFishFetchProvider, extract_zar
from apps.intelligence.federated import external_results, federated_search
from apps.merchants.models import Merchant
from apps.offers.models import DiscoveredOffer
from apps.rights.models import RightsClassChoices, RightsSource, RightsStatusChoices
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings


def _clear_tinyfish_rights():
    RightsSource.objects.filter(name='tinyfish').delete()


class FederatedSearchTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_ext_1', name='Ext Hardware', category='hardware_tools',
            claim_state='claimed', verification_state='fully_verified',
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_ext_1', category_ref='hardware_tools',
            title='Ext Drill 13mm', brand='ExtCo', status=ProductStatusChoices.ACTIVE,
        )
        self.sweep = DiscoveredOffer.objects.create(
            canonical_id='dof_ext_1', master_product=self.product, merchant=self.merchant,
            merchant_name='Web Mart', source_website='webmart.co.za',
            source_url='https://webmart.co.za/p/13mm-drill',
            discovered_price_amount=1299.99, currency='ZAR',
            availability_text='In stock now', confidence_score=0.95,
            location_hint='Cape Town',
        )

    def test_own_sweep_returns_price_bearing_hit(self):
        payload = external_results('drill 13mm')
        self.assertTrue(payload['results'])
        hit = payload['results'][0]
        self.assertEqual(hit['provider'], 'own_sweep')
        self.assertEqual(hit['hostname'], 'webmart.co.za')
        self.assertEqual(hit['price_amount'], '1299.99')

    def test_wikipedia_blocked_without_cleared_rights(self):
        RightsSource.objects.all().delete()
        payload = external_results('drill')
        self.assertNotIn('wikipedia', payload['providers'])

    def test_wikipedia_serves_after_cleared_and_is_cached(self):
        RightsSource.objects.create(
            name='wikipedia', rights_class=RightsClassChoices.OPEN_DATA_COMMERCIAL,
            status=RightsStatusChoices.CLEARED, ai_use_permitted=True,
        )
        fake_json = {'query': {'pages': {
            '1': {'index': 1, 'title': 'Drilling', 'extract': 'Drilling is a cutting process.',
                  'fullurl': 'https://en.wikipedia.org/wiki/Drilling'},
        }}}
        with mock.patch('requests.get', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: fake_json,
        )) as request_get:
            first = external_results('drill')
            second = external_results('drill')
        self.assertEqual(request_get.call_count, 1)  # second call served from cache
        self.assertIn('wikipedia', first['providers'])
        self.assertIn('wikipedia', second['providers'])
        titles = [r['title'] for r in first['results']]
        self.assertIn('Drilling', titles)
        # Price-bearing sweep observation ranks above the snippet.
        self.assertEqual(first['results'][0]['provider'], 'own_sweep')

    def test_federated_search_shape(self):
        payload = federated_search('drill 13mm', include_external=True)
        self.assertIn('intent', payload)
        self.assertIn('internal', payload)
        self.assertIn('external', payload)
        self.assertGreaterEqual(payload['internal']['total_products'], 1)

    def test_zero_rate_limit_blocks_providers(self):
        with override_settings(SHOPPAGE_EXTERNAL_SEARCH={
            **settings.SHOPPAGE_EXTERNAL_SEARCH,
            'rate_limit_per_minute': 0,
        }):
            cache.clear()
            payload = external_results('drill')
            self.assertEqual(payload['results'], [])


class TinyFishProviderTestCase(TestCase):
    """TinyFish search: key + rights gate, live results, cache."""

    def setUp(self):
        cache.clear()
        _clear_tinyfish_rights()

    def tearDown(self):
        _clear_tinyfish_rights()

    def test_blocked_without_key_or_rights(self):
        with mock.patch('requests.get') as request_get:
            payload = external_results('solar inverter')
        request_get.assert_not_called()
        self.assertNotIn('tinyfish', payload['providers'])
        self.assertNotIn('tinyfish_fetch', payload['providers'])

    def test_search_serves_with_key_and_cleared_rights_and_is_cached(self):
        RightsSource.objects.create(
            name='tinyfish', rights_class=RightsClassChoices.PARTNER_CONTRACTUAL_FEED,
            status=RightsStatusChoices.CLEARED, ai_use_permitted=True,
        )
        fake_json = {
            'query': 'solar inverter',
            'total_results': 1,
            'page': 1,
            'results': [{
                'position': 1,
                'domain': 'example.co.za',
                'title': 'Solar Inverter 5kW',
                'snippet': 'Best price on 5kW solar inverters with free delivery.',
                'url': 'https://example.co.za/solar-inverter-5kw',
                'published_date': '2026-08-01',
            }],
        }
        with mock.patch.dict(os.environ, {'TINYFISH_API_KEY': 'sk-test'}), \
                mock.patch('requests.get', return_value=mock.Mock(
                    raise_for_status=lambda: None, json=lambda: fake_json,
                )) as request_get:
            first = external_results('solar inverter')
            second = external_results('solar inverter')
        self.assertEqual(request_get.call_count, 1)  # second call served from cache
        self.assertIn('tinyfish', first['providers'])
        self.assertIn('tinyfish', second['providers'])
        hits = [r for r in first['results'] if r['provider'] == 'tinyfish']
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]['hostname'], 'example.co.za')
        self.assertEqual(hits[0]['title'], 'Solar Inverter 5kW')
        self.assertLessEqual(len(hits[0]['snippet']), 200)

    def test_fetch_captures_evidence_artifact_with_price(self):
        RightsSource.objects.create(
            name='tinyfish', rights_class=RightsClassChoices.PARTNER_CONTRACTUAL_FEED,
            status=RightsStatusChoices.CLEARED, ai_use_permitted=True,
        )
        fake_json = {
            'results': [{
                'url': 'https://example.co.za/inverter',
                'final_url': 'https://example.co.za/inverter',
                'title': 'Solar Inverter 5kW',
                'language': 'en',
                'text': 'Price: R 4 999.00 incl VAT. In stock now.',
            }],
            'errors': [],
        }
        provider = TinyFishFetchProvider()
        with mock.patch.dict(os.environ, {'TINYFISH_API_KEY': 'sk-test'}), \
                mock.patch('requests.post', return_value=mock.Mock(
                    raise_for_status=lambda: None, json=lambda: fake_json,
                )) as request_post:
            snapshots = provider.fetch(['https://example.co.za/inverter'])
        request_post.assert_called_once()
        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0]['price_amount'], '4999.00')
        artifact = EvidenceArtifact.objects.filter(
            source_identifier='https://example.co.za/inverter'
        ).first()
        self.assertIsNotNone(artifact)
        self.assertEqual(artifact.artifact_hash, snapshots[0]['artifact_hash'])
        self.assertEqual(len(artifact.artifact_hash), 64)
        self.assertEqual(artifact.raw_payload['price_amount'], '4999.00')

    def test_fetch_without_key_never_touches_network(self):
        provider = TinyFishFetchProvider({'api_key': ''})
        with mock.patch.dict(os.environ, {'TINYFISH_API_KEY': ''}), \
                override_settings(TINYFISH_API_KEY=''), \
                mock.patch('requests.post') as request_post:
            snapshots = provider.fetch(['https://example.co.za/inverter'])
        request_post.assert_not_called()
        self.assertEqual(snapshots, [])

    def test_extract_zar_heuristics(self):
        from decimal import Decimal

        self.assertEqual(extract_zar('R 4 999.00'), Decimal('4999.00'))
        self.assertEqual(extract_zar('only R1,299.99 today'), Decimal('1299.99'))
        self.assertEqual(extract_zar('just R1299 flat'), Decimal('1299'))
        self.assertIsNone(extract_zar('no price mentioned'))


class VerifyPriceSurfaceTestCase(TestCase):
    """POST /api/v1/verify-price/ — TinyFish fetch tier via the API."""

    VERIFY_URL = '/api/v1/verify-price/'

    def setUp(self):
        cache.clear()

    def _make_rights(self):
        RightsSource.objects.create(
            name='tinyfish', rights_class=RightsClassChoices.PARTNER_CONTRACTUAL_FEED,
            status=RightsStatusChoices.CLEARED, ai_use_permitted=True,
        )

    def test_rejects_missing_or_invalid_url(self):
        resp = self.client.post(self.VERIFY_URL, {'url': ''}, content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        resp = self.client.post(self.VERIFY_URL, {'url': 'ftp://not-web'}, content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        resp = self.client.post(self.VERIFY_URL, {'url': 'x' * 3000}, content_type='application/json')
        self.assertEqual(resp.status_code, 400)

    def test_forbidden_when_rights_blocked(self):
        _clear_tinyfish_rights()
        resp = self.client.post(
            self.VERIFY_URL, {'url': 'https://example.co.za/p'}, content_type='application/json'
        )
        self.assertEqual(resp.status_code, 403)

    def test_returns_snapshot_then_serves_cache(self):
        self._make_rights()
        fake_json = {
            'results': [{
                'url': 'https://example.co.za/inverter',
                'final_url': 'https://example.co.za/inverter',
                'title': 'Solar Inverter 5kW',
                'language': 'en',
                'text': 'Price: R 31 995.00 incl VAT. In stock now.',
            }],
            'errors': [],
        }
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: fake_json,
        )) as request_post:
            first = self.client.post(
                self.VERIFY_URL, {'url': 'https://example.co.za/inverter'},
                content_type='application/json',
            )
            second = self.client.post(
                self.VERIFY_URL, {'url': 'https://example.co.za/inverter'},
                content_type='application/json',
            )
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.json()['verified'])
        self.assertEqual(first.json()['snapshot']['price_amount'], '31995.00')
        self.assertEqual(first.json()['snapshot']['title'], 'Solar Inverter 5kW')
        self.assertTrue(second.json()['cached'])
        request_post.assert_called_once()  # repeat verify served from cache
        artifact = EvidenceArtifact.objects.filter(
            source_identifier='https://example.co.za/inverter'
        ).first()
        self.assertIsNotNone(artifact)
        self.assertEqual(artifact.raw_payload['price_amount'], '31995.00')

    def test_unreadable_page_reports_verified_false(self):
        self._make_rights()
        fake_json = {
            'results': [],
            'errors': [{'url': 'https://example.co.za/blocked', 'error': 'timeout'}],
        }
        with mock.patch('requests.post', return_value=mock.Mock(
            raise_for_status=lambda: None, json=lambda: fake_json,
        )):
            resp = self.client.post(
                self.VERIFY_URL, {'url': 'https://example.co.za/blocked'},
                content_type='application/json',
            )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()['verified'])
        self.assertIsNone(resp.json()['snapshot'])


class FederatedSurfaceTestCase(TestCase):
    """The API ?live=1 block and the search-page panel."""

    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_ext_2', name='Ext Market', category='hardware_tools',
            claim_state='claimed', verification_state='fully_verified',
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_ext_2', category_ref='hardware_tools',
            title='Ext Market Drill', brand='ExtCo', status=ProductStatusChoices.ACTIVE,
        )
        DiscoveredOffer.objects.create(
            canonical_id='dof_ext_2', master_product=self.product, merchant=self.merchant,
            merchant_name='Buy Rite', source_website='buyrite.co.za',
            source_url='https://buyrite.co.za/drill', discovered_price_amount=899.0,
            currency='ZAR', availability_text='In stock', confidence_score=0.9,
        )

    def test_api_live_param_includes_external_results(self):
        response = self.client.get('/api/v1/search/?q=drill&live=1')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data.get('external'), list)
        self.assertTrue(data['external'])
        self.assertEqual(data['external'][0]['hostname'], 'buyrite.co.za')

    def test_api_without_live_omits_external_results(self):
        response = self.client.get('/api/v1/search/?q=drill')
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json().get('external'))

    def test_search_page_renders_external_panel(self):
        response = self.client.get('/search/?q=drill')
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn('Observed Live on the Web', body)
        self.assertIn('buyrite.co.za', body)
        self.assertIn('R 899', body)
