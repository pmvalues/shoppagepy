"""Storefront data-honesty, wiring and query-count regressions.

Each test here pins a defect that the pre-existing suite could not see:
text-only assertions passed while the search path invented prices, star
ratings and merchant names, and while the canonical product card shipped
without being rendered by any served template.
"""

import re

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.catalog.models import MasterProduct, ProductImage, ProductStatusChoices
from apps.merchants.models import Merchant, VerificationStateChoices
from apps.offers.models import AvailabilityStateChoices, DestinationTypeChoices, Offer


def _make_product(canonical_id, title, brand, category_ref='solar_energy', **kwargs):
    return MasterProduct.objects.create(
        canonical_id=canonical_id,
        category_ref=category_ref,
        title=title,
        brand=brand,
        status=ProductStatusChoices.ACTIVE,
        description=f'{title} for grid-tied and off-grid installations.',
        attributes=kwargs.pop('attributes', {}),
        **kwargs,
    )


class UnpricedProductHonestyTests(TestCase):
    """A product nobody has quoted must never display an invented price."""

    def setUp(self):
        cache.clear()
        self.product = _make_product(
            'var_unpriced_cell', 'Unpriced Lithium Cell 48V', 'BrandNewCo',
        )

    def test_search_page_shows_price_on_request_not_a_fallback_number(self):
        response = self.client.get('/search/?q=Unpriced')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertContains(response, 'Price on request')
        self.assertNotIn('R 1,000', content)
        self.assertNotIn('R1,000', content)
        self.assertNotIn('R 1000', content)

    def test_live_dropdown_never_renders_a_zero_price(self):
        response = self.client.get('/search/live/?q=Unpriced')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertNotIn('R0', content)
        self.assertIn('Price on request', content)


class FabricatedRatingTests(TestCase):
    """Ratings come from reviews or the merchant; absence must stay absent."""

    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_no_rating',
            name='Quiet Supplier',
            country='ZA',
            verification_state=VerificationStateChoices.UNVERIFIED,
            trust_score=50,
            province='Gauteng',
        )
        self.product = _make_product(
            'var_no_rating', 'No Rating Geyser Thermostat', 'QuietBrand',
            attributes={'estimatedPriceZar': 4200},
        )
        Offer.objects.create(
            canonical_id='ofr_no_rating',
            variant=self.product,
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=4150.00,
            currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_results_page_does_not_invent_stars_or_review_counts(self):
        content = self.client.get('/search/?q=Geyser').content.decode()
        self.assertNotIn('★ 4.9', content)
        self.assertNotIn('(12 reviews)', content)
        self.assertIn('Quiet Supplier', content)

    def test_results_page_does_not_claim_stock_it_has_not_seen(self):
        """Live offer -> in stock; sold-out offer only -> must not claim stock."""
        _make_product('var_geyser_oos', 'Sold Out Geyser Element', 'QuietBrand')
        Offer.objects.create(
            canonical_id='ofr_geyser_oos',
            variant=MasterProduct.objects.get(canonical_id='var_geyser_oos'),
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=640.00,
            currency='ZAR',
            availability_state=AvailabilityStateChoices.OUT_OF_STOCK,
        )
        cache.clear()
        content = self.client.get('/search/?q=Geyser').content.decode()
        self.assertIn('In stock', content)
        self.assertIn('Stock unconfirmed', content)
        self.assertNotIn('✓ In Stock', content)


class FeaturedCarouselHonestyTests(TestCase):
    """The carousel may be short, but it may not be fictional."""

    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_real_only',
            name='Real Solar Market',
            country='ZA',
            trust_score=88,
            province='Gauteng',
        )
        self.matched = _make_product(
            'var_matched_only', 'Matched Solar Charge Controller', 'MatchCo',
            attributes={'estimatedPriceZar': 2100},
        )
        Offer.objects.create(
            canonical_id='ofr_matched_only',
            variant=self.matched,
            merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=2050.00,
            currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )
        # Unrelated, unquoted products that the filler used to pad with a
        # fabricated R2800 price and a "<brand> South Africa" merchant.
        for n in range(1, 9):
            _make_product(f'var_pad_{n}', f'Padding Item {n} Unused', f'PadBrand{n}')

    def test_padding_products_are_not_labelled_with_invented_sellers(self):
        content = self.client.get('/search/?q=Matched').content.decode()
        self.assertFalse(
            re.search(r'PadBrand\d+\s+South Africa', content),
            'carousel invented a merchant name from the brand',
        )
        self.assertNotIn('R 2,800', content)
        self.assertNotIn('Verified Supplier', content)
        # Unrelated, unquoted products must not be padded into the carousel.
        self.assertNotIn('Padding Item', content)


class InStockFilterTests(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_stock_ctl', name='Stock Control Shop', country='ZA',
            trust_score=70, province='Gauteng',
        )
        self.live = _make_product(
            'var_stock_live', 'Stock Filter Live Distributor', 'StockCo',
        )
        self.dead = _make_product(
            'var_stock_dead', 'Stock Filter Sold Out Distributor', 'StockCo',
        )
        Offer.objects.create(
            canonical_id='ofr_stock_live', variant=self.live, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=900.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )
        Offer.objects.create(
            canonical_id='ofr_stock_dead', variant=self.dead, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=800.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.OUT_OF_STOCK,
        )

    def test_in_stock_param_excludes_products_with_no_live_offer(self):
        all_content = self.client.get('/search/?q=Distributor').content.decode()
        self.assertIn('Live Distributor', all_content)
        self.assertIn('Sold Out Distributor', all_content)

        cache.clear()
        filtered = self.client.get('/search/?q=Distributor&in_stock=1').content.decode()
        self.assertIn('Live Distributor', filtered)
        self.assertNotIn('Sold Out Distributor', filtered)


class CanonicalCardWiringTests(TestCase):
    """The card must be rendered by a served template and actually be styled."""

    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_card', name='Card Merchant', country='ZA',
            trust_score=92, province='Gauteng',
        )
        self.product = _make_product(
            'var_card', 'Card Rendered Panel', 'CardCo',
            gtin13='6012345678907',
            attributes={'estimatedPriceZar': 3300},
            compliance={'sabsApproved': True, 'nrs097Certified': True},
        )
        ProductImage.objects.create(
            product=self.product, url='https://example.invalid/card.jpg',
            alt_text='Card rendered panel photo',
        )
        Offer.objects.create(
            canonical_id='ofr_card', variant=self.product, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=3250.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_results_page_renders_the_canonical_card(self):
        response = self.client.get('/search/?q=Panel&tab=images')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn('sp-card', content)
        self.assertIn('Card Merchant', content)
        self.assertIn('1 photo', content)
        self.assertIn('GTIN 6012345678907', content)
        # Cards link to the canonical handle, not the raw canonical_id.
        self.assertIn('/p/var_card/', content)

    def test_card_and_dropdown_classes_are_defined_in_the_stylesheet(self):
        """The templates were ported from Tailwind markup whose utility
        classes resolve to nothing here; these hooks must exist as real CSS."""
        css = (settings.BASE_DIR / 'static' / 'css' / 'styles.css').read_text(encoding='utf-8')
        for hook in ('.sp-card', '.sp-card-media', '.sp-pill-instock', '.live-dd', '.live-dd-row'):
            self.assertIn(hook, css, f'{hook} missing from styles.css')

    def test_component_templates_have_no_tailwind_only_utility_classes(self):
        """No Tailwind is loaded by base.html, so bracket utilities render as
        unstyled markup. The components must use project classes instead."""
        tailwindish = re.compile(r'(?<![\w-])(?:text|bg|border|rounded|p|m|w|h|gap|max|min|shadow|leading|tracking|line)-\[|line-clamp-\d')
        template_root = settings.BASE_DIR / 'templates'
        for relative in (
            'catalog/_master_product_card.html',
            'search/partials/search_live_dropdown.html',
        ):
            markup = (template_root / relative).read_text(encoding='utf-8')
            offenders = sorted(set(tailwindish.findall(markup)))
            self.assertFalse(offenders, f'{relative} still relies on Tailwind utilities: {offenders}')


class NoPerRowQueryTests(TestCase):
    """Rendering N more rows must not add N image/offer/count queries."""

    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_bulk', name='Bulk Supplier', country='ZA',
            trust_score=75, province='Gauteng',
        )

    def _seed(self, count, prefix):
        for n in range(count):
            product = _make_product(
                f'var_{prefix}_{n}', f'{prefix} Bulk Panel {n}', 'BulkCo',
            )
            ProductImage.objects.create(
                product=product, url=f'https://example.invalid/{prefix}{n}.jpg',
                alt_text=f'{prefix} panel',
            )
            Offer.objects.create(
                canonical_id=f'ofr_{prefix}_{n}', variant=product, merchant=self.merchant,
                destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
                price_amount=1000.00 + n, currency='ZAR',
                availability_state=AvailabilityStateChoices.FRESH,
            )

    def _query_count(self, prefix):
        cache.clear()
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(f'/search/?q={prefix}')
        self.assertEqual(response.status_code, 200)
        return len(ctx.captured_queries)

    def test_query_count_does_not_grow_with_row_count(self):
        self._seed(5, 'smallset')
        self._seed(15, 'bigset')
        small = self._query_count('smallset')
        big = self._query_count('bigset')
        # Three times the rows must not cost three times the queries: the
        # per-row cost has to stay at zero for the batch to remain constant.
        self.assertLess(big - small, 10, f'per-row queries detected ({small} -> {big})')

    def test_live_dropdown_does_not_query_data_it_never_renders(self):
        """The partial renders products only; malls and shorts were LIKE-scanned
        and thrown away on every keystroke."""
        self._seed(6, 'livebulk')
        cache.clear()
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get('/search/live/?q=livebulk')
        self.assertEqual(response.status_code, 200)
        sql = ' '.join(q['sql'] for q in ctx.captured_queries).lower()
        self.assertNotIn('from "markets_market" where', sql)
        self.assertNotIn('from "media_hub_short"', sql)


class PlaceholderClaimTests(TestCase):
    """The imageless placeholder must not assert specs or compliance marks."""

    def test_placeholder_svg_carries_no_certification_or_spec_claims(self):
        from apps.core.templatetags.core_tags import product_svg

        product = _make_product(
            'var_nophoto', 'AfriSam RhinoBoard Plasterboard 12.7mm', 'AfriSam',
            category_ref='building_materials',
        )
        svg = product_svg(product, 'small')
        for claim in ('SABS', 'NRS 097', 'ICASA', 'GS1 VERIFIED', 'IN STOCK', 'SUREBUILD',
                      'CEMENT', 'kWh', ' kW', '2000A', '5G', '42.5N'):
            self.assertNotIn(claim, svg, f'placeholder asserts "{claim}" for {product.title}')
        self.assertIn('NO PHOTO YET', svg)
        self.assertIn('AFRISAM', svg)          # brand is real data, so it may show
        self.assertIn('role="img"', svg)

    def test_placeholder_ignores_title_keywords_as_facts(self):
        from apps.core.templatetags.core_tags import product_svg

        svg = product_svg('5.5kW Deye Hybrid Inverter with 51.2V LiFePO4 battery')
        for claim in ('5.0 kW', '51.2', 'NRS', 'SABS', '5.12 kWh', 'IN STOCK'):
            self.assertNotIn(claim, svg)


class HomepageHonestyTests(TestCase):
    def setUp(self):
        cache.clear()
        self.merchant = Merchant.objects.create(
            canonical_id='m_home', name='Home Grid Solar', country='ZA',
            trust_score=90, province='Gauteng',
        )
        self.quoted = _make_product(
            'var_home_quoted', 'Home Quoted Hybrid Inverter', 'HomeCo',
            model_number='HQ-5K',
        )
        self.unquoted = _make_product(
            'var_home_unquoted', 'Home Unquoted Lithium Battery', 'HomeCo',
        )
        Offer.objects.create(
            canonical_id='ofr_home_quoted', variant=self.quoted, merchant=self.merchant,
            destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
            price_amount=7700.00, currency='ZAR',
            availability_state=AvailabilityStateChoices.FRESH,
        )

    def test_featured_row_never_invents_stock_rating_or_price(self):
        content = self.client.get('/').content.decode()
        self.assertNotIn('★ 4.9', content)
        self.assertNotIn('(12 reviews)', content)
        # The unquoted product must be admitted, not decorated.
        self.assertIn('Home Unquoted Lithium Battery', content)
        self.assertIn('Price on request', content)
        self.assertIn('No live quotes yet', content)
        self.assertNotIn('R 0\n', content)
        # Slugs must not leak.
        self.assertNotIn('Building_Materials', content)

    def test_featured_row_shows_real_price_and_model_for_quoted_product(self):
        content = self.client.get('/').content.decode()
        self.assertIn('7,700', content)
        self.assertIn('HQ-5K', content)
        self.assertIn('Home Grid Solar', content)

    def test_rfq_board_stops_claiming_live_verified_demand(self):
        content = self.client.get('/').content.decode()
        self.assertNotIn('Live Matching', content)
        self.assertNotIn('Verified procurement demands', content)
        self.assertIn('illustrative examples', content)

    def test_featured_rows_link_without_a_redirect(self):
        content = self.client.get('/').content.decode()
        self.assertIn('href="/p/var_home_quoted/"', content)


class ServedTemplateFabricationGuardTests(TestCase):
    """Keep the whole defect class out, not just the two pages that were audited."""

    BANNED = (
        '★ 4.9', '|default:"4.9"', '|default:12 ', '|default:1200',
        '|default:"Standard"', '|default:"Direct Counter"', '|default:"Verified Store"',
        'or 1000.0', 'or 2800.0',
        '|default:"Verified buyer"', '|default:"Shoppage Lab"', '|default:"In Stock"',
        'Direct storefront', 'Direct Mall Counter',
        'Major South African Commercial',
        'Online store & nationwide delivery',
        'opens later this week', '08:00–18:00',
        'verified units', 'verified merchant units',
        'Live Matching', 'Active Buyer Tenders', 'Posted by Verified EPC Contractor',
        'Submit Quote on WhatsApp', 'AI routes tender',
    )

    def test_no_served_template_substitutes_invented_values(self):
        template_root = settings.BASE_DIR / 'templates'
        offenders = []
        for path in template_root.rglob('*.html'):
            if 'cms' in path.parts:
                continue
            text = path.read_text(encoding='utf-8', errors='ignore')
            for needle in self.BANNED:
                if needle in text:
                    offenders.append(f'{path.relative_to(template_root)}: {needle}')
        self.assertEqual(offenders, [], f'invented defaults reintroduced:\n' + '\n'.join(offenders))
