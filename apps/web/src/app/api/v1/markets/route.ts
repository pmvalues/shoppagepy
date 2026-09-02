import { NextRequest, NextResponse } from 'next/server';
import { SA_COMPREHENSIVE_MARKETS, SA_FLAGSHIP_MARKETS } from '@shoppage/kernel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public Markets API Endpoint (/api/v1/markets)
 * Returns South African wholesale markets, trade hubs, and transport commercial interchanges.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim().toLowerCase();
    const province = searchParams.get('province');
    const marketType = searchParams.get('marketType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Combine comprehensive markets with flagship markets (deduplicating by id)
    const marketMap = new Map<string, any>();
    for (const m of SA_FLAGSHIP_MARKETS) {
      marketMap.set(m.id, m);
    }
    for (const m of SA_COMPREHENSIVE_MARKETS) {
      if (!marketMap.has(m.id)) {
        marketMap.set(m.id, {
          id: m.id,
          name: m.name,
          canonicalSlug: m.canonicalSlug || m.id,
          marketType: m.marketType || 'wholesale_market',
          country: 'ZA',
          province: m.province,
          metro: m.metro,
          landmarks: m.landmarks || [],
          safetyNotices: m.safetyNotices || [],
          stallCount: m.zones?.reduce((acc: number, z: any) => acc + (z.stallCount || 0), 0) || 50,
        });
      }
    }

    let allMarkets = Array.from(marketMap.values());

    if (query) {
      allMarkets = allMarkets.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.province.toLowerCase().includes(query) ||
          m.metro?.toLowerCase().includes(query) ||
          m.landmarks?.some((l: string) => l.toLowerCase().includes(query))
      );
    }

    if (province) {
      allMarkets = allMarkets.filter((m) => m.province.toLowerCase() === province.toLowerCase());
    }

    if (marketType) {
      allMarkets = allMarkets.filter((m) => m.marketType === marketType);
    }

    const paged = allMarkets.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      totalCount: allMarkets.length,
      limit,
      offset,
      markets: paged,
    });
  } catch (error) {
    console.error('[API] /api/v1/markets error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve markets', message: String(error) },
      { status: 500 }
    );
  }
}
