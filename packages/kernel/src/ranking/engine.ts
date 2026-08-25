import { Offer, ProductVariant } from '@shoppage/contracts';

export interface RankingFeatures {
  relevanceScore: number;       // 0.00 - 1.00
  gtinConfidence: number;       // 0.00 - 1.00
  distanceScore: number;        // 0.00 - 1.00 (1.0 = closest, 0.0 = furthest/unknown)
  freshnessScore: number;       // 1.0 = fresh, 0.5 = confirm_required, 0.0 = expired
  merchantTrustScore: number;   // 0.00 - 1.00 based on Trust Passport
  priceCompleteness: number;    // 1.0 = verified full price, 0.5 = quote required
}

export interface RankingWeights {
  relevanceWeight: number;
  gtinWeight: number;
  distanceWeight: number;
  freshnessWeight: number;
  trustWeight: number;
  priceWeight: number;
}

export const DEFAULT_RANKING_WEIGHTS_V1: RankingWeights = {
  relevanceWeight: 0.35,
  gtinWeight: 0.15,
  distanceWeight: 0.15,
  freshnessWeight: 0.15,
  trustWeight: 0.10,
  priceWeight: 0.10,
};

export interface ScoredOffer {
  offer: Offer;
  variant?: ProductVariant;
  features: RankingFeatures;
  compositeScore: number;
  rank: number;
}

/**
 * Calculates composite ranking score strictly based on deterministic features.
 * Note: Payment and sponsorship NEVER alter this score.
 */
export function calculateCompositeRankScore(
  features: RankingFeatures,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS_V1
): number {
  const score =
    features.relevanceScore * weights.relevanceWeight +
    features.gtinConfidence * weights.gtinWeight +
    features.distanceScore * weights.distanceWeight +
    features.freshnessScore * weights.freshnessWeight +
    features.merchantTrustScore * weights.trustWeight +
    features.priceCompleteness * weights.priceWeight;

  return Number(score.toFixed(4));
}

/**
 * Ranks an array of candidate offers deterministically
 */
export function rankCandidateOffers(
  candidates: Array<{ offer: Offer; variant?: ProductVariant; features: RankingFeatures }>,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS_V1
): ScoredOffer[] {
  const scored = candidates.map((item) => ({
    ...item,
    compositeScore: calculateCompositeRankScore(item.features, weights),
    rank: 0,
  }));

  // Sort descending by score; secondary sort by freshness lastConfirmedAt
  scored.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return (
      new Date(b.offer.freshness.lastConfirmedAt).getTime() -
      new Date(a.offer.freshness.lastConfirmedAt).getTime()
    );
  });

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
