import { describe, it, expect } from 'vitest';
import { MasterProductStore } from '../src/index';

describe('1,000,000+ Master Product Store & Live Search Engine', () => {
  it('retrieves total count of 1,000,000+ products', () => {
    const count = MasterProductStore.getTotalProductsCount();
    expect(count).toBeGreaterThanOrEqual(1000000);
  });

  it('searches and paginates through master products dynamically', () => {
    const page1 = MasterProductStore.searchProducts({ limit: 12, offset: 0 });
    expect(page1.items.length).toBe(12);
    expect(page1.total).toBeGreaterThanOrEqual(1000000);

    const page2 = MasterProductStore.searchProducts({ limit: 12, offset: 12 });
    expect(page2.items.length).toBe(12);
    // Ensure page 2 has different items than page 1
    expect(page2.items[0].canonicalId).not.toBe(page1.items[0].canonicalId);
  });

  it('looks up specific canonical products by ID from flagship or 1M store with English canonicalization', () => {
    // Flagship seed product lookup
    const deye = MasterProductStore.getProductById('var_deye_5kw_hybrid');
    expect(deye).toBeDefined();
    expect(deye?.brand).toBe('Deye');

    // 1M store product lookup - verifies English canonical title + French alias
    const p1 = MasterProductStore.getProductById('off_000000000054');
    expect(p1).toBeDefined();
    expect(p1?.title).toBe('Artisanal Lemonade with Rose Essence');
    expect(p1?.aliases.some((a) => a.phrase.includes('Limonade'))).toBe(true);
  });

  it('performs keyword searches across 1M+ database items', () => {
    const results = MasterProductStore.searchProducts({ query: 'Chocolate', limit: 10 });
    expect(results.items.length).toBeGreaterThan(0);
    expect(results.total).toBeGreaterThan(0);
    expect(results.items.some((item) => item.title.toLowerCase().includes('chocolate'))).toBe(true);
  });
});
