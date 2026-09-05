import { NextRequest, NextResponse } from 'next/server';
import { buildReferralActionEvent } from '@shoppage/kernel';
import { SA_FLAGSHIP_OFFERS, SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_MERCHANTS } from '@shoppage/kernel';
import { buildWhatsAppActionLink } from '@shoppage/adapters';
import { resolveExternalProduct } from '@/lib/external_discovery';
import { appendReferralEvent } from '@/server/action-ledger';


/**
 * Universal Link Resolver Endpoint (/l/[universalId])
 * Isolated route group with sub-150ms TTFB budget and action logging
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ universalId: string }> }
) {
  const resolvedParams = await params;
  const universalId = resolvedParams.universalId;
  const searchParams = request.nextUrl.searchParams;
  const sourceCampaign = searchParams.get('utm_campaign') || undefined;
  const sourceAssetQrId = searchParams.get('qr_id') || undefined;
  const sessionFingerprint = request.headers.get('user-agent') || 'anonymous_client';

  // Lookup offer by universalId (or fallback to variant)
  let offer = SA_FLAGSHIP_OFFERS.find((o) => o.id === universalId);
  let variant = SA_CANONICAL_PRODUCTS.find((p) => p.canonicalId === universalId || p.canonicalId === offer?.variantRef);

  if (!offer && !variant) {
    // Check external discovery resolution
    const extMatch = resolveExternalProduct(universalId);
    if (extMatch) {
      offer = extMatch.offer;
      variant = extMatch.product;
    }
  }

  if (!offer && !variant) {
    return NextResponse.redirect(new URL('/search?not_found=1', request.url));
  }

  const merchant = SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer?.merchantRef);
  const merchantRef = merchant?.id || offer?.merchantRef || 'unknown_merchant';

  // 1. Emit Action Ledger Event (referral / intent logging) — persisted now.
  const referralEvent = buildReferralActionEvent({
    country: 'ZA',
    sessionFingerprint,
    action: offer?.destinationType === 'merchant_whatsapp' ? 'whatsapp_start' : 'outbound_click',
    merchantRef,
    offerRef: offer?.id,
    variantRef: variant?.canonicalId,
    marketRef: offer?.marketRef,
    stallRef: offer?.stallRef,
    sourceCampaign,
    sourceAssetQrId,
  });

  // Persist synchronously to the append-only ledger (SQLite + NDJSON).
  appendReferralEvent(referralEvent);

  // 2. Select the most specific valid destination
  if (offer) {
    if (offer.actionTarget?.type === 'whatsapp' && offer.actionTarget?.whatsappNumber) {
      const waLink = buildWhatsAppActionLink({
        whatsappNumber: offer.actionTarget.whatsappNumber,
        productTitle: variant?.title || 'Product on Shoppage',
        price: offer.price.amount,
        currency: offer.price.currency,
        merchantName: merchant?.name || 'Seller',
        sourceReferralId: referralEvent.eventId,
        universalLinkUrl: request.url,
      });

      return NextResponse.redirect(waLink, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Shoppage-Event-Id': referralEvent.eventId,
        },
      });
    }

    if (offer.actionTarget?.type === 'url' && offer.actionTarget?.destinationUrl) {
      return NextResponse.redirect(offer.actionTarget.destinationUrl, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Shoppage-Event-Id': referralEvent.eventId,
        },
      });
    }
  }

  // 3. Fallback: Redirect to canonical Frontstore product comparison page
  const canonicalUrl = new URL(`/p/${variant?.canonicalId || universalId}`, request.url);
  return NextResponse.redirect(canonicalUrl);
}
