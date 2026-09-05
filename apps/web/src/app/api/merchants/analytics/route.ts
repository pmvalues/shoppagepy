import { NextRequest, NextResponse } from 'next/server';
import { getLeadsByMerchant } from '@/server/referral-lead-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Merchant referral analytics (/api/merchants/analytics).
 *
 * The commercial value proposition for merchant SaaS: real funnel metrics from
 * the referral ledger — leads, response rate, resolution rate, average time to
 * respond, and action mix. This is what makes the R199/mo tier worth paying.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId query param required' }, { status: 400 });
  }

  const leads = getLeadsByMerchant(merchantId);
  const total = leads.length;
  const responded = leads.filter((l) => ['responded', 'resolved'].includes(l.status)).length;
  const resolved = leads.filter((l) => l.status === 'resolved').length;
  const lost = leads.filter((l) => l.status === 'lost').length;
  const newCount = leads.filter((l) => l.status === 'new').length;

  const actionMix: Record<string, number> = {};
  for (const l of leads) {
    actionMix[l.intentAction] = (actionMix[l.intentAction] || 0) + 1;
  }

  // Median time to first status change (responded/resolved) in minutes.
  const responseTimes: number[] = [];
  for (const l of leads) {
    if (l.updatedAt && l.updatedAt !== l.createdAt) {
      const ms = new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime();
      if (ms > 0) responseTimes.push(ms / 60000);
    }
  }
  responseTimes.sort((a, b) => a - b);
  const medianResponseMin = responseTimes.length
    ? responseTimes[Math.floor(responseTimes.length / 2)]
    : null;

  return NextResponse.json({
    success: true,
    merchantId,
    total,
    newCount,
    responded,
    resolved,
    lost,
    responseRate: total ? Math.round((responded / total) * 100) : 0,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    medianResponseMin: medianResponseMin !== null ? Math.round(medianResponseMin) : null,
    actionMix,
  });
}
