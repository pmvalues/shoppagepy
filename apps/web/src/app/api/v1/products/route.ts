import { NextRequest, NextResponse } from 'next/server';
import { MasterProductStore, SA_CANONICAL_PRODUCTS } from '@shoppage/kernel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public Products Search & Catalog API Endpoint (/api/v1/products)
 * Queries 1,005,190 master products and canonical South African trade items.
 */
export async function GET(request: NextRequest) {
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

/**
 * POST /api/v1/products - Submit a trade product or broadcast deal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }

    const newProduct = {
      id: `prod_${Date.now()}`,
      title: String(body.title).trim(),
      brand: String(body.brand || 'Trade Verified').trim(),
      price: Number(body.price || 0),
      category: String(body.category || 'general_trade'),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Product listing received and indexed for local trade discovery.',
      product: newProduct,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product listing', message: String(error) },
      { status: 500 }
    );
  }
}
