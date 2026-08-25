import { describe, it, expect } from 'vitest';
import { NationwideMerchantStore } from '../src/index';

describe('Merchant Public Information & Statutory Enrichment Layer', () => {
  it('loads enriched statutory governance data for physical merchants', () => {
    const merchant = NationwideMerchantStore.getMerchantById('loc_za_ga_000001');
    expect(merchant).toBeDefined();
    expect(merchant?.cipcEnterpriseNumber).toBeDefined();
    expect(merchant?.bbbeeLevel).toBeDefined();
    expect(merchant?.bbbeeLevel).toContain('Contributor');
    expect(merchant?.taxCompliancePin).toBeDefined();
  });

  it('loads commercial facility, payment rails, and logistics attributes', () => {
    const merchant = NationwideMerchantStore.getMerchantById('loc_za_ga_000001');
    expect(merchant).toBeDefined();
    expect(merchant?.paymentMethods).toBeInstanceOf(Array);
    expect(merchant?.paymentMethods?.length).toBeGreaterThanOrEqual(2);
    expect(merchant?.facilities).toBeInstanceOf(Array);
    expect(merchant?.facilities?.length).toBeGreaterThanOrEqual(1);
    expect(merchant?.languagesSpoken).toBeInstanceOf(Array);
    expect(merchant?.languagesSpoken).toContain('English');
    expect(merchant?.yearsInBusiness).toBeGreaterThanOrEqual(1);
    expect(merchant?.storefrontPhotoUrl).toBeDefined();
  });
});
