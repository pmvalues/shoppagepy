import hashlib
import json

from apps.api.serializers import (
    MarketSerializer,
    MasterProductSerializer,
    MerchantSerializer,
    ReferralEventSerializer,
)
from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.core.signals import data_version
from apps.intelligence.ranking import ranked_search
from apps.intelligence.services import (
    ask_assistant,
    build_overview,
    detect_intent,
    generate_google_merchant_center_feed,
    generate_trust_seal_svg,
)
from apps.markets.models import Market
from apps.merchants.models import Merchant
from apps.merchants.models import ClaimStateChoices
from apps.offers.models import AvailabilityStateChoices
from apps.referrals.models import ReferralEvent
from django.core.cache import cache
from django.db.models import Q
from django.http import (
    Http404,
    HttpResponse,
    HttpResponsePermanentRedirect,
    StreamingHttpResponse,
)
from django.shortcuts import get_object_or_404
from django.utils.cache import patch_response_headers
from rest_framework import generics, pagination, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .schemas import SearchQuery, SearchResponse

PUBLIC_CACHE_SECONDS = 60


def _public_cache(response, seconds: int = PUBLIC_CACHE_SECONDS):
    """Mark a GET response cacheable; ConditionalGetMiddleware adds ETag/304."""
    patch_response_headers(response, cache_timeout=seconds)
    response['Vary'] = 'Accept-Encoding'
    return response


class ShoppagePagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CachedListMixin:
    """Cacheable GET list responses; page size stays adjustable via page_size."""
    list_cache_seconds = PUBLIC_CACHE_SECONDS

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return _public_cache(response, self.list_cache_seconds)


class SearchAPIView(APIView):
    """
    Public Search API Endpoint (/api/v1/search/)
    Executes deterministic ranked retrieval across products and merchants.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'search'

    def finalize_response(self, request, *args, **kwargs):
        response = super().finalize_response(request, *args, **kwargs)
        if request.method == 'GET' and response.status_code == 200:
            _public_cache(response, 15)
        return response

    def get(self, request):
        params = SearchQuery.from_get(request.GET)
        results = ranked_search(
            params.q,
            limit=params.limit,
            offset=params.offset,
            category=params.category,
            province=params.province,
            brand=params.brand,
            min_price=params.min_price,
            max_price=params.max_price,
        )
        intent = detect_intent(params.q)
        top_brands = list(results.get('facets', {}).get('brands', {}).keys())[:5]
        price_stats = results.get('price_stats')
        overview = build_overview(
            params.q, intent, results['total_products'], results['total_merchants'],
            price_stats['min'] if price_stats else None,
            price_stats['max'] if price_stats else None,
            price_stats['avg'] if price_stats else None,
            top_brands,
        )
        products = [s.product for s in results['products']]

        response = SearchResponse(
            query=params.q,
            intent=intent,
            overview=overview,
            top_brands=top_brands,
            total_products=results['total_products'],
            total_merchants=results['total_merchants'],
            price_stats=price_stats,
            products=MasterProductSerializer(products, many=True).data,
            merchants=MerchantSerializer(results['merchants'], many=True).data,
            result_cap=results.get('result_cap'),
            is_capped=results.get('is_capped', False),
        )
        return Response(response.model_dump())


class ProductListAPIView(CachedListMixin, generics.ListAPIView):
    serializer_class = MasterProductSerializer
    pagination_class = ShoppagePagination

    def get_queryset(self):
        qs = (
            MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE)
            .prefetch_related('offers__merchant', 'images', 'discovered_offers')
        )
        params = self.request.GET
        search = (params.get('q') or '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(brand__icontains=search)
                | Q(model_number=search) | Q(gtin13=search) | Q(canonical_id=search)
            )
        if params.get('category'):
            qs = qs.filter(category_ref=params['category'])
        if params.get('brand'):
            qs = qs.filter(brand__iexact=params['brand'])
        if params.get('province'):
            qs = qs.filter(offers__merchant__province__iexact=params['province']).distinct()
        if params.get('min_price'):
            qs = qs.filter(offers__price_amount__gte=params['min_price']).distinct()
        if params.get('max_price'):
            qs = qs.filter(offers__price_amount__lte=params['max_price']).distinct()
        if params.get('in_stock') == '1':
            qs = qs.filter(
                offers__availability_state__in=[
                    AvailabilityStateChoices.FRESH, AvailabilityStateChoices.CONFIRM_REQUIRED,
                ]
            ).distinct()
        ordering = params.get('ordering')
        allowed = {'title', 'brand', 'created_at', 'updated_at', 'category_ref', '-title',
                   '-brand', '-created_at', '-updated_at', '-category_ref'}
        if ordering and ordering.lstrip('-') in {o.lstrip('-') for o in allowed}:
            if ordering.lstrip('-') in {'title', 'brand', 'created_at', 'updated_at', 'category_ref'}:
                qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('brand', 'title')
        return qs


class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = MasterProduct.objects.prefetch_related('offers__merchant', 'images', 'discovered_offers')
    serializer_class = MasterProductSerializer
    lookup_field = 'canonical_id'

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return _public_cache(response, 30)


class MerchantListAPIView(CachedListMixin, generics.ListAPIView):
    serializer_class = MerchantSerializer
    pagination_class = ShoppagePagination

    def get_queryset(self):
        # Prefix matching only: the merchant table is in the millions and an
        # unindexed contains-scan would take the endpoint down.
        qs = Merchant.objects.select_related('market')
        params = self.request.GET
        search = (params.get('q') or '').strip()
        if search:
            qs = qs.filter(name__startswith=search)
        if params.get('category'):
            qs = qs.filter(category=params['category'])
        if params.get('province'):
            qs = qs.filter(province__iexact=params['province'])
        if params.get('country'):
            qs = qs.filter(country=params['country'].upper()[:2])
        if params.get('verification_state'):
            qs = qs.filter(verification_state=params['verification_state'])
        if params.get('claimed') == '1':
            qs = qs.filter(claim_state=ClaimStateChoices.CLAIMED)
        return qs.order_by('-trust_score', 'name')


class MerchantDetailAPIView(generics.RetrieveAPIView):
    queryset = Merchant.objects.select_related('market')
    serializer_class = MerchantSerializer
    lookup_field = 'canonical_id'


class MarketListAPIView(CachedListMixin, generics.ListAPIView):
    serializer_class = MarketSerializer
    pagination_class = ShoppagePagination

    def get_queryset(self):
        qs = Market.objects.select_related('parent_market')
        params = self.request.GET
        search = (params.get('q') or '').strip()
        if search:
            qs = qs.filter(name__startswith=search)
        if params.get('province'):
            qs = qs.filter(province__iexact=params['province'])
        if params.get('country'):
            qs = qs.filter(country=params['country'].upper()[:2])
        if params.get('market_type'):
            qs = qs.filter(market_type=params['market_type'])
        return qs.order_by('province', 'name')


class MarketDetailAPIView(generics.RetrieveAPIView):
    queryset = Market.objects.select_related('parent_market')
    serializer_class = MarketSerializer
    lookup_field = 'canonical_slug'


class ReferralEventListAPIView(CachedListMixin, generics.ListAPIView):
    """
    Read-only and staff-only. Attribution events carry visitor-level data, and
    the ledger is written by the platform's own /l/ resolver — never by callers.
    """
    queryset = ReferralEvent.objects.all().order_by('-created_at')
    serializer_class = ReferralEventSerializer
    pagination_class = ShoppagePagination
    permission_classes = [IsAdminUser]


class AssistantAPIView(APIView):
    """
    AI Commerce Assistant API (/api/assistant/)
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'assistant'

    def post(self, request):
        message = request.data.get('message', '')
        if not message:
            return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)

        result = ask_assistant(message)
        return Response({
            'reply': result['reply'],
            'intent': result['intent'],
            'products': MasterProductSerializer(result['products'], many=True).data,
            'merchants': MerchantSerializer(result['merchants'], many=True).data,
        })


def agent_event_stream_view(request):
    """
    Server-Sent Events stream of real recorded merchant-agent runs.

    Emits what actually happened (apps.merchants.AgentRun). When nothing has run
    it says so instead of replaying a canned progress sequence.
    """
    from apps.merchants.models import AgentRun

    agent_name = request.GET.get('agent', '')
    runs_qs = AgentRun.objects.all().order_by('-created_at')[:50]
    if agent_name:
        runs_qs = AgentRun.objects.filter(agent_name__iexact=agent_name).order_by('-created_at')[:50]
    runs = list(runs_qs.select_related('merchant'))

    def event_stream():
        if not runs:
            payload = {'message': 'No recorded agent runs yet for this agent.', 'count': 0}
            yield f"event: no_runs\ndata: {json.dumps(payload)}\n\n".encode()
            return
        for seq, run in enumerate(runs, start=1):
            data = {
                'run_id': run.run_id,
                'sequence_number': seq,
                'agent_name': run.agent_name,
                'merchant': run.merchant.name if run.merchant_id else None,
                'status': run.status,
                'tokens_consumed': run.tokens_consumed,
                'tool_calls_count': run.tool_calls_count,
                'summary': run.summary or '',
                'created_at': run.created_at.isoformat() if run.created_at else None,
            }
            yield f"event: agent_run\ndata: {json.dumps(data)}\n\n".encode()

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


def google_merchant_center_feed_view(request, merchant_id):
    """
    Google Merchant Center feed (/api/feeds/google-merchant-center/<merchant_id>/)

    Syndicating a merchant's catalogue requires that the merchant claimed the
    profile; candidate profiles that were preloaded by Shoppage are not
    somebody else's inventory to publish.
    """
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first()
    if not merchant:
        try:
            by_pk = Merchant.objects.filter(id=merchant_id).first()
        except Exception:
            by_pk = None
        if by_pk:
            return HttpResponsePermanentRedirect(
                f'/api/feeds/google-merchant-center/{by_pk.canonical_id}/'
            )
        raise Http404('Merchant not found')
    if not merchant.is_syndication_eligible:
        raise Http404('Feed unavailable: this profile has not been claimed by its operator.')

    base_url = request.build_absolute_uri('/')[:-1]
    key = 'sp:feed:%s:%s:v%d' % (
        merchant.canonical_id,
        hashlib.md5(base_url.encode()).hexdigest()[:10],
        data_version(),
    )
    xml_content = cache.get(key)
    if xml_content is None:
        xml_content = generate_google_merchant_center_feed(merchant.canonical_id, base_url=base_url)
        cache.set(key, xml_content, 900)

    response = HttpResponse(xml_content, content_type='application/xml; charset=utf-8')
    response['X-Robots-Tag'] = 'noindex, nofollow'
    return _public_cache(response, 900)


def trust_seal_badge_view(request, merchant_id):
    """
    Trust Seal SVG badge (/api/seal/<merchant_id>/)

    An unknown merchant yields 404 — never another shop's verification seal.
    """
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first()
    if not merchant:
        try:
            merchant = Merchant.objects.filter(id=merchant_id).first()
        except Exception:
            merchant = None
    if not merchant:
        raise Http404('Merchant not found')

    svg_content = generate_trust_seal_svg(merchant)
    response = HttpResponse(svg_content, content_type='image/svg+xml; charset=utf-8')
    response['X-Robots-Tag'] = 'noindex'
    return _public_cache(response, 3600)


def shopify_products_view(request):
    """
    Shopify-compatible storefront feed (/api/products.json)

    Exposes the active catalogue in the shape Shopify's /products.json returns, so
    any integration that imports from a Shopify store can consume Shoppage products:
    handle, body_html, images, tags and one variant per confirmed offer. Only fields
    the record actually holds are emitted.
    """
    from apps.catalog.models import ProductStatusChoices

    limit = min(int(request.GET.get('limit', 250) or 250), 500)
    products = (
        MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE)
        .prefetch_related('images', 'offers__merchant')
        .order_by('updated_at')[:limit]
    )

    payload = {'products': []}
    for product in products:
        variants = []
        for offer in product.offers.all():
            if not offer.price_amount or offer.availability_state == 'hidden':
                continue
            variants.append({
                'id': offer.canonical_id,
                'title': offer.merchant.name if offer.merchant_id else 'Default',
                'price': str(offer.price_amount),
                'sku': product.mpn or product.canonical_id,
                'currency': offer.currency,
                'available': offer.availability_state in (
                    'fresh', 'confirm_required', 'quote_required',
                ),
                'updated_at': offer.last_confirmed_at.isoformat() if offer.last_confirmed_at else None,
            })

        payload['products'].append({
            'id': product.canonical_id,
            'handle': product.seo_handle,
            'title': product.title,
            'body_html': (product.description or '')[:5000],
            'vendor': product.brand,
            'product_type': product.category_ref,
            'tags': product.tags if isinstance(product.tags, list) else [],
            'images': [
                {'src': img.url, 'alt': img.alt_text or product.title}
                for img in product.images.all()[:10]
            ],
            'variants': variants,
            'updated_at': product.updated_at.isoformat() if product.updated_at else None,
        })

    response = HttpResponse(
        json.dumps(payload), content_type='application/json; charset=utf-8'
    )
    return _public_cache(response, 300)
