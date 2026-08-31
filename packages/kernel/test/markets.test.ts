import { describe, it, expect } from 'vitest';
import {
  validateMarketContainment,
  SA_FLAGSHIP_MARKETS,
  SA_COMPREHENSIVE_MARKETS,
} from '../src/index';

describe('Markets-in-Markets Graph Engine', () => {
  it('rejects containment claim when evidence is missing (proximity-only rejection)', () => {
    const parentMarket = SA_FLAGSHIP_MARKETS[0]; // Sandton City
    const res = validateMarketContainment(parentMarket, 'child_stall_1');

    expect(res.isContained).toBe(false);
    expect(res.reason).toContain('Proximity alone cannot establish market containment');
  });

  it('approves containment claim when valid lease/polygon evidence is provided', () => {
    const parentMarket = SA_FLAGSHIP_MARKETS[0];
    const res = validateMarketContainment(parentMarket, 'child_stall_1', {
      evidenceType: 'official_mall_map',
      evidenceRef: 'doc_sandton_floorplan_level2',
    });

    expect(res.isContained).toBe(true);
    expect(res.reason).toContain('Containment verified via official_mall_map');
  });

  it('rejects self-containment cycle', () => {
    const market = SA_FLAGSHIP_MARKETS[0];
    const res = validateMarketContainment(market, market.id, {
      evidenceType: 'cadastral_polygon',
      evidenceRef: 'ref_123',
    });

    expect(res.isContained).toBe(false);
    expect(res.reason).toContain('Self-containment cycle detected');
  });

  it('contains comprehensive South African physical markets with valid Google Maps coordinates and sub-zones', () => {
    const physicalMarkets = SA_COMPREHENSIVE_MARKETS.filter((m) => !m.marketType.startsWith('virtual_'));
    expect(physicalMarkets.length).toBeGreaterThanOrEqual(10);

    const dragonCity = physicalMarkets.find((m) => m.id === 'mkt_dragon_city');
    expect(dragonCity).toBeDefined();
    expect(dragonCity?.geo?.latitude).toBeLessThan(0); // South Africa latitude is negative
    expect(dragonCity?.geo?.longitude).toBeGreaterThan(0); // South Africa longitude is positive
    expect(dragonCity?.geo?.googleMapsUrl).toContain('maps.google.com');
    expect(dragonCity?.zones?.length).toBeGreaterThanOrEqual(3);

    const warwick = physicalMarkets.find((m) => m.id === 'mkt_warwick_junction');
    expect(warwick).toBeDefined();
    expect(warwick?.zones?.some((z) => z.name.includes('Herb Market'))).toBe(true);
  });

  it('contains virtual marketplaces and B2B trade networks with platform metadata', () => {
    const virtualMarkets = SA_COMPREHENSIVE_MARKETS.filter((m) => m.marketType.startsWith('virtual_'));
    expect(virtualMarkets.length).toBeGreaterThanOrEqual(5);

    const solarGuild = virtualMarkets.find((m) => m.id === 'vmkt_renewable_energy');
    expect(solarGuild).toBeDefined();
    expect(solarGuild?.virtualMeta?.platformUrl).toBe('/markets/vmkt_renewable_energy');

    const packagingGuild = virtualMarkets.find((m) => m.id === 'vmkt_packaging_hospitality');
    expect(packagingGuild).toBeDefined();
    expect(packagingGuild?.marketType).toBe('virtual_b2b_network');
  });
});
