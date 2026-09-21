import { describe, it, expect } from 'vitest';
import { HybridSearchEngine } from '../src/search/typesense_adapter';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';

describe('Phase 2: HybridSearchEngine (Typesense + SQLite Fallback)', () => {
  it('instantiates cleanly with Typesense configuration and in-memory engine', () => {
    const engine = new HybridSearchEngine({
      url: 'http://localhost:8108',
      apiKey: 'test_api_key',
    });
    expect(engine.typesense).toBeDefined();
    expect(engine.inMemory).toBeDefined();
  });

  it('indexes variants and executes search with zero degradation when Typesense is offline', async () => {
    const engine = new HybridSearchEngine({
      url: 'http://127.0.0.1:65534', // offline endpoint
    });

    for (const variant of SA_CANONICAL_PRODUCTS) {
      engine.indexVariant(variant);
    }
    for (const offer of SA_FLAGSHIP_OFFERS) {
      engine.indexOffer(offer);
    }

    const res = await engine.search({
      query: 'Sunsynk 8kW',
      country: 'ZA',
      limit: 10,
    });

    expect(res.hits.length).toBeGreaterThan(0);
    expect(res.hits[0].variant.brand).toBe('Sunsynk');
    expect(res.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to MasterProductStore when in-memory engine is empty', () => {
    const engine = new HybridSearchEngine();
    // Do NOT index anything into inMemory

    const res = engine.searchSync({
      query: 'Deye 5kW',
      limit: 5,
    });

    expect(res).toBeDefined();
    expect(res.hits.length).toBeGreaterThan(0);
    expect(res.hits[0].variant.title).toContain('Deye');
  });
});
