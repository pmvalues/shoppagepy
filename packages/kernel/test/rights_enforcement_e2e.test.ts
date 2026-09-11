import { describe, it, expect } from 'vitest';
import { DiscoveredOffersStore } from '../src/repository/discovered_offers_store';
import { RIGHTS_REGISTER, resolveSourceId } from '../src/rights/register';

/**
 * WS-2.2 end-to-end enforcement.
 *
 * These tests run against the real 93,021-row sa_discovered_offers.sqlite dataset,
 * not fixtures. They are the proof that the rights gate actually removes rows from
 * live search output rather than merely existing as an unused function.
 */
describe('WS-2.2 end-to-end: the rights gate changes real search output', () => {
  const PROBE_QUERIES = ['inverter', 'solar', 'battery', 'display', 'cement'];

  it('returns zero results sourced from any BLOCKED retailer', () => {
    const blocked = new Set(
      Object.values(RIGHTS_REGISTER)
        .filter((r) => r.status !== 'CLEARED')
        .map((r) => r.sourceId)
    );
    expect(blocked.size).toBeGreaterThan(0);

    for (const query of PROBE_QUERIES) {
      const results = DiscoveredOffersStore.searchDiscoveredProducts(query, { limit: 100 });
      for (const r of results) {
        const raw = r.discoveredOffer?.sourceWebsite || '';
        const resolved = resolveSourceId(raw);
        const label = `${query} -> ${raw}`;

        // Every returned row must be attributable to a CLEARED source.
        expect(
          resolved === null || !blocked.has(resolved),
          `Query "${label}" leaked a BLOCKED source into public output.`
        ).toBe(true);
      }
    }
  });

  it('reports which sources it suppressed, so the posture is observable', () => {
    for (const query of PROBE_QUERIES) {
      DiscoveredOffersStore.searchDiscoveredProducts(query, { limit: 100 });
    }
    const report = DiscoveredOffersStore.getRightsSuppressionReport();
    // The dataset is entirely scraped retail data, so suppression must be non-empty.
    expect(report.sources.length).toBeGreaterThan(0);
    expect(report.since).toBeTruthy();
  });

  it('does not return offers for a product via the per-product accessor either', () => {
    // getOffersForProduct is the other read path; it must be gated identically.
    const sample = DiscoveredOffersStore.searchDiscoveredProducts('inverter', { limit: 1 });
    if (sample.length === 0) return; // nothing to probe in this dataset state

    const productId = sample[0].product.canonicalId;
    const { discovered } = DiscoveredOffersStore.getOffersForProduct(productId);
    for (const d of discovered) {
      const resolved = resolveSourceId(d.sourceWebsite || '');
      expect(resolved).toBeNull();
    }
  });
});

/**
 * WS-2.2 regression, added 2026-09-11.
 *
 * `getLatestDiscoveredOffers` and `getAllDiscoveredSpecials` are the two raw
 * SELECT readers. They back the public homepage catalogue and the deals rail.
 * Neither applied the rights gate, so `getProductsCatalog` serialised all
 * 93,021 scraped retailer rows into a single 58 MB inline script on the homepage
 * — the register was enforced on search but bypassed on the landing page.
 */
describe('WS-2.2 regression: the raw catalogue readers are gated', () => {
  const READERS = [
    [
      'getLatestDiscoveredOffers',
      () => DiscoveredOffersStore.getLatestDiscoveredOffers(500),
    ],
    [
      'getAllDiscoveredSpecials',
      () => DiscoveredOffersStore.getAllDiscoveredSpecials(500),
    ],
  ] as const;

  it.each(READERS)('%s returns no row from a non-CLEARED source', (_name, read) => {
    const rows = read();
    for (const row of rows) {
      const resolved = resolveSourceId(row.sourceWebsite || '');
      if (resolved === null) continue;
      expect(
        RIGHTS_REGISTER[resolved].status === 'CLEARED',
        `${_name} leaked non-CLEARED source "${row.sourceWebsite}" into public output.`
      ).toBe(true);
    }
  });

  it('suppresses rows that the underlying table still holds', () => {
    // Guards against the gate silently disappearing. The dataset is ~93k scraped
    // rows, so a gated reader must publish strictly fewer than the table total.
    const total = DiscoveredOffersStore.getTotalDiscoveredOffersCount();
    expect(total).toBeGreaterThan(0);
    const published = DiscoveredOffersStore.getLatestDiscoveredOffers(total);
    expect(published.length).toBeLessThan(total);
  });
});
