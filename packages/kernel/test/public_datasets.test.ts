import { describe, it, expect } from 'vitest';
import { PublicMerchantDatasetManager } from '../src/index';

describe('Public & Open Merchant Datasets Hub (South Africa)', () => {
  it('lists all 7 major statutory, open geospatial and contractor registries', () => {
    const sources = PublicMerchantDatasetManager.listAvailableSources();
    expect(sources.length).toBeGreaterThanOrEqual(7);

    const overture = sources.find((s) => s.id === 'src_overture_places_za');
    expect(overture).toBeDefined();
    expect(overture?.licenseType).toBe('CDLA_PERMISSIVE_OVERTURE');

    const cipc = sources.find((s) => s.id === 'src_cipc_public_registry');
    expect(cipc).toBeDefined();
    expect(cipc?.sourceAuthority).toContain('Department of Trade');

    const csd = sources.find((s) => s.id === 'src_national_treasury_csd');
    expect(csd).toBeDefined();
    expect(csd?.sourceAuthority).toContain('National Treasury');
  });

  it('calculates total potential merchant record pool exceeding 5,000,000 records', () => {
    const total = PublicMerchantDatasetManager.getTotalEstimatedMerchantRecords();
    expect(total).toBeGreaterThanOrEqual(5000000);
  });
});
