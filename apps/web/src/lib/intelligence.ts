// Server-side Agentic Intelligence Layer for Shoppage
// Supports multi-step tool execution: search, solar calculations, compatibility checking,
// store routing, and WhatsApp RFQ payload generation.
// Complements internal catalog search with live external web sweeps for 100% result coverage.

import {
  MasterProductStore,
  NationwideMerchantStore,
  SouthAfricaMallsStore,
  SA_FLAGSHIP_OFFERS,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
  calculateBackupRuntime,
} from '@shoppage/kernel';
import type { ProductVariant, Merchant, Offer } from '@shoppage/contracts';
import { searchExternalLiveWeb } from './external_discovery';
import { completeChat, LLMError, type LLMToolDef } from './llm';

const ASSISTANT_SYSTEM = [
  "You are Shoppage's shopping assistant for South Africa.",
  'Answer ONLY from the tool results provided to you.',
  'Every product, price, merchant, address, contact, link or location you mention must come from a tool result.',
  'Never invent, estimate, round or guess prices, stock levels, merchants, contacts, links or locations.',
  'Prices are in South African Rand (ZAR).',
  'If the tools return nothing relevant, say so honestly and suggest what to try next.',
  'Keep replies short, plain and useful. Use **bold** for product names and prices.',
].join(' ');

const ASSISTANT_TOOLS: LLMToolDef[] = [
  {
    name: 'searchCatalog',
    description: 'Search the live South African product catalogue. Returns catalogue products; use getOffers for their live prices.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product keywords, e.g. "5kW hybrid inverter"' },
        category: { type: 'string', description: 'Catalogue category if known' },
        brand: { type: 'string', description: 'Brand name if the user named one' },
        maxPrice: { type: 'number', description: 'Maximum budget in ZAR' },
        minPrice: { type: 'number', description: 'Minimum budget in ZAR' },
      },
      required: ['query'],
    },
  },
  {
    name: 'getOffers',
    description: 'List confirmed live offers (price plus stockist) for one catalogue product.',
    parameters: {
      type: 'object',
      properties: {
        canonicalId: { type: 'string', description: 'Catalogue product id from searchCatalog results' },
      },
      required: ['canonicalId'],
    },
  },
  {
    name: 'findStores',
    description: 'Find verified physical trade stores by keyword and optional province.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Store, brand or product keywords' },
        province: { type: 'string', description: 'South African province, e.g. Gauteng' },
      },
      required: ['query'],
    },
  },
  {
    name: 'calcRuntime',
    description: 'Estimate load-shedding backup runtime for a battery capacity and load.',
    parameters: {
      type: 'object',
      properties: {
        batteryKwh: { type: 'number', description: 'Battery capacity in kWh' },
        loadWatts: { type: 'number', description: 'Load in watts' },
      },
    },
  },
  {
    name: 'liveSweep',
    description: 'Search live external retailer sweeps for items missing from the catalogue.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product keywords' },
        brand: { type: 'string', description: 'Brand name if known' },
        category: { type: 'string', description: 'Catalogue category if known' },
      },
      required: ['query'],
    },
  },
];

export interface ToolCallResult {
  tool: 'searchProducts' | 'calculateSolarRuntime' | 'checkCompatibility' | 'findStores' | 'generateWhatsAppQuote' | 'liveExternalSweep';
  title: string;
  data: any;
}

export interface SearchIntent {
  normalizedQuery: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  location?: string;
  batteryKwh?: number;
  loadWatts?: number;
  isSolarCalculation: boolean;
  wantsVideo: boolean;
  wantsCompare: boolean;
}

function numArg(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function strArg(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function runSearchCatalog(args: {
  query: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
}): { products: ProductVariant[]; offersByProduct: Record<string, Offer[]> } {
  const res = MasterProductStore.searchProducts({
    query: args.query,
    category: args.category,
    brand: args.brand,
    limit: args.limit ?? 24,
    offset: 0,
  });
  let products = res.items;
  if (args.maxPrice !== undefined || args.minPrice !== undefined) {
    products = products.filter((p) => {
      const price = priceOf(p);
      if (typeof price !== 'number') return true;
      if (args.maxPrice !== undefined && price > args.maxPrice) return false;
      if (args.minPrice !== undefined && price < args.minPrice) return false;
      return true;
    });
  }
  const offersByProduct: Record<string, Offer[]> = {};
  for (const p of products) offersByProduct[p.canonicalId] = offersFor(p.canonicalId);
  return { products, offersByProduct };
}

function merchantName(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return SA_FLAGSHIP_MERCHANTS.find((m) => m.id === id)?.name;
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

export interface AssistantReply {
  reply: string;
  products: ProductVariant[];
  merchants: Merchant[];
  offersByProduct: Record<string, Offer[]>;
  intent: SearchIntent;
  toolCalls?: ToolCallResult[];
  calculationResult?: {
    batteryCapacityKwh: number;
    loadWatts: number;
    hours: number;
    formatted: string;
  };
  externalComplemented?: boolean;
}

export async function askAssistant(
  message: string,
  opts?: { limit?: number; offset?: number; signal?: AbortSignal },
): Promise<AssistantReply> {
  const clean = (message || '').trim().slice(0, 500);
  const limit = Math.min(Math.max(opts?.limit ?? 24, 1), 48);
  const intent: SearchIntent = {
    normalizedQuery: clean.toLowerCase(),
    isSolarCalculation: false,
    wantsVideo: false,
    wantsCompare: false,
  };
  const products: ProductVariant[] = [];
  const seen = new Set<string>();
  const offersByProduct: Record<string, Offer[]> = {};
  const merchants: Merchant[] = [];
  const toolCalls: ToolCallResult[] = [];
  let calculationResult: AssistantReply['calculationResult'];
  let externalComplemented = false;

  if (!clean) {
    return {
      reply: 'Ask me about a product, brand, budget or suburb — for example "5kW hybrid inverter under R20000".',
      products,
      merchants,
      offersByProduct,
      intent,
      toolCalls,
    };
  }

  const take = (list: ProductVariant[]) => {
    for (const p of list) {
      if (seen.has(p.canonicalId)) continue;
      seen.add(p.canonicalId);
      products.push(p);
      if (products.length >= limit) break;
    }
  };

  const first = await completeChat({
    system: ASSISTANT_SYSTEM,
    message: clean,
    tools: ASSISTANT_TOOLS,
    signal: opts?.signal,
  });

  for (const call of first.toolCalls.slice(0, 4)) {
    const a = call.args || {};
    if (call.name === 'searchCatalog') {
      const q = strArg(a.query) || clean;
      const category = strArg(a.category);
      const brand = strArg(a.brand);
      const maxPrice = numArg(a.maxPrice);
      const minPrice = numArg(a.minPrice);
      const res = runSearchCatalog({ query: q, category, brand, maxPrice, minPrice, limit });
      take(res.products);
      Object.assign(offersByProduct, res.offersByProduct);
      if (category) intent.category = category;
      if (brand) intent.brand = brand;
      if (maxPrice !== undefined) intent.maxPrice = maxPrice;
      if (minPrice !== undefined) intent.minPrice = minPrice;
      toolCalls.push({
        tool: 'searchProducts',
        title: `Grid catalogue search for "${q}"`,
        data: { count: res.products.length },
      });
    } else if (call.name === 'getOffers') {
      const id = strArg(a.canonicalId);
      if (id) {
        const offs = offersFor(id);
        if (offs.length > 0) offersByProduct[id] = offs;
        toolCalls.push({
          tool: 'searchProducts',
          title: 'Live offers for catalogue item',
          data: { count: offs.length },
        });
      }
    } else if (call.name === 'findStores') {
      const q = strArg(a.query) || clean;
      const province = strArg(a.province);
      const res = NationwideMerchantStore.searchMerchants({ query: q, province, limit: 4, offset: 0 });
      merchants.push(...res.items);
      if (province) intent.location = province;
      toolCalls.push({
        tool: 'findStores',
        title: 'Matched verified physical stores',
        data: { count: res.total },
      });
    } else if (call.name === 'calcRuntime') {
      const batt = numArg(a.batteryKwh) ?? 5.12;
      const load = numArg(a.loadWatts) ?? 500;
      const runtime = calculateBackupRuntime(batt, load);
      calculationResult = {
        batteryCapacityKwh: batt,
        loadWatts: load,
        hours: runtime.runtimeHours,
        formatted: runtime.formattedRuntime,
      };
      intent.batteryKwh = batt;
      intent.loadWatts = load;
      intent.isSolarCalculation = true;
      toolCalls.push({
        tool: 'calculateSolarRuntime',
        title: `Backup runtime (${batt}kWh at ${load}W)`,
        data: calculationResult,
      });
    } else if (call.name === 'liveSweep') {
      const q = strArg(a.query) || clean;
      const items = searchExternalLiveWeb(
        q,
        {
          normalizedQuery: q.toLowerCase(),
          category: strArg(a.category),
          brand: strArg(a.brand),
          isSolarCalculation: false,
          wantsVideo: false,
          wantsCompare: false,
        },
        4,
      );
      for (const { product, offer } of items) {
        if (!seen.has(product.canonicalId)) {
          seen.add(product.canonicalId);
          products.push(product);
        }
        offersByProduct[product.canonicalId] = [offer];
      }
      if (items.length > 0) {
        externalComplemented = true;
        toolCalls.push({
          tool: 'liveExternalSweep',
          title: 'Live retailer sweep items',
          data: { count: items.length },
        });
      }
    }
  }

  if (products.length === 0 && !calculationResult) {
    const fallback = runSearchCatalog({ query: clean, limit });
    take(fallback.products);
    Object.assign(offersByProduct, fallback.offersByProduct);
  }

  const context: string[] = [];
  if (calculationResult) {
    context.push(
      `CALCULATION: a ${calculationResult.batteryCapacityKwh}kWh battery running a ${calculationResult.loadWatts}W load provides ${calculationResult.formatted} of backup power.`,
    );
  }
  products.slice(0, 6).forEach((p) => {
    const offs = offersByProduct[p.canonicalId] || [];
    const amounts = offs.map((o) => o.price?.amount).filter((n): n is number => typeof n === 'number');
    const names = Array.from(
      new Set(offs.map((o) => merchantName(o.merchantRef)).filter((n): n is string => !!n)),
    ).slice(0, 3);
    context.push(
      `PRODUCT: ${p.title} (${p.brand})${
        amounts.length > 0
          ? ` | best live price R ${Math.min(...amounts).toLocaleString()} across ${offs.length} offer(s)`
          : ' | no live offer price'
      }${names.length > 0 ? ` | stockists: ${names.join(', ')}` : ''}`,
    );
  });
  merchants.slice(0, 4).forEach((m) => {
    context.push(`STORE: ${m.name}${m.addressText ? ` | ${m.addressText}` : ''}`);
  });

  let reply = '';
  try {
    const final = await completeChat({
      system: ASSISTANT_SYSTEM,
      message: `User asked: ${clean}\n\nTool results (answer ONLY from these):\n${
        context.length > 0 ? context.join('\n') : 'No matching products, stores or calculations found.'
      }`,
      signal: opts?.signal,
      maxOutputTokens: 512,
    });
    reply = final.text;
  } catch {
    reply = '';
  }

  if (!reply) {
    const parts: string[] = [];
    if (calculationResult) {
      parts.push(
        `A **${calculationResult.batteryCapacityKwh}kWh** battery running a **${calculationResult.loadWatts}W** load provides **${calculationResult.formatted}** of backup power.`,
      );
    }
    if (products.length > 0) {
      parts.push('Top matches with confirmed stock:');
      products.slice(0, 3).forEach((p, idx) => {
        const offs = offersByProduct[p.canonicalId] || [];
        const amounts = offs.map((o) => o.price?.amount).filter((n): n is number => typeof n === 'number');
        const best = amounts.length > 0 ? Math.min(...amounts) : undefined;
        parts.push(
          `${idx + 1}. **${p.title}** — ${
            best !== undefined
              ? `from **R ${best.toLocaleString()}** (${offs.length} store${offs.length === 1 ? '' : 's'})`
              : 'price on request'
          }.`,
        );
      });
    } else if (!calculationResult) {
      parts.push(
        `I couldn't find an exact match for "${clean}" in the live catalogue. Try a product type like "5kW hybrid inverter", a brand like "Deye", or a budget like "under R20000".`,
      );
    }
    if (merchants.length > 0) {
      parts.push(`You can contact **${merchants[0].name}** directly for live stock and counter pricing.`);
    }
    reply = parts.join('\n\n');
  }

  return { reply, products, merchants, offersByProduct, intent, toolCalls, calculationResult, externalComplemented };
}

export async function semanticSearch(rawQuery: string, opts?: { limit?: number; offset?: number }) {
  const limit = opts?.limit ?? 24;
  try {
    const res = await askAssistant(rawQuery, opts);
    return shapeSearchResult(rawQuery, res);
  } catch (err) {
    if (!(err instanceof LLMError)) throw err;
    const q = rawQuery.trim().slice(0, 200);
    const direct = runSearchCatalog({ query: q, limit });
    const merchantRes = NationwideMerchantStore.searchMerchants({ query: q, limit: 4, offset: 0 });
    return shapeSearchResult(rawQuery, {
      products: direct.products,
      merchants: merchantRes.items,
      offersByProduct: direct.offersByProduct,
      intent: {
        normalizedQuery: q.toLowerCase(),
        isSolarCalculation: false,
        wantsVideo: false,
        wantsCompare: false,
      },
      externalComplemented: false,
    });
  }
}

function shapeSearchResult(
  rawQuery: string,
  res: {
    products: ProductVariant[];
    merchants: Merchant[];
    offersByProduct: Record<string, Offer[]>;
    intent: SearchIntent;
    externalComplemented?: boolean;
  },
) {
  const totalProducts = res.products.length;
  const totalMerchants = res.merchants.length;
  const topBrands = Array.from(new Set(res.products.map((p) => p.brand))).slice(0, 5);
  const overview = `Shoppage intelligence matched ${totalProducts} master products and ${totalMerchants} verified merchants across South Africa. Results are prioritized by confirmed stock, SABS/NRS 097 compliance, and direct multi-channel trade contact.`;

  return {
    query: rawQuery,
    intent: res.intent,
    overview,
    products: res.products,
    merchants: res.merchants,
    offersByProduct: res.offersByProduct,
    topBrands,
    totalProducts,
    totalMerchants,
    externalComplemented: res.externalComplemented,
  };
}

export function getRecommendations(opts?: { category?: string; brand?: string; limit?: number }) {
  const limit = opts?.limit || 8;
  const q = opts?.brand || '';
  const productRes = MasterProductStore.searchProducts({ query: q, category: opts?.category, limit, offset: 0 });
  const merchantRes = NationwideMerchantStore.searchMerchants({ query: q, category: opts?.category, limit: 6, offset: 0 });
  const offersByProduct: Record<string, Offer[]> = {};
  for (const p of productRes.items) offersByProduct[p.canonicalId] = offersFor(p.canonicalId);
  return { products: productRes.items, merchants: merchantRes.items, offersByProduct };
}

export function getPlatformStats() {
  return {
    totalProducts: MasterProductStore.getTotalProductsCount(),
    totalMerchants: NationwideMerchantStore.getTotalCount(),
    totalMalls: SouthAfricaMallsStore.getTotalCount(),
    flagshipProducts: SA_CANONICAL_PRODUCTS.length,
  };
}
