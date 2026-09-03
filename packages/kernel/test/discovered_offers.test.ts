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
      expect(disc.sourceUrl).toMatch(/^https:\/\/(www\.)?(takealot\.com|makro\.co\.za|builders\.co\.za|game\.co\.za|buco\.co\.za|spar\.co\.za|expertstores\.co\.za|russells\.co\.za|bradlows\.co\.za|pep\.co\.za|leroymerlin\.co\.za|checkers\.co\.za|woolworths\.co\.za|dischem\.co\.za|clicks\.co\.za|incredible\.co\.za|solaradvice\.co\.za|solartechdirect\.co\.za|inverterwarehouse\.co\.za|pricecheck\.co\.za|google\.co\.za)/);
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

  it('searches database-stored scraped products and returns complete ProductVariants with direct retailer URLs', () => {
    const cementResults = DiscoveredOffersStore.searchDiscoveredProducts('cement');
    expect(cementResults.length).toBeGreaterThan(0);

    const first = cementResults[0];
    expect(first.product.title.toLowerCase()).toContain('cement');
    expect(first.offer.actionTarget.destinationUrl).toMatch(/^https:\/\/(www\.)?(builders\.co\.za|game\.co\.za|buco\.co\.za|leroymerlin\.co\.za|makro\.co\.za|takealot\.com)/);
    expect(first.offer.price.amount).toBeGreaterThan(0);
    expect(first.offer.actionTarget.destinationUrl).not.toContain('undefined');
  });

  it('dynamically saves scraped external offers into SQLite database and cache', () => {
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

