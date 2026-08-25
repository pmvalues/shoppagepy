import { describe, it, expect } from 'vitest';
import { SA_CANONICAL_PRODUCTS, calculateBackupRuntime, enrichProductVariant } from '../src/index';

describe('Massive Master Product Enrichment Engine', () => {
  it('enriches canonical products with media gallery, videos, and PDF documentation', () => {
    const deye = SA_CANONICAL_PRODUCTS.find((p) => p.canonicalId === 'var_deye_5kw_hybrid');
    expect(deye).toBeDefined();
    expect(deye?.media?.gallery.length).toBeGreaterThanOrEqual(3);
    expect(deye?.media?.videos.length).toBeGreaterThanOrEqual(1);
    expect(deye?.media?.documents.length).toBeGreaterThanOrEqual(2);
    expect(deye?.media?.documents[0].type).toBe('datasheet_pdf');
  });

  it('provides structured reviews summary with average rating and pros/cons', () => {
    const deye = SA_CANONICAL_PRODUCTS[0];
    expect(deye.reviewsSummary).toBeDefined();
    expect(deye.reviewsSummary?.averageRating).toBeGreaterThanOrEqual(4.5);
    expect(deye.reviewsSummary?.pros.length).toBeGreaterThanOrEqual(2);
    expect(deye.reviewsSummary?.cons.length).toBeGreaterThanOrEqual(1);
    expect(deye.reviewsSummary?.reviews.length).toBeGreaterThanOrEqual(2);
    expect(deye.reviewsSummary?.reviews[0].verifiedBuyer).toBe(true);
  });

  it('provides troubleshooting error codes and installation guides', () => {
    const deye = SA_CANONICAL_PRODUCTS[0];
    expect(deye.guides).toBeDefined();
    expect(deye.guides?.troubleshooting.length).toBeGreaterThanOrEqual(3);
    const f20 = deye.guides?.troubleshooting.find((t) => t.code === 'F20');
    expect(f20).toBeDefined();
    expect(f20?.symptom).toContain('DC Bus');
  });

  it('accurately calculates load-shedding backup runtime', () => {
    // 5.12kWh lithium battery with 450W typical residential load (fridge + TV + lights + Wi-Fi)
    const runtime = calculateBackupRuntime(5.12, 450, 0.9);
    expect(runtime.usableKwh).toBe(4.61);
    expect(runtime.runtimeHours).toBeCloseTo(10.2, 1);
    expect(runtime.formattedRuntime).toBe('10h 14m');
  });
});
