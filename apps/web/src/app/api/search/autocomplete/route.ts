import { NextRequest, NextResponse } from 'next/server';
import {
  MasterProductStore,
  NationwideMerchantStore,
  SouthAfricaMallsStore,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);

  if (!q || q.length < 2) {
    return NextResponse.json({
      query: q,
      suggestions: ['Solar Inverters', 'Deye 5kW', 'Lithium Batteries', 'Mitrend Packaging', 'Crown Mines Wholesale'],
      products: [],
      merchants: [],
      malls: [],
      latencyMs: 0,
    });
  }

  try {
    // 1. In-process FTS5 Product Search (Sub-5ms)
    const productResult = MasterProductStore.searchProducts({
      query: q,
      limit: 6,
      offset: 0,
    });

    // 2. Attach lowest confirmed price from offers
    const productsWithPricing = productResult.items.map((p) => {
      const offers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === p.canonicalId);
      const prices = offers.map((o) => o.price.amount).filter((n): n is number => typeof n === 'number');
      const lowestOfferPrice = prices.length ? Math.min(...prices) : undefined;
      const estPrice = (p.attributes?.estimatedPriceZar as number) || lowestOfferPrice || 0;

      return {
        canonicalId: p.canonicalId,
        title: p.title,
        brand: p.brand,
        image: p.media?.gallery?.[0]?.url,
        priceZar: estPrice,
        offersCount: offers.length || 1,
        gtin13: p.identifiers.gtin13,
      };
    });

    // 3. In-process Storefront Search
    const merchantResult = NationwideMerchantStore.searchMerchants({
      query: q,
      limit: 3,
      offset: 0,
    });

    const merchants = merchantResult.items.map((m) => ({
      id: m.id,
      name: m.name,
      suburb: m.addressText?.split(',')?.[0] || 'Johannesburg',
      isVerified: m.verificationState === 'fully_verified',
    }));

    // 4. Geofenced Malls & Commercial Hubs
    let malls: any[] = [];
    try {
      const mallRes = SouthAfricaMallsStore.searchMalls({ query: q, limit: 3 });
      malls = (mallRes?.items || []).map((mall: any) => ({
        id: mall.id || mall.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: mall.name,
        province: mall.province || 'Gauteng',
        storeCount: mall.stallCapacity || mall.storeCount || 120,
      }));
    } catch {
      // Best-effort malls search
    }

    // 5. Query expansion suggestions
    const suggestions = [
      q,
      `${q} inverters`,
      `${q} price south africa`,
      `wholesale ${q}`,
    ].slice(0, 3);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      query: q,
      suggestions,
      products: productsWithPricing,
      merchants,
      malls,
      latencyMs,
    });
  } catch (err) {
    console.error('[autocomplete] error', err);
    return NextResponse.json(
      {
        query: q,
        suggestions: [],
        products: [],
        merchants: [],
        malls: [],
        error: 'Autocomplete unavailable',
      },
      { status: 500 }
    );
  }
}
