import { NextRequest, NextResponse } from 'next/server';
import { ReferralActionLogSchema } from '@shoppage/contracts';
import { buildReferralActionEvent } from '@shoppage/kernel';

/**
 * Public Referral Action Logging API Endpoint (/api/v1/referrals)
 */
export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
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
