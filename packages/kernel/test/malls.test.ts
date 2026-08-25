import { describe, it, expect } from 'vitest';
import { SouthAfricaMallsStore } from '../src/index';

describe('South Africa Comprehensive Malls & Shopping Centres Store (3,290+ Hubs)', () => {
  it('retrieves nationwide total count of 3,000+ malls and shopping centres', () => {
    const total = SouthAfricaMallsStore.getTotalCount();
    expect(total).toBeGreaterThanOrEqual(3000);
  });

  it('provides real-time distribution across all 9 provinces', () => {
    const counts = SouthAfricaMallsStore.getProvinceCounts();
    expect(counts['Gauteng']).toBeGreaterThan(500);
    expect(counts['Western Cape']).toBeGreaterThan(400);
    expect(counts['KwaZulu-Natal']).toBeGreaterThan(300);
    expect(counts['Eastern Cape']).toBeGreaterThan(200);
    expect(counts['Limpopo']).toBeGreaterThan(150);
    expect(counts['Mpumalanga']).toBeGreaterThan(150);
    expect(counts['Free State']).toBeGreaterThan(100);
    expect(counts['North West']).toBeGreaterThan(100);
    expect(counts['Northern Cape']).toBeGreaterThan(80);
  });

  it('searches malls by suburb and province', () => {
    const res = SouthAfricaMallsStore.searchMalls({ province: 'Gauteng', suburb: 'Sandton', limit: 10 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].province).toBe('Gauteng');
  });

  it('filters malls by shopping centre format type', () => {
    const res = SouthAfricaMallsStore.searchMalls({ marketType: 'formal_mega_mall', limit: 12 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((m) => m.marketType === 'formal_mega_mall')).toBe(true);
  });

  it('performs keyword search by anchor tenant or landmark', () => {
    const res = SouthAfricaMallsStore.searchMalls({ query: 'Woolworths', limit: 10 });
    expect(res.items.length).toBeGreaterThan(0);
  });

  it('retrieves full mall metadata with coordinates and operating hours', () => {
    const res = SouthAfricaMallsStore.searchMalls({ limit: 1 });
    const mall = SouthAfricaMallsStore.getMallById(res.items[0].id);
    expect(mall).not.toBeNull();
    expect(mall?.geo?.latitude).toBeDefined();
    expect(mall?.geo?.longitude).toBeDefined();
    expect(mall?.operatingHours).toBeDefined();
    expect(mall?.zones?.length).toBeGreaterThan(0);
  });
});
