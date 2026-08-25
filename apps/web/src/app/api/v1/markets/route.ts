import { NextRequest, NextResponse } from 'next/server';
import { SA_FLAGSHIP_MARKETS } from '@shoppage/kernel';

/**
 * Public Markets-in-Markets API Endpoint (/api/v1/markets)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const marketType = searchParams.get('marketType');

  let filtered = [...SA_FLAGSHIP_MARKETS];

  if (province) {
    filtered = filtered.filter((m) => m.province.toLowerCase() === province.toLowerCase());
  }
  if (marketType) {
    filtered = filtered.filter((m) => m.marketType === marketType);
  }

  return NextResponse.json({
    markets: filtered,
    totalCount: filtered.length,
  });
}
