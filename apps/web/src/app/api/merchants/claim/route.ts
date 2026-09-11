import { NextRequest, NextResponse } from 'next/server';
import { PayloadMerchantCmsService } from '@/cms';
import { rateLimit, clientIp } from '@/server/rate-limit';
import {
  generateMerchantCredential,
  hasStoredCredential,
  storeMerchantCredential,
} from '@/server/merchant-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Merchant claim / onboarding endpoint (/api/merchants/claim).
 *
 * Creates or claims a merchant document in the CMS store and provisions a
 * dashboard credential. The credential is scrypt-hashed at rest and shown to
 * the caller exactly once. When the platform operator already configured
 * SHOPPAGE_MERCHANT_SECRET_<STORE_ID>, that credential stays authoritative and
 * no new credential is issued.
 */

function merchantSecretKeyFor(storeId: string): string {
  return 'SHOPPAGE_MERCHANT_SECRET_' + storeId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

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
    const requestedMerchantId = String(body?.merchantId || '').trim();
    const stallIdentifier = body?.stallNumber ? String(body.stallNumber) : undefined;

    if (!name || !whatsapp || !address) {
      return NextResponse.json(
        { error: 'businessName, whatsappPhone and streetAddress are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let doc: ReturnType<typeof PayloadMerchantCmsService.upsertMerchant>;

    if (requestedMerchantId) {
      const existing = PayloadMerchantCmsService.getMerchant(requestedMerchantId);
      if (!existing) {
        return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
      }

      const configuredSecret = (process.env[merchantSecretKeyFor(requestedMerchantId)] || '').trim();
      if (configuredSecret || hasStoredCredential(requestedMerchantId)) {
        return NextResponse.json(
          { error: 'Merchant already claimed. Contact the platform operator to reset credentials.' },
          { status: 409 }
        );
      }

      doc = PayloadMerchantCmsService.upsertMerchant({
        ...existing,
        name,
        legalName: existing.legalName || name,
        category: category || existing.category,
        addressText: address,
        contacts: {
          ...existing.contacts,
          telephone: whatsapp.replace(/[^0-9+]/g, ''),
          whatsapp: whatsapp.replace(/[^0-9+]/g, ''),
          email: email || existing.contacts?.email || '',
        },
        stallIdentifier: stallIdentifier || existing.stallIdentifier,
        updatedAt: now,
      });
    } else {
      const id =
        'loc_' +
        name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) +
        '_' +
        Date.now().toString(36).slice(-4);

      doc = PayloadMerchantCmsService.upsertMerchant({
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
    }

    if ((process.env[merchantSecretKeyFor(doc.id)] || '').trim()) {
      return NextResponse.json(
        {
          success: true,
          merchant: { id: doc.id, name: doc.name },
          credentialIssued: false,
          loginHint: 'Credentials for this store are managed by the platform operator.',
        },
        { status: 201 }
      );
    }

    const credential = generateMerchantCredential();
    const stored = credential ? storeMerchantCredential(doc.id, credential) : false;

    return NextResponse.json(
      {
        success: true,
        merchant: { id: doc.id, name: doc.name },
        credentialIssued: stored,
        credential: stored ? credential : undefined,
        loginHint: stored
          ? 'Store this credential now — it will not be shown again.'
          : 'Automatic credential provisioning is unavailable. Contact the platform operator.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to provision merchant', message: String(error?.message || error) },
      { status: 500 }
    );
  }
}
