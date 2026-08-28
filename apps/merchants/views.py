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
        .order_by('-trust_score')[:120]
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
