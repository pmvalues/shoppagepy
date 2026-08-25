import { AvailabilityState, Offer } from '@shoppage/contracts';

/**
 * 15-Minute Freshness State Machine & SLA Controller
 */

export interface FreshnessEvaluation {
  currentState: AvailabilityState;
  nextState: AvailabilityState;
  stateChanged: boolean;
  ageHours: number;
  slaMaxHours: number;
  reason: string;
}

export const SLA_HOURS_MAP: Record<Offer['freshness']['slaClass'], number> = {
  fast_moving_24h: 24,
  retail_72h: 72,
  catalogue_7d: 168, // 7 days * 24h
  service_30d: 720,  // 30 days * 24h
};

/**
 * Evaluates the current state of an offer and returns the next state based on SLA rules
 */
export function evaluateOfferFreshness(
  offer: Offer,
  currentTime: Date = new Date()
): FreshnessEvaluation {
  const lastConfirmed = new Date(offer.freshness.lastConfirmedAt);
  const diffMs = currentTime.getTime() - lastConfirmed.getTime();
  const ageHours = Math.max(0, diffMs / (1000 * 60 * 60));
  const slaMaxHours = SLA_HOURS_MAP[offer.freshness.slaClass] || 72;

  let nextState: AvailabilityState = offer.availabilityState;
  let reason = 'Offer is fresh and within SLA window';

  if (offer.availabilityState === 'hidden' || offer.availabilityState === 'out_of_stock') {
    return {
      currentState: offer.availabilityState,
      nextState: offer.availabilityState,
      stateChanged: false,
      ageHours: Number(ageHours.toFixed(2)),
      slaMaxHours,
      reason: 'Offer in terminal or manual override state',
    };
  }

  if (ageHours > slaMaxHours * 2) {
    nextState = 'expired';
    reason = `Exceeded 2x SLA limit (${slaMaxHours * 2}h). Demoted to expired.`;
  } else if (ageHours > slaMaxHours) {
    nextState = 'confirm_required';
    reason = `Exceeded SLA limit (${slaMaxHours}h). Requires merchant re-confirmation.`;
  } else {
    nextState = 'fresh';
  }

  return {
    currentState: offer.availabilityState,
    nextState,
    stateChanged: nextState !== offer.availabilityState,
    ageHours: Number(ageHours.toFixed(2)),
    slaMaxHours,
    reason,
  };
}

/**
 * Detects suspicious price anomalies relative to category and historical benchmark
 */
export function detectPriceAnomaly(
  proposedPrice: number,
  benchmarkMean: number,
  benchmarkStdDev: number
): { isAnomaly: boolean; severity: 'none' | 'warning' | 'critical'; reason?: string } {
  if (proposedPrice <= 0) {
    return { isAnomaly: true, severity: 'critical', reason: 'Price must be greater than zero' };
  }

  if (benchmarkStdDev <= 0 || benchmarkMean <= 0) {
    return { isAnomaly: false, severity: 'none' };
  }

  const zScore = Math.abs((proposedPrice - benchmarkMean) / benchmarkStdDev);

  if (zScore > 4.0 || proposedPrice < benchmarkMean * 0.1) {
    return {
      isAnomaly: true,
      severity: 'critical',
      reason: `Extreme price deviation (Z-score: ${zScore.toFixed(2)}, >90% deviation from mean). Flagged for review.`,
    };
  }

  if (zScore > 2.5) {
    return {
      isAnomaly: true,
      severity: 'warning',
      reason: `Moderate price deviation (Z-score: ${zScore.toFixed(2)}). Badge set to confirm required.`,
    };
  }

  return { isAnomaly: false, severity: 'none' };
}
