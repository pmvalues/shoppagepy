"""
Shoppage Platform URL Configuration (Pure Django Architecture)
"""

from apps.catalog.views import (
    category_landing_view,
    price_alert_subscribe_view,
    product_detail_view,
)
from apps.core.legal import legal_page_view
from apps.core.seo import (
    _paged_sitemap,
    robots_txt_view,
    sitemap_index_view,
    static_sitemap_view,
)
from apps.core.views import (
    agency_view,
    analytics_view,
    healthz_view,
    home_view,
    readyz_view,
    requests_view,
    search_live_view,
    search_view,
)
from apps.markets.views import malls_directory_view, market_detail_view
from apps.media_hub.views import (
    short_comment_create_view,
    short_like_view,
    short_view_increment_view,
    shorts_directory_view,
    show_detail_view,
    shows_directory_view,
)
from apps.merchants.views import (
    campaign_center_view,
    campaign_toggle_view,
    following_feed_view,
    merchant_claim_view,
    merchant_crawl_actions_view,
    merchant_dashboard_view,
    merchant_detail_view,
    merchant_draft_action_view,
    merchant_list_view,
    merchant_photo_add_view,
    merchant_post_create_view,
    merchant_product_add_view,
    merchant_promotion_create_view,
    merchant_question_answer_view,
    merchant_question_ask_view,
    merchant_quick_price_view,
    merchant_review_create_view,
    merchant_review_reply_view,
    merchant_settings_view,
)
from apps.referrals.views import (
    affiliate_landing_view,
    affiliate_profile_view,
    affiliate_register_view,
    merchant_follow_toggle_view,
    universal_link_resolver,
)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from django.views.generic import RedirectView

# Custom Django Admin Header & Branding
admin.site.site_header = "Shoppage National Commercial Intelligence Grid"
admin.site.site_title = "Shoppage Admin"
admin.site.index_title = "South Africa Commercial Operations & Registry Control"

urlpatterns = [
    # 0. Authentication (Merchant Centre OS)
    path('accounts/login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),

    # 1. Native Django Admin
    path('admin/', admin.site.urls),

    # 2. Universal Link Resolver (Sub-50ms WhatsApp & Outbound Tracker)
    path('l/<str:universal_id>/', universal_link_resolver, name='universal_link_resolver'),
    path('affiliate/', affiliate_landing_view, name='affiliate_landing'),
    path('affiliate/register/', affiliate_register_view, name='affiliate_register'),
    path('affiliate/<slug:handle>/', affiliate_profile_view, name='affiliate_profile'),
    path('following/', following_feed_view, name='following_feed'),
    path('m/<str:canonical_id>/follow/', merchant_follow_toggle_view, name='merchant_follow_toggle'),

    # 3. REST API Endpoints
    path('api/', include('apps.api.urls')),

    # 4. Catalog Product Detail & Matrix Pricing
    path('p/<str:canonical_id>/', product_detail_view, name='product_detail'),
    path('p/<str:canonical_id>/alert/', price_alert_subscribe_view, name='price_alert_subscribe'),
    path('category/<slug:slug>/', category_landing_view, name='category_landing'),

    # 5. Spatial Markets & Shopping Centres
    path('malls/', malls_directory_view, name='malls_directory'),
    path('markets/<slug:slug_or_id>/', market_detail_view, name='market_detail'),

    # 6. Merchants, Claims & Merchant Centre OS
    path('merchants/', merchant_list_view, name='merchant_list'),
    path('m/<str:canonical_id>/', merchant_detail_view, name='merchant_detail'),
    path('merchant/claim/', merchant_claim_view, name='merchant_claim'),
    path('merchant/dashboard/', merchant_dashboard_view, name='merchant_dashboard'),
    path('merchant/products/add/', merchant_product_add_view, name='merchant_product_add'),
    path('merchant/crawl/actions/', merchant_crawl_actions_view, name='merchant_crawl_actions'),
    path('merchant/draft/<str:draft_id>/action/', merchant_draft_action_view, name='merchant_draft_action'),
    path('merchant/offer/<uuid:offer_id>/price/', merchant_quick_price_view, name='merchant_quick_price'),
    path('merchant/settings/', merchant_settings_view, name='merchant_settings'),
    path('merchant/promotion/create/', merchant_promotion_create_view, name='merchant_promotion_create'),
    path('m/<str:canonical_id>/review/', merchant_review_create_view, name='merchant_review_create'),
    path('m/<str:canonical_id>/review/<int:review_pk>/reply/', merchant_review_reply_view, name='merchant_review_reply'),
    path('m/<str:canonical_id>/question/', merchant_question_ask_view, name='merchant_question_ask'),
    path('m/<str:canonical_id>/question/<int:q_pk>/answer/', merchant_question_answer_view, name='merchant_question_answer'),
    path('m/<str:canonical_id>/photo/', merchant_photo_add_view, name='merchant_photo_add'),
    path('m/<str:canonical_id>/post/', merchant_post_create_view, name='merchant_post_create'),

    # 7. Media Hub: Shows & Proof Shorts
    path('shows/', shows_directory_view, name='shows_directory'),
    path('shows/<slug:slug>/', show_detail_view, name='show_detail'),
    path('shorts/', shorts_directory_view, name='shorts_directory'),
    path('shorts/<str:canonical_id>/like/', short_like_view, name='short_like'),
    path('shorts/<str:canonical_id>/view/', short_view_increment_view, name='short_view'),
    path('shorts/<str:canonical_id>/comment/', short_comment_create_view, name='short_comment_create'),

    # 8. Search Engine & RFQ Broadcast
    path('search/', search_view, name='search'),
    path('search/live/', search_live_view, name='search_live'),
    path('requests/', requests_view, name='requests'),
    path('agency/', agency_view, name='agency'),
    path('analytics/', analytics_view, name='analytics'),
    path('merchant/campaigns/', campaign_center_view, name='campaign_center'),
    path('merchant/campaign/<str:campaign_id>/toggle/', campaign_toggle_view, name='campaign_toggle'),

    # 9. Homepage
    path('', home_view, name='home'),

    # 9b. Policy pages linked from the footer
    path('privacy/', legal_page_view, {'slug': 'privacy'}, name='privacy'),
    path('terms/', legal_page_view, {'slug': 'terms'}, name='terms'),
    path('security/', legal_page_view, {'slug': 'security'}, name='security'),

    # 10. SEO & Browser Favicon Surface
    path('favicon.ico', RedirectView.as_view(url='/static/icons/favicon.svg', permanent=True)),
    path('robots.txt', robots_txt_view, name='robots'),
    path('sitemap.xml', sitemap_index_view, name='sitemap-index'),
    path('sitemap-static.xml', static_sitemap_view, name='sitemap-static'),
    path('sitemap-products-<int:page>.xml', _paged_sitemap('products'), name='sitemap-products'),
    path('sitemap-merchants-<int:page>.xml', _paged_sitemap('merchants'), name='sitemap-merchants'),
    path('sitemap-markets-<int:page>.xml', _paged_sitemap('markets'), name='sitemap-markets'),

    # 11. Orchestration Probes (v8.2)
    path('healthz/', healthz_view, name='healthz'),
    path('readyz/', readyz_view, name='readyz'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
