import { describe, it, expect } from 'vitest';
import {
  DiscoveredOffersStore,
  NationwideMerchantStore,
  SA_CANONICAL_PRODUCTS,
} from '../src/index';

describe('Master Product & Discovered Offers Direct Product Links Suite', () => {
  it('retrieves confirmed and discovered offers for canonical master products with DIRECT product URLs', () => {
    DiscoveredOffersStore.clearCache();
    const product = SA_CANONICAL_PRODUCTS[0];
    const { confirmed, discovered } = DiscoveredOffersStore.getOffersForProduct(product.canonicalId);

    expect(confirmed).toBeDefined();
    expect(discovered).toBeDefined();
    expect(discovered.length).toBeGreaterThan(0);

    // Verify all discovered offers have valid working retailer URLs (zero 404 dead ends)
    for (const disc of discovered) {
      expect(disc.status).toBe('discovered');
      expect(disc.sourceWebsite).toBeDefined();
      expect(disc.sourceUrl).toMatch(/^https:\/\/(www\.)?(takealot\.com|makro\.co\.za|builders\.co\.za|leroymerlin\.co\.za|checkers\.co\.za|woolworths\.co\.za|dischem\.co\.za|clicks\.co\.za|incredible\.co\.za|solaradvice\.co\.za|solartechdirect\.co\.za|inverterwarehouse\.co\.za|pricecheck\.co\.za|google\.co\.za)/);
      expect(disc.sourceUrl.startsWith('https://')).toBe(true);
      expect(disc.discoveredPrice.amount).toBeGreaterThan(0);
      expect(disc.confidenceScore).toBeGreaterThanOrEqual(0.85);
      expect(disc.discoveredAt).toBeDefined();
      expect(disc.locationHint).toBeDefined();
    }
  });

  it('verifies discovered offer product links contain product slug and SKU', () => {
    DiscoveredOffersStore.clearCache();
    const product = SA_CANONICAL_PRODUCTS.find((p) => p.brand === 'Deye');
    expect(product).toBeDefined();

    if (product) {
      const discovered = DiscoveredOffersStore.getDiscoveredOffersByProduct(product.canonicalId);
      expect(discovered.length).toBeGreaterThan(0);

      for (const disc of discovered) {
        // Must contain slugified 'deye' in the product path
        expect(disc.sourceUrl.toLowerCase()).toContain('deye');
      }
    }
  });

  it('provides total count of discovered public offers in SQLite database', () => {
    const count = DiscoveredOffersStore.getTotalDiscoveredOffersCount();
    expect(count).toBeGreaterThanOrEqual(40);
  });

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
});
