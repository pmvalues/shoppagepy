import { NextRequest, NextResponse } from 'next/server';
import { PayloadMerchantCmsService } from '@/cms';
import { rateLimit, clientIp } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Merchant claim / onboarding endpoint (/api/merchants/claim).
 *
 * Turns the merchant claim wizard into a real provisioning flow: creates a
 * merchant document in the CMS store and returns a credential token (issued
 * from SHOPPAGE_MERCHANT_SECRET_<STORE_ID> if set, otherwise a generated token
 * shown once) plus the merchant id needed for dashboard login.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit('claim:' + ip, 10, 60_000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = String(body?.businessName || '').trim();
    const whatsapp = String(body?.whatsappPhone || '').trim();
    const email = String(body?.email || '').trim();
    const address = String(body?.streetAddress || '').trim();
    const category = String(body?.category || 'wholesale').trim();
    const marketId = body?.marketId ? String(body.marketId) : undefined;
    const stallIdentifier = body?.stallNumber ? String(body.stallNumber) : undefined;

    if (!name || !whatsapp || !address) {
      return NextResponse.json(
        { error: 'businessName, whatsappPhone and streetAddress are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = 'loc_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) + '_' + Date.now().toString(36).slice(-4);

    const doc = PayloadMerchantCmsService.upsertMerchant({
      id,
      name,
      legalName: name,
      category,
      addressText: address,
      province: 'Gauteng',
      googleRating: 0,
      googleReviewsCount: 0,
      operatingHours: 'Mon-Fri 08:30 - 17:00',
      medianResponseMinutes: 10,
      verificationState: 'unverified',
      contacts: {
        telephone: whatsapp.replace(/[^0-9+]/g, ''),
        whatsapp: whatsapp.replace(/[^0-9+]/g, ''),
        email: email,
      },
      stallIdentifier,
      createdAt: now,
      updatedAt: now,
    });

    // Provision a merchant credential if an env secret is set for this store.
    const secretKey = 'SHOPPAGE_MERCHANT_SECRET_' + id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const existingSecret = (process.env[secretKey] || '').trim();
    const credential = existingSecret || 'change_me_' + Math.random().toString(36).slice(2, 12);

    return NextResponse.json({
      success: true,
      merchant: { id: doc.id, name: doc.name },
      credential,
      loginHint: 'Use ' + email + ' or your store id with the credential above.',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to provision merchant', message: String(error?.message || error) },
      { status: 500 }
    );
  }
}
