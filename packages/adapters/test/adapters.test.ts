import { describe, it, expect } from 'vitest';
import { InMemorySearchEngine } from '../src/search/search_adapter';
import { TypesenseSearchAdapter, HybridSearchEngine } from '../src/search/typesense_adapter';
import { generateLiveTrustSealSvg } from '../src/seal/trust_seal';
import { buildWhatsAppActionLink } from '../src/comms/whatsapp';
import { GovernedAiGateway } from '../src/ai/grok_gateway';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS, SA_FLAGSHIP_PASSPORTS } from '@shoppage/kernel';

describe('Shoppage Adapters Suite', () => {
  it('executes faceted search and returns ranked hits with live offers', () => {
    const engine = new InMemorySearchEngine();
    for (const variant of SA_CANONICAL_PRODUCTS) {
      engine.indexVariant(variant);
    }
    for (const offer of SA_FLAGSHIP_OFFERS) {
      engine.indexOffer(offer);
    }

    const res = engine.search({
      query: 'Deye 5kW inverter',
      country: 'ZA',
      availability: 'all_confirmed',
      limit: 10,
      offset: 0,
    });

    expect(res.totalHits).toBeGreaterThan(0);
    expect(res.hits[0].variant.brand).toBe('Deye');
    expect(res.hits[0].offers.length).toBeGreaterThan(0);
    expect(res.hits[0].lowestPrice).toBe(19850);
  });

  it('filters search results by category and brand', () => {
    const engine = new InMemorySearchEngine();
    for (const variant of SA_CANONICAL_PRODUCTS) {
      engine.indexVariant(variant);
    }

    const res = engine.search({
      query: '5kW',
      category: 'solar_energy',
      brand: 'Deye',
      country: 'ZA',
      availability: 'all_confirmed',
      limit: 10,
      offset: 0,
    });

    expect(res.totalHits).toBeGreaterThan(0);
    expect(res.hits[0].variant.brand).toBe('Deye');
    expect(res.hits[0].variant.categoryRef).toBe('solar_energy');
  });

  it('generates Live Trust Seal SVG with live telemetry (light theme)', () => {
    const passport = SA_FLAGSHIP_PASSPORTS['loc_sunpower_crownmines'];
    const svg = generateLiveTrustSealSvg(passport, 'light');

    expect(svg).toContain('<svg');
    expect(svg).toContain('SunPower Solutions');
    expect(svg).toContain('Score: 94/100');
    expect(svg).toContain('14 Offers Confirmed Today');
  });

  it('generates Live Trust Seal SVG for dark theme and stale merchant', () => {
    const stalePassport = {
      merchantId: 'loc_test_stale',
      merchantName: 'Sample Electrical',
      score: 82,
      freshOffersTodayCount: 0,
      medianResponseMinutes: 20,
      complaintCountLast90d: 0,
      state: 'VERIFIED_ACTIVE' as const,
    };
    const svg = generateLiveTrustSealSvg(stalePassport, 'dark');

    expect(svg).toContain('<svg');
    expect(svg).toContain('#0F172A'); // dark background
    expect(svg).toContain('Phone Verified');
  });

  it('builds WhatsApp click-to-chat link with attribution ref and prefilled message', () => {
    const waLink = buildWhatsAppActionLink({
      whatsappNumber: '+27829876543',
      productTitle: 'Deye 5kW Inverter',
      price: 19850,
      currency: 'R',
      merchantName: 'SunPower Solutions',
      sourceReferralId: 'evt_test_123',
      universalLinkUrl: 'https://shoppage.co.za/l/off_deye_5kw',
    });

    expect(waLink).toContain('https://wa.me/27829876543');
    expect(waLink).toContain(encodeURIComponent('Deye 5kW Inverter'));
    expect(waLink).toContain(encodeURIComponent('R19,850'));
    expect(waLink).toContain(encodeURIComponent('[Ref: evt_test_123]'));
  });

  it('enforces Draft<T> type-guard on AI gateway output for intent extraction', async () => {
    const gateway = new GovernedAiGateway();
    const draft = await gateway.extractAliasesAndIntent('ngifuna amapaneli 550w eGauteng', 'zu');

    expect(draft.isDraft).toBe(true);
    expect(draft.generatedByModel).toBe('grok-4.6');
    expect(draft.extractedData.aliases[0].locale).toBe('zu');
    expect(draft.extractedData.aliases[0].phrase).toContain('amapaneli');
  });

  it('enforces Draft<T> type-guard on parsing unformatted Bill of Quantities', async () => {
    const gateway = new GovernedAiGateway();
    const rawBoQ = `
      1x Deye 8kW Hybrid Inverter Single Phase
      2x Dyness BX51100 5.12kWh Lithium Battery
      12x 550W Tier 1 Mono PV Solar Panels
    `;
    const draft = await gateway.parseBillOfQuantities(rawBoQ);

    expect(draft.isDraft).toBe(true);
    expect(draft.requiresHumanReview).toBe(true);
    expect(draft.extractedData.length).toBe(3);
    expect(draft.extractedData[0].title).toContain('Deye 8kW');
  });

  it('checks Typesense adapter configuration and health probe resilience', async () => {
    const adapter = new TypesenseSearchAdapter({
      url: 'http://127.0.0.1:8108',
      apiKey: 'test_key',
      timeoutMs: 300,
    });

    expect(adapter.getBaseUrl()).toBe('http://127.0.0.1:8108');
    // Fast health probe returns boolean without unhandled rejection
    const healthy = await adapter.isHealthy();
    expect(typeof healthy).toBe('boolean');
  });

  it('verifies HybridSearchEngine executes transparent fallback when Typesense is offline', async () => {
    const hybrid = new HybridSearchEngine({
      url: 'http://127.0.0.1:8108',
      apiKey: 'test_key',
      timeoutMs: 200,
    });

    for (const variant of SA_CANONICAL_PRODUCTS) {
      hybrid.indexVariant(variant);
    }
    for (const offer of SA_FLAGSHIP_OFFERS) {
      hybrid.indexOffer(offer);
    }

    // Must return valid results using in-memory / FTS5 fallback
    const res = await hybrid.search({
      query: 'Deye 5kW inverter',
      country: 'ZA',
      availability: 'all_confirmed',
      limit: 5,
      offset: 0,
    });

    expect(res.totalHits).toBeGreaterThan(0);
    expect(res.hits[0].variant.brand).toBe('Deye');
    expect(res.hits[0].lowestPrice).toBeGreaterThan(0);

    // Synchronous execution also works
    const syncRes = hybrid.searchSync({
      query: 'Deye 5kW inverter',
      country: 'ZA',
      limit: 5,
      offset: 0,
    });
    expect(syncRes.totalHits).toBeGreaterThan(0);
  });
});
