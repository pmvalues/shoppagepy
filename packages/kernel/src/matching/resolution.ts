/**
 * Entity Resolution & Match Scoring Engine
 * Token Dice-Sørensen, Levenshtein distance, and Brand-Model Extractor
 */

export interface MatchScoreResult {
  confidence: number; // 0.00 to 1.00
  exactIdentifierMatch: boolean;
  tokenSimilarity: number;
  brandMatch: boolean;
  matchedTokens: string[];
  unmatchedTokens: string[];
}

export function tokenizeAndNormalize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Calculates Token Dice-Sørensen coefficient
 */
export function calculateTokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenizeAndNormalize(a));
  const tokensB = new Set(tokenizeAndNormalize(b));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  return (2 * intersectionCount) / (tokensA.size + tokensB.size);
}

/**
 * Resolves match confidence between an offer title and a canonical product variant
 */
export function scoreVariantMatch(
  offerTitle: string,
  canonicalTitle: string,
  brand?: string,
  model?: string
): MatchScoreResult {
  const offerTokens = tokenizeAndNormalize(offerTitle);
  const canonicalTokens = tokenizeAndNormalize(canonicalTitle);
  const offerTokenSet = new Set(offerTokens);

  let brandMatch = false;
  if (brand) {
    const brandTokens = tokenizeAndNormalize(brand);
    brandMatch = brandTokens.every((bt) => offerTokenSet.has(bt));
  }

  let modelMatch = false;
  if (model) {
    const modelTokens = tokenizeAndNormalize(model);
    modelMatch = modelTokens.every((mt) => offerTokenSet.has(mt));
  }

  const tokenSim = calculateTokenSimilarity(offerTitle, canonicalTitle);
  const matchedTokens = canonicalTokens.filter((t) => offerTokenSet.has(t));
  const unmatchedTokens = canonicalTokens.filter((t) => !offerTokenSet.has(t));

  let confidence = tokenSim * 0.7;
  if (brandMatch) confidence += 0.15;
  if (modelMatch) confidence += 0.15;

  confidence = Math.min(1.0, Math.max(0.0, confidence));

  return {
    confidence: Number(confidence.toFixed(4)),
    exactIdentifierMatch: false,
    tokenSimilarity: Number(tokenSim.toFixed(4)),
    brandMatch,
    matchedTokens,
    unmatchedTokens,
  };
}
