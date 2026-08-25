"""
Shoppage Platform URL Configuration (Pure Django Architecture)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.core.views import home_view, search_view, search_live_view, requests_view, agency_view
from apps.referrals.views import universal_link_resolver
from apps.catalog.views import product_detail_view
from apps.markets.views import malls_directory_view, market_detail_view
from apps.merchants.views import (
    merchant_list_view,
    merchant_detail_view,
    merchant_claim_view,
    merchant_dashboard_view,
    merchant_draft_action_view,
    merchant_quick_price_view,
)
from apps.media_hub.views import shows_directory_view, show_detail_view, shorts_directory_view

# Custom Django Admin Header & Branding
admin.site.site_header = "Shoppage National Commercial Intelligence Grid"
admin.site.site_title = "Shoppage Admin"
admin.site.index_title = "South Africa Commercial Operations & Registry Control"

urlpatterns = [
    # 1. Native Django Admin
    path('admin/', admin.site.urls),

    # 2. Universal Link Resolver (Sub-50ms WhatsApp & Outbound Tracker)
    path('l/<str:universal_id>/', universal_link_resolver, name='universal_link_resolver'),

    # 3. REST API Endpoints
    path('api/', include('apps.api.urls')),

    # 4. Catalog Product Detail & Matrix Pricing
    path('p/<str:canonical_id>/', product_detail_view, name='product_detail'),

    # 5. Spatial Markets & Shopping Centres
    path('malls/', malls_directory_view, name='malls_directory'),
    path('markets/<slug:slug_or_id>/', market_detail_view, name='market_detail'),

    # 6. Merchants, Claims & Merchant Centre OS
    path('merchants/', merchant_list_view, name='merchant_list'),
    path('m/<str:canonical_id>/', merchant_detail_view, name='merchant_detail'),
    path('merchant/claim/', merchant_claim_view, name='merchant_claim'),
    path('merchant/dashboard/', merchant_dashboard_view, name='merchant_dashboard'),
    path('merchant/draft/<str:draft_id>/action/', merchant_draft_action_view, name='merchant_draft_action'),
    path('merchant/offer/<int:offer_id>/price/', merchant_quick_price_view, name='merchant_quick_price'),

    # 7. Media Hub: Shows & Proof Shorts
    path('shows/', shows_directory_view, name='shows_directory'),
    path('shows/<slug:slug>/', show_detail_view, name='show_detail'),
    path('shorts/', shorts_directory_view, name='shorts_directory'),

    # 8. Search Engine & RFQ Broadcast
    path('search/', search_view, name='search'),
    path('search/live/', search_live_view, name='search_live'),
    path('requests/', requests_view, name='requests'),
    path('agency/', agency_view, name='agency'),

    # 9. Homepage
    path('', home_view, name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
