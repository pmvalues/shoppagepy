import { describe, it, expect } from 'vitest';
import {
  SearchQuerySchema,
  CreateRequestSchema,
  ReferralActionLogSchema,
  QuickFreshnessConfirmSchema,
} from '../src/schemas';
import type {
  MasterProduct,
  Merchant,
  Offer,
  Market,
  TrustPassport,
  ReferralActionEvent,
} from '../src/types';

describe('@shoppage/contracts Domain Schemas & Contracts', () => {
  describe('SearchQuerySchema', () => {
    it('parses valid search query and applies standard defaults', () => {
      const parsed = SearchQuerySchema.parse({
        query: 'solar inverter 5kw',
      });

      expect(parsed.query).toBe('solar inverter 5kw');
      expect(parsed.country).toBe('ZA');
      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(0);
      expect(parsed.availability).toBe('all_confirmed');
    });

    it('parses structured query with filters and geographic constraints', () => {
      const parsed = SearchQuerySchema.parse({
        query: 'deye',
        category: 'solar_energy',
        brand: 'Deye',
        province: 'Gauteng',
        metro: 'Johannesburg',
        lat: -26.2041,
        lng: 28.0473,
        maxDistanceKm: 25,
        limit: 50,
        offset: 10,
        availability: 'fresh_only',
      });

      expect(parsed.category).toBe('solar_energy');
      expect(parsed.brand).toBe('Deye');
      expect(parsed.province).toBe('Gauteng');
      expect(parsed.lat).toBe(-26.2041);
      expect(parsed.limit).toBe(50);
      expect(parsed.offset).toBe(10);
    });

    it('rejects empty query string or out-of-range limit', () => {
      expect(() => SearchQuerySchema.parse({ query: '' })).toThrow();
      expect(() => SearchQuerySchema.parse({ query: 'valid', limit: 500 })).toThrow();
      expect(() => SearchQuerySchema.parse({ query: 'valid', lat: 100 })).toThrow();
    });
  });

  describe('CreateRequestSchema', () => {
    it('validates a complete buyer sourcing request', () => {
      const validReq = {
        needDescription: 'Need 1x Deye 8kW Hybrid Inverter + 10kWh battery combo in Sandton',
        categoryRef: 'solar_energy',
        quantity: 1,
        country: 'ZA',
        province: 'Gauteng',
        metro: 'Johannesburg',
        urgency: 'immediate_today' as const,
        contactConsent: true,
        visibility: 'public_board' as const,
        buyerPhone: '+27821234567',
      };

      const parsed = CreateRequestSchema.parse(validReq);
      expect(parsed.needDescription).toContain('Deye 8kW');
      expect(parsed.urgency).toBe('immediate_today');
      expect(parsed.buyerPhone).toBe('+27821234567');
    });

    it('rejects description too short or invalid phone', () => {
      expect(() =>
        CreateRequestSchema.parse({
          needDescription: 'Hi',
          buyerPhone: '+27821234567',
        })
      ).toThrow();

      expect(() =>
        CreateRequestSchema.parse({
          needDescription: 'Valid description of need',
          buyerPhone: '123',
        })
      ).toThrow();
    });
  });

  describe('ReferralActionLogSchema', () => {
    it('validates standard referral action event logging', () => {
      const parsed = ReferralActionLogSchema.parse({
        sessionFingerprint: 'sess_client_abcdef123',
        merchantRef: 'loc_sunpower_crownmines',
        variantRef: 'var_deye_5kw_hybrid',
        action: 'whatsapp_start',
        confidenceScore: 0.95,
        metadata: {
          utmSource: 'organic_search',
        },
      });

      expect(parsed.action).toBe('whatsapp_start');
      expect(parsed.confidenceScore).toBe(0.95);
      expect(parsed.country).toBe('ZA');
    });

    it('rejects invalid action type or missing session fingerprint', () => {
      expect(() =>
        ReferralActionLogSchema.parse({
          sessionFingerprint: 'sess_12345678',
          merchantRef: 'loc_01',
          action: 'invalid_action_type' as any,
        })
      ).toThrow();

      expect(() =>
        ReferralActionLogSchema.parse({
          sessionFingerprint: 'short',
          merchantRef: 'loc_01',
          action: 'impression',
        })
      ).toThrow();
    });
  });

  describe('QuickFreshnessConfirmSchema', () => {
    it('validates merchant price and stock status update', () => {
      const parsed = QuickFreshnessConfirmSchema.parse({
        offerId: 'off_01',
        merchantId: 'mer_01',
        stockState: 'in_stock',
        confirmedPrice: 18999,
        currency: 'ZAR',
      });

      expect(parsed.stockState).toBe('in_stock');
      expect(parsed.confirmedPrice).toBe(18999);
    });

    it('rejects negative price', () => {
      expect(() =>
        QuickFreshnessConfirmSchema.parse({
          offerId: 'off_01',
          merchantId: 'mer_01',
          stockState: 'in_stock',
          confirmedPrice: -500,
        })
      ).toThrow();
    });
  });

  describe('TypeScript Domain Types Structure', () => {
    it('constructs a valid MasterProduct object', () => {
      const product: MasterProduct = {
        canonicalId: 'test_prod_01',
        familyRef: 'fam_solar',
        categoryRef: 'solar_energy',
        title: '5kW Inverter Master Spec',
        brand: 'Deye',
        identifiers: {
          gtin13: '6001234567890',
        },
        attributes: {
          ratedPowerW: 5000,
        },
        aliases: [
          {
            phrase: '5kva inverter',
            locale: 'en',
            source: 'merchant_usage',
            confidence: 0.9,
          },
        ],
        compatibilityEdgeCount: 3,
        status: 'active',
        countryScope: ['ZA'],
        provenance: {
          sourceRef: 'test_spec',
          rightsClass: 'PUBLIC_RECORD',
          confidence: 1.0,
          fieldOwner: 'TEST',
          validFrom: '2026-01-01T00:00:00Z',
        },
      };

      expect(product.canonicalId).toBe('test_prod_01');
      expect(product.countryScope).toContain('ZA');
    });

    it('constructs a valid TrustPassport structure', () => {
      const passport: TrustPassport = {
        merchantId: 'loc_01',
        merchantName: 'Crown Mines Solar Hub',
        score: 95,
        freshOffersTodayCount: 12,
        medianResponseMinutes: 8,
        complaintCountLast90d: 0,
        state: 'VERIFIED_ACTIVE',
      };

      expect(passport.score).toBe(95);
      expect(passport.state).toBe('VERIFIED_ACTIVE');
    });
  });
});
