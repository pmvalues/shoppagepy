import { describe, it, expect } from 'vitest';
import {
  detectIntent,
  parsePriceValue,
  semanticSearch,
  askAssistant,
  getRecommendations,
  getPlatformStats,
} from '../src/lib/intelligence';
import { SHORTS, SHOWS, ALL_MEDIA, getMediaById } from '../src/lib/media';

describe('@shoppage/web Intelligence & Intent Engine', () => {
  describe('parsePriceValue', () => {
    it('parses standard numbers', () => {
      expect(parsePriceValue('25000')).toBe(25000);
      expect(parsePriceValue('R18,999')).toBe(18999);
      expect(parsePriceValue('R 500')).toBe(500);
    });

    it('parses "k" notation correctly', () => {
      expect(parsePriceValue('20k')).toBe(20000);
      expect(parsePriceValue('R15k')).toBe(15000);
      expect(parsePriceValue('1.5k')).toBe(1500);
    });

    it('parses "grand" notation correctly', () => {
      expect(parsePriceValue('20 grand')).toBe(20000);
      expect(parsePriceValue('5 grand')).toBe(5000);
    });

    it('returns undefined for empty/invalid inputs', () => {
      expect(parsePriceValue('')).toBeUndefined();
      expect(parsePriceValue('invalid')).toBeUndefined();
    });
  });

  describe('detectIntent', () => {
    it('detects category, brand, and price ceilings in solar queries', () => {
      const intent = detectIntent('Deye 5kW hybrid inverter under R20000');
      expect(intent.brand).toBe('deye');
      expect(intent.category).toBe('solar_energy');
      expect(intent.maxPrice).toBe(20000);
      expect(intent.wantsCompare).toBe(false);
    });

    it('detects comparison intent and brand pairs', () => {
      const intent = detectIntent('Compare Deye vs Sunsynk 8kW inverters');
      expect(intent.brand).toBe('deye');
      expect(intent.category).toBe('solar_energy');
      expect(intent.wantsCompare).toBe(true);
    });

    it('detects video intent', () => {
      const intent = detectIntent('Show me teardown video of Dyness battery');
      expect(intent.wantsVideo).toBe(true);
      expect(intent.brand).toBe('dyness');
      expect(intent.category).toBe('solar_energy');
    });

    it('detects "k" price ceiling e.g. "under 15k"', () => {
      const intent = detectIntent('Samsung galaxy under 15k');
      expect(intent.brand).toBe('samsung');
      expect(intent.category).toBe('smartphones');
      expect(intent.maxPrice).toBe(15000);
    });

    it('detects hardware and building queries', () => {
      const intent = detectIntent('PPC cement 50kg bag prices in Sandton');
      expect(intent.category).toBe('hardware');
    });
  });

  describe('semanticSearch', () => {
    it('returns structured search results and AI overview for solar queries', () => {
      const result = semanticSearch('solar inverter', { limit: 4 });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.overview).toContain('Shoppage intelligence');
      expect(result.topBrands.length).toBeGreaterThan(0);
      expect(result.totalProducts).toBeGreaterThan(0);
    });

    it('applies price filter to search results', () => {
      const result = semanticSearch('inverter under R50000', { limit: 4 });
      expect(result.intent.maxPrice).toBe(50000);
      expect(result.products.length).toBeGreaterThan(0);
    });
  });

  describe('askAssistant', () => {
    it('returns natural language response with matched products and suppliers', () => {
      const res = askAssistant('I need a 5kW inverter under R20000');
      expect(res.reply).toBeDefined();
      expect(res.products.length).toBeGreaterThan(0);
      expect(res.intent.maxPrice).toBe(20000);
    });

    it('provides helpful guidance for unmapped queries', () => {
      const res = askAssistant('xyznonexistentunobtainium9999');
      expect(res.reply).toContain('catalogue');
    });
  });

  describe('getRecommendations & Platform Stats', () => {
    it('retrieves category-specific recommendations', () => {
      const recs = getRecommendations({ category: 'solar_energy', limit: 4 });
      expect(recs.products.length).toBeGreaterThan(0);
      expect(recs.merchants.length).toBeGreaterThan(0);
    });

    it('retrieves national platform scale counts', () => {
      const stats = getPlatformStats();
      expect(stats.totalProducts).toBeGreaterThanOrEqual(1000000);
      expect(stats.totalMerchants).toBeGreaterThanOrEqual(3000000);
      expect(stats.totalMalls).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('Media Catalogue (Shorts & Shows)', () => {
    it('contains verified video shorts tethered to products', () => {
      expect(SHORTS.length).toBeGreaterThan(0);
      const firstShort = SHORTS[0];
      expect(firstShort.type).toBe('short');
      expect(firstShort.videoUrl).toContain('.mp4');
      expect(firstShort.merchantWhatsApp).toBeDefined();
    });

    it('contains verified video shows with market walk tours', () => {
      expect(SHOWS.length).toBeGreaterThan(0);
      const firstShow = SHOWS[0];
      expect(firstShow.type).toBe('show');
      expect(firstShow.series).toBeDefined();
    });

    it('retrieves media by ID correctly', () => {
      const item = getMediaById('sh_01');
      expect(item).toBeDefined();
      expect(item?.id).toBe('sh_01');
    });
  });
});
