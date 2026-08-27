from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import HttpResponse, JsonResponse, Http404
from .models import Merchant, Draft, AgentRun
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
    if not merchant:
        try:
            merchant = Merchant.objects.filter(id=canonical_id).select_related('market').first()
        except Exception:
            merchant = None
    if not merchant:
        raise Http404("Merchant not found")

    if request.method == 'POST' and 'review_submit' in request.POST:
        from apps.catalog.views import _handle_merchant_review
        _handle_merchant_review(request, merchant)
        return redirect(request.path)

    offers = list(merchant.offers.select_related('variant').order_by('-price_amount'))
    
    # Store proof video shorts
    from apps.media_hub.models import Short
    store_shorts = []
    try:
        store_shorts = list(Short.objects.filter(
            merchant=merchant, moderation_state__in=['approved', 'APPROVED']
        ))
        if not store_shorts and merchant.name:
            first_word = merchant.name.split()[0].strip()
            if len(first_word) > 2:
                store_shorts = list(Short.objects.filter(
                    Q(title__icontains=first_word) |
                    Q(merchant_name__icontains=first_word)
                )[:2])
    except Exception:
        store_shorts = []

    # Store inventory categories for navigation
    categories = set()
    for o in offers:
        if o.variant and o.variant.category_ref:
            categories.add(o.variant.category_ref)
    
    featured_offers = offers[:4]

    open_now, open_label = merchant.is_open_now()
    context = {
        'merchant': merchant,
        'offers': offers,
        'featured_offers': featured_offers,
        'store_categories': sorted(list(categories)),
        'store_shorts': store_shorts,
        'open_now': open_now,
        'open_label': open_label,
        'reviews': list(merchant.reviews.filter(moderation_state=ReviewModerationChoices.APPROVED)),
        'jsonld': jsonld_script(merchant_jsonld(merchant)),
    }
    return render(request, 'merchants/merchant_detail.html', context)

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

        # Create or update merchant
        canonical_id = f"m_{name.lower().replace(' ', '_')[:20]}"
        market = Market.objects.filter(id=market_id).first() if market_id else None

        merchant, _ = Merchant.objects.get_or_create(
            canonical_id=canonical_id,
            defaults={
                'name': name,
                'whatsapp_number': whatsapp,
                'email': email,
                'stall_identifier': stall,
                'market': market,
                'claim_state': 'claimed',
                'verification_state': 'phone_verified',
                'province': market.province if market else 'Gauteng',
                'address_text': f"{stall}, {market.name if market else 'Direct'}",
            }
        )

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
            except Exception:
                pass

        messages.success(request, f"Congratulations! {name} has been listed. You can now receive WhatsApp referrals.")
        return redirect(f"/merchant/dashboard/?merchantId={merchant.canonical_id}")

    context = {
        'product': product,
        'title': title,
        'markets': markets,
    }
    return render(request, 'merchants/merchant_claim.html', context)

def merchant_dashboard_view(request):
    """
    Modern Merchant Centre OS (v8.1 Part XII)
    5-Tab Workspace: Agent Console, Draft Review, Offers Matrix, Demand Radar, Trust Passport.
    """
    merchant_id = request.GET.get('merchantId', 'm_solar_bros')
    merchant = Merchant.objects.filter(canonical_id=merchant_id).first() or Merchant.objects.first()
    
    offers = list(merchant.offers.select_related('variant').all()) if merchant else []
    drafts = list(merchant.drafts.select_related('product').all()) if merchant else []
    agent_runs = list(merchant.agent_runs.all()[:6]) if merchant else []
    referral_events = list(merchant.referral_events.all()[:12]) if merchant else []

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
        'demands': demands,
        'insights': insights,
        'total_referrals_count': insights.get('total', len(referral_events)) if merchant else 48,
    }
    return render(request, 'merchants/merchant_dashboard.html', context)


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

    if action in ['approved', 'rejected']:
        draft.review_state = action
        draft.save(update_fields=['review_state'])

    color = '#10B981' if draft.review_state == 'approved' else '#EF4444'
    label = '✓ Approved' if draft.review_state == 'approved' else '✕ Rejected'

    return HttpResponse(
        f'<span style="background:{color}; color:#FFFFFF; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem;">{label}</span>'
    )

def merchant_quick_price_view(request, offer_id):
    offer = get_object_or_404(Offer, id=offer_id)
    new_price = request.POST.get('price')
    if new_price:
        try:
            offer.price_amount = float(new_price)
            offer.save(update_fields=['price_amount', 'updated_at'])
        except ValueError:
            pass

    return HttpResponse(f"R {offer.price_amount:,.0f}")
