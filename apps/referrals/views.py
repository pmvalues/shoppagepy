import contextlib
import hashlib
import urllib.parse
import uuid

from apps.catalog.models import MasterProduct
from apps.offers.models import Offer
from django.contrib import messages
from django.http import Http404, HttpResponseRedirect, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from .models import ReferralActionChoices, ReferralEvent


@require_POST
def merchant_follow_toggle_view(request, canonical_id):
    """LinkedIn-style follow: session-keyed, toggle on/off."""
    from apps.merchants.models import Follow, Merchant

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if not merchant:
        return JsonResponse({'error': 'not found'}, status=404)
    if not request.session.session_key:
        request.session['anon_marker'] = '1'
        request.session.save()
    follower_key = f"sess_{request.session.session_key}"
    existing = Follow.objects.filter(merchant=merchant, follower_key=follower_key).first()
    if existing:
        existing.delete()
        following = False
    else:
        Follow.objects.create(merchant=merchant, follower_key=follower_key)
        following = True
    return JsonResponse({
        'following': following,
        'followers': merchant.followers.count(),
    })


@require_POST
def affiliate_register_view(request):
    """Register a creator affiliate and open their link generator."""
    from decimal import Decimal, InvalidOperation

    from .models import Affiliate

    handle = (request.POST.get('handle') or '').strip().lower()
    name = (request.POST.get('name') or '').strip()
    if not handle or not name:
        messages.error(request, 'Handle and name are required.')
        return redirect('/affiliate/')
    cleaned = handle.replace(' ', '_')[:60]
    if Affiliate.objects.filter(handle=cleaned).exists():
        messages.error(request, 'That handle is taken — try another.')
        return redirect('/affiliate/')
    try:
        rate = Decimal(request.POST.get('commission_rate') or '5.00')
        rate = min(max(rate, Decimal('1.00')), Decimal('30.00'))
    except (InvalidOperation, TypeError, ValueError):
        rate = Decimal('5.00')
    aff = Affiliate.objects.create(
        canonical_id=f'aff_{cleaned}_{int(timezone.now().timestamp())}',
        handle=cleaned,
        name=name[:150],
        contact=(request.POST.get('contact') or '').strip()[:255],
        commission_rate=rate,
    )
    messages.success(request, f'Welcome @{aff.handle} — your link generator is ready.')
    return redirect(f'/affiliate/{aff.handle}/')


def affiliate_landing_view(request):
    """TikTok-Shop-style creator marketplace: explain, register, leaderboard."""
    from django.db.models import Count, Sum

    from .models import Affiliate

    top = list(
        Affiliate.objects.filter(active=True)
        .annotate(events_total=Count('events'), earnings_total=Sum('events__commission_earned'))
        .order_by('-earnings_total')[:10]
    )
    context = {
        'top_affiliates': top,
    }
    return render(request, 'referrals/affiliate_page.html', context)


def affiliate_profile_view(request, handle):
    """Affiliate dashboard: earnings, attributed events, and their link generator."""
    from django.db.models import Count, Sum

    from apps.catalog.models import MasterProduct

    from .models import Affiliate

    aff = Affiliate.objects.filter(handle=handle, active=True).first()
    if not aff:
        raise Http404('Affiliate not found')
    events = aff.events.order_by('-occurred_at')[:25]
    totals = aff.events.aggregate(
        handoffs=Count('id'),
        earnings=Sum('commission_earned'),
    )
    products = list(MasterProduct.objects.filter(status__in=['active', 'ACTIVE']).order_by('-compatibility_edge_count')[:40])
    context = {
        'affiliate': aff,
        'events': events,
        'total_handoffs': totals['handoffs'] or 0,
        'total_earnings': totals['earnings'] or 0,
        'products': products,
        'site_url': request.build_absolute_uri('/'),
    }
    return render(request, 'referrals/affiliate_profile.html', context)


def build_whatsapp_action_link(whatsapp_number: str, product_title: str, price: float, currency: str, merchant_name: str, referral_id: str, stall_ref: str | None = None) -> str:
    clean_phone = "".join(ch for ch in whatsapp_number if ch.isdigit())
    if clean_phone.startswith('0'):
        clean_phone = '27' + clean_phone[1:]

    stall_part = f" at {stall_ref}" if stall_ref else ""
    message = (
        f"Hi {merchant_name}! I saw {product_title} on Shoppage for {currency} {price:,.2f}{stall_part}. "
        f"Is this currently in stock? (Ref: {referral_id})"
    )
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{clean_phone}?text={encoded_message}"

def universal_link_resolver(request, universal_id):
    """
    Universal Link Resolver Endpoint (/l/<universal_id>/).
    Matches Offer or MasterProduct, logs referral event in database,
    and performs fast 302 redirect directly to WhatsApp or merchant destination URL.
    """
    source_campaign = request.GET.get('utm_campaign')
    source_qr_id = request.GET.get('qr_id')
    aff_handle = (request.GET.get('aff') or '').strip().lower()
    user_agent = request.META.get('HTTP_USER_AGENT', 'unknown_client')
    ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')

    # 1. Try to find Offer
    offer = Offer.objects.filter(canonical_id=universal_id).select_related('variant', 'merchant', 'merchant__market').first()
    variant = None
    merchant = None

    if offer:
        variant = offer.variant
        merchant = offer.merchant
    else:
        # Fallback to MasterProduct
        variant = MasterProduct.objects.filter(canonical_id=universal_id).first()
        if variant:
            offer = variant.offers.first()
            if offer:
                merchant = offer.merchant

    if not variant and not offer:
        return redirect('/search/?not_found=1')

    # Compute deduplication key (ip + universal_id + 5-minute bucket)
    time_bucket = int(timezone.now().timestamp() // 300)
    raw_dedupe = f"{ip_address}_{universal_id}_{time_bucket}"
    dedupe_key = hashlib.sha256(raw_dedupe.encode('utf-8')).hexdigest()[:32]

    # Log referral event
    event_id = uuid.uuid4()
    action = ReferralActionChoices.WHATSAPP_START if offer and offer.destination_type == 'merchant_whatsapp' else ReferralActionChoices.OUTBOUND_CLICK

    affiliate = None
    commission_earned = None
    if aff_handle:
        from decimal import Decimal

        from .models import Affiliate

        affiliate = Affiliate.objects.filter(handle=aff_handle, active=True).first()
        if affiliate and offer and offer.price_amount:
            # Commission accrues on a genuine handoff (WhatsApp start / website ack),
            # once per visitor+offer bucket via the dedupe key.
            handoff_actions = (
                ReferralActionChoices.WHATSAPP_START,
                ReferralActionChoices.OUTBOUND_CLICK,
            )
            if action in handoff_actions:
                already = ReferralEvent.objects.filter(affiliate=affiliate, variant=variant, dedupe_key=dedupe_key).exists()
                if not already:
                    commission_earned = (offer.price_amount * affiliate.commission_rate / Decimal('100')).quantize(Decimal('0.01'))

    with contextlib.suppress(Exception):
        ReferralEvent.objects.create(
            event_id=event_id,
            country_code='ZA',
            session_fingerprint=user_agent[:250],
            source_campaign=source_campaign,
            source_asset_qr_id=source_qr_id,
            offer=offer,
            variant=variant,
            merchant=merchant,
            market=merchant.market if merchant else None,
            stall_ref=offer.stall_ref if offer else None,
            affiliate=affiliate,
            commission_earned=commission_earned,
            action=action,
            dedupe_key=dedupe_key,
            payload={
                'requested_url': request.build_absolute_uri(),
                'ip': ip_address,
            }
        )

    # WhatsApp redirect
    if offer and offer.destination_type == 'merchant_whatsapp' and merchant and merchant.whatsapp_number:
        wa_url = build_whatsapp_action_link(
            whatsapp_number=merchant.whatsapp_number,
            product_title=variant.title if variant else 'Product',
            price=float(offer.price_amount or 0),
            currency=offer.currency,
            merchant_name=merchant.name,
            referral_id=str(event_id)[:8],
            stall_ref=offer.stall_ref
        )
        response = HttpResponseRedirect(wa_url)
        response['X-Shoppage-Event-Id'] = str(event_id)
        response['Cache-Control'] = 'no-store, must-revalidate'
        return response

    # Destination URL redirect
    if offer and offer.destination_url:
        response = HttpResponseRedirect(offer.destination_url)
        response['X-Shoppage-Event-Id'] = str(event_id)
        response['Cache-Control'] = 'no-store, must-revalidate'
        return response

    # Fallback to product detail page
    return redirect(f"/p/{variant.canonical_id}/" if variant else "/")
