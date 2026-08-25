import { SOUTH_AFRICA_QUERY_FIXTURES } from './fixtures/sa_queries.js';
import { evaluateLocalAvailabilityHallucinations, HallucinationEvaluationResult } from './scorers/hallucination_scorer.js';
import { InMemorySearchEngine } from '@shoppage/adapters';

export interface EvalRunSummary {
  runId: string;
  evaluatedAt: string;
  totalFixtures: number;
  hallucinationResult: HallucinationEvaluationResult;
  averageLatencyMs: number;
}

export function runEvaluationSuite(searchEngine: InMemorySearchEngine): EvalRunSummary {
  const actualResults = new Map<string, { returnedLocalOffersCount: number; isReferenceOnly: boolean }>();
  let totalLatency = 0;

  for (const fixture of SOUTH_AFRICA_QUERY_FIXTURES) {
    const response = searchEngine.search({
      query: fixture.rawQuery,
      country: 'ZA',
      availability: 'all_confirmed',
      limit: 10,
      offset: 0,
    });

    totalLatency += response.processingTimeMs;
    const offersCount = response.hits.reduce((acc, h) => acc + h.offers.length, 0);
    const isReferenceOnly = response.hits.every((h) => h.variant.status === 'reference_only');

    actualResults.set(fixture.id, {
      returnedLocalOffersCount: offersCount,
      isReferenceOnly,
    });
  }

  const hallucinationResult = evaluateLocalAvailabilityHallucinations(
    SOUTH_AFRICA_QUERY_FIXTURES,
    actualResults
  );

  return {
    runId: `eval_${Date.now()}`,
    evaluatedAt: new Date().toISOString(),
    totalFixtures: SOUTH_AFRICA_QUERY_FIXTURES.length,
    hallucinationResult,
    averageLatencyMs: Number((totalLatency / SOUTH_AFRICA_QUERY_FIXTURES.length).toFixed(2)),
  };
}
