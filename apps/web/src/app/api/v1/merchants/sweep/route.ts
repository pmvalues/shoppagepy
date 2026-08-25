import { NextRequest, NextResponse } from 'next/server';
import {
  NationwideMapsSweeper,
  SA_9_PROVINCES_SWEEP_GRID,
  googlePlaceToMerchant,
} from '@shoppage/kernel';

/**
 * Nationwide Google Maps / Places Sweeper & Ingestion API (/api/v1/merchants/sweep)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const province = searchParams.get('province') || undefined;
  const marketId = searchParams.get('marketId') || undefined;
  const category = searchParams.get('category') || undefined;
  const query = searchParams.get('q') || undefined;

  const merchants = NationwideMapsSweeper.searchMerchants({
    province,
    marketId,
    category,
    query,
  });

  const provinceCounts = NationwideMapsSweeper.getProvinceCounts();

  return NextResponse.json({
    status: 'success',
    country: 'ZA',
    scope: 'Nationwide 9-Provinces Coverage',
    totalSweptCount: merchants.length,
    provinceBreakdown: provinceCounts,
    sweepGridTilesCount: SA_9_PROVINCES_SWEEP_GRID.length,
    merchants,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { places, marketId } = body;

    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload. "places" array required.' },
        { status: 400 }
      );
    }

    const ingested = places.map((place: any) => googlePlaceToMerchant(place, marketId));

    return NextResponse.json({
      status: 'success',
      ingestedCount: ingested.length,
      sampleMerchant: ingested[0]?.merchant,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
