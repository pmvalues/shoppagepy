import { NextRequest, NextResponse } from 'next/server';
import { NationwideMerchantStore } from '@shoppage/kernel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public Merchants Search & Directory API Endpoint (/api/v1/merchants)
 * Queries 3,109,299 South African verified merchants and trade desks.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const province = searchParams.get('province') || undefined;
    const category = searchParams.get('category') || undefined;
    const marketId = searchParams.get('marketId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const result = NationwideMerchantStore.searchMerchants({
      query,
      province,
      category,
      marketId,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      query: query || null,
      province: province || null,
      category: category || null,
      totalCount: result.total,
      limit,
      offset,
      merchants: result.items,
    });
  } catch (error) {
    console.error('[API] /api/v1/merchants error:', error);
    return NextResponse.json(
      { error: 'Failed to search merchants', message: String(error) },
      { status: 500 }
    );
  }
}
