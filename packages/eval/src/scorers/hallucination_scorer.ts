import { QueryEvaluationFixture } from '../fixtures/sa_queries.js';

export interface HallucinationEvaluationResult {
  totalQueriesEvaluated: number;
  hallucinatedCount: number;
  hallucinationRate: number;
  passedGate: boolean;
  failures: Array<{ fixtureId: string; query: string; reason: string }>;
}

/**
 * Evaluates whether the system incorrectly claimed local stock for unconfirmed/reference-only items
 * Tolerance Gate: 0.00% (Zero-Regression Rule)
 */
export function evaluateLocalAvailabilityHallucinations(
  fixtures: QueryEvaluationFixture[],
  actualResults: Map<string, { returnedLocalOffersCount: number; isReferenceOnly: boolean }>
): HallucinationEvaluationResult {
  const failures: Array<{ fixtureId: string; query: string; reason: string }> = [];

  for (const fixture of fixtures) {
    const result = actualResults.get(fixture.id);
    if (!result) continue;

    // If fixture is NOT available locally, but engine returned local offers -> CRITICAL HALLUCINATION
    if (!fixture.isAvailableLocally && result.returnedLocalOffersCount > 0 && !result.isReferenceOnly) {
      failures.push({
        fixtureId: fixture.id,
        query: fixture.rawQuery,
        reason: `Engine hallucinated ${result.returnedLocalOffersCount} active local offers for unavailable/reference-only item.`,
      });
    }
  }

  const hallucinatedCount = failures.length;
  const hallucinationRate = fixtures.length > 0 ? hallucinatedCount / fixtures.length : 0;

  return {
    totalQueriesEvaluated: fixtures.length,
    hallucinatedCount,
    hallucinationRate: Number(hallucinationRate.toFixed(4)),
    passedGate: hallucinatedCount === 0, // Strict zero hallucination gate
    failures,
  };
}
