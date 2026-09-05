import { NextRequest, NextResponse } from 'next/server';
import { MasterProductStore, SA_CANONICAL_PRODUCTS } from '@shoppage/kernel';
import { rateLimit, clientIp } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public Products Search & Catalog API Endpoint (/api/v1/products)
 * Queries 1,005,190 master products and canonical South African trade items.
 */
export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit('products:' + ip, 120, 60_000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // If a query, category or brand is provided, search through MasterProductStore (FTS5 + memory)
    if (query || category || brand) {
      const result = MasterProductStore.searchProducts({
        query,
        category,
        brand,
        limit,
        offset,
      });

      let items = result.items;
      if (status) {
        items = items.filter((p) => p.status === status);
      }

      return NextResponse.json({
        success: true,
        query: query || null,
        category: category || null,
        brand: brand || null,
        totalCount: result.total,
        limit,
        offset,
        products: items,
      });
    }

    // Default: Return flagship canonical products with pagination
    let filtered = [...SA_CANONICAL_PRODUCTS];
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const paged = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      query: null,
      category: null,
      brand: null,
      totalCount: filtered.length,
      limit,
      offset,
      products: paged,
    });
  } catch (error) {
    console.error('[API] /api/v1/products error:', error);
    return NextResponse.json(
      { error: 'Failed to search products', message: String(error) },
      { status: 500 }
    );
  }
}

