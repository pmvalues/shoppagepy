import { NextRequest, NextResponse } from 'next/server';
import { LiveDataScraperService } from '@shoppage/kernel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const query = searchParams.get('q') || 'inverter solar south africa';

  try {
    const feed = await LiveDataScraperService.sweepUnifiedFeed(filter);

    return NextResponse.json({
      success: true,
      filter,
      totalItems: feed.length,
      scrapedAt: new Date().toISOString(),
      feed,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scrape live commercial data',
      },
      { status: 500 }
    );
  }
}
