// Server-side "intelligence" layer for Shoppage.
// Wires the kernel's real data stores to semantic-style search, recommendations,
// and a rule-based commerce assistant. No external LLM key is required — the
// GovernedAiGateway provides local intent/alias extraction and the rest is
// deterministic kernel querying with generated natural-language summaries.

import {
  MasterProductStore,
  NationwideMerchantStore,
  SouthAfricaMallsStore,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';
import type { ProductVariant, Merchant, Offer } from '@shoppage/contracts';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  solar_energy: [
    'solar', 'inverter', 'battery', 'backup', 'power', 'deye', 'sunsynk', 'dyness', 'panel', 'pv',
    'load shedding', 'loadshedding', 'ups', 'hybrid', 'lifepo4', 'pylontech', 'hubble', 'growatt',
    'victron', 'must', 'geyser timer', 'generator', 'stage 6', 'lithium'
  ],
  smartphones: [
    'phone', 'smartphone', 'samsung', 'apple', 'iphone', 'android', 'galaxy', 'a16', 'a55', 'tablet',
    'cellphone', 'mobile', 'xiaomi', 'redmi', 'oppo', 'honor', 'oraimo', 'airpods', 'earbuds'
  ],
  hardware: [
    'hardware', 'cement', 'surebuild', 'ppc', 'brick', 'paint', 'tool', 'drill', 'building', 'plumbing',
    'tile', 'steel', 'timber', 'jojo', 'borehole', 'pump', 'welder', 'angle grinder'
  ],
  groceries: [
    'food', 'grocery', 'fmcg', 'maize', 'rice', 'sugar', 'oil', 'flour', 'tin', 'can', 'spaza',
    'beverage', 'bulk food', 'pantry'
  ],
  pharmacy: [
    'pharmacy', 'medicine', 'health', 'vitamin', 'supplement', 'pill', 'tablet med', 'dischem', 'clicks', 'first aid'
  ],
  automotive: [
    'car', 'auto', 'spare', 'tyre', 'tire', 'engine oil', 'brake', 'vehicle', 'car battery', 'alternator'
  ],
};

const BRAND_HINTS = [
  'deye', 'sunsynk', 'dyness', 'samsung', 'apple', 'huawei', 'lg', 'sony', 'oraimo',
  'xis', 'victron', 'growatt', 'pylontech', 'hubble', 'must', 'ja solar', 'canadian solar'
];

export interface SearchIntent {
  normalizedQuery: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  location?: string;
  wantsVideo: boolean;
  wantsCompare: boolean;
}

/**
 * Parses numeric price representations including "k", "grand", and comma separators
 */
export function parsePriceValue(raw: string): number | undefined {
  if (!raw) return undefined;
  const clean = raw.toLowerCase().trim().replace(/^r\s*/i, '').replace(/,/g, '');
  
  // Handle "grand" e.g. "20 grand"
  const grandMatch = clean.match(/^([\d.]+)\s*grand/i);
  if (grandMatch) {
    const val = parseFloat(grandMatch[1]);
    return isNaN(val) ? undefined : Math.round(val * 1000);
  }

  // Handle "k" e.g. "20k", "1.5k"
  const kMatch = clean.match(/^([\d.]+)\s*k$/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    return isNaN(val) ? undefined : Math.round(val * 1000);
  }

  const num = parseInt(clean, 10);
  return isNaN(num) ? undefined : num;
}

export function detectIntent(raw: string): SearchIntent {
  const text = (raw || '').toLowerCase().trim();

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  // Match "under R20000", "under 20k", "below 15000", "less than 20 grand", "max R5k"
  const under = text.match(/(?:under|below|less than|cheaper than|max|up to)\s*(?:r\s*)?([\d,.]+\s*(?:k|grand)?)/i);
  if (under) {
    maxPrice = parsePriceValue(under[1]);
  }

  // Match "over R10k", "above 15000", "more than 5k", "min 2000", "from R10k"
  const over = text.match(/(?:over|above|more than|min|from)\s*(?:r\s*)?([\d,.]+\s*(?:k|grand)?)/i);
  if (over) {
    minPrice = parsePriceValue(over[1]);
  }

  const brand = BRAND_HINTS.find((b) => text.includes(b));

  let category: string | undefined;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => text.includes(k))) {
      category = cat;
      break;
    }
  }

  const loc = text.match(/(?:in|near|around|at)\s+([a-z ]+?)(?:\s+(?:for|with|under|below|that|and|$))/);
  const location = loc ? loc[1].trim() : undefined;

  const wantsVideo = /video|short|watch|youtube|clip|demo|teardown|walk/.test(text);
  const wantsCompare = /compare|vs|versus|difference|which|better/.test(text);

  return { normalizedQuery: text, category, brand, maxPrice, minPrice, location, wantsVideo, wantsCompare };
}

export function cleanSearchQuery(text: string): string {
  return text
    .replace(/(?:under|below|less than|cheaper than|max|up to|over|above|more than|min|from)\s*(?:r\s*)?[\d,.]+\s*(?:k|grand)?/gi, ' ')
    .replace(/\b(?:i\s+need|i\s+want|looking\s+for|give\s+me|find\s+me|show\s+me|where\s+to\s+buy|price\s+of|prices\s+for|can\s+i\s+get|please)\b/gi, ' ')
    .replace(/\b\d[\d,]*\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function priceOf(p: ProductVariant): number | undefined {
  const offers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === p.canonicalId);
  if (offers.length) {
    const nums = offers.map((o) => o.price.amount).filter((n): n is number => typeof n === 'number');
    if (nums.length) return Math.min(...nums);
  }
  const est = (p.attributes as Record<string, unknown>)?.estimatedPriceZar;
  return typeof est === 'number' ? est : undefined;
}

function offersFor(variantRef: string): Offer[] {
  return SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === variantRef);
}

export interface PriceStats {
  min: number;
  max: number;
  avg: number;
}

export interface SearchResult {
  query: string;
  intent: SearchIntent;
  overview: string;
  products: ProductVariant[];
  merchants: Merchant[];
  offersByProduct: Record<string, Offer[]>;
  priceStats?: PriceStats;
  topBrands: string[];
  totalProducts: number;
  totalMerchants: number;
}

function buildOverview(
  query: string,
  intent: SearchIntent,
  totalProducts: number,
  totalMerchants: number,
  priceStats: PriceStats | undefined,
  topBrands: string[]
): string {
  const scope = intent.category
    ? `in the ${intent.category.replace(/_/g, ' ')} category`
    : 'across the national catalogue';
  const brandLine = intent.brand ? ` focused on ${intent.brand.toUpperCase()} ` : ' ';
  const priceLine = priceStats
    ? ` Live pricing currently ranges from R ${priceStats.min.toLocaleString()} to R ${priceStats.max.toLocaleString()} (avg R ${priceStats.avg.toLocaleString()}).`
    : ' Live local pricing is being confirmed with merchants.';
  const brandSummary = topBrands.length
    ? ` Top matching brands: ${topBrands.slice(0, 4).join(', ')}.`
    : '';
  return `Shoppage intelligence found ${totalProducts.toLocaleString()} master product${totalProducts === 1 ? '' : 's'} and ${totalMerchants.toLocaleString()} verified supplier${totalMerchants === 1 ? '' : 's'} ${brandLine}${scope}.${priceLine}${brandSummary} Results are ranked by local availability, freshness and merchant trust signals.`;
}

export function semanticSearch(rawQuery: string, opts?: { limit?: number; offset?: number }): SearchResult {
  const intent = detectIntent(rawQuery);
  const limit = opts?.limit || 12;
  const offset = opts?.offset || 0;

  const cleaned = cleanSearchQuery(intent.normalizedQuery);
  const q = cleaned || rawQuery;

  const productRes = MasterProductStore.searchProducts({
    query: q,
    category: intent.category,
    brand: intent.brand,
    limit,
    offset,
  });

  let products = productRes.items;
  if (intent.maxPrice || intent.minPrice) {
    products = products.filter((p) => {
      const price = priceOf(p);
      if (typeof price !== 'number') return true;
      if (intent.maxPrice && price > intent.maxPrice) return false;
      if (intent.minPrice && price < intent.minPrice) return false;
      return true;
    });
  }

  const merchantRes = NationwideMerchantStore.searchMerchants({
    query: q,
    limit: 6,
    offset: 0,
  });

  const offersByProduct: Record<string, Offer[]> = {};
  const prices: number[] = [];
  for (const p of products) {
    const offs = offersFor(p.canonicalId);
    offersByProduct[p.canonicalId] = offs;
    offs.forEach((o) => {
      if (typeof o.price.amount === 'number') prices.push(o.price.amount);
    });
    const est = priceOf(p);
    if (typeof est === 'number') prices.push(est);
  }

  const priceStats: PriceStats | undefined = prices.length
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }
    : undefined;

  const topBrands = Array.from(new Set(products.map((p) => p.brand))).slice(0, 5);

  const overview = buildOverview(rawQuery, intent, products.length, merchantRes.total, priceStats, topBrands);

  return {
    query: rawQuery,
    intent,
    overview,
    products,
    merchants: merchantRes.items,
    offersByProduct,
    priceStats,
    topBrands,
    totalProducts: products.length,
    totalMerchants: merchantRes.total,
  };
}

export interface RecommendationSet {
  products: ProductVariant[];
  merchants: Merchant[];
  offersByProduct: Record<string, Offer[]>;
}

export function getRecommendations(opts?: {
  category?: string;
  brand?: string;
  limit?: number;
}): RecommendationSet {
  const limit = opts?.limit || 8;
  const q = opts?.brand || '';
  const productRes = MasterProductStore.searchProducts({
    query: q,
    category: opts?.category,
    limit,
    offset: 0,
  });
  const merchantRes = NationwideMerchantStore.searchMerchants({
    query: q,
    category: opts?.category,
    limit: 6,
    offset: 0,
  });
  const offersByProduct: Record<string, Offer[]> = {};
  for (const p of productRes.items) offersByProduct[p.canonicalId] = offersFor(p.canonicalId);
  return { products: productRes.items, merchants: merchantRes.items, offersByProduct };
}

export interface AssistantReply {
  reply: string;
  products: ProductVariant[];
  merchants: Merchant[];
  offersByProduct: Record<string, Offer[]>;
  intent: SearchIntent;
}

function buildAssistantReply(
  message: string,
  intent: SearchIntent,
  products: ProductVariant[],
  merchants: Merchant[]
): string {
  if (!products.length && !merchants.length) {
    return `I couldn't find a direct match for "${message}" in the current South African catalogue. Try a product type (e.g. "5kW inverter"), a brand (e.g. "Deye"), or a category (e.g. "solar", "smartphones"). You can also ask me to compare options or filter by budget like "under R20000".`;
  }

  const parts: string[] = [];
  const subject = intent.brand
    ? intent.brand.toUpperCase()
    : intent.category
    ? intent.category.replace(/_/g, ' ')
    : 'your search';

  if (intent.maxPrice || intent.minPrice) {
    const range = [
      intent.minPrice ? `from R ${intent.minPrice.toLocaleString()}` : null,
      intent.maxPrice ? `up to R ${intent.maxPrice.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join(' ');
    parts.push(`Here are ${subject} options ${range}, ranked by local availability:`);
  } else {
    parts.push(`Here's what I found for ${subject}, ranked by local availability and merchant trust:`);
  }

  products.slice(0, 4).forEach((p, i) => {
    const offs = offersFor(p.canonicalId);
    const price = priceOf(p);
    const priceText = price ? `from R ${price.toLocaleString()}` : 'price on request';
    const offerCount = offs.length ? ` (${offs.length} confirmed local offer${offs.length === 1 ? '' : 's'})` : '';
    parts.push(`${i + 1}. ${p.title} — ${priceText}${offerCount}.`);
  });

  if (merchants.length) {
    parts.push(`I also matched ${merchants.length} verified supplier${merchants.length === 1 ? '' : 's'} you can contact directly on WhatsApp.`);
  }

  if (intent.wantsVideo) {
    parts.push(`Want to see it in action? Check the Shorts & Shows tabs for teardowns and market walks.`);
  }

  return parts.join(' ');
}

export function askAssistant(message: string): AssistantReply {
  const intent = detectIntent(message);
  const cleaned = cleanSearchQuery(intent.normalizedQuery);
  const q = cleaned || message;

  const productRes = MasterProductStore.searchProducts({
    query: q,
    category: intent.category,
    brand: intent.brand,
    limit: 8,
    offset: 0,
  });

  let products = productRes.items;
  if (intent.maxPrice || intent.minPrice) {
    products = products.filter((p) => {
      const price = priceOf(p);
      if (typeof price !== 'number') return true;
      if (intent.maxPrice && price > intent.maxPrice) return false;
      if (intent.minPrice && price < intent.minPrice) return false;
      return true;
    });
  }

  const merchantRes = NationwideMerchantStore.searchMerchants({
    query: q,
    limit: 4,
    offset: 0,
  });

  const offersByProduct: Record<string, Offer[]> = {};
  for (const p of products) offersByProduct[p.canonicalId] = offersFor(p.canonicalId);

  const reply = buildAssistantReply(message, intent, products, merchantRes.items);

  return { reply, products, merchants: merchantRes.items, offersByProduct, intent };
}

export function getPlatformStats() {
  return {
    totalProducts: MasterProductStore.getTotalProductsCount(),
    totalMerchants: NationwideMerchantStore.getTotalCount(),
    totalMalls: SouthAfricaMallsStore.getTotalCount(),
    flagshipProducts: SA_CANONICAL_PRODUCTS.length,
  };
}
