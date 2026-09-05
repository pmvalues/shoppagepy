import { NextRequest, NextResponse } from 'next/server';
import { ReferralActionLogSchema } from '@shoppage/contracts';
import { buildReferralActionEvent } from '@shoppage/kernel';
import { appendReferralEvent } from '@/server/action-ledger';
import { rateLimit, clientIp } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public Referral Action Logging API Endpoint (/api/v1/referrals)
 *
 * Now persists every action to the append-only ledger (SQLite + NDJSON) so the
 * business model's measurement spine (RQNR, merchant response analytics,
 * ranking signals) is real. Previously this returned a success body and
 * discarded the event.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit('referrals:' + ip, 120, 60_000);
    if (rl.limited) {
      return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
    }

    const body = await request.json();
    const parseResult = ReferralActionLogSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid referral log payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const event = buildReferralActionEvent({
      country: parseResult.data.country,
      sessionFingerprint: parseResult.data.sessionFingerprint,
      action: parseResult.data.action,
      merchantRef: parseResult.data.merchantRef,
      offerRef: parseResult.data.offerRef,
      variantRef: parseResult.data.variantRef,
      marketRef: parseResult.data.marketRef,
      stallRef: parseResult.data.stallRef,
      sourceCampaign: parseResult.data.sourceCampaign,
      sourceAssetQrId: parseResult.data.sourceAssetQrId,
      metadata: parseResult.data.metadata,
    });

    const persisted = appendReferralEvent(event);

    return NextResponse.json({
      success: true,
      persisted,
      eventId: event.eventId,
      dedupeKey: event.dedupeKey,
      confidenceScore: event.confidenceScore,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record referral event', message: String(error) },
      { status: 500 }
    );
  }
}
