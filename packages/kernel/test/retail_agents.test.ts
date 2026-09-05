import { describe, it, expect } from 'vitest';
import {
  LinkVerifierAgent,
  ProductCleansingAgent,
  MerchantSourcingAgent,
  RetailNewsAgent,
  ChangeDetectorAgent,
  AutonomousRetailAgentOrchestrator,
  RawProductOffer,
} from '../src';
import { DiscoveredOffer } from '@shoppage/contracts';

describe('Autonomous Retail Intelligence Agents Suite', () => {
  describe('LinkVerifierAgent', () => {
    const verifier = new LinkVerifierAgent();

    it('cleans tracking parameters while preserving catalog parameters', () => {
      const dirtyUrl =
        'https://www.takealot.com/deye-5kw-hybrid-inverter/PLID91428540?utm_source=google&utm_medium=cpc&utm_campaign=winter_sale&fbclid=IwAR2xyz&p=91428540';
      const cleaned = verifier.cleanUrl(dirtyUrl);

      expect(cleaned).not.toContain('utm_source');
      expect(cleaned).not.toContain('utm_medium');
      expect(cleaned).not.toContain('fbclid');
      expect(cleaned).toContain('PLID91428540');
      expect(cleaned).toContain('p=91428540');
    });

    it('correctly handles non-HTTP or malformed URLs', async () => {
      const res = await verifier.verifyLink('not-a-valid-url');
      expect(res.status).toBe('DEAD_404');
      expect(res.isWorking).toBe(false);
    });

    it('detects live 200 OK links with custom fetch mock', async () => {
      const mockFetch = async (url: any) =>
        ({
          status: 200,
          ok: true,
          url,
          text: async () => '<html><body>Product in stock ready to order</body></html>',
        } as any);

      const agent = new LinkVerifierAgent({ customFetch: mockFetch as any });
      const res = await agent.verifyLink('https://www.takealot.com/product/PLID123');

      expect(res.status).toBe('LIVE');
      expect(res.isWorking).toBe(true);
      expect(res.httpStatusCode).toBe(200);
    });

    it('detects HTTP 404 dead links', async () => {
      const mockFetch = async (url: any) =>
        ({
          status: 404,
          ok: false,
          url,
          text: async () => 'Not Found',
        } as any);

      const agent = new LinkVerifierAgent({ customFetch: mockFetch as any });
      const res = await agent.verifyLink('https://www.builders.co.za/broken-link/p/0000');

      expect(res.status).toBe('DEAD_404');
      expect(res.isWorking).toBe(false);
      expect(res.httpStatusCode).toBe(404);
    });

    it('detects Soft-404 pages with discontinued/unavailable text in HTML', async () => {
      const mockFetch = async (url: any) =>
        ({
          status: 200,
          ok: true,
          url,
          text: async () => '<html><body>Sorry, this product not found or has been discontinued.</body></html>',
        } as any);

      const agent = new LinkVerifierAgent({ customFetch: mockFetch as any });
      const res = await agent.verifyLink('https://www.makro.co.za/p/old-item');

      expect(res.status).toBe('SOFT_404');
      expect(res.isWorking).toBe(false);
    });

    it('detects redirects and tracks canonical destination URL', async () => {
      const mockFetch = async (_url: any) =>
        ({
          status: 200,
          ok: true,
          url: 'https://www.leroymerlin.co.za/deye-5kw-hybrid-inverter-canonical',
          text: async () => '<html><body>Canonical Product Page</body></html>',
        } as any);

      const agent = new LinkVerifierAgent({ customFetch: mockFetch as any });
      const res = await agent.verifyLink('https://www.leroymerlin.co.za/old-slug');

      expect(res.status).toBe('REDIRECTED');
      expect(res.finalDestinationUrl).toBe('https://www.leroymerlin.co.za/deye-5kw-hybrid-inverter-canonical');
      expect(res.isWorking).toBe(true);
    });
  });

  describe('ProductCleansingAgent', () => {
    const cleanser = new ProductCleansingAgent();

    it('de-noises clickbait promotional phrases, emojis, and boilerplate suffixes', () => {
      const rawTitle = '🔥 HOT DEAL!! Deye 5kW Hybrid Inverter 48V (South Africa Spec) · SABS Approved Standard >> BUY NOW';
      const clean = cleanser.cleanTitle(rawTitle);

      expect(clean).not.toContain('HOT DEAL');
      expect(clean).not.toContain('🔥');
      expect(clean).not.toContain('BUY NOW');
      expect(clean).not.toContain('(South Africa Spec)');
      expect(clean).not.toContain('SABS Approved Standard');
      expect(clean).toBe('Deye 5kW Hybrid Inverter 48V');
    });

    it('canonicalizes brand names and infers from product title when brand is omitted', () => {
      expect(cleanser.canonicalizeBrand('DEYE INVERTERS')).toBe('Deye');
      expect(cleanser.canonicalizeBrand('sunsynk')).toBe('Sunsynk');
      expect(cleanser.canonicalizeBrand('PPC CEMENT')).toBe('PPC');
      expect(cleanser.canonicalizeBrand('victron energy')).toBe('Victron Energy');
      // Inferred from title:
      expect(cleanser.canonicalizeBrand('', 'Samsung 65 Inch 4K Smart TV')).toBe('Samsung');
    });

    it('extracts technical specifications (kW, kWh, Ah, V, Litres, kg, Inches)', () => {
      const title = 'Deye 5kW Hybrid Inverter 48V with Dyness 5.12kWh 100Ah Lithium Battery JoJo 2500L Tank';
      const specs = cleanser.extractSpecs(title);

      expect(specs.powerKw).toBe(5);
      expect(specs.voltage).toBe('48V');
      expect(specs.energyKwh).toBe(5.12);
      expect(specs.capacityAh).toBe(100);
      expect(specs.volumeLitres).toBe(2500);
    });

    it('sanitizes ZAR numerical prices and computes verified discounts and badges', () => {
      const res = cleanser.sanitizePrice('R 17,999.00', 'R 21,999.00');

      expect(res.priceZar).toBe(17999);
      expect(res.oldPriceZar).toBe(21999);
      expect(res.discountPct).toBe(18);
      expect(res.dealBadge).toBe('⚡ SAVE 18%');
      expect(res.rawPriceText).toContain('17,999.00');
    });

    it('validates image URLs and applies category fallbacks for broken/placeholder images', () => {
      const invalidRes = cleanser.validateAndCleanImage('http://example.com/1x1-pixel.png', 'solar_energy');
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.isFallback).toBe(true);
      expect(invalidRes.imageUrl).toContain('images.unsplash.com');

      const validRes = cleanser.validateAndCleanImage('https://media.takealot.com/covers_ts/12345.jpg', 'electronics');
      expect(validRes.isValid).toBe(true);
      expect(validRes.isFallback).toBe(false);
      expect(validRes.imageUrl).toBe('https://media.takealot.com/covers_ts/12345.jpg');
    });

    it('cleans a full raw product offer end-to-end', () => {
      const raw: RawProductOffer = {
        title: '⚡ SPECIAL PROMOTION: PPC Surebuild Cement 50kg (Includes VAT) 🔥',
        brand: 'PPC CEMENT',
        category: 'hardware',
        price: 'R 115.00',
        oldPrice: 'R 139.00',
        merchantName: 'Makro South Africa',
        sourceWebsite: 'makro.co.za',
        sourceUrl: 'https://www.makro.co.za/cement',
      };

      const cleansed = cleanser.cleanProduct(raw);
      expect(cleansed.cleanTitle).toBe('PPC Surebuild Cement 50kg');
      expect(cleansed.canonicalBrand).toBe('PPC');
      expect(cleansed.priceZar).toBe(115);
      expect(cleansed.discountPct).toBe(17);
      expect(cleansed.dealBadge).toBe('⚡ SAVE 17%');
      expect(cleansed.extractedSpecs.weightKg).toBe(50);
    });
  });

  describe('MerchantSourcingAgent', () => {
    const merchantAgent = new MerchantSourcingAgent();

    it('normalizes South African phone numbers to standard format', () => {
      expect(merchantAgent.normalizePhoneNumber('0821234567')).toBe('+27 82 123 4567');
      expect(merchantAgent.normalizePhoneNumber('011 456 7890')).toBe('+27 11 456 7890');
      expect(merchantAgent.normalizePhoneNumber('27839998877')).toBe('+27 83 999 8877');
    });

    it('normalizes operating hours with default fallbacks', () => {
      expect(merchantAgent.normalizeOperatingHours('')).toBe('Mon-Sat: 08:30 - 18:00 | Sun: 09:00 - 16:00');
      expect(merchantAgent.normalizeOperatingHours('Mon-Fri 8am-5pm')).toBe('Mon-Fri 8am-5pm');
    });

    it('classifies major national chains and normalizes merchant footprint', () => {
      const merchant = merchantAgent.normalizeMerchant({
        name: 'Builders Warehouse Rivonia',
        tradingName: 'Builders Warehouse Rivonia',
        telephone: '011 800 1234',
        suburb: 'Rivonia',
        province: 'Gauteng',
      });

      expect(merchant.retailerTier).toBe('major_national_chain');
      expect(merchant.contacts.telephone).toBe('+27 11 800 1234');
      expect(merchant.brandSlug).toBe('builders-warehouse-rivonia');
    });
  });

  describe('RetailNewsAgent', () => {
    const newsAgent = new RetailNewsAgent();

    it('aggregates active weekly retail circular campaigns', () => {
      const campaigns = newsAgent.getActiveCampaigns();
      expect(campaigns.length).toBeGreaterThan(0);

      const first = campaigns[0];
      expect(first.headline).toBeDefined();
      expect(first.featuredDeals.length).toBeGreaterThan(0);
      expect(first.campaignType).toBe('weekly_circular');
    });

    it('searches specials by category and discount threshold', () => {
      const hardwareDeals = newsAgent.searchSpecials({ category: 'hardware', minDiscountPct: 10 });
      expect(hardwareDeals.length).toBeGreaterThan(0);
      expect(hardwareDeals[0].category).toBe('hardware');
      expect(hardwareDeals[0].discountPct).toBeGreaterThanOrEqual(10);
    });
  });

  describe('ChangeDetectorAgent', () => {
    const detector = new ChangeDetectorAgent();

    const existingOffer: DiscoveredOffer = {
      id: 'disc_var_deye_5kw_takealot',
      masterProductRef: 'var_deye_5kw_hybrid',
      merchantName: 'Takealot.com',
      sourceWebsite: 'takealot.com',
      sourceUrl: 'https://www.takealot.com/deye-5kw/PLID91428540',
      discoveredPrice: {
        amount: 19999,
        currency: 'ZAR',
      },
      availabilityText: 'In Stock (Next Day Dispatch)',
      discoverySource: 'retailer_web_sweep',
      confidenceScore: 0.98,
      discoveredAt: '2026-09-01T10:00:00Z',
      status: 'discovered',
    };

    it('detects price drop and computes percentage discount', () => {
      const changes = detector.detectChanges(existingOffer, {
        masterProductRef: 'var_deye_5kw_hybrid',
        merchantName: 'Takealot.com',
        priceZar: 16999, // R3,000 drop (15%)
        availabilityText: 'In Stock',
      });

      expect(changes.length).toBe(1);
      expect(changes[0].changeType).toBe('PRICE_DROP');
      expect(changes[0].oldPriceZar).toBe(19999);
      expect(changes[0].newPriceZar).toBe(16999);
      expect(changes[0].pctChange).toBe(15);
      expect(changes[0].priceDiffZar).toBe(3000);
    });

    it('detects transition from in stock to out of stock', () => {
      const changes = detector.detectChanges(existingOffer, {
        masterProductRef: 'var_deye_5kw_hybrid',
        merchantName: 'Takealot.com',
        priceZar: 19999,
        availabilityText: 'Sold Out / Temporarily Out of Stock',
      });

      expect(changes.some((c) => c.changeType === 'OUT_OF_STOCK')).toBe(true);
    });

    it('detects canonical URL redirection/update', () => {
      const changes = detector.detectChanges(existingOffer, {
        masterProductRef: 'var_deye_5kw_hybrid',
        merchantName: 'Takealot.com',
        priceZar: 19999,
        availabilityText: 'In Stock',
        sourceUrl: 'https://www.takealot.com/deye-5kw-hybrid-inverter-48v/PLID91428540',
      });

      expect(changes.some((c) => c.changeType === 'URL_UPDATED')).toBe(true);
    });

    it('retains audit history across detections', () => {
      const history = detector.getAuditHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('AutonomousRetailAgentOrchestrator', () => {
    it('executes the full pipeline in dry-run mode and returns telemetry', async () => {
      const mockFetch = async (url: any) =>
        ({
          status: 200,
          ok: true,
          url,
          text: async () => '<html><body>Verified Live Product Page</body></html>',
        } as any);

      const orchestrator = new AutonomousRetailAgentOrchestrator({
        verifierOptions: { customFetch: mockFetch as any },
      });

      const rawFeeds: RawProductOffer[] = [
        {
          title: '🔥 MASSIVE SAVINGS: Deye 5kW 48V Hybrid Inverter (South Africa Spec)',
          brand: 'DEYE',
          category: 'solar_energy',
          price: 'R 17,499.00',
          oldPrice: 'R 19,999.00',
          merchantName: 'SolarAdvice South Africa',
          sourceWebsite: 'solaradvice.co.za',
          sourceUrl: 'https://solaradvice.co.za/shop/deye-5kw-hybrid-inverter/',
        },
        {
          title: 'Samsung Galaxy A16 128GB LTE Dual SIM - Black',
          brand: 'Samsung',
          category: 'electronics',
          price: 2999,
          merchantName: 'Takealot.com',
          sourceWebsite: 'takealot.com',
          sourceUrl: 'https://www.takealot.com/samsung-a16/PLID95182930',
        },
      ];

      const telemetry = await orchestrator.processBatch(rawFeeds, {
        dryRun: true,
      });

      expect(telemetry.totalIngested).toBe(2);
      expect(telemetry.cleansedCount).toBe(2);
      expect(telemetry.verifiedLiveCount).toBe(2);
      expect(telemetry.dead404sCount).toBe(0);
      expect(telemetry.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('identifies and marks dead 404 links during batch processing', async () => {
      const mockFetch = async (url: string) => {
        if (url.includes('broken-dead-item')) {
          return { status: 404, ok: false, url, text: async () => 'Not Found' } as any;
        }
        return { status: 200, ok: true, url, text: async () => 'OK' } as any;
      };

      const orchestrator = new AutonomousRetailAgentOrchestrator({
        verifierOptions: { customFetch: mockFetch as any },
      });

      const rawFeeds: RawProductOffer[] = [
        {
          title: 'JoJo 2500L Vertical Water Tank Green',
          brand: 'JoJo',
          category: 'hardware',
          price: 3499,
          merchantName: 'Builders Warehouse',
          sourceWebsite: 'builders.co.za',
          sourceUrl: 'https://www.builders.co.za/broken-dead-item/p/404',
        },
      ];

      const telemetry = await orchestrator.processBatch(rawFeeds, { dryRun: true });
      expect(telemetry.dead404sCount).toBe(1);
      expect(telemetry.deadLinkUrls).toContain('https://www.builders.co.za/broken-dead-item/p/404');
    });
  });
});
