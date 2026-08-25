import { describe, it, expect } from 'vitest';
import {
  NationwideMapsSweeper,
  SA_9_PROVINCES_SWEEP_GRID,
} from '../src/index';

describe('Nationwide Google Maps 9-Provinces Sweeper Engine', () => {
  it('covers all 9 South African provinces in the radial sweep grid', () => {
    const provincesInGrid = new Set(SA_9_PROVINCES_SWEEP_GRID.map((t) => t.province));
    expect(provincesInGrid.size).toBe(9);
    expect(provincesInGrid.has('Gauteng')).toBe(true);
    expect(provincesInGrid.has('Western Cape')).toBe(true);
    expect(provincesInGrid.has('KwaZulu-Natal')).toBe(true);
    expect(provincesInGrid.has('Eastern Cape')).toBe(true);
    expect(provincesInGrid.has('Free State')).toBe(true);
    expect(provincesInGrid.has('Limpopo')).toBe(true);
    expect(provincesInGrid.has('Mpumalanga')).toBe(true);
    expect(provincesInGrid.has('North West')).toBe(true);
    expect(provincesInGrid.has('Northern Cape')).toBe(true);
  });

  it('contains swept physical merchants across all 9 provinces', () => {
    const all = NationwideMapsSweeper.getAllMerchants();
    expect(all.length).toBeGreaterThanOrEqual(15);

    const counts = NationwideMapsSweeper.getProvinceCounts();
    for (const [prov, count] of Object.entries(counts)) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('filters merchants accurately by province and sector', () => {
    const limpopoMerchants = NationwideMapsSweeper.searchMerchants({ province: 'Limpopo' });
    expect(limpopoMerchants.length).toBeGreaterThanOrEqual(2);
    expect(limpopoMerchants.some((m) => m.addressText.includes('Polokwane'))).toBe(true);

    const kznSolar = NationwideMapsSweeper.searchMerchants({
      province: 'KwaZulu-Natal',
      category: 'solar_energy',
    });
    expect(kznSolar.length).toBeGreaterThanOrEqual(1);
    expect(kznSolar[0].name).toContain('Umhlanga');
  });
});
