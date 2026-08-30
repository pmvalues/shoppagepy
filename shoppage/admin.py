"""
Shoppage National Commercial Intelligence Grid — Admin Command Centre.

Wired in via ``shoppage.apps.ShoppageAdminConfig.default_site`` (documented
Django 5.x hook): the framework's ``admin.site`` lazy proxy wraps this class,
so every app-level ``@admin.register`` decorator keeps binding to the same
singleton it always has. The portal gains:

  * a live-telemetry index (KPI cards + operator triage queues) fed from real
    database counts, cached for 60 seconds so the dashboard is cheap even on
    the million-row registries, and
  * an environment/version chrome (DEV vs LIVE) injected into every admin page.
"""

import datetime

from django.conf import settings
from django.contrib.admin import AdminSite
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from django.utils.http import urlencode

from shoppage.admin_nav import ADMIN_NAV_SECTIONS

STATS_CACHE_KEY = 'shoppage:admin:portal_stats'
STATS_CACHE_TTL = 60  # seconds — dashboard telemetry refresh window


# ---------------------------------------------------------------------------
# Telemetry helpers
# ---------------------------------------------------------------------------

def _compact(n: int) -> str:
    """Human-friendly scale: 3,296 -> '3,296'; 3,100,000 -> '3.1M'."""
    if n is None:
        return '0'
    if n >= 1_000_000:
        value = f'{n / 1_000_000:.2f}'
        return f'{value.rstrip("0").rstrip(".")}M'
    return f'{n:,}'


def _changelist_url(model, **filters) -> str:
    url = reverse(f'admin:{model._meta.app_label}_{model._meta.model_name}_changelist')
    if filters:
        url = f'{url}?{urlencode(filters)}'
    return url


def _change_url(model, obj) -> str:
    return reverse(f'admin:{model._meta.app_label}_{model._meta.model_name}_change', args=[obj.pk])


def _sample(model, queryset, limit=4) -> list:
    """Tiny sample of queue rows (label + deep-link) — capped, never heavy."""
    return [
        {'label': str(obj), 'url': _change_url(model, obj)}
        for obj in queryset[:limit]
    ]


# ---------------------------------------------------------------------------
# Dashboard data service
# ---------------------------------------------------------------------------

def compute_portal_stats() -> dict:
    """
    Live counts across every authority plane. Runs at most once per
    STATS_CACHE_TTL; the dashboard must never take the site down, so any
    failure degrades to an empty (graceful) deck.
    """
    try:
        return _compute_portal_stats()
    except Exception as exc:  # pragma: no cover - defensive ceiling
        return {
            'error': str(exc),
            'generated_at': timezone.localtime().strftime('%H:%M:%S'),
            'cards': [],
            'queues': [],
        }

def _compute_portal_stats() -> dict:
    from apps.catalog.models import MasterProduct, ProductStatusChoices
    from apps.core.models import SearchQueryLog
    from apps.evidence.models import EvidenceArtifact, EvidenceClaim
    from apps.markets.models import Market, MarketVerificationChoices
    from apps.media_hub.models import ModerationStateChoices, Short
    from apps.merchants.models import (
        AgentRun,
        Campaign,
        ClaimStateChoices,
        Draft,
        Merchant,
        MerchantPhoto,
        MerchantQuestion,
        MerchantReview,
        TrustPassport,
        VerificationStateChoices,
    )
    from apps.offers.models import (
        AvailabilityStateChoices,
        CrawlRun,
        DiscoveredOffer,
        Offer,
        PriceAlert,
        Promotion,
        UrlHealthRecord,
        UrlHealthStateChoices,
    )
    from apps.referrals.models import ReferralEvent
    from django.db.models import Sum

    now = timezone.now()
    day_ago = now - datetime.timedelta(hours=24)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    live_states = [
        AvailabilityStateChoices.FRESH,
        AvailabilityStateChoices.CONFIRM_REQUIRED,
        AvailabilityStateChoices.QUOTE_REQUIRED,
    ]

    # --- Authority planes ---------------------------------------------------
    markets_total = Market.objects.count()
    markets_verified = Market.objects.filter(
        verification_state=MarketVerificationChoices.EVIDENCE_VERIFIED
    ).count()

    merchants_total = Merchant.objects.count()
    merchants_claimed = Merchant.objects.filter(claim_state=ClaimStateChoices.CLAIMED).count()
    merchants_verified = Merchant.objects.filter(
        verification_state=VerificationStateChoices.FULLY_VERIFIED
    ).count()

    products_total = MasterProduct.objects.count()
    products_active = MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE).count()
    try:
        products_with_live_offers = (
            Offer.objects.filter(availability_state__in=live_states)
            .values('variant_id')
            .distinct()
            .count()
        )
    except Exception:
        products_with_live_offers = products_active

    offers_live = Offer.objects.filter(availability_state__in=live_states).count()
    offers_lapsed = Offer.objects.filter(availability_state=AvailabilityStateChoices.EXPIRED).count()
    discovered_total = DiscoveredOffer.objects.count()

    drafts_pending = Draft.objects.filter(review_state='pending').count()
    agent_runs_24h = AgentRun.objects.filter(created_at__gte=day_ago).count()

    claims_verified = EvidenceClaim.objects.filter(state='verified').count()
    artifacts_total = EvidenceArtifact.objects.count()

    try:
        shorts_views = Short.objects.aggregate(total=Sum('views'))['total'] or 0
    except Exception:
        shorts_views = 0
    shorts_pending = Short.objects.filter(moderation_state=ModerationStateChoices.PENDING).count()

    referral_events = ReferralEvent.objects.count()
    campaigns_active = Campaign.objects.filter(status=Campaign.StatusChoices.ACTIVE).count()
    searches_today = SearchQueryLog.objects.filter(created_at__gte=today_start).count()
    alerts_active = PriceAlert.objects.filter(active=True).count()
    promotions_active = Promotion.objects.filter(state='active').count()

    # --- Web crawl ledger (merchant catalog health) --------------------------
    crawl_urls_total = UrlHealthRecord.objects.count()
    crawl_healthy = UrlHealthRecord.objects.filter(state=UrlHealthStateChoices.HEALTHY).count()
    crawl_failed = UrlHealthRecord.objects.filter(state=UrlHealthStateChoices.FAILED).count()
    crawl_off_domain = UrlHealthRecord.objects.filter(state=UrlHealthStateChoices.OFF_DOMAIN).count()
    crawl_pending = UrlHealthRecord.objects.filter(refresh_requested_at__isnull=False).count()
    crawl_runs_24h = CrawlRun.objects.filter(started_at__gte=day_ago).count()

    cards = [
        {'icon': '🏬', 'label': 'Spatial Commerce Nodes', 'value': _compact(markets_total),
         'sub': f'{markets_verified:,} field-verified', 'color': '#2563EB'},
        {'icon': '🏪', 'label': 'Merchant Registry', 'value': _compact(merchants_total),
         'sub': f'{merchants_claimed:,} claimed · {merchants_verified:,} fully verified', 'color': '#10B981'},
        {'icon': '🛒', 'label': 'Master Catalogue', 'value': _compact(products_total),
         'sub': f'{products_active:,} active · {products_with_live_offers:,} with live offers', 'color': '#8B5CF6'},
        {'icon': '🕸️', 'label': 'Web Crawl Ledger', 'value': _compact(crawl_urls_total),
         'sub': f'{crawl_healthy:,} healthy · {crawl_failed:,} failing · {crawl_off_domain:,} off-domain', 'color': '#0EA5E9'},
        {'icon': '💰', 'label': 'Live Offers', 'value': _compact(offers_live),
         'sub': f'{offers_lapsed:,} lapsed · {discovered_total:,} discovered', 'color': '#F59E0B'},
        {'icon': '🤖', 'label': 'Autopilot Pipeline', 'value': _compact(drafts_pending),
         'sub': f'{agent_runs_24h:,} agent runs in 24h · {crawl_runs_24h:,} crawls', 'color': '#06B6D4'},
        {'icon': '📜', 'label': 'Evidence Ledger', 'value': _compact(claims_verified),
         'sub': f'{artifacts_total:,} hashed artifacts', 'color': '#EC4899'},
        {'icon': '🎬', 'label': 'Proof Media Reach', 'value': _compact(shorts_views),
         'sub': f'{shorts_pending:,} shorts pending moderation', 'color': '#EF4444'},
        {'icon': '🔗', 'label': 'Referral Engine', 'value': _compact(referral_events),
         'sub': f'{campaigns_active} campaigns live', 'color': '#64748B'},
    ]

    queues = [
        {'icon': '🤖', 'title': 'AI drafts awaiting review', 'model': Draft,
         'qs': Draft.objects.filter(review_state='pending'),
         'filters': {'review_state': 'pending'}, 'empty_hint': 'no drafts waiting'},
        {'icon': '⭐', 'title': 'Reviews awaiting moderation', 'model': MerchantReview,
         'qs': MerchantReview.objects.filter(state='pending'),
         'filters': {'state': 'pending'}, 'empty_hint': 'no reviews waiting'},
        {'icon': '❓', 'title': 'Questions awaiting answers', 'model': MerchantQuestion,
         'qs': MerchantQuestion.objects.filter(state='pending'),
         'filters': {'state': 'pending'}, 'empty_hint': 'no questions waiting'},
        {'icon': '📷', 'title': 'Photos awaiting moderation', 'model': MerchantPhoto,
         'qs': MerchantPhoto.objects.filter(state='pending'),
         'filters': {'state': 'pending'}, 'empty_hint': 'no photos waiting'},
        {'icon': '⏳', 'title': 'Offers needing confirmation', 'model': Offer,
         'qs': Offer.objects.filter(availability_state=AvailabilityStateChoices.CONFIRM_REQUIRED),
         'filters': {'availability_state': 'confirm_required'}, 'empty_hint': 'no offers to confirm'},
        {'icon': '🎬', 'title': 'Shorts pending moderation', 'model': Short,
         'qs': Short.objects.filter(moderation_state=ModerationStateChoices.PENDING),
         'filters': {'moderation_state': 'pending'}, 'empty_hint': 'no shorts waiting'},
        {'icon': '🛒', 'title': 'Products missing image or copy', 'model': MasterProduct,
         'qs': MasterProduct.objects.filter(status=ProductStatusChoices.ACTIVE),
         'filters': {'publishable': 'no'}, 'empty_hint': 'catalogue is feed-ready'},
        {'icon': '🔔', 'title': 'Trust passports flagged', 'model': TrustPassport,
         'qs': TrustPassport.objects.filter(state='FLAGGED'),
         'filters': {'state': 'FLAGGED'}, 'empty_hint': 'no passports flagged'},
        {'icon': '🕸️', 'title': 'Crawled URLs failing checks', 'model': UrlHealthRecord,
         'qs': UrlHealthRecord.objects.filter(state=UrlHealthStateChoices.FAILED),
         'filters': {'state': 'failed'}, 'empty_hint': 'no failing crawl URLs'},
        {'icon': '🔄', 'title': 'URLs waiting impression refresh', 'model': UrlHealthRecord,
         'qs': UrlHealthRecord.objects.filter(refresh_requested_at__isnull=False),
         'filters': {'refresh_requested_at__isnull': 'False'}, 'empty_hint': 'no refresh requests queued'},
    ]

    built_queues = []
    for queue in queues:
        try:
            model = queue['model']
            items = _sample(model, queue['qs'], limit=5)
            count = len(items) if len(items) < 5 else queue['qs'].count()
            built_queues.append({
                'icon': queue['icon'],
                'title': queue['title'],
                'count': count,
                'url': _changelist_url(model, **queue['filters']),
                'items': items,
                'empty_hint': queue['empty_hint'],
            })
        except Exception:
            continue

    return {
        'generated_at': timezone.localtime(now).strftime('%H:%M:%S'),
        'cards': cards,
        'queues': built_queues,
        # Activity pulse (secondary strip below the KPI deck)
        'pulse': {
            'searches_today': searches_today,
            'price_alerts_active': alerts_active,
            'promotions_active': promotions_active,
            'agent_runs_24h': agent_runs_24h,
            'crawl_runs_24h': crawl_runs_24h,
            'crawl_refresh_pending': crawl_pending,
        },
    }


# ---------------------------------------------------------------------------
# Chart data & activity feed (dashboard extras)
# ---------------------------------------------------------------------------

def compute_activity_chart_data() -> dict:
    """
    Last 7 days of platform activity: searches, clicks, referral leads.
    Returns JSON-safe dict for Chart.js consumption.
    """
    try:
        return _compute_activity_chart_data()
    except Exception:
        return {'labels': [], 'searches': [], 'clicks': [], 'leads': []}


def _compute_activity_chart_data() -> dict:
    from apps.core.models import SearchClick, SearchQueryLog
    from apps.referrals.models import ReferralEvent
    from django.db.models import Count
    from django.db.models.functions import TruncDate

    now = timezone.now()
    seven_days_ago = now - datetime.timedelta(days=6)

    def _daily(model, date_field):
        rows = list(
            model.objects.filter(**{f'{date_field}__gte': seven_days_ago})
            .annotate(day=TruncDate(date_field))
            .values('day')
            .annotate(n=Count('id'))
            .order_by('day')
        )
        return {r['day'].isoformat(): r['n'] for r in rows}

    searches_by_day = _daily(SearchQueryLog, 'created_at')
    clicks_by_day = _daily(SearchClick, 'created_at')
    leads_by_day = _daily(ReferralEvent, 'occurred_at')

    labels = []
    searches, clicks, leads = [], [], []
    for i in range(7):
        day = (seven_days_ago + datetime.timedelta(days=i)).date()
        labels.append(day.strftime('%a %d'))
        searches.append(searches_by_day.get(day.isoformat(), 0))
        clicks.append(clicks_by_day.get(day.isoformat(), 0))
        leads.append(leads_by_day.get(day.isoformat(), 0))

    return {'labels': labels, 'searches': searches, 'clicks': clicks, 'leads': leads}


def compute_activity_trend() -> dict:
    """Week-over-week direction for total platform activity."""
    try:
        return _compute_activity_trend()
    except Exception:
        return {'direction': 'flat', 'pct': 0}


def _compute_activity_trend() -> dict:
    from apps.core.models import SearchQueryLog

    now = timezone.now()
    this_week = now - datetime.timedelta(days=7)
    last_week_start = now - datetime.timedelta(days=14)
    this_count = SearchQueryLog.objects.filter(created_at__gte=this_week).count()
    last_count = SearchQueryLog.objects.filter(
        created_at__gte=last_week_start, created_at__lt=this_week
    ).count()
    if last_count == 0:
        return {'direction': 'flat', 'pct': 0}
    pct = round((this_count - last_count) / last_count * 100, 1)
    if pct > 0:
        return {'direction': 'up', 'pct': abs(pct)}
    if pct < 0:
        return {'direction': 'down', 'pct': abs(pct)}
    return {'direction': 'flat', 'pct': 0}


def compute_mix_chart_data() -> dict:
    """Entity composition: merchants, products, offers, markets, markets."""
    try:
        return _compute_mix_chart_data()
    except Exception:
        return {'labels': [], 'data': []}


def _compute_mix_chart_data() -> dict:
    from apps.catalog.models import MasterProduct
    from apps.markets.models import Market
    from apps.merchants.models import Merchant
    from apps.offers.models import DiscoveredOffer, Offer

    return {
        'labels': ['Merchants', 'Products', 'Offers', 'Markets', 'Discovered'],
        'data': [
            Merchant.objects.count(),
            MasterProduct.objects.count(),
            Offer.objects.count(),
            Market.objects.count(),
            DiscoveredOffer.objects.count(),
        ],
    }


def compute_recent_activity(limit: int = 12) -> list[dict]:
    """Latest Django admin LogEntry rows with friendly rendering."""
    try:
        return _compute_recent_activity(limit)
    except Exception:
        return []


def _compute_recent_activity(limit: int) -> list[dict]:
    from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
    from django.contrib.contenttypes.models import ContentType

    rows = list(
        LogEntry.objects.select_related('user', 'content_type')
        .order_by('-action_time')[:limit]
    )
    out = []
    for entry in rows:
        flag = 'change'
        if entry.action_flag == ADDITION:
            flag = 'add'
        elif entry.action_flag == DELETION:
            flag = 'delete'
        change_url = None
        if entry.content_type_id and entry.object_id:
            try:
                change_url = reverse(
                    f'admin:{entry.content_type.app_label}_{entry.content_type.model}_change',
                    args=[entry.object_id],
                )
            except Exception:
                pass
        out.append({
            'user': entry.user.get_short_name() or entry.user.username if entry.user_id else 'system',
            'action': entry.get_action_flag_display().lower() + ' ' + (entry.object_repr or 'item'),
            'content_type': entry.content_type.name if entry.content_type else 'unknown',
            'action_time': entry.action_time.strftime('%d %b %H:%M'),
            'action_flag': flag,
            'change_url': change_url,
        })
    return out


def build_palette_items() -> list[dict]:
    """
    All admin-nav pages plus common quick actions — consumed by the
    command-palette search overlay (Cmd/Ctrl+K).
    """
    items = []
    for section in ADMIN_NAV_SECTIONS:
        for nav in section.items:
            items.append({
                'group': section.label,
                'label': nav.label,
                'url': reverse(nav.url_name) if nav.url_name else '#',
                'hint': f'{section.label} · {nav.app_label}/{nav.model_name}',
            })
    extras = [
        {'group': 'Actions', 'label': 'Run Catalog Crawl', 'url': '/admin/', 'hint': 'Trigger crawl rotation'},
        {'group': 'Actions', 'label': 'Open Merchant Centre', 'url': '/merchant/dashboard/', 'hint': 'Merchant OS'},
        {'group': 'Actions', 'label': 'Live Search API', 'url': '/api/v1/search/?q=&live=1', 'hint': 'Federated search'},
        {'group': 'Actions', 'label': 'View Malls Explorer', 'url': '/malls/', 'hint': 'Spatial commerce'},
        {'group': 'Account', 'label': 'Change Password', 'url': reverse('admin:password_change'), 'hint': 'Your credentials'},
        {'group': 'Account', 'label': 'Log Out', 'url': reverse('admin:logout'), 'hint': 'End session'},
    ]
    for e in extras:
        try:
            e['url'] = reverse(e['url'].lstrip('/')) if e['url'].startswith('/admin/') else e['url']
        except Exception:
            pass
        items.append(e)
    return items


# ---------------------------------------------------------------------------
# Custom AdminSite — Command Centre chrome
# ---------------------------------------------------------------------------

class ShoppageAdminSite(AdminSite):
    """Live-telemetry index plus environment/version chrome on every page."""

    site_header = 'Shoppage Command Centre'
    site_title = 'Shoppage Admin'
    index_title = 'Dashboard'

    def _greeting(self) -> str:
        hour = timezone.localtime().hour
        if hour < 12:
            return 'Good morning'
        if hour < 18:
            return 'Good afternoon'
        return 'Good evening'

    def each_context(self, request):
        context = super().each_context(request)
        context['shoppage_version'] = getattr(settings, 'SHOPPAGE_VERSION', 'v8.2')
        context['shoppage_env'] = 'DEV' if settings.DEBUG else 'LIVE'
        context['admin_nav'] = ADMIN_NAV_SECTIONS
        context['greeting'] = self._greeting()
        return context

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['portal_stats'] = cache.get_or_set(
            STATS_CACHE_KEY, compute_portal_stats, STATS_CACHE_TTL
        )
        extra_context['activity_chart_data'] = cache.get_or_set(
            'shoppage:admin:activity_chart', compute_activity_chart_data, 300
        )
        extra_context['activity_trend'] = cache.get_or_set(
            'shoppage:admin:activity_trend', compute_activity_trend, 300
        )
        extra_context['mix_chart_data'] = cache.get_or_set(
            'shoppage:admin:mix_chart', compute_mix_chart_data, 600
        )
        extra_context['recent_activity'] = compute_recent_activity(limit=12)
        extra_context['palette_items'] = build_palette_items()
        return super().index(request, extra_context=extra_context)
