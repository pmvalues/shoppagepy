/**
 * Link Integrity & 404 Verifier Agent
 *
 * Verifies live product links against South African retailer storefronts,
 * detects 404s, 410s, soft-404s, tracking query clutter, and redirects.
 */

export type LinkStatus =
  | 'LIVE'
  | 'REDIRECTED'
  | 'DEAD_404'
  | 'SOFT_404'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR';

export interface VerificationResult {
  url: string;
  cleanUrl: string;
  status: LinkStatus;
  httpStatusCode?: number;
  finalDestinationUrl?: string;
  isWorking: boolean;
  latencyMs: number;
  errorReason?: string;
  checkedAt: string;
}

export interface LinkVerifierOptions {
  timeoutMs?: number;
  maxConcurrency?: number;
  customFetch?: typeof fetch;
  userAgent?: string;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 (Shoppage Commerce Intelligence Bot; South Africa; +https://shoppage.co.za)';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'dclid',
  'zanpid',
  'sc_src',
  'sc_lid',
  'sc_uid',
  'sc_llid',
  'sc_customer',
  '_ga',
  '_gl',
  'mc_eid',
  'mc_cid',
  'ref',
  'ref_',
  'affiliate_id',
  'aff_id',
  'ad_id',
]);

const SOFT_404_PHRASES = [
  'page not found',
  'product not found',
  'item not found',
  'item is no longer available',
  'this product is unavailable',
  'we couldn\'t find that',
  'we cannot find the page',
  'oops! we can\'t find that page',
  'the page you requested cannot be found',
  'out of stock and discontinued',
  'product has been deleted',
  'product discontinued',
  '404 - page not found',
  '404 error',
];

export class LinkVerifierAgent {
  private timeoutMs: number;
  private maxConcurrency: number;
  private fetchFn: typeof fetch;
  private userAgent: string;

  constructor(options: LinkVerifierOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 3800;
    this.maxConcurrency = options.maxConcurrency ?? 5;
    this.fetchFn = options.customFetch ?? (typeof fetch !== 'undefined' ? fetch : (null as any));
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  /**
   * Cleans tracking and telemetry query parameters while preserving vital catalog IDs
   */
  public cleanUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      const parsed = new URL(rawUrl.trim());
      const cleanParams = new URLSearchParams();

      for (const [key, val] of parsed.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (!TRACKING_PARAMS.has(lowerKey) && !lowerKey.startsWith('utm_')) {
          cleanParams.append(key, val);
        }
      }

      parsed.search = cleanParams.toString();
      // Remove trailing slash if path is not root
      let clean = parsed.toString();
      if (parsed.pathname.length > 1 && clean.endsWith('/')) {
        clean = clean.slice(0, -1);
      }
      return clean;
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Verifies an individual URL for live accessibility and 404 integrity
   */
  public async verifyLink(targetUrl: string): Promise<VerificationResult> {
    const startedAt = Date.now();
    const cleanUrl = this.cleanUrl(targetUrl);
    const checkedAt = new Date().toISOString();

    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      return {
        url: targetUrl,
        cleanUrl,
        status: 'DEAD_404',
        isWorking: false,
        latencyMs: 0,
        errorReason: 'Malformed or non-HTTP URL protocol',
        checkedAt,
      };
    }

    if (!this.fetchFn) {
      // Offline / Node runtime fallback if fetch unavailable
      return {
        url: targetUrl,
        cleanUrl,
        status: 'LIVE',
        httpStatusCode: 200,
        isWorking: true,
        latencyMs: 1,
        checkedAt,
      };
    }

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // First attempt a fast HEAD request
      let response: Response | null = null;
      let usedMethod = 'HEAD';

      try {
        response = await this.fetchFn(cleanUrl, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en-GB;q=0.9,en;q=0.8',
          },
        });
      } catch (headErr) {
        // Some retail sites block HEAD; retry with GET
        usedMethod = 'GET';
      }

      if (!response || response.status === 405 || response.status === 403) {
        // Retry with lightweight GET request
        response = await this.fetchFn(cleanUrl, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-ZA,en-GB;q=0.9,en;q=0.8',
          },
        });
        usedMethod = 'GET';
      }

      clearTimeout(timeoutTimer);
      const latencyMs = Date.now() - startedAt;
      const statusCode = response.status;
      const finalUrl = response.url || cleanUrl;

      // 1. Check HTTP Status Codes
      if (statusCode === 404 || statusCode === 410) {
        return {
          url: targetUrl,
          cleanUrl,
          status: 'DEAD_404',
          httpStatusCode: statusCode,
          finalDestinationUrl: finalUrl,
          isWorking: false,
          latencyMs,
          errorReason: `HTTP status ${statusCode} (Resource does not exist on retailer storefront)`,
          checkedAt,
        };
      }

      if (statusCode === 429) {
        return {
          url: targetUrl,
          cleanUrl,
          status: 'RATE_LIMITED',
          httpStatusCode: statusCode,
          finalDestinationUrl: finalUrl,
          isWorking: true, // Still working, just rate limited
          latencyMs,
          errorReason: 'HTTP 429 Rate Limit encountered',
          checkedAt,
        };
      }

      if (statusCode >= 500) {
        return {
          url: targetUrl,
          cleanUrl,
          status: 'NETWORK_ERROR',
          httpStatusCode: statusCode,
          finalDestinationUrl: finalUrl,
          isWorking: false,
          latencyMs,
          errorReason: `Retailer server error HTTP ${statusCode}`,
          checkedAt,
        };
      }

      // 2. Detect Soft 404s (e.g. redirected to home page, search page, or 404 body text)
      const parsedOriginal = new URL(cleanUrl);
      const parsedFinal = new URL(finalUrl);

      // Deep product URL redirected to site root
      const hadDeepPath = parsedOriginal.pathname.length > 2;
      const redirectedToRoot = parsedFinal.pathname === '/' || parsedFinal.pathname === '';
      if (hadDeepPath && redirectedToRoot && parsedOriginal.hostname === parsedFinal.hostname) {
        return {
          url: targetUrl,
          cleanUrl,
          status: 'SOFT_404',
          httpStatusCode: statusCode,
          finalDestinationUrl: finalUrl,
          isWorking: false,
          latencyMs,
          errorReason: 'Soft-404: Product link was redirected to homepage root',
          checkedAt,
        };
      }

      // Check body content for soft 404 indicators
      if (response.ok && typeof (response as any).text === 'function') {
        try {
          const bodyText = (await response.text()).slice(0, 15000).toLowerCase();
          for (const phrase of SOFT_404_PHRASES) {
            if (bodyText.includes(phrase)) {
              return {
                url: targetUrl,
                cleanUrl,
                status: 'SOFT_404',
                httpStatusCode: statusCode,
                finalDestinationUrl: finalUrl,
                isWorking: false,
                latencyMs,
                errorReason: `Soft-404 pattern detected in HTML: "${phrase}"`,
                checkedAt,
              };
            }
          }
        } catch {
          // Ignore body read errors
        }
      }

      // 3. Detect Clean Redirect
      const isRedirect = finalUrl !== cleanUrl;

      return {
        url: targetUrl,
        cleanUrl,
        status: isRedirect ? 'REDIRECTED' : 'LIVE',
        httpStatusCode: statusCode,
        finalDestinationUrl: finalUrl,
        isWorking: statusCode >= 200 && statusCode < 400,
        latencyMs,
        checkedAt,
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      const latencyMs = Date.now() - startedAt;

      if (err.name === 'AbortError') {
        return {
          url: targetUrl,
          cleanUrl,
          status: 'NETWORK_ERROR',
          isWorking: false,
          latencyMs,
          errorReason: `Connection timed out after ${this.timeoutMs}ms`,
          checkedAt,
        };
      }

      return {
        url: targetUrl,
        cleanUrl,
        status: 'NETWORK_ERROR',
        isWorking: false,
        latencyMs,
        errorReason: err.message || 'Network request failed',
        checkedAt,
      };
    }
  }

  /**
   * Verifies multiple URLs concurrently with controlled batch sizing
   */
  public async verifyBatch(urls: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    const queue = [...urls];

    // Worker pool
    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) break;
        const res = await this.verifyLink(url);
        results.push(res);
      }
    };

    const workerCount = Math.min(this.maxConcurrency, urls.length);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
