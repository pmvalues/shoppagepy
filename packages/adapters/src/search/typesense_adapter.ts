import { SearchQueryInput, ProductVariant, Offer } from '@shoppage/contracts';
import { InMemorySearchEngine, SearchHit, SearchResponse } from './search_adapter';

export interface TypesenseConfig {
  url?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface TypesenseProductDocument {
  id: string;
  canonicalId: string;
  title: string;
  brand: string;
  categoryRef: string;
  modelNumber?: string;
  gtin13?: string;
  countryScope: string[];
  lowestPrice?: number;
  highestPrice?: number;
  description?: string;
  specs?: string;
  aliases?: string[];
  rawVariant: string; // JSON serialized ProductVariant
}

/**
 * Native REST Client for Typesense 26.0 (Zero External Dependencies)
 */
export class TypesenseSearchAdapter {
  private url: string;
  private apiKey: string;
  private timeoutMs: number;
  private lastHealthCheck: { healthy: boolean; checkedAt: number } = { healthy: false, checkedAt: 0 };
  private healthTtlMs = 15000; // 15s cache

  constructor(config?: TypesenseConfig) {
    const rawUrl = config?.url || process.env.TYPESENSE_URL || 'http://localhost:8108';
    this.url = rawUrl.replace(/\/+$/, '');
    this.apiKey = config?.apiKey || process.env.TYPESENSE_API_KEY || 'shoppage_typesense_secret_key';
    this.timeoutMs = config?.timeoutMs || 2000;
  }

  public getBaseUrl(): string {
    return this.url;
  }

  /**
   * Fast health probe with cached TTL
   */
  public async isHealthy(forceCheck = false): Promise<boolean> {
    const now = Date.now();
    if (!forceCheck && now - this.lastHealthCheck.checkedAt < this.healthTtlMs) {
      return this.lastHealthCheck.healthy;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(`${this.url}/health`, {
        headers: { 'X-TYPESENSE-API-KEY': this.apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const ok = res.ok;
      this.lastHealthCheck = { healthy: ok, checkedAt: now };
      return ok;
    } catch {
      this.lastHealthCheck = { healthy: false, checkedAt: now };
      return false;
    }
  }

  /**
   * Initializes the Typesense collection schema for products
   */
  public async ensureCollections(): Promise<boolean> {
    try {
      const schema = {
        name: 'products',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'canonicalId', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'brand', type: 'string', facet: true },
          { name: 'categoryRef', type: 'string', facet: true },
          { name: 'modelNumber', type: 'string', optional: true },
          { name: 'gtin13', type: 'string', optional: true },
          { name: 'countryScope', type: 'string[]', facet: true },
          { name: 'lowestPrice', type: 'float', optional: true, facet: true },
          { name: 'highestPrice', type: 'float', optional: true },
          { name: 'location', type: 'geopoint', optional: true },
          { name: 'description', type: 'string', optional: true },
          { name: 'specs', type: 'string', optional: true },
          { name: 'aliases', type: 'string[]', optional: true },
          { name: 'rawVariant', type: 'string', index: false },
        ],
        default_sorting_field: 'lowestPrice',
      };

      const res = await fetch(`${this.url}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TYPESENSE-API-KEY': this.apiKey,
        },
        body: JSON.stringify(schema),
      });

      if (res.status === 409) {
        // Collection already exists
        return true;
      }
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Imports a batch of canonical product variants into Typesense
   */
  public async importProducts(
    variants: ProductVariant[],
    offersByVariant?: Map<string, Offer[]>
  ): Promise<{ success: boolean; count: number }> {
    try {
      const docs: TypesenseProductDocument[] = variants.map((v) => {
        const offers = offersByVariant?.get(v.canonicalId) || [];
        const prices = offers.map((o) => o.price.amount).filter((p): p is number => typeof p === 'number' && p > 0);
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : undefined;
        const highestPrice = prices.length > 0 ? Math.max(...prices) : undefined;

        return {
          id: v.canonicalId,
          canonicalId: v.canonicalId,
          title: v.title,
          brand: v.brand,
          categoryRef: v.categoryRef,
          modelNumber: v.modelNumber,
          gtin13: v.identifiers.gtin13,
          countryScope: (v.countryScope as string[]) || ['ZA'],
          lowestPrice,
          highestPrice,
          description: typeof v.attributes?.description === 'string' ? v.attributes.description : undefined,
          specs: typeof v.attributes?.specs === 'string' ? v.attributes.specs : undefined,
          aliases: v.aliases?.map((a) => a.phrase),
          rawVariant: JSON.stringify(v),
        };
      });

      const jsonl = docs.map((d) => JSON.stringify(d)).join('\n');
      const res = await fetch(`${this.url}/collections/products/documents/import?action=upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-TYPESENSE-API-KEY': this.apiKey,
        },
        body: jsonl,
      });

      return { success: res.ok, count: docs.length };
    } catch {
      return { success: false, count: 0 };
    }
  }

  /**
   * Typo-tolerant, weighted search across Typesense
   */
  public async search(params: SearchQueryInput): Promise<SearchResponse> {
    const startTime = performance.now();
    const query = (params.query || '*').trim();

    // Construct filter query
    const filters: string[] = [];
    if (params.country) {
      filters.push(`countryScope:=[${params.country}]`);
    }
    if (params.category) {
      filters.push(`categoryRef:=${params.category}`);
    }
    if (params.brand) {
      filters.push(`brand:=${params.brand}`);
    }
    if (params.lat !== undefined && params.lng !== undefined && params.maxDistanceKm) {
      filters.push(`location:(${params.lat}, ${params.lng}, ${params.maxDistanceKm} km)`);
    }

    const searchParams = new URLSearchParams({
      q: query,
      query_by: 'title,brand,categoryRef,modelNumber,description,aliases',
      query_by_weights: '4,3,2,3,1,2',
      num_typos: '2',
      drop_tokens_threshold: '1',
      per_page: String(params.limit || 24),
      page: String(Math.floor((params.offset || 0) / (params.limit || 24)) + 1),
    });

    if (params.lat !== undefined && params.lng !== undefined) {
      searchParams.set('sort_by', `location(${params.lat}, ${params.lng}):asc,lowestPrice:asc`);
    }

    if (filters.length > 0) {
      searchParams.set('filter_by', filters.join(' && '));
    }

    const res = await fetch(`${this.url}/collections/products/documents/search?${searchParams.toString()}`, {
      headers: { 'X-TYPESENSE-API-KEY': this.apiKey },
    });

    if (!res.ok) {
      throw new Error(`Typesense search failed with status ${res.status}`);
    }

    const data = (await res.json()) as any;
    const hits: SearchHit[] = (data.hits || []).map((h: any) => {
      let variant: ProductVariant;
      try {
        variant = JSON.parse(h.document.rawVariant);
      } catch {
        variant = {
          canonicalId: h.document.canonicalId,
          title: h.document.title,
          brand: h.document.brand,
          categoryRef: h.document.categoryRef,
          modelNumber: h.document.modelNumber,
          countryScope: h.document.countryScope,
          identifiers: { gtin13: h.document.gtin13 },
          aliases: (h.document.aliases || []).map((p: string) => ({ phrase: p, locale: 'en' })),
          familyRef: h.document.categoryRef || 'general',
          attributes: {},
          compatibilityEdgeCount: 0,
          status: 'active',
          provenance: {
            sourceRef: 'typesense',
            rightsClass: 'OPEN_DATA_COMMERCIAL',
            confidence: 0.95,
            fieldOwner: 'SHOPPAGE_CANONICAL',
            validFrom: '2026-01-01T00:00:00Z',
          },
        };
      }

      return {
        variant,
        offers: [],
        lowestPrice: h.document.lowestPrice,
        highestPrice: h.document.highestPrice,
        currency: 'ZAR',
        matchedScore: h.text_match || 1.0,
        availableMerchantsCount: 1,
      };
    });

    return {
      hits,
      totalHits: data.found || hits.length,
      processingTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }
}

/**
 * Resilient Hybrid Search Engine
 * Delegates to Typesense if available; seamlessly falls back to In-Memory/SQLite FTS5
 */
export class HybridSearchEngine {
  public typesense: TypesenseSearchAdapter;
  public inMemory: InMemorySearchEngine;

  constructor(config?: TypesenseConfig) {
    this.typesense = new TypesenseSearchAdapter(config);
    this.inMemory = new InMemorySearchEngine();
  }

  public indexVariant(variant: ProductVariant): void {
    this.inMemory.indexVariant(variant);
  }

  public indexOffer(offer: Offer): void {
    this.inMemory.indexOffer(offer);
  }

  /**
   * Asynchronous smart search: Tries Typesense first, falls back to In-Memory/FTS5
   */
  public async search(params: SearchQueryInput): Promise<SearchResponse> {
    const isTypesenseReady = await this.typesense.isHealthy();
    if (isTypesenseReady) {
      try {
        return await this.typesense.search(params);
      } catch {
        // If Typesense query errors, transparently fall back
      }
    }
    return this.inMemory.search(params);
  }

  /**
   * Synchronous fallback search
   */
  public searchSync(params: SearchQueryInput): SearchResponse {
    return this.inMemory.search(params);
  }
}
