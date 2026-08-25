import { ReferralAction, ReferralActionEvent } from '@shoppage/contracts';

/**
 * Action Ledger Event Builder & Deduplication Engine
 */

export function generateDedupeKey(params: {
  sessionFingerprint: string;
  action: ReferralAction;
  merchantRef: string;
  variantRef?: string;
  bucket15Min: number;
}): string {
  const parts = [
    params.sessionFingerprint,
    params.action,
    params.merchantRef,
    params.variantRef || 'none',
    params.bucket15Min.toString(),
  ];
  return parts.join(':');
}

/**
 * Creates an append-only ReferralActionEvent with confidence scoring and attribution
 */
export function buildReferralActionEvent(input: {
  country: string;
  sessionFingerprint: string;
  action: ReferralAction;
  merchantRef: string;
  offerRef?: string;
  variantRef?: string;
  marketRef?: string;
  stallRef?: string;
  sourceCampaign?: string;
  sourceAssetQrId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}): ReferralActionEvent {
  const now = input.timestamp || new Date();
  const bucket15Min = Math.floor(now.getTime() / (1000 * 60 * 15));

  const dedupeKey = generateDedupeKey({
    sessionFingerprint: input.sessionFingerprint,
    action: input.action,
    merchantRef: input.merchantRef,
    variantRef: input.variantRef,
    bucket15Min,
  });

  // Confidence mapping based on action verification strength
  let confidenceScore = 0.5;
  if (input.action === 'whatsapp_start' || input.action === 'call_reveal') {
    confidenceScore = 0.85;
  } else if (input.action === 'quote_submitted' || input.action === 'merchant_responded') {
    confidenceScore = 0.95;
  } else if (input.action === 'buyer_resolved' || input.action === 'purchase_confirmed') {
    confidenceScore = 1.0;
  } else if (input.action === 'outbound_click') {
    confidenceScore = 0.7;
  }

  // Generate standard random UUID for event id
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    eventId,
    occurredAt: now.toISOString(),
    country: input.country,
    sessionFingerprint: input.sessionFingerprint,
    sourceCampaign: input.sourceCampaign,
    sourceAssetQrId: input.sourceAssetQrId,
    offerRef: input.offerRef,
    variantRef: input.variantRef,
    merchantRef: input.merchantRef,
    marketRef: input.marketRef,
    stallRef: input.stallRef,
    action: input.action,
    confidenceScore,
    dedupeKey,
    metadata: input.metadata,
  };
}
