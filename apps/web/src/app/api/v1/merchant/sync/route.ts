import { NextRequest, NextResponse } from 'next/server';
import { ProductVariant, Offer } from '@shoppage/contracts';
import { scoreVariantMatch, validateGtin } from '@shoppage/kernel';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';
import { rateLimit, clientIp } from '@/server/rate-limit';

export interface VendorSyncItemInput {
  merchantSku?: string;
  rawTitle: string;
  barcodeGtin?: string;
  price: number;
  currency?: string;
  stockState: 'in_stock' | 'out_of_stock' | 'quote_required';
  brand?: string;
  model?: string;
}

export interface VendorSyncPayload {
  merchantId: string;
  syncSource: 'csv_upload' | 'shopify_webhook' | 'woocommerce_plugin' | 'pos_api' | 'snap_extract';
  items: VendorSyncItemInput[];
}

/**
 * Multi-Vendor Product Sync Endpoint (/api/v1/merchant/sync)
 * Resolves incoming vendor SKUs to the Canonical Master Product Graph
 * and creates or updates merchant-specific Offer records.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit('sync:' + ip, 60, 60_000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  try {
    const body = (await request.json()) as VendorSyncPayload;

    if (!body.merchantId || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid payload: merchantId and items array are required' },
        { status: 400 }
      );
    }

    const syncResults = body.items.map((item) => {
      let matchedVariant: ProductVariant | undefined;
      let matchMethod = 'none';
      let confidence = 0.0;

      // 1. Primary Resolution: Exact GS1 GTIN Barcode Match
      if (item.barcodeGtin) {
        const gtinValidation = validateGtin(item.barcodeGtin);
        if (gtinValidation.isValid) {
          matchedVariant = SA_CANONICAL_PRODUCTS.find(
            (p) =>
              p.identifiers.gtin13 === item.barcodeGtin ||
              p.identifiers.gtin14 === gtinValidation.normalizedGtin14
          );
          if (matchedVariant) {
            matchMethod = 'exact_gtin';
            confidence = 1.0;
          }
        }
      }

      // 2. Secondary Resolution: Fuzzy Token & Brand Match
      if (!matchedVariant) {
        let highestConfidence = 0.0;
        for (const variant of SA_CANONICAL_PRODUCTS) {
          const score = scoreVariantMatch(item.rawTitle, variant.title, item.brand, item.model);
          if (score.confidence > highestConfidence && score.confidence >= 0.65) {
            highestConfidence = score.confidence;
            matchedVariant = variant;
            matchMethod = 'fuzzy_token';
            confidence = score.confidence;
          }
        }
      }

      // 3. Create or attach Offer to Canonical Product
      const offerId = `off_${body.merchantId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const offerRecord: Partial<Offer> = {
        id: offerId,
        variantRef: matchedVariant ? matchedVariant.canonicalId : 'unmapped_draft',
        merchantRef: body.merchantId,
        destinationType: 'merchant_whatsapp',
        price: {
          amount: item.price,
          currency: (item.currency as any) || 'ZAR',
          sourceTimestamp: new Date().toISOString(),
        },
        availabilityState: item.stockState === 'in_stock' ? 'fresh' : 'out_of_stock',
        updateType: 'stock_confirmed',
        freshness: {
          slaClass: 'retail_72h',
          expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          lastConfirmedAt: new Date().toISOString(),
        },
      };

      return {
        merchantSku: item.merchantSku,
        rawTitle: item.rawTitle,
        price: item.price,
        resolvedCanonicalVariantId: matchedVariant?.canonicalId || null,
        resolvedCanonicalTitle: matchedVariant?.title || null,
        matchMethod,
        matchConfidence: confidence,
        offerId,
        status: matchedVariant ? 'attached_to_canonical' : 'queued_for_enrichment',
      };
    });

    const mappedCount = syncResults.filter((r) => r.status === 'attached_to_canonical').length;
    const queuedCount = syncResults.filter((r) => r.status === 'queued_for_enrichment').length;

    return NextResponse.json({
      success: true,
      merchantId: body.merchantId,
      totalSynced: body.items.length,
      mappedToCanonicalCount: mappedCount,
      queuedForReviewCount: queuedCount,
      syncResults,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process multi-vendor product sync', message: String(error) },
      { status: 500 }
    );
  }
}

