import { describe, it, expect } from 'vitest';
import {
  DiscoveredOffersStore,
  NationwideMerchantStore,
  SA_CANONICAL_PRODUCTS,
  RIGHTS_REGISTER,
  canPublishSource,
  resolveSourceId,
} from '../src/index';

/**
 * WS-2.2 — REVISED SUITE.
 *
 * This file previously asserted that scraped third-party retail offers (Takealot,
 * Makro, Builders, Game, Leroy Merlin, BUCO, ...) were returned from public search
 * and exposed directly to consumers.
 *
 * Under the WS-2.2 governance decision those sources are registered BLOCKED, so
 * that assertion is no longer the intended behaviour. The suite now verifies the
 * OPPOSITE contract — that the gate holds — while still covering the URL-construction
 * and dataset-shape logic that remains valid and must not regress.
 *
 * If the data-rights posture changes (agreements signed), flip the source to
 * CLEARED in RIGHTS_REGISTER and the "is suppressed" assertions will need updating
 * deliberately — they are the guard rail that stops an accidental re-exposure.
 */
describe('Discovered Offers — governance gate (WS-2.2)', () => {
  it('suppresses every scraped retailer from the public per-product accessor', () => {
    DiscoveredOffersStore.clearCache();
    const product = SA_CANONICAL_PRODUCTS[0];
    const { confirmed, discovered } = DiscoveredOffersStore.getOffersForProduct(product.canonicalId);

    expect(confirmed).toBeDefined();
    expect(discovered).toBeDefined();

    // Any row that does surface must come from a CLEARED source.
    for (const disc of discovered) {
      const resolved = resolveSourceId(disc.sourceWebsite);
      const blocked = resolved !== null && RIGHTS_REGISTER[resolved].status !== 'CLEARED';
      expect(blocked, `Blocked source ${disc.sourceWebsite} leaked into public output`).toBe(false);
    }
  });

  it('suppresses scraped retailer rows from the public search path', () => {
    const results = DiscoveredOffersStore.searchDiscoveredProducts('cement');
    for (const r of results) {
      const resolved = resolveSourceId(r.discoveredOffer?.sourceWebsite || '');
      expect(resolved).toBeNull();
    }
  });

  it('reports the sources it is withholding, so the posture is auditable', () => {
    DiscoveredOffersStore.searchDiscoveredProducts('inverter', { limit: 50 });
    const report = DiscoveredOffersStore.getRightsSuppressionReport();
    expect(report.sources.length).toBeGreaterThan(0);
  });

  it('still counts the full underlying dataset (suppression is at read time, not ingest)', () => {
    // The data remains ingested and available for a future licensed agreement.
    const count = DiscoveredOffersStore.getTotalDiscoveredOffersCount();
    expect(count).toBeGreaterThanOrEqual(40);
  });

  it('still ingests and stores a scraped offer correctly (write path unaffected)', () => {
    const saved = DiscoveredOffersStore.saveScrapedOffer({
      masterProductRef: 'var_test_scraper_sku_1',
      productTitle: 'Scraped Test Solar Inverter 5kW',
      brand: 'SolarTech',
      category: 'solar_energy',
      merchantName: 'Takealot.com',
      sourceWebsite: 'takealot.com',
      sourceUrl: 'https://www.takealot.com/solartech-5kw-inverter/PLID99988877',
      priceZar: 15499,
      availabilityText: 'In Stock (Live Scraped)',
      locationHint: 'National Distribution Centres',
      sku: 'ST-5KW-TEST',
    });

    expect(saved.id).toBeDefined();
    expect(saved.sourceUrl).toBe('https://www.takealot.com/solartech-5kw-inverter/PLID99988877');
    expect(saved.discoveredPrice.amount).toBe(15499);

    // But it must NOT be publishable while takealot is BLOCKED.
    expect(canPublishSource('takealot.com')).toBe(false);
  });
});

describe('Discovered Offers — dataset integrity unaffected by the gate', () => {
  it('populates hyperlinked Google Maps and Google Reviews URLs on merchants', () => {
    const merchants = NationwideMerchantStore.getAllMerchants(5);
    expect(merchants.length).toBeGreaterThan(0);

    for (const m of merchants) {
      expect(m.googleMapsUrl).toBeDefined();
      expect(m.googleMapsUrl).toMatch(/(google\.com\/maps|maps\.google\.com)/);
      expect(m.googleReviewsUrl).toBeDefined();
      expect(m.googleReviewsUrl).toMatch(/(google\.com\/maps|search\.google\.com)/);
    }
  });

  it('produces well-formed direct retailer URLs when reconstructing a discovered offer', () => {
    // URL construction is still exercised via the write path, independent of rights.
    const saved = DiscoveredOffersStore.saveScrapedOffer({
      masterProductRef: 'var_test_url_shape',
      productTitle: 'Deye 8kW Hybrid Inverter',
      brand: 'Deye',
      category: 'solar_energy',
      merchantName: 'Test Retailer',
      sourceWebsite: 'takealot.com',
      sourceUrl: '',
      priceZar: 23999,
      availabilityText: 'In Stock',
      locationHint: 'Gauteng',
      sku: 'DEYE-8KW',
    });

    // The guarantee is a usable, absolute, non-broken retailer URL — not a specific
    // path shape. The builder may emit either a product slug or a search fallback.
    expect(saved.sourceUrl.startsWith('https://')).toBe(true);
    expect(saved.sourceUrl).not.toContain('undefined');
    expect(saved.sourceUrl).not.toContain('null');
  });

  it('preserves an explicitly supplied direct product URL verbatim', () => {
    const saved = DiscoveredOffersStore.saveScrapedOffer({
      masterProductRef: 'var_test_url_verbatim',
      productTitle: 'Deye 8kW Hybrid Inverter',
      brand: 'Deye',
      category: 'solar_energy',
      merchantName: 'Test Retailer',
      sourceWebsite: 'takealot.com',
      sourceUrl: 'https://www.takealot.com/deye-8kw-hybrid-inverter/PLID12345678',
      priceZar: 23999,
      availabilityText: 'In Stock',
      locationHint: 'Gauteng',
      sku: 'DEYE-8KW',
    });

    expect(saved.sourceUrl).toBe('https://www.takealot.com/deye-8kw-hybrid-inverter/PLID12345678');
    expect(saved.sourceUrl.toLowerCase()).toContain('deye');
  });
});
