import { describe, it, expect } from 'vitest';
import { runEvaluationSuite } from '../src/runner.js';
import { InMemorySearchEngine } from '@shoppage/adapters';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';

describe('Shoppage Evaluation Suite & Benchmark Runner', () => {
  it('passes evaluation harness with zero availability hallucinations', () => {
    const searchEngine = new InMemorySearchEngine();
    for (const variant of SA_CANONICAL_PRODUCTS) {
      searchEngine.indexVariant(variant);
    }
    for (const offer of SA_FLAGSHIP_OFFERS) {
      searchEngine.indexOffer(offer);
    }

    const summary = runEvaluationSuite(searchEngine);

    expect(summary.totalFixtures).toBeGreaterThan(0);
    expect(summary.hallucinationResult.passedGate).toBe(true);
    expect(summary.hallucinationResult.hallucinatedCount).toBe(0);
    expect(summary.averageLatencyMs).toBeLessThan(100);
  });
});
