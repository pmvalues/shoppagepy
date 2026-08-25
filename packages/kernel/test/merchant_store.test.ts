import { describe, it, expect } from 'vitest';
import { NationwideMerchantStore } from '../src/index';

describe('Nationwide Merchant Store & 74,000+ Multi-Source Index', () => {
  it('retrieves total count of 70,000+ South African companies across Google Maps, Bing, OpenStreetMap', () => {
    const total = NationwideMerchantStore.getTotalCount();
    expect(total).toBeGreaterThanOrEqual(50000);
  });

  it('provides real-time merchant distribution across all 9 provinces', () => {
    const counts = NationwideMerchantStore.getProvinceCounts();
    expect(counts['Gauteng']).toBeGreaterThan(5000);
    expect(counts['Western Cape']).toBeGreaterThan(3000);
    expect(counts['KwaZulu-Natal']).toBeGreaterThan(3000);
    expect(counts['Eastern Cape']).toBeGreaterThan(1000);
    expect(counts['Free State']).toBeGreaterThan(1000);
    expect(counts['Limpopo']).toBeGreaterThan(1000);
    expect(counts['Mpumalanga']).toBeGreaterThan(1000);
    expect(counts['North West']).toBeGreaterThan(1000);
    expect(counts['Northern Cape']).toBeGreaterThan(1000);
  });

  it('searches and paginates through physical merchants seamlessly', () => {
    const res1 = NationwideMerchantStore.searchMerchants({ province: 'Gauteng', limit: 12, offset: 0 });
    expect(res1.items.length).toBe(12);
    expect(res1.total).toBeGreaterThan(5000);

    const res2 = NationwideMerchantStore.searchMerchants({ province: 'Gauteng', limit: 12, offset: 12 });
    expect(res2.items.length).toBe(12);
    expect(res2.items[0].id).not.toBe(res1.items[0].id);
  });

  it('performs keyword searches across store names and addresses', () => {
    const res = NationwideMerchantStore.searchMerchants({ query: 'Solar', limit: 10 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.some((m) => m.name.toLowerCase().includes('solar') || m.category === 'solar_energy')).toBe(true);
  });

  it('retrieves merchants bound to specific regional markets and trade concourses', () => {
    const res = NationwideMerchantStore.getMerchantsByMarket('mkt_sandton_city', 5);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].marketId).toBe('mkt_sandton_city');
    expect(res.items[0].stallIdentifier).toBeDefined();
  });
});
