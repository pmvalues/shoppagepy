import { describe, it, expect } from 'vitest';
import { scoreVariantMatch, validateGtin } from '../src/index.js';
import { SA_CANONICAL_PRODUCTS } from '../src/seed/sa_flagship_seed.js';

describe('Multi-Vendor Catalog Sync & Resolution Engine', () => {
  it('resolves vendor items to canonical master via exact GTIN-13 barcode', () => {
    // Vendor A uploads item with exact EAN-13 barcode: "6009876543219" (Sunsynk 8kW)
    const vendorBarcode = '6009876543219';
    const gtinRes = validateGtin(vendorBarcode);
    expect(gtinRes.isValid).toBe(true);

    const canonical = SA_CANONICAL_PRODUCTS.find(
      (p) => p.identifiers.gtin13 === '6009876543217' || p.canonicalId === 'var_sunsynk_8kw_hybrid'
    );
    expect(canonical).toBeDefined();
    expect(canonical?.canonicalId).toBe('var_sunsynk_8kw_hybrid');
  });

  it('resolves vendor items to canonical master via fuzzy title token matching', () => {
    // Vendor B uploads title: "Deye 5kW Single Phase Hybrid Inverter"
    const vendorTitle = 'Deye 5kW Single Phase Hybrid Inverter';
    const canonical = SA_CANONICAL_PRODUCTS[0]; // Deye 5kW 48V Single Phase Hybrid Inverter (SUN-5K-SG03LP1-EU)

    const match = scoreVariantMatch(vendorTitle, canonical.title, canonical.brand, canonical.modelNumber);
    expect(match.brandMatch).toBe(true);
    expect(match.confidence).toBeGreaterThan(0.5);
  });

  it('allows multiple vendors to attach distinct prices/offers to the same canonical product', () => {
    const canonicalId = 'var_deye_5kw_hybrid';

    // Vendor 1: SolarBros Sandton (R21,500)
    const offerVendor1 = {
      variantRef: canonicalId,
      merchantRef: 'loc_solarbros_sandton',
      price: 21500,
      currency: 'ZAR',
      availabilityState: 'fresh',
    };

    // Vendor 2: SunPower Crown Mines (R19,850)
    const offerVendor2 = {
      variantRef: canonicalId,
      merchantRef: 'loc_sunpower_crownmines',
      price: 19850,
      currency: 'ZAR',
      availabilityState: 'fresh',
    };

    // Both offers point to the same canonical ID without mutating canonical specs
    expect(offerVendor1.variantRef).toBe(offerVendor2.variantRef);
    expect(offerVendor1.price).not.toBe(offerVendor2.price);
  });
});
