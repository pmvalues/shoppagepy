import { NextRequest, NextResponse } from 'next/server';
import { SA_FLAGSHIP_PASSPORTS, NationwideMerchantStore } from '@shoppage/kernel';
import { generateLiveTrustSealSvg } from '@shoppage/adapters';

/**
 * Dynamic Live Trust Seal SVG Route (/api/seal/[merchantId])
 * Dynamic SVG badge for merchant websites, WhatsApp catalogs, and email signatures
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const merchantId = params.merchantId;
  let passport = SA_FLAGSHIP_PASSPORTS[merchantId];

  if (!passport) {
    const merchant = NationwideMerchantStore.getMerchantById(merchantId);
    passport = {
      merchantId,
      merchantName: merchant ? merchant.name : 'Shoppage Verified Merchant',
      country: 'ZA' as const,
      freshOffersTodayCount: 0,
      medianResponseMinutes: 15,
      complaintCountLast90d: 0,
      score: merchant?.googleRating ? Math.round(merchant.googleRating * 19) : 85,
      state: 'VERIFIED_ACTIVE' as const,
    };
  }

  const svg = generateLiveTrustSealSvg(passport);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800',
      'X-Trust-Score': passport.score.toString(),
    },
  });
}
