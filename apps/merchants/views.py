from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import HttpResponse, JsonResponse, Http404
from .models import Merchant, Draft, AgentRun
from apps.markets.models import Market
from apps.catalog.models import MasterProduct
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

    # Prefer verified stores with physical shopping centres/markets attached first
    flagship_stores = list(merchants_qs.filter(market__isnull=False).select_related('market').order_by('-trust_score', 'name')[:24])
    seen_ids = {m.id for m in flagship_stores}
    
    remaining_count = 48 - len(flagship_stores)
    if remaining_count > 0:
        extra_stores = list(merchants_qs.exclude(id__in=seen_ids).select_related('market').order_by('-trust_score', 'name')[:remaining_count])
        flagship_stores.extend(extra_stores)

    merchants = flagship_stores

    context = {
        'merchants': merchants,
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

    offers = list(merchant.offers.select_related('variant').all())

    context = {
        'merchant': merchant,
        'offers': offers,
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
        'total_referrals_count': len(referral_events) if merchant else 48,
    }
    return render(request, 'merchants/merchant_dashboard.html', context)

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
