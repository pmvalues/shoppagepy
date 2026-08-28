from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.intelligence.ranking import _fuzzy_candidates, _levenshtein, ranked_search
from django.test import TestCase


class RankingTestCase(TestCase):
    def setUp(self):
        self.product = MasterProduct.objects.create(
            canonical_id='var_samsung_s24',
            category_ref='smartphones',
            title='Samsung Galaxy S24 Ultra',
            brand='Samsung',
            model_number='SM-S928',
            status=ProductStatusChoices.ACTIVE,
            attributes={'estimatedPriceZar': 22000},
        )

    def test_exact_search_finds_product(self):
        res = ranked_search('Samsung Galaxy S24 Ultra', limit=10)
        ids = [s.product.id for s in res['products']]
        self.assertIn(self.product.id, ids)

    def test_typo_tolerance_finds_product(self):
        # 'samsng' is a common misspelling of 'samsung'
        res = ranked_search('samsng galaxy', limit=10)
        ids = [s.product.id for s in res['products']]
        self.assertIn(self.product.id, ids)

    def test_levenshtein(self):
        self.assertEqual(_levenshtein('samsung', 'samsng'), 1)
        self.assertEqual(_levenshtein('inverter', 'invertor'), 1)
        self.assertEqual(_levenshtein('deye', 'deye'), 0)

    def test_fuzzy_candidates_empty_for_short_term(self):
        self.assertEqual(_fuzzy_candidates('ab', limit=5), [])
