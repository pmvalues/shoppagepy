import { SearchQueryInput, ProductVariant, Offer } from '@shoppage/contracts';
import { scoreVariantMatch, calculateCompositeRankScore, DEFAULT_RANKING_WEIGHTS_V1 } from '@shoppage/kernel';

export interface SearchHit {
  variant: ProductVariant;
  offers: Offer[];
  lowestPrice?: number;
  highestPrice?: number;
  currency: string;
  matchedScore: number;
  freshestConfirmedAt?: string;
  availableMerchantsCount: number;
}

export interface SearchResponse {
  hits: SearchHit[];
  totalHits: number;
  zeroResultReason?: string;
  processingTimeMs: number;
}

/**
 * High-Performance In-Memory / Typesense Search Adapter
 */
export class InMemorySearchEngine {
  private variants: Map<string, ProductVariant> = new Map();
  private offersByVariant: Map<string, Offer[]> = new Map();

  public indexVariant(variant: ProductVariant): void {
    this.variants.set(variant.canonicalId, variant);
  }

  public indexOffer(offer: Offer): void {
    const list = this.offersByVariant.get(offer.variantRef) || [];
    list.push(offer);
    this.offersByVariant.set(offer.variantRef, list);
  }

  public search(params: SearchQueryInput): SearchResponse {
    const startTime = performance.now();
    const query = params.query.toLowerCase().trim();
    const hits: SearchHit[] = [];

    for (const variant of this.variants.values()) {
      // Check country scope
      if (params.country && !(variant.countryScope as string[]).includes(params.country)) {
        continue;
      }

      // Check category filter
      if (params.category && variant.categoryRef !== params.category) {
        continue;
      }

      // Check brand filter
      if (params.brand && variant.brand.toLowerCase() !== params.brand.toLowerCase()) {
        continue;
      }

      // Calculate match score
      const match = scoreVariantMatch(query, variant.title, variant.brand, variant.modelNumber);

      // Also check aliases
      let aliasMatched = false;
      for (const alias of variant.aliases) {
        if (alias.phrase.toLowerCase().includes(query) || query.includes(alias.phrase.toLowerCase())) {
          aliasMatched = true;
          break;
        }
      }

      if (match.confidence > 0.3 || aliasMatched) {
        const variantOffers = this.offersByVariant.get(variant.canonicalId) || [];
        const activeOffers = variantOffers.filter(
          (o) => o.availabilityState === 'fresh' || o.availabilityState === 'confirm_required'
        );

        let lowestPrice: number | undefined;
        let highestPrice: number | undefined;
        let freshestConfirmedAt: string | undefined;

        for (const offer of activeOffers) {
          if (offer.price.amount) {
            if (lowestPrice === undefined || offer.price.amount < lowestPrice) {
              lowestPrice = offer.price.amount;
            }
            if (highestPrice === undefined || offer.price.amount > highestPrice) {
              highestPrice = offer.price.amount;
            }
          }
          if (
            !freshestConfirmedAt ||
            new Date(offer.freshness.lastConfirmedAt) > new Date(freshestConfirmedAt)
          ) {
            freshestConfirmedAt = offer.freshness.lastConfirmedAt;
          }
        }

        const features = {
          relevanceScore: match.confidence,
          gtinConfidence: variant.identifiers.gtin13 ? 1.0 : 0.5,
          distanceScore: 0.8,
          freshnessScore: activeOffers.length > 0 ? 1.0 : 0.2,
          merchantTrustScore: 0.85,
          priceCompleteness: lowestPrice !== undefined ? 1.0 : 0.5,
        };

        const matchedScore = calculateCompositeRankScore(features, DEFAULT_RANKING_WEIGHTS_V1);

        hits.push({
          variant,
          offers: activeOffers,
          lowestPrice,
          highestPrice,
          currency: activeOffers[0]?.price.currency || 'ZAR',
          matchedScore,
          freshestConfirmedAt,
          availableMerchantsCount: new Set(activeOffers.map((o) => o.merchantRef)).size,
        });
      }
    }

    // Sort by matched score descending
    hits.sort((a, b) => b.matchedScore - a.matchedScore);

    const paginatedHits = hits.slice(params.offset, params.offset + params.limit);
    const processingTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      hits: paginatedHits,
      totalHits: hits.length,
      processingTimeMs,
    };
  }
}
