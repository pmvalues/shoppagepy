import json
import logging
from decimal import Decimal, InvalidOperation
from typing import Any

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

    # GMB-grade engagement surfaces (moderated, never fabricated).
    approved_reviews = list(merchant.reviews.filter(state='approved').order_by('-created_at')[:20])
    pending_reviews_count = merchant.reviews.filter(state='pending').count()
    approved_questions = list(merchant.questions.filter(state='approved').order_by('-created_at')[:20])
    approved_photos = list(merchant.photos.filter(state='approved').order_by('-created_at')[:24])
    active_posts = list(merchant.posts.filter(active=True).order_by('-created_at')[:10])
    is_owner = bool(
        request.user.is_authenticated
        and (request.user.is_staff or request.user.owned_merchants.filter(id=merchant.id).exists())
    )
    is_following = False
    if request.session.session_key:
        is_following = merchant.followers.filter(follower_key=f"sess_{request.session.session_key}").exists()
    followers_count = merchant.followers.count()

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
        'approved_reviews': approved_reviews,
        'pending_reviews_count': pending_reviews_count,
        'approved_questions': approved_questions,
        'approved_photos': approved_photos,
        'active_posts': active_posts,
        'is_owner': is_owner,
        'is_following': is_following,
        'followers_count': followers_count,
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

    offers = list(merchant.offers.select_related('variant').prefetch_related('variant__images').order_by('-price_amount')[:100])
    drafts = list(merchant.drafts.select_related('product').order_by('-created_at')[:25])
    agent_runs = list(merchant.agent_runs.order_by('-created_at')[:6])
    referral_events = list(merchant.referral_events.order_by('-created_at')[:12])

    # Feeds & Syndication diagnostics (Merchant-Center-grade quality report).
    from apps.core.seo import site_url

    feed_states = (
        AvailabilityStateChoices.FRESH,
        AvailabilityStateChoices.CONFIRM_REQUIRED,
        AvailabilityStateChoices.QUOTE_REQUIRED,
    )
    feed_offers = list(
        merchant.offers.select_related('variant').prefetch_related('variant__images')
        .filter(availability_state__in=feed_states, price_amount__isnull=False)
    )
    variants = {o.variant_id: o.variant for o in feed_offers}
    cover = list(variants.values())
    with_image = sum(1 for v in cover if v.images.all())
    with_gtin = sum(1 for v in cover if v.gtin_pairs)
    with_identifier = sum(1 for v in cover if v.gtin_pairs or (v.brand and v.mpn))
    no_price = merchant.offers.filter(price_amount__isnull=True).count()

    feed_risks = []
    if cover and with_image < len(cover):
        feed_risks.append(f'{len(cover) - with_image} product(s) without photos')
    if cover and with_identifier < len(cover):
        feed_risks.append(f'{len(cover) - with_identifier} product(s) without a valid identifier (GTIN or brand + MPN)')
    if no_price:
        feed_risks.append(f'{no_price} un-priced offer(s) excluded from the feed')
    if not cover:
        feed_risks.append('No priced offers yet — confirm prices to populate the feed.')

    # ---- GMC-grade Performance: clicks & leads per product (last 30 days) ----
    from apps.core.models import SearchClick
    from apps.offers.models import Promotion
    from apps.referrals.models import ReferralEvent
    from django.db.models import Count

    since30 = timezone.now() - timezone.timedelta(days=30)
    catalog_pk_strings = [
        str(pk) for pk in merchant.offers.exclude(variant__isnull=True).values_list('variant_id', flat=True)
    ]
    clicks_by_product: dict[str, int] = {}
    query_rows: list[tuple[str, int]] = []
    if catalog_pk_strings:
        click_rows = list(
            SearchClick.objects.filter(product_id__in=catalog_pk_strings, created_at__gte=since30)
            .values('product_id').annotate(n=Count('id')).order_by('-n')
        )
        clicks_by_product = {r['product_id']: r['n'] for r in click_rows}
        query_rows = list(
            SearchClick.objects.filter(product_id__in=catalog_pk_strings, created_at__gte=since30)
            .exclude(query='')
            .values('query').annotate(n=Count('id')).order_by('-n')[:8]
            .values_list('query', 'n')
        )
    lead_rows = list(
        ReferralEvent.objects.filter(merchant=merchant, occurred_at__gte=since30)
        .exclude(offer__isnull=True)
        .values('offer__variant_id').annotate(n=Count('id'))
    )
    leads_by_variant: dict[Any, int] = {r['offer__variant_id']: r['n'] for r in lead_rows}

    # Per-item diagnostics & promotion badges (attached to the offer objects).
    active_promos = list(Promotion.objects.filter(merchant=merchant, state='active').select_related('variant'))
    promo_by_variant = {p.variant_id: p for p in active_promos}
    for o in offers:
        v = o.variant
        o.diag_image = bool(v and v.images.all())
        o.diag_gtin = bool(v and v.gtin_pairs)
        o.diag_identifier = o.diag_gtin or bool(v and v.brand and v.mpn)
        o.diag_needs_attention = not o.diag_image or not o.diag_identifier or o.is_expired
        o.diag_promo = promo_by_variant[o.variant_id].discount_label if o.variant_id in promo_by_variant else ''
        o.diag_clicks = clicks_by_product.get(str(o.variant_id), 0)
        o.diag_leads = leads_by_variant.get(o.variant_id, 0)

    top_products = sorted(
        (o for o in offers if (o.diag_clicks or o.diag_leads)),
        key=lambda o: -(o.diag_clicks + o.diag_leads),
    )[:8]
    perf_totals = {
        'clicks': sum(clicks_by_product.values()),
        'leads': sum(leads_by_variant.values()),
        'top_product': top_products[0].variant.title if top_products else None,
        'top_query': query_rows[0][0] if query_rows else None,
    }

    # ---- Catalog health: crawl-ledger roll-up for this merchant ----
    from apps.offers.services.crawler import health_summary

    catalog_health = health_summary(merchant) if merchant else None

    context = {
        'merchant': merchant,
        'offers': offers,
        'drafts': drafts,
        'agent_runs': agent_runs,
        'referral_events': referral_events,
        'demands': referral_events,
        'total_referrals_count': len(referral_events),
        'feed_url': f'{site_url(request)}/api/feeds/google-merchant-center/{merchant.canonical_id}/',
        'feed_items': len(feed_offers),
        'feed_coverage': len(cover),
        'feed_with_image': with_image,
        'feed_with_gtin': with_gtin,
        'feed_with_identifier': with_identifier,
        'feed_risks': feed_risks,
        'top_queries': [(q, n) for q, n in query_rows],
        'top_products': [
            {
                'title': o.variant.title,
                'canonical_id': o.variant.canonical_id,
                'price': float(o.price_amount) if o.price_amount else 0.0,
                'clicks': o.diag_clicks,
                'leads': o.diag_leads,
            }
            for o in top_products
        ],
        'perf_totals': perf_totals,
        'active_promos': active_promos,
        'catalog_health': catalog_health,
    }
    return render(request, 'merchants/merchant_dashboard.html', context)


@login_required
def merchant_crawl_actions_view(request):
    """Merchant dashboard crawl controls: run web discovery or check next batch.

    Both actions are bounded (max ~5 new URLs / max 2 live checks) so the
    request stays responsive even on the free TinyFish tier.
    """
    merchant_id = request.POST.get('merchantId', '')
    merchant = None
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate
    if merchant is None:
        merchant = request.user.owned_merchants.first()
    if merchant is None:
        return redirect('merchant_claim')

    action = request.POST.get('action', '')
    from apps.offers.services.crawler import crawl_rotation, discover_merchant_urls

    if action == 'discover':
        outcome = discover_merchant_urls(merchant)
        messages.success(
            request,
            f'Discovery scanned {outcome["queries"]} web queries and tracked '
            f'{outcome["found"]} new product URL(s) for health monitoring.',
        )
    elif action == 'check_next':
        outcome = crawl_rotation(limit=2, merchant=merchant, trigger='manual', pacing=0.0)
        messages.success(
            request,
            f'Checked {outcome["attempted"]} URL(s): {outcome["ok"]} ok, '
            f'{outcome["failed"]} failed — the ledger is refreshed.',
        )
    else:
        messages.error(request, 'Unknown crawl action.')
    return redirect(f'/merchant/dashboard/?merchantId={merchant.canonical_id}#health')

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


@login_required
def merchant_settings_view(request):
    """
    GMC-grade business settings: contact/location/hours plus per-merchant
    shipping & tax that the merchant feed uses (g:shipping / g:tax).
    """
    merchant = request.user.owned_merchants.first()
    merchant_id = request.GET.get('merchantId')
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate
    if merchant is None:
        return redirect('merchant_claim')

    if request.method == 'POST':
        updates: dict[str, Any] = {}
        for f in ('name', 'whatsapp_number', 'telephone', 'email', 'website_url',
                  'category', 'address_text', 'province', 'locality', 'postal_code',
                  'stall_identifier', 'storefront_photo_url', 'appointment_url',
                  'operating_hours', 'shipping_service'):
            val = request.POST.get(f, '').strip()
            updates[f] = val or None
        for f in ('shipping_price', 'tax_rate'):
            raw = request.POST.get(f, '').strip()
            try:
                updates[f] = Decimal(raw) if raw else None
            except (InvalidOperation, TypeError, ValueError):
                messages.error(request, f'{f} must be a number — unchanged.')
        hours_raw = request.POST.get('opening_hours_json', '').strip()
        if hours_raw:
            try:
                parsed = json.loads(hours_raw)
                if isinstance(parsed, dict):
                    updates['opening_hours'] = parsed
                else:
                    messages.error(request, 'Opening hours must be a JSON object.')
            except ValueError:
                messages.error(request, 'Opening hours JSON was invalid — hours unchanged.')
        for f, v in updates.items():
            setattr(merchant, f, v)
        merchant.save(update_fields=list(updates.keys()))
        messages.success(request, 'Business settings saved — the merchant feed now uses your shipping & tax.')
        return redirect(f'/merchant/dashboard/?merchantId={merchant.canonical_id}')

    context = {
        'merchant': merchant,
        'promos': list(merchant.promotions.select_related('variant').order_by('-created_at')[:25]),
        'offer_products': list(
            merchant.offers.exclude(variant__isnull=True).select_related('variant').order_by('-price_amount')[:200]
        ),
    }
    return render(request, 'merchants/merchant_settings.html', context)


@login_required
@require_POST
def merchant_promotion_create_view(request):
    """Create an active product promotion; it feeds g:promotion_id and badges product pages."""
    from apps.offers.models import Promotion

    merchant = request.user.owned_merchants.first()
    merchant_id = request.POST.get('merchantId') or request.GET.get('merchantId')
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate
    if merchant is None:
        raise PermissionDenied

    variant = MasterProduct.objects.filter(
        id=request.POST.get('product_id'), status__in=['active', 'ACTIVE']
    ).first()
    if not variant:
        messages.error(request, 'Select a product for the promotion.')
        return redirect(f'/merchant/settings/?merchantId={merchant.canonical_id}')

    try:
        percent = Decimal(request.POST.get('percent_off') or '')
    except InvalidOperation:
        percent = None
    try:
        price_off = Decimal(request.POST.get('price_off') or '')
    except InvalidOperation:
        price_off = None
    if not percent and not price_off:
        messages.error(request, 'Provide either % off or a flat R amount.')
        return redirect(f'/merchant/settings/?merchantId={merchant.canonical_id}')

    try:
        days = max(1, min(365, int(request.POST.get('valid_days') or 14)))
    except ValueError:
        days = 14

    title = (request.POST.get('title') or '').strip() or (
        f'{percent}% off' if percent else f'R {price_off:,.0f} off'
    )
    promo = Promotion.objects.create(
        canonical_id=(
            f"prom_{merchant.canonical_id}_{variant.canonical_id[:8]}"
            f"_{int(timezone.now().timestamp() * 1000) % 1000000}"
        ),
        merchant=merchant,
        variant=variant,
        title=title[:150],
        percent_off=percent,
        price_off=price_off,
        valid_from=timezone.now(),
        valid_until=timezone.now() + timezone.timedelta(days=days),
    )
    messages.success(
        request,
        f'Promotion "{promo.title}" live until {promo.valid_until:%d %b %Y} — badged in the feed and product page.',
    )
    return redirect(f'/merchant/settings/?merchantId={merchant.canonical_id}')


@require_POST
def merchant_review_create_view(request, canonical_id):
    """Public: submit a review for a merchant profile (held for moderation)."""
    from .models import MerchantReview

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if not merchant:
        raise Http404('Merchant not found')
    name = (request.POST.get('author_name') or '').strip()[:150] or 'Anonymous shopper'
    comment = (request.POST.get('comment') or '').strip()
    try:
        rating = int(request.POST.get('rating') or 0)
        if not 1 <= rating <= 5:
            raise ValueError
    except (TypeError, ValueError):
        rating = 0
    if not comment or not rating:
        messages.error(request, 'Please provide a rating (1-5 stars) and your comment.')
        return redirect(f'/m/{merchant.canonical_id}/')
    MerchantReview.objects.create(merchant=merchant, author_name=name, rating=rating, comment=comment)
    messages.success(request, 'Thanks! Your review is queued for verification and will appear shortly.')
    return redirect(f'/m/{merchant.canonical_id}/')


@login_required
@require_POST
def merchant_review_reply_view(request, canonical_id, review_pk):
    """Owner: reply to a review on their own profile."""
    from .models import MerchantReview

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if merchant is None or (
        not request.user.is_staff and (merchant.owner_id is None or merchant.owner_id != request.user.id)
    ):
        raise PermissionDenied
    review = MerchantReview.objects.filter(pk=review_pk, merchant=merchant).first()
    if not review:
        raise Http404('Review not found')
    reply = (request.POST.get('reply_text') or '').strip()
    if reply:
        review.reply_text = reply
        review.replied_at = timezone.now()
        review.save(update_fields=['reply_text', 'replied_at', 'updated_at'])
        messages.success(request, 'Reply published on the profile.')
    return redirect(f'/m/{merchant.canonical_id}/')


@require_POST
def merchant_question_ask_view(request, canonical_id):
    """Public: ask a question on a merchant profile (held for moderation)."""
    from .models import MerchantQuestion

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if not merchant:
        raise Http404('Merchant not found')
    question = (request.POST.get('question') or '').strip()
    if not question:
        messages.error(request, 'Question cannot be empty.')
        return redirect(f'/m/{merchant.canonical_id}/')
    asker = (request.POST.get('asker_name') or '').strip()[:120] or 'Shopper'
    MerchantQuestion.objects.create(merchant=merchant, asker_name=asker, question=question)
    messages.success(request, 'Question submitted — the store owner will answer shortly.')
    return redirect(f'/m/{merchant.canonical_id}/')


@login_required
@require_POST
def merchant_question_answer_view(request, canonical_id, q_pk):
    """Owner: answer a question on their own profile."""
    from .models import MerchantQuestion

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if merchant is None or (
        not request.user.is_staff and (merchant.owner_id is None or merchant.owner_id != request.user.id)
    ):
        raise PermissionDenied
    q = MerchantQuestion.objects.filter(pk=q_pk, merchant=merchant).first()
    if not q:
        raise Http404('Question not found')
    answer = (request.POST.get('answer') or '').strip()
    if answer:
        q.answer = answer
        q.answered_at = timezone.now()
        q.state = 'approved'
        q.save(update_fields=['answer', 'answered_at', 'state', 'updated_at'])
        messages.success(request, 'Answer published.')
    return redirect(f'/m/{merchant.canonical_id}/')


@require_POST
def merchant_photo_add_view(request, canonical_id):
    """Public: contribute a photo URL (held for moderation)."""
    from .models import MerchantPhoto

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if not merchant:
        raise Http404('Merchant not found')
    url = (request.POST.get('image_url') or '').strip()
    if not url.startswith('http://') and not url.startswith('https://'):
        messages.error(request, 'Please provide a valid photo URL (https://...).')
        return redirect(f'/m/{merchant.canonical_id}/')
    MerchantPhoto.objects.create(
        merchant=merchant,
        image_url=url,
        caption=(request.POST.get('caption') or '').strip()[:200],
    )
    messages.success(request, 'Photo submitted — it will appear after moderation.')
    return redirect(f'/m/{merchant.canonical_id}/')


@login_required
@require_POST
def merchant_post_create_view(request, canonical_id):
    """Owner: publish an update or offer on their own profile."""
    from .models import MerchantPost

    merchant = Merchant.objects.filter(canonical_id=canonical_id).first()
    if merchant is None or (
        not request.user.is_staff and (merchant.owner_id is None or merchant.owner_id != request.user.id)
    ):
        raise PermissionDenied
    title = (request.POST.get('title') or '').strip()[:150]
    body = (request.POST.get('body') or '').strip()
    if not title or not body:
        messages.error(request, 'Posts need a title and a body.')
        return redirect(f'/m/{merchant.canonical_id}/')
    MerchantPost.objects.create(
        merchant=merchant,
        kind='offer' if request.POST.get('kind') == 'offer' else 'text',
        title=title,
        body=body,
    )
    messages.success(request, 'Post published on your storefront.')
    return redirect(f'/m/{merchant.canonical_id}/')


@login_required
def campaign_center_view(request):
    """Google-Ads-style campaign center: create, manage and report campaigns."""
    from .models import Campaign

    merchant = request.user.owned_merchants.first()
    merchant_id = request.GET.get('merchantId') or request.POST.get('merchantId')
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate
    if merchant is None:
        return redirect('merchant_claim')

    if request.method == 'POST':
        name = (request.POST.get('name') or '').strip()[:150]
        if not name:
            messages.error(request, 'Campaign name is required.')
            return redirect(f'/merchant/campaigns/?merchantId={merchant.canonical_id}')
        try:
            budget = Decimal(request.POST.get('budget_zar') or '')
        except InvalidOperation:
            budget = None
        try:
            radius = int(request.POST.get('radius_km')) if request.POST.get('radius_km') else None
        except (TypeError, ValueError):
            radius = None
        Campaign.objects.create(
            canonical_id=f'cmp_{merchant.canonical_id[:12]}_{int(timezone.now().timestamp() * 1000) % 1000000}',
            merchant=merchant,
            name=name,
            campaign_type=request.POST.get('campaign_type') or 'hyperlocal',
            status=request.POST.get('status', 'draft') if request.POST.get('status') in ('draft', 'active', 'paused') else 'draft',
            budget_zar=budget,
            target_province=(request.POST.get('target_province') or '').strip()[:100],
            radius_km=radius,
            target_category=(request.POST.get('target_category') or '').strip()[:100],
            headline=(request.POST.get('headline') or '').strip()[:150],
            description=(request.POST.get('description') or '').strip()[:300],
        )
        messages.success(request, 'Campaign created — launch links are ready to copy.')
        return redirect(f'/merchant/campaigns/?merchantId={merchant.canonical_id}')

    campaigns = list(merchant.campaigns.all())
    # Per-campaign UTM attribution report (leads, last 30 days) — guarded so a
    # migration-incomplete environment renders empty instead of failing.
    from apps.referrals.models import ReferralEvent
    from django.db.models import Count

    for c in campaigns:
        c.leads_30 = 0
    try:
        since = timezone.now() - timezone.timedelta(days=30)
        rows = list(
            ReferralEvent.objects.filter(source_campaign__in=[c.canonical_id for c in campaigns], occurred_at__gte=since)
            .values('source_campaign').annotate(leads=Count('id')).order_by('-leads')
        )
        leads_by_campaign = {r['source_campaign']: r['leads'] for r in rows}
        for c in campaigns:
            c.leads_30 = leads_by_campaign.get(c.canonical_id, 0)
    except Exception:
        for c in campaigns:
            c.leads_30 = 0
    offer_links = []
    for o in merchant.offers.select_related('variant').order_by('-price_amount')[:24]:
        offer_links.append({'title': o.variant.title, 'url': f'/l/{o.canonical_id}?utm_campaign='})

    context = {
        'merchant': merchant,
        'campaigns': campaigns,
        'leads_by_campaign': leads_by_campaign,
        'offer_links': offer_links,
    }
    return render(request, 'merchants/campaign_center.html', context)


@login_required
def following_feed_view(request):
    """LinkedIn-style feed: latest posts and offers from followed merchants."""
    if not request.session.session_key:
        request.session['anon_marker'] = '1'
        request.session.save()
    follower_key = f"sess_{request.session.session_key}"
    from .models import Follow, MerchantPost

    followed = list(Follow.objects.filter(follower_key=follower_key).select_related('merchant')[:40])
    followed_merchants = [f.merchant for f in followed]
    feed = []
    if followed_merchants:
        posts = list(
            MerchantPost.objects.filter(merchant__in=followed_merchants, active=True)
            .select_related('merchant').order_by('-created_at')[:30]
        )
        for post in posts:
            feed.append({
                'kind': 'post',
                'created_at': post.created_at,
                'merchant': post.merchant,
                'title': post.title,
                'body': post.body,
                'is_offer': post.kind == 'offer',
            })
        from apps.offers.models import Offer

        latest_offers = list(
            Offer.objects.filter(merchant__in=followed_merchants, availability_state=AvailabilityStateChoices.FRESH)
            .select_related('variant', 'merchant').order_by('-last_confirmed_at')[:20]
        )
        for o in latest_offers:
            feed.append({
                'kind': 'offer',
                'created_at': o.last_confirmed_at,
                'merchant': o.merchant,
                'title': o.variant.title,
                'body': '',
                'price': float(o.price_amount) if o.price_amount else 0.0,
                'canonical_id': o.variant.canonical_id,
                'offer_canonical_id': o.canonical_id,
            })
        feed.sort(key=lambda item: item['created_at'], reverse=True)
        feed = feed[:30]

    suggestions = []
    if not followed_merchants:
        suggestions = list(Merchant.objects.order_by('-trust_score')[:6])

    context = {
        'feed': feed,
        'following_count': len(followed_merchants),
        'suggestions': suggestions,
    }
    return render(request, 'merchants/following_feed.html', context)


@login_required
@require_POST
def campaign_toggle_view(request, campaign_id):
    """Owner: activate / pause / end a campaign."""
    from .models import Campaign

    campaign = Campaign.objects.filter(canonical_id=campaign_id).first()
    if campaign is None or (
        not request.user.is_staff
        and (campaign.merchant.owner_id is None or campaign.merchant.owner_id != request.user.id)
    ):
        raise PermissionDenied
    action = request.POST.get('action', '')
    new_status = {'activate': 'active', 'pause': 'paused', 'draft': 'draft', 'end': 'ended'}.get(action)
    if new_status:
        campaign.status = new_status
        campaign.save(update_fields=['status', 'updated_at'])
        messages.success(request, f'Campaign "{campaign.name}" is now {new_status}.')
    return redirect(f'/merchant/campaigns/?merchantId={campaign.merchant.canonical_id}')


@login_required
def merchant_product_add_view(request):
    """
    Shopify / Google Merchant Center Product Listing Creator:
    Allows merchants to add items from the 1M+ GS1 Master Catalog or create custom listings.
    """
    import re
    import uuid

    merchant_id = request.GET.get('merchantId') or request.POST.get('merchantId')
    merchant = None
    if merchant_id:
        candidate = Merchant.objects.filter(canonical_id=merchant_id).first()
        if candidate and (request.user.is_staff or candidate.owner_id == request.user.id):
            merchant = candidate
    if merchant is None:
        merchant = request.user.owned_merchants.first()
    if merchant is None:
        return redirect('merchant_claim')

    if request.method == 'POST':
        product_id = request.POST.get('product_id', '').strip()
        custom_title = request.POST.get('title', '').strip()
        custom_brand = request.POST.get('brand', '').strip()
        custom_category = request.POST.get('category', 'general').strip()
        custom_model = request.POST.get('model_number', '').strip()
        custom_gtin = request.POST.get('gtin13', '').strip()
        custom_desc = request.POST.get('description', '').strip()
        price_raw = request.POST.get('price', '').strip()
        availability = request.POST.get('availability', 'fresh')
        stall_ref = request.POST.get('stall_ref', merchant.stall_identifier or 'Showroom').strip()

        product = None
        if product_id:
            product = MasterProduct.objects.filter(canonical_id=product_id).first()
            if not product:
                try:
                    product = MasterProduct.objects.filter(id=product_id).first()
                except (ValueError, ValidationError):
                    product = None

        if not product and custom_title:
            slug = re.sub(r'[^a-zA-Z0-9]+', '_', custom_title.lower()).strip('_')[:32]
            canonical_id = f"var_{slug}_{timezone.now().strftime('%m%d%H%M')}_{uuid.uuid4().hex[:4]}"
            product = MasterProduct.objects.create(
                canonical_id=canonical_id,
                title=custom_title,
                brand=custom_brand or merchant.name,
                category_ref=custom_category or 'general',
                model_number=custom_model or None,
                gtin13=custom_gtin if len(custom_gtin) in [8, 12, 13, 14] else None,
                description=custom_desc,
                status='active',
            )

        if product and price_raw:
            try:
                price = float(price_raw)
                ofr_id = f"ofr_{merchant.canonical_id[:16]}_{product.canonical_id[:16]}_{uuid.uuid4().hex[:4]}"
                Offer.objects.create(
                    canonical_id=ofr_id,
                    variant=product,
                    merchant=merchant,
                    price_amount=price,
                    stall_ref=stall_ref,
                    destination_type='merchant_whatsapp',
                    availability_state=availability,
                    last_confirmed_at=timezone.now(),
                    expires_at=timezone.now() + timezone.timedelta(days=30),
                )
                messages.success(request, f"✓ Product '{product.title}' successfully listed in your catalog at R {price:,.2f}!")
                return redirect(f"/merchant/dashboard/?merchantId={merchant.canonical_id}#offers")
            except (ValueError, IntegrityError) as exc:
                logger.warning('Offer create error: %s', exc)
                messages.error(request, f"Error saving offer: {exc}")
        else:
            messages.error(request, "Please provide a valid product title and price in ZAR.")

    # GET request - load popular master catalog products for 1-click pricing
    master_products = list(MasterProduct.objects.filter(status='active').order_by('-created_at')[:40])
    context = {
        'merchant': merchant,
        'master_products': master_products,
    }
    return render(request, 'merchants/merchant_product_add.html', context)

