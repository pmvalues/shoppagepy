import logging
from decimal import Decimal, InvalidOperation

from apps.catalog.models import MasterProduct
from apps.core.hours import day_rows
from apps.core.seo import breadcrumb_jsonld, jsonld_script, merchant_jsonld
from apps.markets.models import Market
from apps.offers.models import (
    DEFAULT_SLA,
    SLA_VALIDITY,
    AvailabilityStateChoices,
    Offer,
)
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.http import Http404, HttpResponse, HttpResponsePermanentRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from .models import Draft, Merchant

logger = logging.getLogger(__name__)
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import HttpResponse, JsonResponse, Http404
from .models import (
    Merchant, Draft, AgentRun, Order, OrderItem, Promotion,
    ShippingRate, MerchantCentreSettings, diagnose_offer_feed_status,
    OrderStatusChoices, PromotionTypeChoices, PromotionScopeChoices,
)
from apps.markets.models import Market
from apps.catalog.models import MasterProduct, Review, ReviewModerationChoices
from apps.offers.models import Offer
from apps.core.seo import merchant_jsonld, jsonld_script
from apps.referrals.models import ReferralEvent

def merchant_list_view(request):
    category_filter = request.GET.get('category')
    province_filter = request.GET.get('province')
    query = request.GET.get('q')

    merchants_qs = Merchant.objects.all()
    if category_filter:
        merchants_qs = merchants_qs.filter(category=category_filter)
    if province_filter:
        merchants_qs = merchants_qs.filter(province=province_filter)
    if query:
        merchants_qs = merchants_qs.filter(name__istartswith=query)

    # Fetch top-rated candidate merchants and deduplicate by storefront brand
    candidates = list(
        merchants_qs.select_related('market')
        .order_by('-trust_score', 'id')[:200]
    )

    unique_merchants = []
    seen_prefixes = set()
    for m in candidates:
        name_key = m.name.split('#')[0].strip().lower()
        if name_key not in seen_prefixes:
            seen_prefixes.add(name_key)
            unique_merchants.append(m)
        if len(unique_merchants) >= 48:
            break

    context = {
        'merchants': unique_merchants,
        'selected_category': category_filter,
        'selected_province': province_filter,
        'query': query,
    }
    return render(request, 'merchants/merchant_list.html', context)

def merchant_detail_view(request, canonical_id):
    merchant = Merchant.objects.filter(canonical_id=canonical_id).select_related('market').first()
    matched_by_pk = False
    if not merchant:
        try:
            merchant = Merchant.objects.filter(id=canonical_id).select_related('market').first()
        except ValidationError:
            merchant = None
        matched_by_pk = merchant is not None
    if not merchant:
        raise Http404("Merchant not found")
    if matched_by_pk:
        return HttpResponsePermanentRedirect(f'/m/{merchant.canonical_id}/')

    offers = list(merchant.offers.select_related('variant').order_by('-price_amount')[:100])

    # Store proof video shorts: only clips actually tethered to this merchant.
    if request.method == 'POST' and 'review_submit' in request.POST:
        from apps.catalog.views import _handle_merchant_review
        _handle_merchant_review(request, merchant)
        return redirect(request.path)

    offers = list(merchant.offers.select_related('variant').order_by('-price_amount'))
    
    # Store proof video shorts
    from apps.media_hub.models import Short
    store_shorts = list(Short.objects.filter(
        merchant=merchant, moderation_state__in=['approved', 'APPROVED']
    )[:12])

    # Store inventory categories for navigation
    categories = set()
    for o in offers:
        if o.variant and o.variant.category_ref:
            categories.add(o.variant.category_ref)

    featured_offers = offers[:4]
    rating_count = merchant.rating_count
    summary_bits = [part for part in (
        merchant.primary_category,
        f'{rating_count} review{"s" if rating_count != 1 else ""} at {merchant.google_rating}★' if merchant.google_rating and rating_count else '',
        f'trust score {merchant.trust_score}/100' if merchant.is_claimed else '',
    ) if part]
    default_description = (
        f'{merchant.name} trades at {merchant.address_text or merchant.locality or "the Shoppage grid"}. '
        + ' · '.join(summary_bits)
    ).strip()
    crumbs = [
        ('Home', '/'),
        ('Merchants', '/merchants/'),
        (merchant.name, None),
    ]

    open_now, open_label = merchant.is_open_now()
    context = {
        'merchant': merchant,
        'offers': offers,
        'featured_offers': featured_offers,
        'store_categories': sorted(categories),
        'store_shorts': store_shorts,
        'rating_count': rating_count,
        'hours_rows': day_rows(merchant.opening_hours),
        'jsonld': jsonld_script(merchant_jsonld(merchant, request)),
        'breadcrumb_jsonld': jsonld_script(breadcrumb_jsonld(crumbs, request)),
        'breadcrumbs': crumbs,
        'page_title': merchant.meta_title or f'{merchant.name} — Hours, Stock & Reviews | Shoppage',
        'meta_description': merchant.meta_description or default_description[:155],
        'canonical_path': f'/m/{merchant.canonical_id}/',
        'og_image_url': merchant.public_image_url or '',
        'og_image_alt': merchant.name,
        'og_type': 'business.business',
        'open_now': open_now,
        'open_label': open_label,
        'reviews': list(merchant.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED)),
        'jsonld': jsonld_script(merchant_jsonld(merchant)),
    }
    return render(request, 'merchants/merchant_detail.html', context)

@login_required
def merchant_claim_view(request):
    variant_id = request.GET.get('variantId')
    title = request.GET.get('title', '')
    product = MasterProduct.objects.filter(canonical_id=variant_id).first() if variant_id else None
    markets = list(Market.objects.all()[:30])

    if request.method == 'POST':
        name = request.POST.get('name')
        whatsapp = request.POST.get('whatsapp')
        email = request.POST.get('email')
        stall = request.POST.get('stall')
        price = request.POST.get('price')
        market_id = request.POST.get('market_id')

        # Create or update merchant (owned by the authenticated user)
        canonical_id = f"m_{name.lower().replace(' ', '_')[:20]}"
        market = Market.objects.filter(id=market_id).first() if market_id else None

        merchant, _ = Merchant.objects.get_or_create(
            canonical_id=canonical_id,
            defaults={
                'name': name,
                'owner': request.user,
                'whatsapp_number': whatsapp,
                'email': email,
                'stall_identifier': stall,
                'market': market,
                'claim_state': 'claimed',
                'verification_state': 'unverified',
                'province': market.province if market else 'Gauteng',
                'address_text': f"{stall}, {market.name if market else 'Direct'}",
            }
        )
        # Ensure an existing record is linked to the claiming user.
        if merchant.owner_id != request.user.id:
            merchant.owner = request.user
            merchant.save(update_fields=['owner'])

        if product and price:
            try:
                Offer.objects.create(
                    canonical_id=f"ofr_{merchant.canonical_id}_{product.canonical_id[:10]}",
                    variant=product,
                    merchant=merchant,
                    price_amount=float(price),
                    stall_ref=stall,
                    destination_type='merchant_whatsapp',
                    availability_state='fresh',
                )
            except (ValueError, IntegrityError) as exc:
                logger.warning('Claim offer creation failed for %s: %s', canonical_id, exc)

        messages.success(request, f"Congratulations! {name} has been listed. You can now receive WhatsApp referrals.")
        return redirect(f"/merchant/dashboard/?merchantId={merchant.canonical_id}")

    context = {
        'product': product,
        'title': title,
        'markets': markets,
    }
    return render(request, 'merchants/merchant_claim.html', context)

@login_required
def merchant_dashboard_view(request):
    """
    Modern Merchant Centre OS (v8.1 Part XII)
    5-Tab Workspace: Agent Console, Draft Review, Offers Matrix, Demand Radar, Trust Passport.
    Access is restricted to the owning user (or staff for support).
    """
    merchant_id = request.GET.get('merchantId')
    merchant = None
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate

    if merchant is None:
        merchant = request.user.owned_merchants.first()

    if merchant is None:
        # No merchant linked to this account yet — send them to claim one.
        return redirect('merchant_claim')

    offers = list(merchant.offers.select_related('variant').order_by('-price_amount')[:100])
    drafts = list(merchant.drafts.select_related('product').order_by('-created_at')[:25])
    agent_runs = list(merchant.agent_runs.order_by('-created_at')[:6])
    referral_events = list(merchant.referral_events.order_by('-created_at')[:12])
    Fully-fledged Merchant Centre (Google Merchant Centre + Amazon Seller Central + Shopify Admin parity).
    Tabs: Overview, Products (+ feed diagnostics), Orders, Promotions, Reviews, Performance, Settings.
    POST actions drive order status, promotions, review moderation, profile + shipping settings.
    """
    merchant_id = request.GET.get('merchantId', 'm_solar_bros')
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first() or Merchant.objects.first()

    if request.method == 'POST' and merchant:
        _handle_merchant_centre_post(request, merchant)
        return redirect(f"{request.path}?merchantId={merchant.canonical_id}")

    offers = list(merchant.offers.select_related('variant').all()) if merchant else []
    drafts = list(merchant.drafts.select_related('product').all()) if merchant else []
    agent_runs = list(merchant.agent_runs.all()[:6]) if merchant else []
    referral_events = list(merchant.referral_events.all()[:12]) if merchant else []

    orders = list(merchant.orders.prefetch_related('items').all()[:50]) if merchant else []
    promotions = list(merchant.promotions.all()[:50]) if merchant else []
    shipping_rates = list(merchant.shipping_rates.all()) if merchant else []
    centre_settings, _ = (MerchantCentreSettings.objects.get_or_create(merchant=merchant) if merchant else (None, None))

    reviews_pending = list(merchant.reviews.filter(moderation_state=ReviewModerationChoices.PENDING).all()[:50]) if merchant else []
    reviews_approved = list(merchant.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED).all()[:50]) if merchant else []

    # GMC-style feed diagnostics per offer
    feed_diagnostics = _merchant_feed_diagnostics(merchant) if merchant else []
    feed_counts = {
        'approved': sum(1 for d in feed_diagnostics if d['status'] == 'approved'),
        'limited': sum(1 for d in feed_diagnostics if d['status'] == 'limited'),
        'disapproved': sum(1 for d in feed_diagnostics if d['status'] == 'disapproved'),
        'pending': sum(1 for d in feed_diagnostics if d['status'] == 'pending'),
    }

    # Merchant insights: referral action aggregates (7d / 30d / all-time) + top offers
    insights = _merchant_insights(merchant) if merchant else {}

    demands = [
        {
            'id': 'rfq_01',
            'buyer_name': 'Thabo M. (Sandton)',
            'query': 'Need 5kW Deye Inverter + 10kWh Battery installation with CoC certificate before Friday.',
            'category': 'solar_energy',
            'timestamp': '12 mins ago',
            'suggested_quote': 'R 64,500 (Installed + CoC)',
        },
        {
            'id': 'rfq_02',
            'buyer_name': 'Kagiso N. (Centurion)',
            'query': 'Looking for 3x Dyness 5.12kWh BX51100 Lithium Batteries bulk pricing.',
            'category': 'solar_energy',
            'timestamp': '45 mins ago',
            'suggested_quote': 'R 48,900 (Trade Bulk)',
        },
        {
            'id': 'rfq_03',
            'buyer_name': 'Nomsa D. (Rosebank)',
            'query': 'Solar geyser conversion kit with 2kW element for stage 4 backup.',
            'category': 'solar_energy',
            'timestamp': '2 hours ago',
            'suggested_quote': 'R 14,200 (Complete Kit)',
        },
    ]

    context = {
        'merchant': merchant,
        'offers': offers,
        'drafts': drafts,
        'agent_runs': agent_runs,
        'referral_events': referral_events,
        'demands': referral_events,
        'total_referrals_count': len(referral_events),
    }
    return render(request, 'merchants/merchant_dashboard.html', context)

@login_required
        'demands': demands,
        'insights': insights,
        'total_referrals_count': insights.get('total', len(referral_events)) if merchant else 48,
        'orders': orders,
        'promotions': promotions,
        'shipping_rates': shipping_rates,
        'centre_settings': centre_settings,
        'reviews_pending': reviews_pending,
        'reviews_approved': reviews_approved,
        'feed_diagnostics': feed_diagnostics,
        'feed_counts': feed_counts,
        'order_status_choices': OrderStatusChoices.choices,
        'promotion_type_choices': PromotionTypeChoices.choices,
        'promotion_scope_choices': PromotionScopeChoices.choices,
        'weekday_choices': [
            ('mon', 'Mon'), ('tue', 'Tue'), ('wed', 'Wed'),
            ('thu', 'Thu'), ('fri', 'Fri'), ('sat', 'Sat'), ('sun', 'Sun'),
        ],
    }
    return render(request, 'merchants/merchant_dashboard.html', context)


def _merchant_feed_diagnostics(merchant):
    """Return GMC-style diagnostics list for a merchant's offers."""
    rows = []
    for offer in merchant.offers.select_related('variant').all():
        diag = diagnose_offer_feed_status(offer)
        rows.append({
            'offer': offer,
            'status': diag['status'],
            'issues': diag['issues'],
        })
    return rows


def _handle_merchant_centre_post(request, merchant):
    """Dispatch Merchant Centre POST actions (orders, promotions, reviews, profile, shipping)."""
    from decimal import Decimal
    from django.utils import timezone
    action = request.POST.get('action')

    if action == 'update_order_status':
        order = merchant.orders.filter(id=request.POST.get('order_id')).first()
        if order and request.POST.get('status') in OrderStatusChoices.values:
            order.status = request.POST['status']
            order.save(update_fields=['status', 'updated_at'])
            messages.success(request, f"Order {order.reference} → {order.get_status_display()}")

    elif action == 'create_promotion':
        promo = Promotion(merchant=merchant)
        promo.title = request.POST.get('title', 'Untitled Promotion')[:255]
        if request.POST.get('promo_type') in PromotionTypeChoices.values:
            promo.promo_type = request.POST['promo_type']
        try:
            promo.value = Decimal(request.POST.get('value') or '0')
        except Exception:
            promo.value = 0
        promo.code = request.POST.get('code') or None
        if request.POST.get('scope') in PromotionScopeChoices.values:
            promo.scope = request.POST['scope']
        promo.target_ref = request.POST.get('target_ref') or None
        try:
            promo.min_order_amount = Decimal(request.POST.get('min_order_amount') or '0')
        except Exception:
            promo.min_order_amount = 0
        promo.active = request.POST.get('active', 'on') == 'on'
        promo.save()
        messages.success(request, f"Promotion '{promo.title}' created")

    elif action == 'toggle_promotion':
        promo = merchant.promotions.filter(id=request.POST.get('promo_id')).first()
        if promo:
            promo.active = not promo.active
            promo.save(update_fields=['active', 'updated_at'])
            messages.success(request, f"Promotion '{promo.title}' {'enabled' if promo.active else 'paused'}")

    elif action == 'delete_promotion':
        promo = merchant.promotions.filter(id=request.POST.get('promo_id')).first()
        if promo:
            promo.delete()
            messages.success(request, "Promotion removed")

    elif action == 'moderate_review':
        review = merchant.reviews.filter(id=request.POST.get('review_id')).first()
        decision = request.POST.get('decision')
        if review and decision in ('approve', 'reject'):
            review.moderation_state = ReviewModerationChoices.APPROVED if decision == 'approve' else ReviewModerationChoices.REJECTED
            review.save(update_fields=['moderation_state'])
            merchant.refresh_reviews_summary()
            messages.success(request, f"Review {'approved' if decision == 'approve' else 'rejected'}")

    elif action == 'add_shipping_rate':
        rate = ShippingRate(merchant=merchant)
        rate.method = request.POST.get('method', 'Standard')[:120]
        rate.zone = request.POST.get('zone') or None
        try:
            rate.rate = Decimal(request.POST.get('rate') or '0')
        except Exception:
            rate.rate = 0
        try:
            rate.free_above = Decimal(request.POST.get('free_above')) if request.POST.get('free_above') else None
        except Exception:
            rate.free_above = None
        try:
            rate.eta_days = int(request.POST.get('eta_days') or '3')
        except Exception:
            rate.eta_days = 3
        rate.active = request.POST.get('active', 'on') == 'on'
        rate.save()
        messages.success(request, f"Shipping method '{rate.method}' added")

    elif action == 'update_profile':
        merchant.telephone = request.POST.get('telephone', merchant.telephone)
        merchant.email = request.POST.get('email', merchant.email) or None
        merchant.whatsapp_number = request.POST.get('whatsapp_number', merchant.whatsapp_number) or None
        merchant.website_url = request.POST.get('website_url', merchant.website_url) or None
        merchant.address_text = request.POST.get('address_text', merchant.address_text) or None
        # Structured opening hours: one [open, close] pair per weekday
        hours = {}
        for day in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'):
            o = request.POST.get(f'hours_{day}_open')
            c = request.POST.get(f'hours_{day}_close')
            if o and c:
                hours[day] = [o, c]
        if hours:
            merchant.operating_hours_json = hours
        delivery = [d.strip() for d in (request.POST.get('delivery_options') or '').split(',') if d.strip()]
        if request.POST.get('delivery_options') is not None:
            merchant.delivery_options = delivery
        payments = [p.strip() for p in (request.POST.get('payment_methods') or '').split(',') if p.strip()]
        if request.POST.get('payment_methods') is not None:
            merchant.payment_methods = payments
        merchant.save(update_fields=[
            'telephone', 'email', 'whatsapp_number', 'website_url', 'address_text',
            'operating_hours_json', 'delivery_options', 'payment_methods', 'updated_at',
        ])
        settings, _ = MerchantCentreSettings.objects.get_or_create(merchant=merchant)
        settings.about_text = request.POST.get('about_text', settings.about_text) or None
        settings.return_policy = request.POST.get('return_policy', settings.return_policy) or None
        settings.banner_url = request.POST.get('banner_url', settings.banner_url) or None
        try:
            settings.tax_rate = Decimal(request.POST.get('tax_rate') or '0')
        except Exception:
            pass
        settings.save()
        messages.success(request, "Business profile updated")


def _merchant_insights(merchant):
    """Aggregate referral events into actionable merchant insights."""
    from django.db.models import Count
    from datetime import timedelta
    from django.utils import timezone
    from apps.referrals.models import ReferralEvent, ReferralActionChoices

    qs = merchant.referral_events.all()
    now = timezone.now()
    since_7 = now - timedelta(days=7)
    since_30 = now - timedelta(days=30)

    def counts(since=None):
        base = qs.filter(occurred_at__gte=since) if since else qs
        rows = base.values('action').annotate(c=Count('id')).order_by('-c')
        return {ReferralActionChoices(r['action']).label if r['action'] in ReferralActionChoices.values else r['action']: r['c'] for r in rows}

    top_offers = (
        qs.filter(offer__isnull=False)
        .values('offer__canonical_id', 'offer__variant__title')
        .annotate(c=Count('id')).order_by('-c')[:5]
    )
    top_offers_list = [
        {'offer': o['offer__canonical_id'], 'title': o['offer__variant__title'], 'clicks': o['c']}
        for o in top_offers
    ]

    return {
        'total': qs.count(),
        'last_7': counts(since_7),
        'last_30': counts(since_30),
        'all_time': counts(),
        'top_offers': top_offers_list,
        'profile_views_7d': sum(v for k, v in counts(since_7).items() if 'Profile' in k or 'View' in k),
    }

def merchant_draft_action_view(request, draft_id):
    action = request.POST.get('action') or request.GET.get('action', 'approved')
    draft = get_object_or_404(Draft, draft_id=draft_id)

    if not request.user.is_staff and draft.merchant_id and draft.merchant.owner_id != request.user.id:
        raise PermissionDenied

    if action in ['approved', 'rejected']:
        draft.review_state = action
        draft.save(update_fields=['review_state'])

    color = '#10B981' if draft.review_state == 'approved' else '#EF4444'
    label = '✓ Approved' if draft.review_state == 'approved' else '✕ Rejected'

    return HttpResponse(
        f'<span style="background:{color}; color:#FFFFFF; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem;">{label}</span>'
    )

@login_required
@require_POST
def merchant_quick_price_view(request, offer_id):
    offer = get_object_or_404(Offer.objects.select_related('merchant'), id=offer_id)

    if not request.user.is_staff and (not offer.merchant_id or offer.merchant.owner_id != request.user.id):
        raise PermissionDenied

    try:
        price = Decimal(str(request.POST.get('price')))
    except (TypeError, ValueError, InvalidOperation):
        return HttpResponse('Invalid price', status=400)
    if price <= 0:
        return HttpResponse('Invalid price', status=400)

    offer.price_amount = price
    offer.availability_state = AvailabilityStateChoices.FRESH
    offer.last_confirmed_at = timezone.now()
    offer.expires_at = offer.last_confirmed_at + SLA_VALIDITY.get(offer.sla_class, DEFAULT_SLA)
    offer.save(update_fields=[
        'price_amount', 'availability_state', 'last_confirmed_at', 'expires_at', 'updated_at',
    ])
    return HttpResponse(f'R {offer.price_amount:,.0f} · confirmed {offer.last_confirmed_at:%Y-%m-%d %H:%M}')
