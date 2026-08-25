from django.urls import path
from .views import (
    SearchAPIView,
    ProductListAPIView,
    ProductDetailAPIView,
    MerchantListAPIView,
    MerchantDetailAPIView,
    MarketListAPIView,
    MarketDetailAPIView,
    ReferralCreateAPIView,
    AssistantAPIView,
    agent_event_stream_view,
    google_merchant_center_feed_view,
    trust_seal_badge_view,
)

urlpatterns = [
    # Search
    path('v1/search/', SearchAPIView.as_view(), name='api-search'),
    path('search/', SearchAPIView.as_view(), name='api-search-alias'),
    
    # Products
    path('v1/products/', ProductListAPIView.as_view(), name='api-product-list'),
    path('v1/products/<str:canonical_id>/', ProductDetailAPIView.as_view(), name='api-product-detail'),
    
    # Merchants
    path('v1/merchants/', MerchantListAPIView.as_view(), name='api-merchant-list'),
    path('v1/merchants/<str:canonical_id>/', MerchantDetailAPIView.as_view(), name='api-merchant-detail'),
    
    # Markets
    path('v1/markets/', MarketListAPIView.as_view(), name='api-market-list'),
    path('v1/markets/<slug:canonical_slug>/', MarketDetailAPIView.as_view(), name='api-market-detail'),
    
    # Referrals & Action Ledger
    path('v1/referrals/', ReferralCreateAPIView.as_view(), name='api-referral-create'),
    
    # AI Assistant & Agent Stream (v8.1 Part XII)
    path('assistant/', AssistantAPIView.as_view(), name='api-assistant'),
    path('agent/stream/', agent_event_stream_view, name='api-agent-stream'),
    
    # Feeds & Badges
    path('feeds/google-merchant-center/<str:merchant_id>/', google_merchant_center_feed_view, name='api-gmc-feed'),
    path('seal/<str:merchant_id>/', trust_seal_badge_view, name='api-trust-seal'),
]
