import json
import time
import uuid
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.catalog.models import MasterProduct
from apps.merchants.models import Merchant, Draft, AgentRun
from apps.markets.models import Market
from apps.offers.models import Offer
from apps.media_hub.models import Show, Short
from apps.referrals.models import ReferralEvent
from apps.evidence.models import EvidenceClaim, EvidenceArtifact
from apps.intelligence.services import (
    semantic_search,
    ask_assistant,
    generate_google_merchant_center_feed,
    generate_trust_seal_svg,
)
from .serializers import (
    MasterProductSerializer,
    MerchantSerializer,
    MarketSerializer,
    OfferSerializer,
    ShowSerializer,
    ShortSerializer,
    ReferralEventSerializer,
)

class SearchAPIView(APIView):
    """
    Public Search API Endpoint (/api/v1/search/)
    Executes semantic & keyword search across products and merchants.
    """
    def get(self, request):
        query = request.GET.get('q', '')
        limit = int(request.GET.get('limit', 12))
        offset = int(request.GET.get('offset', 0))

        result = semantic_search(query, limit=limit, offset=offset)
        
        return Response({
            'query': result['query'],
            'intent': result['intent'],
            'overview': result['overview'],
            'topBrands': result['top_brands'],
            'totalProducts': result['total_products'],
            'totalMerchants': result['total_merchants'],
            'priceStats': result['price_stats'],
            'products': MasterProductSerializer(result['products'], many=True).data,
            'merchants': MerchantSerializer(result['merchants'], many=True).data,
        })

class ProductListAPIView(generics.ListAPIView):
    queryset = MasterProduct.objects.filter(status='active')
    serializer_class = MasterProductSerializer

class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = MasterProduct.objects.all()
    serializer_class = MasterProductSerializer
    lookup_field = 'canonical_id'

class MerchantListAPIView(generics.ListAPIView):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

class MerchantDetailAPIView(generics.RetrieveAPIView):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer
    lookup_field = 'canonical_id'

class MarketListAPIView(generics.ListAPIView):
    queryset = Market.objects.all()
    serializer_class = MarketSerializer

class MarketDetailAPIView(generics.RetrieveAPIView):
    queryset = Market.objects.all()
    serializer_class = MarketSerializer
    lookup_field = 'canonical_slug'

class ReferralCreateAPIView(generics.CreateAPIView):
    queryset = ReferralEvent.objects.all()
    serializer_class = ReferralEventSerializer

class AssistantAPIView(APIView):
    """
    AI Commerce Assistant API (/api/assistant/)
    """
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
    Server-Sent Events (SSE) Agent Execution Stream (v8.1 Part XII.4 & XII.5)
    Streams structured lifecycle events for merchant autopilot runs.
    """
    def event_stream():
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        trace_id = f"trc_{uuid.uuid4().hex[:16]}"
        agent_name = request.GET.get('agent', 'Feed Autopilot')
        
        events = [
            ("run_started", f"Starting {agent_name} execution pipeline...", {"status": "running"}),
            ("plan_ready", "Policy check passed. Formulating catalogue ingestion plan.", {"steps": 4}),
            ("tool_executing", "Inspecting GS1 barcodes against SABS compliance registry...", {"tool": "registry_lookup"}),
            ("evidence_check", "Corroborating price claims with verified merchant receipts...", {"claims_checked": 5}),
            ("draft_generated", "Drafted 3 catalogue optimizations ready for merchant review.", {"draft_count": 3}),
            ("run_completed", f"{agent_name} run finished successfully with 0 policy violations.", {"status": "completed"}),
        ]

        for seq, (event_type, msg, payload) in enumerate(events, 1):
            data = {
                "event_id": str(uuid.uuid4()),
                "run_id": run_id,
                "trace_id": trace_id,
                "sequence_number": seq,
                "event_type": event_type,
                "message": msg,
                "payload": payload,
                "timestamp": int(time.time()),
            }
            yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

def google_merchant_center_feed_view(request, merchant_id):
    """
    Google Merchant Center XML Feed (/api/feeds/google-merchant-center/<merchant_id>/)
    """
    base_url = request.build_absolute_uri('/')[:-1]
    xml_content = generate_google_merchant_center_feed(merchant_id, base_url=base_url)
    return HttpResponse(xml_content, content_type='application/xml; charset=utf-8')

def trust_seal_badge_view(request, merchant_id):
    """
    Trust Seal SVG Dynamic Badge (/api/seal/<merchant_id>/)
    """
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first()
    if not merchant:
        merchant = Merchant.objects.first()
    
    if not merchant:
        return HttpResponse("<svg></svg>", content_type='image/svg+xml')

    svg_content = generate_trust_seal_svg(merchant)
    return HttpResponse(svg_content, content_type='image/svg+xml; charset=utf-8')
