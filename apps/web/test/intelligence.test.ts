import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  semanticSearch,
  askAssistant,
  getRecommendations,
  getPlatformStats,
} from '../src/lib/intelligence';
import { LLMError, completeChat } from '../src/lib/llm';
import { SHORTS, SHOWS, ALL_MEDIA, getMediaById } from '../src/lib/media';

const OLD_KEY = process.env.GEMINI_API_KEY;

function mockJsonOnce(payload: unknown, status = 200) {
  const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response);
}

function geminiText(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

function geminiTools(calls: Array<{ name: string; args: Record<string, unknown> }>, text = '') {
  return {
    candidates: [
      {
        content: {
          parts: [
            ...(text ? [{ text }] : []),
            ...calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })),
          ],
        },
      },
    ],
  };
}

describe('@shoppage/web LLM assistant (Gemini + real kernel tools)', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    if (OLD_KEY === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = OLD_KEY;
    vi.unstubAllGlobals();
  });

  describe('llm client', () => {
    it('throws NOT_CONFIGURED when the API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(completeChat({ system: 's', message: 'hi' })).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns text plus parsed tool calls', async () => {
      mockJsonOnce(
        geminiTools([{ name: 'searchCatalog', args: { query: 'inverter' } }], 'Looking that up'),
      );
      const res = await completeChat({ system: 's', message: 'inverter', tools: [] });
      expect(res.text).toBe('Looking that up');
      expect(res.toolCalls).toEqual([{ name: 'searchCatalog', args: { query: 'inverter' } }]);
    });

    it('maps 401 to AUTH and 429 to retryable RATE_LIMITED', async () => {
      mockJsonOnce({ error: { message: 'bad key' } }, 401);
      await expect(completeChat({ system: 's', message: 'hi' })).rejects.toMatchObject({
        code: 'AUTH',
      });

      mockJsonOnce({ error: { message: 'slow down' } }, 429);
      mockJsonOnce({ error: { message: 'slow down' } }, 429);
      const err = await completeChat({ system: 's', message: 'hi' }).catch((e) => e);
      expect(err).toBeInstanceOf(LLMError);
      expect((err as LLMError).code).toBe('RATE_LIMITED');
      expect((err as LLMError).retryable).toBe(true);
    });

    it('rejects empty provider responses', async () => {
      mockJsonOnce({ candidates: [{ content: { parts: [] } }] });
      await expect(completeChat({ system: 's', message: 'hi' })).rejects.toMatchObject({
        code: 'BAD_RESPONSE',
      });
    });
  });

  describe('askAssistant', () => {
    it('answers product questions from real kernel tools', async () => {
      mockJsonOnce(
        geminiTools([
          { name: 'searchCatalog', args: { query: '5kW inverter', brand: 'deye', maxPrice: 20000 } },
        ]),
      );
      mockJsonOnce(geminiText('The Deye 5kW is in stock at a live counter.'));
      const res = await askAssistant('I need a 5kW inverter under R20000');
      expect(res.products.length).toBeGreaterThan(0);
      expect(res.intent.brand).toBe('deye');
      expect(res.intent.maxPrice).toBe(20000);
      expect(res.reply).toContain('Deye 5kW');
      expect(res.toolCalls?.some((t) => t.tool === 'searchProducts') ?? false).toBe(true);
    });

    it('runs the solar runtime calculator through the model', async () => {
      mockJsonOnce(
        geminiTools([{ name: 'calcRuntime', args: { batteryKwh: 5, loadWatts: 500 } }]),
      );
      mockJsonOnce(geminiText('About 10 hours of backup.'));
      const res = await askAssistant('How long will a 5kWh battery run 500W?');
      expect(res.calculationResult).toBeDefined();
      expect(res.calculationResult?.hours).toBeGreaterThan(0);
      expect(res.intent.isSolarCalculation).toBe(true);
    });

    it('falls back to honest templated answers when finalization fails', async () => {
      mockJsonOnce(geminiTools([{ name: 'searchCatalog', args: { query: 'inverter' } }]));
      (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));
      const res = await askAssistant('inverter deals');
      expect(res.products.length).toBeGreaterThan(0);
      expect(res.reply).toContain('Top matches with confirmed stock');
    });

    it('is honest when nothing matches', async () => {
      mockJsonOnce(geminiText('I will check the catalogue.'));
      mockJsonOnce(geminiText('No match in the live catalogue.'));
      const res = await askAssistant('xyznonexistentunobtainium9999');
      expect(res.products.length).toBe(0);
      expect(res.reply).toContain('No match in the live catalogue.');
    });

    it('refuses to run without configuration', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(askAssistant('hello')).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });
  });

  describe('semanticSearch', () => {
    it('degrades to direct catalogue retrieval without LLM configuration', async () => {
      delete process.env.GEMINI_API_KEY;
      const result = await semanticSearch('solar inverter', { limit: 4 });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.overview).toContain('Shoppage intelligence');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns structured search results and AI overview for solar queries', async () => {
      mockJsonOnce(geminiTools([{ name: 'searchCatalog', args: { query: 'solar inverter' } }]));
      mockJsonOnce(geminiText('Solar inverters in stock.'));
      const result = await semanticSearch('solar inverter', { limit: 4 });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.overview).toContain('Shoppage intelligence');
      expect(result.topBrands.length).toBeGreaterThan(0);
      expect(result.totalProducts).toBeGreaterThan(0);
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
      expect(ALL_MEDIA.length).toBeGreaterThanOrEqual(SHORTS.length);
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
