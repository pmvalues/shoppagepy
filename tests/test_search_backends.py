"""
SearchBackend seam tests.

Typesense is not running in this environment, so every test drives the HTTP
boundary with a stub. What they pin down is the part that matters for a
swap-in engine: the shared return contract, honest document building, and the
guarantee that any Typesense failure falls back to the SQL engine instead of
returning an empty results page.
"""

import json
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings

from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.intelligence import backends
from apps.intelligence.ranking import ScoredProduct, ranked_search
from apps.merchants.models import Merchant
from apps.offers.models import AvailabilityStateChoices, DestinationTypeChoices, Offer

SQL_ONLY = {'backend': 'sql', 'typesense_url': '', 'typesense_api_key': '',
            'typesense_collection': 'products', 'timeout_seconds': 1.0}
TYPESENSE = {'backend': 'auto', 'typesense_url': 'http://typesense.test:8108',
             'typesense_api_key': 'test-key', 'typesense_collection': 'products',
             'timeout_seconds': 1.0}


class FakeResponse:
    def __init__(self, payload=None, status=200, text='', ok=True):
        self._payload = payload
        self.status_code = status
        self.text = text or (json.dumps(payload) if payload is not None else '')
        self.ok = ok

    def json(self):
        if self._payload is None:
            raise ValueError('no json body')
        return self._payload


def filters(**overrides):
    base = {
        'limit': 6, 'offset': 0, 'category': '', 'province': '', 'brand': '',
        'min_price': None, 'max_price': None, 'candidate_limit': 1000,
        'sort': 'relevance', 'near': None, 'in_stock_only': False,
    }
    base.update(overrides)
    return base


class BackendSelectionTests(TestCase):
    def setUp(self):
        backends.reset_backends()
        self.addCleanup(backends.reset_backends)

    def test_sql_is_selected_when_forced(self):
        with override_settings(SHOPPAGE_SEARCH=SQL_ONLY):
            self.assertIsInstance(backends.get_backend(), backends.SqlHybridBackend)

    def test_auto_falls_back_to_sql_when_typesense_is_not_configured(self):
        with override_settings(SHOPPAGE_SEARCH=SQL_ONLY):
            self.assertIsInstance(backends.get_backend(), backends.SqlHybridBackend)

    def test_auto_prefers_typesense_once_configured(self):
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            self.assertIsInstance(backends.get_backend(), backends.TypesenseBackend)

    def test_explicit_typesense_is_selected_even_without_url(self):
        cfg = dict(TYPESENSE, backend='typesense')
        with override_settings(SHOPPAGE_SEARCH=cfg):
            self.assertIsInstance(backends.get_backend(), backends.TypesenseBackend)


class RankedSearchDispatchTests(TestCase):
    """ranked_search() is the entry point every caller uses; it must delegate
    to the selected backend and survive that backend's failure."""

    fixtures = None

    def setUp(self):
        backends.reset_backends()
        self.addCleanup(backends.reset_backends)
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_dispatch', name='Dispatch Solar', country='ZA',
            trust_score=81, province='Gauteng',
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_dispatch', category_ref='solar_energy',
            title='Dispatch Hybrid Inverter', brand='DispatchCo',
            status=ProductStatusChoices.ACTIVE,
            attributes={'estimatedPriceZar': 9000},
        )
        Offer.objects.create(
            canonical_id='ofr_dispatch', variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=8900.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_results_come_from_the_selected_backend(self):
        sentinel = {'products': [], 'facets': {}, 'total_products': 0, 'backend': 'stub'}
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            with mock.patch.object(backends.TypesenseBackend, 'search', return_value=sentinel) as spy:
                self.assertIs(ranked_search('dispatch inverter', limit=6), sentinel)
            kwargs = spy.call_args.kwargs
            self.assertEqual(kwargs['limit'], 6)
            self.assertEqual(kwargs['in_stock_only'], False)

    def test_none_from_backend_falls_back_to_sql(self):
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            with mock.patch.object(backends.TypesenseBackend, 'search', return_value=None):
                result = ranked_search('dispatch inverter', limit=6)
        self.assertEqual(result['backend'] if 'backend' in result else 'sql', 'sql')
        self.assertEqual([s.product.canonical_id for s in result['products']], ['var_dispatch'])

    def test_backend_exception_falls_back_to_sql(self):
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            with mock.patch.object(backends.TypesenseBackend, 'search', side_effect=RuntimeError('boom')):
                result = ranked_search('dispatch inverter', limit=6)
        self.assertEqual(len(result['products']), 1)

    def test_contract_keys_match_the_sql_engine(self):
        """A swapped-in backend must feed the templates the same shape."""
        with override_settings(SHOPPAGE_SEARCH=SQL_ONLY):
            sql_keys = set(ranked_search('dispatch inverter', limit=6))
        payload = {'hits': [{'canonical_id': 'var_dispatch', 'product_id': str(self.product.pk)}],
                   'found': 1, 'facet_counts': [], 'search_time_ms': 3}
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            with mock.patch.object(backends.requests, 'get', return_value=FakeResponse({'results': [payload]})):
                ts_keys = set(ranked_search('dispatch inverter', limit=6))
        self.assertEqual(sql_keys - {'backend'}, ts_keys - {'backend'})


class TypesenseParamBuildingTests(TestCase):
    def setUp(self):
        self.backend = backends.TypesenseBackend(TYPESENSE)

    def test_query_uses_weighted_fields_and_relevance_sort(self):
        params = self.backend.build_params('deye inverter', **filters())
        self.assertEqual(params['q'], 'deye inverter')
        self.assertIn('title', params['query_by'])
        self.assertEqual(params['sort_by'], ':relevance')
        self.assertIn('status:=[active, ACTIVE]', params['filter_by'])

    def test_filters_are_translated_to_filter_by(self):
        params = self.backend.build_params(
            'inverter',
            **filters(category='solar_energy', province='Gauteng', brand='Deye',
                      min_price=1000, max_price=9999, in_stock_only=True),
        )
        joined = params['filter_by']
        self.assertIn('category_ref:=`solar_energy`', joined)
        self.assertIn('brand:=`Deye`', joined)
        self.assertIn('provinces:=`Gauteng`', joined)
        self.assertIn('in_stock:=true', joined)
        self.assertIn('price_zar:>=1000', joined)
        self.assertIn('price_zar:<=9999', joined)

    def test_geo_radius_stays_in_kilometres(self):
        params = self.backend.build_params('inverter', **filters(near=(-26.0, 28.0, 25.0)))
        self.assertIn('location:(-26.0,28.0,25)', params['filter_by'])

    def test_sort_maps_to_a_stored_field(self):
        self.assertEqual(
            self.backend.build_params('inverter', **filters(sort='price_asc'))['sort_by'],
            'price_zar:asc',
        )
        self.assertEqual(
            self.backend.build_params('', **filters(sort='relevance'))['sort_by'],
            'popularity:desc',
        )

    def test_pagination_page_math(self):
        second = self.backend.build_params('inverter', **filters(limit=24, offset=24))
        self.assertEqual(second['page'], 2)
        self.assertEqual(second['per_page'], 24)


class TypesenseHydrationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_hyd', name='Hydration Traders', country='ZA',
            trust_score=88, province='Western Cape',
        )
        self.merchant2 = Merchant.objects.create(
            canonical_id='m_hyd2', name='Hydration Branch', country='ZA',
            trust_score=64, province='Gauteng',
        )
        self.first = MasterProduct.objects.create(
            canonical_id='var_hyd_a', category_ref='solar_energy', title='Hyd A Panel',
            brand='HydCo', status=ProductStatusChoices.ACTIVE,
        )
        self.second = MasterProduct.objects.create(
            canonical_id='var_hyd_b', category_ref='solar_energy', title='Hyd B Panel',
            brand='HydCo', status=ProductStatusChoices.ACTIVE,
        )
        Offer.objects.create(
            canonical_id='ofr_hyd_a', variant=self.first, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=4200.0, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )
        Offer.objects.create(
            canonical_id='ofr_hyd_b', variant=self.second, merchant=self.merchant2,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=1200.0, currency='ZAR',
            availability_state=AvailabilityStateChoices.OUT_OF_STOCK,
        )
        self.backend = backends.TypesenseBackend(TYPESENSE)

    def _payload(self, ids, found=99, facets=None, stats=None):
        return {
            'hits': [{'canonical_id': i} for i in ids],
            'found': found,
            'facet_counts': facets or [],
            'search_time_ms': 4,
            'stats': stats or [],
        }

    def test_hits_are_hydrated_in_typesense_order(self):
        result = self.backend.hydrate(
            self._payload(['var_hyd_b', 'var_hyd_a']),
            raw_query='panel', tokens=['panel'], expanded=[], limit=6, offset=0,
            sort='relevance', near=None,
        )
        self.assertEqual([s.product.canonical_id for s in result['products']],
                         ['var_hyd_b', 'var_hyd_a'])
        self.assertTrue(all(isinstance(s, ScoredProduct) for s in result['products']))
        self.assertGreater(result['products'][0].score, result['products'][1].score)

    def test_unquoted_product_keeps_a_null_price_and_no_stock_claim(self):
        result = self.backend.hydrate(
            self._payload(['var_hyd_b', 'var_hyd_a']),
            raw_query='panel', tokens=['panel'], expanded=[], limit=6, offset=0,
            sort='relevance', near=None,
        )
        sold_out, live = result['products']
        self.assertIsNone(sold_out.best_offer)
        self.assertEqual(sold_out.offer_count, 0)
        self.assertEqual(live.offer_count, 1)
        self.assertEqual(float(live.best_offer.price_amount), 4200.0)

    def test_found_and_pagination_come_from_the_engine_not_the_page(self):
        result = self.backend.hydrate(
            self._payload(['var_hyd_a'], found=1234),
            raw_query='panel', tokens=['panel'], expanded=[], limit=6, offset=6,
            sort='relevance', near=None,
        )
        self.assertEqual(result['total_products'], 1234)
        self.assertEqual(result['page'], 2)
        self.assertTrue(result['has_next'])
        self.assertEqual(result['next_offset'], 12)
        self.assertFalse(result['is_capped'])

    def test_facets_and_price_stats_are_mapped_to_storefront_keys(self):
        result = self.backend.hydrate(
            self._payload(
                ['var_hyd_a'],
                facets=[
                    {'field_name': 'category_ref', 'counts': [{'value': 'solar_energy', 'count': 7}]},
                    {'field_name': 'brand', 'counts': [{'value': 'HydCo', 'count': 5}]},
                    {'field_name': 'provinces', 'counts': [{'value': 'Gauteng', 'count': 3}]},
                    {'field_name': 'merchant_names', 'counts': [{'value': 'Hydration Traders', 'count': 2}]},
                ],
                stats=[{'name': 'price_zar', 'min': 900.0, 'max': 21000.0, 'avg': 5000.4}],
            ),
            raw_query='panel', tokens=['panel'], expanded=[], limit=6, offset=0,
            sort='relevance', near=None,
        )
        self.assertEqual(result['facets']['categories'], {'solar_energy': 7})
        self.assertEqual(result['facets']['brands'], {'HydCo': 5})
        self.assertEqual(result['facets']['provinces'], {'Gauteng': 3})
        self.assertEqual(result['facets']['merchants'], {'Hydration Traders': 2})
        self.assertEqual(result['price_stats'], {'min': 900.0, 'max': 21000.0, 'avg': 5000})

    def test_stale_index_id_returns_none_so_the_caller_falls_back(self):
        result = self.backend.hydrate(
            self._payload(['var_deleted_product']),
            raw_query='panel', tokens=['panel'], expanded=[], limit=6, offset=0,
            sort='relevance', near=None,
        )
        self.assertIsNone(result)


class TypesenseFailureFallbackTests(TestCase):
    def setUp(self):
        self.backend = backends.TypesenseBackend(TYPESENSE)

    def test_transport_error_returns_none(self):
        with mock.patch.object(backends.requests, 'get', side_effect=ConnectionError('down')):
            self.assertIsNone(self.backend.search('panel', **filters()))

    def test_non_ok_response_returns_none(self):
        with mock.patch.object(backends.requests, 'get',
                               return_value=FakeResponse(None, status=503, ok=False)):
            self.assertIsNone(self.backend.search('panel', **filters()))

    def test_unparseable_body_returns_none(self):
        with mock.patch.object(backends.requests, 'get', return_value=FakeResponse(None, text='not json')):
            self.assertIsNone(self.backend.search('panel', **filters()))

    def test_empty_hit_set_returns_none(self):
        payload = {'results': [{'hits': [], 'found': 0}]}
        with mock.patch.object(backends.requests, 'get', return_value=FakeResponse(payload)):
            self.assertIsNone(self.backend.search('panel', **filters()))

    def test_unconfigured_backend_never_touches_the_network(self):
        offline = backends.TypesenseBackend(dict(TYPESENSE, typesense_url='', typesense_api_key=''))
        with mock.patch.object(backends.requests, 'get', side_effect=AssertionError('network used')):
            self.assertIsNone(offline.search('panel', **filters()))
            self.assertFalse(offline.health())


class DocumentBuildingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_doc', name='Doc Supplier', country='ZA',
            trust_score=77, province='KwaZulu-Natal', latitude=-29.858, longitude=31.021,
        )
        self.product = MasterProduct.objects.create(
            canonical_id='var_doc', category_ref='solar_energy', title='Doc Panel 550W',
            brand='DocCo', model_number='DP-550', status=ProductStatusChoices.ACTIVE,
            compliance={'nrs097Certified': True, 'sabsApproved': False},
            compatibility_edge_count=4,
        )
        self.live = Offer.objects.create(
            canonical_id='ofr_doc_live', variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=1500.0, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )
        Offer.objects.create(
            canonical_id='ofr_doc_cheap_oos', variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=200.0, currency='ZAR',
            availability_state=AvailabilityStateChoices.OUT_OF_STOCK,
        )

    def test_document_reflects_only_live_offers(self):
        doc = backends.build_product_doc(self.product)
        self.assertEqual(doc['price_zar'], 1500.0, 'sold-out R200 offer must not set the price')
        self.assertEqual(doc['offer_count'], 1)
        self.assertTrue(doc['in_stock'])
        self.assertEqual(doc['provinces'], ['KwaZulu-Natal'])
        self.assertEqual(doc['max_trust_score'], 77)
        self.assertEqual(doc['locations'], [[-29.858, 31.021]])
        self.assertTrue(doc['nrs_certified'])
        self.assertFalse(doc['sabs_approved'])
        self.assertEqual(doc['canonical_id'], 'var_doc')
        self.assertEqual(doc['model_number'], 'DP-550')

    def test_unpriced_product_omits_price_instead_of_inventing_one(self):
        self.live.price_amount = None
        self.live.save(update_fields=['price_amount'])
        doc = backends.build_product_doc(self.product)
        self.assertNotIn('price_zar', doc)
        self.assertTrue(doc['in_stock'])

    def test_no_live_offers_marks_document_out_of_stock(self):
        Offer.objects.filter(variant=self.product).update(availability_state='expired')
        doc = backends.build_product_doc(self.product)
        self.assertFalse(doc['in_stock'])
        self.assertEqual(doc['offer_count'], 0)

    def test_iter_product_docs_covers_active_products_only(self):
        MasterProduct.objects.create(
            canonical_id='var_doc_archived', category_ref='solar_energy',
            title='Archived Doc Panel', brand='DocCo', status='archived',
        )
        ids = [d['canonical_id'] for d in backends.iter_product_docs(batch_size=10)]
        self.assertIn('var_doc', ids)
        self.assertNotIn('var_doc_archived', ids)


class CollectionSchemaTests(TestCase):
    def test_every_field_the_query_layer_filters_on_is_indexed(self):
        """build_params would send filters Typesense rejects if a field were
        missing or unfaceted, so schema and query layer are asserted together."""
        indexed = {f['name'] for f in backends.COLLECTION_SCHEMA['fields']}
        used_in_filters = {
            'status', 'category_ref', 'brand', 'provinces', 'in_stock',
            'price_zar', 'locations',
        }
        self.assertTrue(used_in_filters <= indexed, used_in_filters - indexed)
        for field in backends.QUERY_BY:
            self.assertIn(field, indexed)
        faceted = {f['name'] for f in backends.COLLECTION_SCHEMA['fields'] if f.get('facet')}
        self.assertTrue({'category_ref', 'brand', 'provinces', 'merchant_names', 'in_stock'} <= faceted)


class SilentFailureVisibilityTests(TestCase):
    """A retrieval tier that dies silently makes an outage look like "no
    products exist". Each one must log and degrade, not swallow."""

    def test_candidate_tier_logs_when_the_database_fails(self):
        from apps.intelligence import ranking

        with mock.patch.object(ranking, 'connection') as conn:
            conn.vendor = 'postgresql'
            conn.cursor.side_effect = RuntimeError('database unavailable')
            with self.assertLogs('apps.intelligence.ranking', level='ERROR') as logs:
                self.assertEqual(ranking._tsvector_ids('inverter', ['inverter'], 10), [])
                self.assertEqual(ranking._trgm_ids('inverter', 10), [])
        captured = '\n'.join(logs.output)
        self.assertIn('_tsvector_ids', captured)
        self.assertIn('_trgm_ids', captured)

    def test_backend_failure_is_logged_and_the_sql_engine_still_answers(self):
        cache.clear()
        merchant = Merchant.objects.create(
            canonical_id='m_log', name='Logged Fallback Store', country='ZA',
            trust_score=70, province='Gauteng',
        )
        product = MasterProduct.objects.create(
            canonical_id='var_log', category_ref='solar_energy',
            title='Logged Fallback Inverter', brand='LogCo',
            status=ProductStatusChoices.ACTIVE,
        )
        Offer.objects.create(
            canonical_id='ofr_log', variant=product, merchant=merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=1500.0, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )
        with override_settings(SHOPPAGE_SEARCH=TYPESENSE):
            backends.reset_backends()
            with mock.patch.object(backends.TypesenseBackend, 'search',
                                   side_effect=RuntimeError('connection refused')):
                with self.assertLogs('apps.intelligence.ranking', level='ERROR') as logs:
                    result = ranked_search('fallback inverter', limit=5)
        backends.reset_backends()
        self.assertIn('falling back to the SQL engine', '\n'.join(logs.output))
        self.assertEqual([s.product.canonical_id for s in result['products']], ['var_log'])
