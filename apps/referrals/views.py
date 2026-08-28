import contextlib
import hashlib
import urllib.parse
import uuid

from apps.catalog.models import MasterProduct
from apps.offers.models import Offer
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.utils import timezone

from .models import ReferralActionChoices, ReferralEvent


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
