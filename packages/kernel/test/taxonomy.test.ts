import { describe, it, expect } from 'vitest';
import { GoogleTaxonomyEngine } from '../src/taxonomy/google_taxonomy.js';

describe('Google Product Taxonomy Engine', () => {
  const engine = new GoogleTaxonomyEngine();

  it('retrieves root categories (level 1)', () => {
    const rootCats = engine.getChildren(undefined);
    expect(rootCats.length).toBeGreaterThanOrEqual(10);
    expect(rootCats.some((c) => c.name === 'Electronics')).toBe(true);
    expect(rootCats.some((c) => c.name === 'Hardware')).toBe(true);
  });

  it('searches categories by keyword and finds nested solar subcategories', () => {
    const results = engine.searchCategories('inverter');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fullPath).toContain('Hardware > Solar Energy > Solar Inverters');
  });

  it('reconstructs complete breadcrumb hierarchy trail', () => {
    // Solar Inverters (ID: 500002)
    const breadcrumbs = engine.getBreadcrumbs(500002);
    expect(breadcrumbs.length).toBe(3);
    expect(breadcrumbs[0].name).toBe('Hardware');
    expect(breadcrumbs[1].name).toBe('Solar Energy');
    expect(breadcrumbs[2].name).toBe('Solar Inverters');
  });

  it('resolves category by slug', () => {
    const cat = engine.getCategoryBySlug('mobile-phones');
    expect(cat).toBeDefined();
    expect(cat?.id).toBe(269);
    expect(cat?.fullPath).toBe('Electronics > Communications > Telephony > Mobile Phones');
  });
});
