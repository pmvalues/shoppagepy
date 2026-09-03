import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get('q') || '').toString().slice(0, 200);
    if (!q.trim()) {
      return NextResponse.json({ query: '', overview: '', products: [], merchants: [], totalProducts: 0, totalMerchants: 0 });
    }
    const result = await semanticSearch(q, { limit: 8 });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[search] error', err);
    return NextResponse.json({ error: 'Search unavailable' }, { status: 500 });
  }
}
