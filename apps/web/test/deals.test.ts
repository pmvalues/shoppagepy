import { describe, it, expect } from 'vitest';
import { getRetailerSpecials } from '../src/lib/feed';

describe('Major Retailer Deals & Direct Product URLs Suite (Guzzle-style)', () => {
  it('aggregates circular deals across all major South African retailers', () => {
    const deals = getRetailerSpecials(100);
    expect(deals.length).toBeGreaterThanOrEqual(25);

    const merchants = new Set(deals.map((d) => d.merchant));
    expect(merchants.has('Makro South Africa')).toBe(true);
    expect(merchants.has('Game Stores')).toBe(true);
    expect(merchants.has('Builders Warehouse')).toBe(true);
    expect(merchants.has('Checkers Sixty60')).toBe(true);
    expect(merchants.has('Pick n Pay')).toBe(true);
    expect(merchants.has('Woolworths South Africa')).toBe(true);
    expect(merchants.has('Takealot.com')).toBe(true);
    expect(merchants.has('Incredible Connection')).toBe(true);
    expect(merchants.has('Clicks Group')).toBe(true);
    expect(merchants.has('Dis-Chem Pharmacies')).toBe(true);
    expect(merchants.has('Leroy Merlin South Africa')).toBe(true);
    expect(merchants.has('SolarAdvice South Africa')).toBe(true);
  });

  it('guarantees that every deal URL is an authentic, direct retailer product page URL', () => {
    const deals = getRetailerSpecials(100);

    const allowedRetailerDomains = [
      'makro.co.za',
      'game.co.za',
      'builders.co.za',
      'buco.co.za',
      'spar.co.za',
      'expertstores.co.za',
      'russells.co.za',
      'bradlows.co.za',
      'pep.co.za',
      'midas.co.za',
      'checkers.co.za',
      'pnp.co.za',
      'woolworths.co.za',
      'takealot.com',
      'incredible.co.za',
      'clicks.co.za',
      'dischem.co.za',
      'leroymerlin.co.za',
      'solaradvice.co.za',
      'inverterwarehouse.co.za',
      'solartechdirect.co.za',
      'mitrend.co.za',
    ];

    for (const deal of deals) {
      expect(deal.url).toMatch(/^https:\/\//);
      expect(deal.title).toBeDefined();
      expect(deal.title.length).toBeGreaterThan(3);
      expect(deal.priceZar).toBeGreaterThan(0);
      expect(deal.priceText).toMatch(/^R\s/);

      // Verify domain is in the allowed authentic SA retailers
      const matchesAllowed = allowedRetailerDomains.some((domain) => deal.url.includes(domain));
      expect(matchesAllowed).toBe(true);

      // Verify it does NOT contain generic search engine or dead aggregator flyer paths
      expect(deal.url).not.toContain('guzzle.co.za');
      expect(deal.url).not.toContain('undefined');
    }
  });

  it('verifies price drop calculations and promotional badges', () => {
    const deals = getRetailerSpecials(100);
    const discountedDeals = deals.filter((d) => typeof d.dropPct === 'number' && d.dropPct > 0);

    expect(discountedDeals.length).toBeGreaterThan(15);
    for (const d of discountedDeals) {
      if (d.oldPriceZar && d.priceZar) {
        expect(d.oldPriceZar).toBeGreaterThan(d.priceZar);
        const expectedDrop = Math.round(((d.oldPriceZar - d.priceZar) / d.oldPriceZar) * 100);
        expect(Math.abs((d.dropPct || 0) - expectedDrop)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('retrieves database-scraped specials with full deal info including images, categories, and direct links', () => {
    const specials = getRetailerSpecials(100);
    expect(specials.length).toBeGreaterThanOrEqual(25);

    for (const s of specials) {
      expect(s.id).toBeDefined();
      expect(s.title).toBeDefined();
      expect(s.merchant).toBeDefined();
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.priceZar).toBeGreaterThan(0);
      expect(s.image).toMatch(/^https:\/\//);
      expect(s.availability).toBeDefined();
      expect(s.categoryLabel).toBeDefined();
    }
  });
});

