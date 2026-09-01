/**
 * Discovery feed — turns real commerce state into a timeline of events.
 *
 * Prices come from DiscoveredOffersStore, which returns both confirmed
 * merchant offers and externally swept retailer web prices. The two are kept
 * strictly apart: a confirmed offer is attributed to its verified merchant and
 * may claim stock, while a swept price is published as a "price sweep" and
 * never claims to be verified stock.
 *
 * Social values (timestamps, reaction counts, viewers) are derived from a
 * deterministic hash of the post id rather than Math.random(), so the server
 * and client renders match and hydration stays clean.
 */

import {
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_MERCHANTS,
  SA_FLAGSHIP_MARKETS,
  DiscoveredOffersStore,
  MasterProductStore,
  NationwideMerchantStore,
  SouthAfricaMallsStore,
} from '@shoppage/kernel';
import type { Merchant, Offer, ProductVariant } from '@shoppage/contracts';
import { SHORTS, type MediaItem } from './media';

export type FeedKind =
  | 'price_drop'
  | 'sweep'
  | 'new_listing'
  | 'restock'
  | 'short'
  | 'demand'
  | 'sponsored';

export interface FeedAuthor {
  id: string;
  name: string;
  handle: string;
  initials: string;
  verified: boolean;
  href: string;
  marketName?: string;
}

export interface FeedProductRef {
  canonicalId: string;
  title: string;
  brand: string;
  emoji: string;
  imageUrl?: string;
  href: string;
  priceNow?: number;
  priceWas?: number;
  dropPct?: number;
  sellerCount: number;
  verifiedSellers: number;
}

export interface FeedMedia {
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: number;
}

export interface FeedCTA {
  label: string;
  href: string;
  whatsapp?: boolean;
  external?: boolean;
}

export interface FeedPost {
  id: string;
  kind: FeedKind;
  author: FeedAuthor;
  timeLabel: string;
  text: string;
  product?: FeedProductRef;
  media?: FeedMedia;
  stats: { likes: number; saves: number; replies: number };
  viewers?: number;
  cta: FeedCTA;
}

export interface TrendRow {
  id: string;
  name: string;
  meta: string;
  delta: string;
  direction: 'up' | 'down' | 'flat';
  href: string;
}

export interface PlatformStats {
  products: number;
  merchants: number;
  markets: number;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededInt(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

function seededPick<T>(seed: string, items: readonly T[]): T {
  return items[hash(seed) % items.length];
}

const TIME_LABELS = ['2m', '7m', '18m', '34m', '51m', '1h', '2h', '4h', '7h', '11h', '1d'] as const;

const MIN_CREDIBLE_PRICE = 20;
const MIN_CREDIBLE_SPREAD = 25;
const MIN_CREDIBLE_PCT = 3;

export function formatZar(value: number): string {
  return `R ${Math.round(value).toLocaleString('en-ZA')}`;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const merchantById = new Map<string, Merchant>(SA_FLAGSHIP_MERCHANTS.map((m) => [m.id, m]));
const marketNameById = new Map<string, string>(SA_FLAGSHIP_MARKETS.map((m) => [m.id, m.name]));

const CATEGORY_EMOJI: Array<[RegExp, string]> = [
  [/solar|inverter|battery|lithium|panel|ups/i, '⚡'],
  [/packaging|catering|tub|hanger|spoon|tray|cup/i, '🍽️'],
  [/cement|brick|hardware|build|paint|steel|timber/i, '🧱'],
  [/phone|samsung|iphone|tecno|itel|laptop|tablet|tech/i, '📱'],
  [/tyre|automotive|car|spare|engine|oil/i, '🚗'],
  [/wholesale|spaza|fmcg|grocery|rice|sugar|maize/i, '🛒'],
];

function emojiFor(product: ProductVariant): string {
  const haystack = `${product.title} ${product.brand} ${product.categoryRef}`;
  for (const [re, emoji] of CATEGORY_EMOJI) {
    if (re.test(haystack)) return emoji;
  }
  return '📦';
}

function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function handleOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18);
  return `@${slug || 'seller'}`;
}

function authorFromMerchant(merchant: Merchant): FeedAuthor {
  return {
    id: merchant.id,
    name: merchant.name,
    handle: handleOf(merchant.name),
    initials: initialsOf(merchant.name),
    verified: merchant.verificationState === 'fully_verified',
    href: `/m/${merchant.id}`,
    marketName: merchant.marketId ? marketNameById.get(merchant.marketId) : undefined,
  };
}

interface PricePoint {
  amount: number;
  sellerName: string;
  verified: boolean;
  href?: string;
  offer?: Offer;
}

function collectPrices(product: ProductVariant): PricePoint[] {
  const { confirmed, discovered } = DiscoveredOffersStore.getOffersForProduct(product.canonicalId);
  const points: PricePoint[] = [];

  for (const offer of confirmed) {
    const amount = offer.price?.amount;
    if (typeof amount !== 'number') continue;
    const merchant = merchantById.get(offer.merchantRef);
    points.push({ amount, sellerName: merchant?.name ?? 'Verified seller', verified: true, offer });
  }

  for (const found of discovered) {
    const amount = found.discoveredPrice?.amount;
    if (typeof amount !== 'number') continue;
    points.push({
      amount,
      sellerName: found.merchantName,
      verified: false,
      href: found.sourceUrl,
    });
  }

  return points.sort((a, b) => a.amount - b.amount);
}

function buildProductPost(product: ProductVariant): FeedPost | null {
  const points = collectPrices(product);
  const best = points[0];
  const worst = points[points.length - 1];
  const verifiedCount = points.filter((p) => p.verified).length;

  const fallbackPrice = product.attributes?.estimatedPriceZar;
  const priceNow = best?.amount ?? (typeof fallbackPrice === 'number' ? fallbackPrice : undefined);
  const priceWas = worst && best && worst.amount > best.amount ? worst.amount : undefined;

  if (typeof priceNow !== 'number' && points.length === 0) return null;

  const rawDropPct =
    priceWas && typeof priceNow === 'number'
      ? Math.round(((priceWas - priceNow) / priceWas) * 100)
      : undefined;
  const spread = priceWas && typeof priceNow === 'number' ? priceWas - priceNow : 0;

  // R1-R3 unit prices turn rounding noise into "100% off" badges.
  const dropPct =
    rawDropPct !== undefined &&
    typeof priceNow === 'number' &&
    priceNow >= MIN_CREDIBLE_PRICE &&
    spread >= MIN_CREDIBLE_SPREAD &&
    rawDropPct >= MIN_CREDIBLE_PCT
      ? rawDropPct
      : undefined;

  const confirmedOffer = points.find((p) => p.verified)?.offer;
  const merchant = confirmedOffer ? merchantById.get(confirmedOffer.merchantRef) : undefined;
  const sellerLabel = best?.sellerName ?? 'Shoppage Sweep';

  const author: FeedAuthor = merchant
    ? authorFromMerchant(merchant)
    : {
        id: `sweep_${product.canonicalId}`,
        name: sellerLabel,
        handle: handleOf(sellerLabel),
        initials: initialsOf(sellerLabel),
        verified: false,
        href: `/p/${product.canonicalId}`,
      };

  const marketName = confirmedOffer?.marketRef
    ? marketNameById.get(confirmedOffer.marketRef)
    : author.marketName;

    const id = `post_${product.canonicalId}`;
  const imageUrl =
    product.media?.gallery?.[0]?.url ||
    (product as any).image ||
    (product as any).featuredImage;

  let kind: FeedKind;
  let text: string;

  if (merchant && dropPct) {
    kind = 'price_drop';
    text =
      `${product.title} just moved to ${formatZar(priceNow as number)}. ` +
      (verifiedCount > 1 ? `Cheapest of ${verifiedCount} verified sellers — ` : '') +
      `down ${dropPct}% from ${formatZar(priceWas as number)}${marketName ? ` in ${marketName}` : ''}.`;
  } else if (dropPct && points.length > 1) {
    kind = 'sweep';
    text =
      `Price sweep: ${product.title} found at ${formatZar(priceNow as number)} — lowest of ` +
      `${points.length} retailers tracked online, ${formatZar(spread)} under the highest ` +
      `web price of ${formatZar(priceWas as number)}.`;
  } else if (
    confirmedOffer?.updateType === 'stock_confirmed' ||
    confirmedOffer?.updateType === 'stall_visited'
  ) {
    kind = 'restock';
    text = `Stock confirmed: ${product.title} is on the shelf at ${formatZar(priceNow as number)}${
      marketName ? ` in ${marketName}` : ''
    }.`;
  } else {
    kind = 'new_listing';
    text = `Now trading: ${product.title} at ${formatZar(priceNow as number)}${
      marketName ? ` in ${marketName}` : ''
    }. Direct from the counter, 0% platform commission.`;
  }

  const cta: FeedCTA = best?.href && best.href.startsWith('http')
    ? { label: 'View Stockist', href: best.href, external: true }
    : kind === 'price_drop'
    ? { label: 'View Deal', href: `/p/${product.canonicalId}` }
    : kind === 'restock'
    ? { label: 'Direct Order', href: `/p/${product.canonicalId}` }
    : { label: 'Compare Offers', href: `/p/${product.canonicalId}` };

  return {
    id,
    kind,
    author,
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text,
    product: {
      canonicalId: product.canonicalId,
      title: product.title,
      brand: product.brand,
      emoji: emojiFor(product),
      imageUrl,
      href: `/p/${product.canonicalId}`,
      priceNow,
      priceWas,
      dropPct,
      sellerCount: points.length,
      verifiedSellers: verifiedCount,
    },
    stats: {
      likes: seededInt(`${id}_l`, 12, 940),
      saves: seededInt(`${id}_s`, 4, 380),
      replies: seededInt(`${id}_r`, 0, 46),
    },
    viewers: dropPct ? seededInt(`${id}_v`, 6, 240) : undefined,
    cta,
  };
}

function buildShortPost(short: MediaItem): FeedPost {
  const author: FeedAuthor = short.merchantName
    ? {
        id: `media_${short.id}`,
        name: short.merchantName,
        handle: handleOf(short.merchantName),
        initials: initialsOf(short.merchantName),
        verified: true,
        href: '/shorts',
        marketName: short.marketName,
      }
    : {
        id: `media_${short.id}`,
        name: 'Shoppage Studios',
        handle: '@shoppagestudios',
        initials: 'SS',
        verified: true,
        href: '/shorts',
      };

  const id = `post_${short.id}`;

  return {
    id,
    kind: 'short',
    author,
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text: short.summary || short.title,
    product:
      short.productTitle && typeof short.priceZar === 'number'
        ? {
            canonicalId: short.productRef ?? short.id,
            title: short.productTitle,
            brand: short.merchantName ?? 'Shoppage',
            emoji: '🎬',
            imageUrl: short.thumbnailUrl,
            href: short.productRef ? `/p/${short.productRef}` : '/shorts',
            priceNow: short.priceZar,
            sellerCount: short.featuredProductsCount ?? 1,
            verifiedSellers: 1,
          }
        : undefined,
    media: {
      thumbnailUrl: short.thumbnailUrl,
      videoUrl: short.videoUrl,
      duration: short.duration,
      views: short.views,
    },
    stats: {
      likes: short.likes ?? seededInt(`${id}_l`, 40, 4200),
      saves: seededInt(`${id}_s`, 12, 1600),
      replies: seededInt(`${id}_r`, 2, 180),
    },
    cta: { label: 'Watch', href: '/shorts' },
  };
}

let cachedFeed: FeedPost[] | null = null;

export function getFeed(): FeedPost[] {
  if (cachedFeed) return cachedFeed;

  const productPosts = SA_CANONICAL_PRODUCTS.map(buildProductPost).filter(
    (p): p is FeedPost => p !== null,
  );

  // Rank by rand saved: percentage ranking lets synthetic sweeps outrank real scraped data.
  const spreadOf = (p: FeedPost) =>
    p.product && typeof p.product.priceNow === 'number' && typeof p.product.priceWas === 'number'
      ? p.product.priceWas - p.product.priceNow
      : 0;

  const ranked = [...productPosts].sort((a, b) => {
    const bySpread = spreadOf(b) - spreadOf(a);
    if (bySpread !== 0) return bySpread;
    return (b.stats.likes ?? 0) - (a.stats.likes ?? 0);
  });

  const shortPosts = SHORTS.map(buildShortPost);

  const feed: FeedPost[] = [];
  let shortIndex = 0;
  ranked.forEach((post, i) => {
    feed.push(post);
    if ((i + 1) % 4 === 0 && shortIndex < shortPosts.length) {
      feed.push(shortPosts[shortIndex]);
      shortIndex += 1;
    }
  });
  while (shortIndex < shortPosts.length) {
    feed.push(shortPosts[shortIndex]);
    shortIndex += 1;
  }

  cachedFeed = feed;
  return feed;
}

export function getTrending(limit = 6): TrendRow[] {
  const rows: TrendRow[] = [];

  for (const post of getFeed()) {
    const p = post.product;
    if (!p || typeof p.priceNow !== 'number' || p.sellerCount === 0) continue;
    if (post.kind === 'short') continue;

    rows.push({
      id: p.canonicalId,
      name: p.title,
      meta: `${p.sellerCount} source${p.sellerCount === 1 ? '' : 's'} · ${formatZar(p.priceNow)}`,
      delta: p.dropPct ? `-${p.dropPct}%` : '—',
      direction: p.dropPct ? 'down' : 'flat',
      href: p.href,
    });
  }

  const weight = (r: TrendRow) => parseInt(r.delta.replace(/[^0-9]/g, '') || '0', 10);
  rows.sort((a, b) => weight(b) - weight(a));
  return rows.slice(0, limit);
}

export function formatViews(n: number): string {
  return compact(n);
}

let cachedStats: PlatformStats | null = null;

function safeCount(fn: () => number, fallback: number): number {
  try {
    const n = fn();
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

// Cached per process: these counts scan the 1M-row SQLite index and fall back
// to in-memory dataset sizes when that index is unavailable.
export function getPlatformStats(): PlatformStats {
  if (cachedStats) return cachedStats;
  cachedStats = {
    products: safeCount(
      () => MasterProductStore.getTotalProductsCount(),
      SA_CANONICAL_PRODUCTS.length,
    ),
    merchants: safeCount(
      () => NationwideMerchantStore.getTotalCount(),
      SA_FLAGSHIP_MERCHANTS.length,
    ),
    markets: safeCount(() => SouthAfricaMallsStore.getTotalCount(), SA_FLAGSHIP_MARKETS.length),
  };
  return cachedStats;
}
