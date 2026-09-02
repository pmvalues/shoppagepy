/**
 * Discovery feed — turns real commerce state into a Twitter/X style timeline of events.
 *
 * Supports multi-domain discovery across Products, Product Videos (Shorts),
 * Original Shows, Wholesale Markets, and Verified Companies.
 *
 * Social values (timestamps, reaction counts, viewers, reposts) are derived from
 * deterministic hashing for pure hydration hygiene.
 */

import {
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_MERCHANTS,
  SA_FLAGSHIP_MARKETS,
  SA_COMPREHENSIVE_MARKETS,
  DiscoveredOffersStore,
  MasterProductStore,
  NationwideMerchantStore,
  SouthAfricaMallsStore,
} from '@shoppage/kernel';
import type { Merchant, Offer, ProductVariant } from '@shoppage/contracts';
import { SHORTS, SHOWS, type MediaItem, type FeaturedProduct, type Chapter } from './media';

export type FeedKind =
  | 'price_drop'
  | 'sweep'
  | 'new_listing'
  | 'restock'
  | 'short'
  | 'show'
  | 'market'
  | 'company'
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

export interface FeedShowRef {
  id: string;
  title: string;
  series: string;
  duration: string;
  views: number;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  chapters: Chapter[];
  featuredProducts: FeaturedProduct[];
}

export interface FeedMarketRef {
  id: string;
  name: string;
  marketType: string;
  province: string;
  address: string;
  stallCount: number;
  categoryFocus: string;
  href: string;
  imageUrl?: string;
}

export interface FeedCompanyRef {
  id: string;
  name: string;
  tradingName?: string;
  cipcNumber?: string;
  province: string;
  address: string;
  primaryCategory: string;
  catalogCount: number;
  phone?: string;
  whatsapp?: string;
  href: string;
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
  category?: string;
  product?: FeedProductRef;
  media?: FeedMedia;
  show?: FeedShowRef;
  market?: FeedMarketRef;
  company?: FeedCompanyRef;
  stats: {
    likes: number;
    saves: number;
    replies: number;
    reposts: number;
  };
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

export interface CommerceTrend {
  tag: string;
  label: string;
  category: string;
  postsCount: string;
  isHot?: boolean;
  query: string;
}

export interface RecommendedCompany {
  id: string;
  name: string;
  handle: string;
  initials: string;
  verified: boolean;
  category: string;
  location: string;
  href: string;
  whatsapp?: string;
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

function categoryForProduct(product: ProductVariant): string {
  const haystack = `${product.title} ${product.brand} ${product.categoryRef}`.toLowerCase();
  if (/solar|inverter|battery|lithium|panel|ups/.test(haystack)) return 'solar';
  if (/packaging|catering|tub|hanger|spoon|tray|cup/.test(haystack)) return 'packaging';
  if (/cement|brick|hardware|build|paint|steel|timber/.test(haystack)) return 'hardware';
  if (/phone|samsung|iphone|tecno|itel|laptop|tablet|tech/.test(haystack)) return 'tech';
  if (/tyre|automotive|car|spare|engine|oil/.test(haystack)) return 'auto';
  if (/wholesale|spaza|fmcg|grocery|rice|sugar|maize/.test(haystack)) return 'fmcg';
  return 'general';
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
      `🔥 Price drop: ${product.title} just dropped to ${formatZar(priceNow as number)}!\n\n` +
      (verifiedCount > 1 ? `Cheapest of ${verifiedCount} verified sellers — ` : '') +
      `down ${dropPct}% from ${formatZar(priceWas as number)}${marketName ? ` in ${marketName}` : ''}. #PriceDrop #Deals`;
  } else if (dropPct && points.length > 1) {
    kind = 'sweep';
    text =
      `⚡ Market sweep: ${product.title} spotted at ${formatZar(priceNow as number)} — lowest across ` +
      `${points.length} web stockists. Save ${formatZar(spread)} under peak retail. #PriceSweep #BuyBox`;
  } else if (
    confirmedOffer?.updateType === 'stock_confirmed' ||
    confirmedOffer?.updateType === 'stall_visited'
  ) {
    kind = 'restock';
    text = `✅ Counter restock: ${product.title} is on the floor at ${formatZar(priceNow as number)}${
      marketName ? ` in ${marketName}` : ''
    }. Verified physical inventory ready for collection. #Restock`;
  } else {
    kind = 'new_listing';
    text = `📦 Now trading: ${product.title} at ${formatZar(priceNow as number)}${
      marketName ? ` in ${marketName}` : ''
    }. Direct trade counter, 0% platform take-rate. #NewListing`;
  }

  const cta: FeedCTA = best?.href && best.href.startsWith('http')
    ? { label: 'View Stockist', href: best.href, external: true }
    : kind === 'price_drop'
    ? { label: 'Compare Offers', href: `/p/${product.canonicalId}` }
    : kind === 'restock'
    ? { label: 'Direct Order', href: `/p/${product.canonicalId}` }
    : { label: 'Compare Sellers', href: `/p/${product.canonicalId}` };

  return {
    id,
    kind,
    author,
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text,
    category: categoryForProduct(product),
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
      likes: seededInt(`${id}_l`, 18, 940),
      saves: seededInt(`${id}_s`, 6, 380),
      replies: seededInt(`${id}_r`, 2, 46),
      reposts: seededInt(`${id}_rp`, 5, 120),
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
    text: `🎬 Video proof: ${short.title}\n\n${short.summary || 'Real physical hardware testing and trade floor proof.'} #VideoProof #ProductVideo`,
    category: short.category || 'general',
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
      likes: short.likes ?? seededInt(`${id}_l`, 60, 4200),
      saves: seededInt(`${id}_s`, 18, 1600),
      replies: seededInt(`${id}_r`, 4, 180),
      reposts: short.shares ?? seededInt(`${id}_rp`, 12, 380),
    },
    viewers: seededInt(`${id}_v`, 14, 180),
    cta: { label: 'Watch Proof', href: '/shorts' },
  };
}

function buildShowPost(show: MediaItem): FeedPost {
  const id = `post_${show.id}`;
  return {
    id,
    kind: 'show',
    author: {
      id: `studio_${show.id}`,
      name: 'Shoppage Broadcast Network',
      handle: '@shoppage_shows',
      initials: 'SB',
      verified: true,
      href: '/shows',
      marketName: show.marketName,
    },
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text: `📺 Original Series Spotlight: ${show.title}\n\n${show.description || show.summary || ''} #ShoppageShows #WholesaleWalk #LabTest`,
    category: show.category || 'markets',
    show: {
      id: show.id,
      title: show.title,
      series: show.series || 'Original Series',
      duration: show.duration,
      views: show.views,
      description: show.description || show.summary || '',
      thumbnailUrl: show.thumbnailUrl,
      videoUrl: show.videoUrl,
      chapters: show.chapters || [],
      featuredProducts: show.featuredProducts || [],
    },
    media: {
      thumbnailUrl: show.thumbnailUrl,
      videoUrl: show.videoUrl,
      duration: show.duration,
      views: show.views,
    },
    stats: {
      likes: show.likes ?? seededInt(`${id}_l`, 380, 5200),
      saves: seededInt(`${id}_s`, 110, 1800),
      replies: seededInt(`${id}_r`, 22, 240),
      reposts: show.shares ?? seededInt(`${id}_rp`, 45, 480),
    },
    viewers: seededInt(`${id}_v`, 42, 290),
    cta: { label: 'Watch Full Show', href: '/shows' },
  };
}

function buildMarketPost(market: any): FeedPost {
  const id = `post_${market.id}`;
  const initials = initialsOf(market.name);
  return {
    id,
    kind: 'market',
    author: {
      id: `market_${market.id}`,
      name: market.name,
      handle: handleOf(market.name),
      initials,
      verified: true,
      href: `/market/${market.id}`,
      marketName: market.name,
    },
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text: `🏢 Wholesale Commercial Trading Hub: ${market.name} in ${market.province}.\n\nHosting ${market.totalStalls || 250}+ verified stalls, direct container arrivals, and trade counters. Direct buyer pricing, 0% platform commission. #WholesaleMarket #CommercialGrid`,
    category: 'markets',
    market: {
      id: market.id,
      name: market.name,
      marketType: market.marketType || 'wholesale_mall',
      province: market.province,
      address: market.address,
      stallCount: market.totalStalls || 250,
      categoryFocus: market.categoryFocus || 'Wholesale Trade & Retail Hub',
      href: `/market/${market.id}`,
      imageUrl:
        market.imageUrl ||
        'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop',
    },
    stats: {
      likes: seededInt(`${id}_l`, 210, 3100),
      saves: seededInt(`${id}_s`, 75, 940),
      replies: seededInt(`${id}_r`, 14, 110),
      reposts: seededInt(`${id}_rp`, 32, 360),
    },
    viewers: seededInt(`${id}_v`, 25, 160),
    cta: { label: 'Explore Stalls', href: `/market/${market.id}` },
  };
}

function buildCompanyPost(merchant: Merchant): FeedPost {
  const id = `post_${merchant.id}`;
  const primaryCat = merchant.category || 'wholesale';
  const haystack = `${merchant.name} ${primaryCat}`.toLowerCase();
  let category = 'general';
  if (/solar|power|battery|energy/.test(haystack)) category = 'solar';
  else if (/packaging|catering|hospitality/.test(haystack)) category = 'packaging';
  else if (/hardware|build|timber|steel|cement/.test(haystack)) category = 'hardware';
  else if (/phone|tech|cellular|computer/.test(haystack)) category = 'tech';
  else if (/auto|tyre|motor|car/.test(haystack)) category = 'auto';
  else if (/wholesale|fmcg|grocery|spaza/.test(haystack)) category = 'fmcg';

  const whatsapp = merchant.contacts?.whatsapp;
  const phone = merchant.contacts?.telephone;
  const cipc = merchant.cipcEnterpriseNumber;

  return {
    id,
    kind: 'company',
    author: authorFromMerchant(merchant),
    timeLabel: seededPick(`${id}_t`, TIME_LABELS),
    text: `🏪 Verified Trade Counter: ${merchant.name}\n\nOperating in ${merchant.province || 'Gauteng'}. Statutory CIPC compliance verified (${cipc || 'Registered Trade Counter'}). Dealing direct at wholesale and contractor rates. #VerifiedSupplier #DirectTrade`,
    category,
    company: {
      id: merchant.id,
      name: merchant.name,
      tradingName: merchant.name,
      cipcNumber: cipc,
      province: merchant.province || 'Gauteng',
      address: merchant.addressText || 'South Africa',
      primaryCategory: primaryCat,
      catalogCount: seededInt(`${id}_cat`, 45, 360),
      phone,
      whatsapp,
      href: `/m/${merchant.id}`,
    },
    stats: {
      likes: seededInt(`${id}_l`, 140, 2400),
      saves: seededInt(`${id}_s`, 55, 780),
      replies: seededInt(`${id}_r`, 16, 130),
      reposts: seededInt(`${id}_rp`, 22, 290),
    },
    viewers: seededInt(`${id}_v`, 18, 120),
    cta: whatsapp
      ? {
          label: 'WhatsApp Trade Counter',
          href: `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`,
          whatsapp: true,
          external: true,
        }
      : { label: 'View Flagship', href: `/m/${merchant.id}` },
  };
}

let cachedFeed: FeedPost[] | null = null;

export function getFeed(): FeedPost[] {
  if (cachedFeed) return cachedFeed;

  const productPosts = SA_CANONICAL_PRODUCTS.map(buildProductPost).filter(
    (p): p is FeedPost => p !== null,
  );

  const spreadOf = (p: FeedPost) =>
    p.product && typeof p.product.priceNow === 'number' && typeof p.product.priceWas === 'number'
      ? p.product.priceWas - p.product.priceNow
      : 0;

  const rankedProducts = [...productPosts].sort((a, b) => {
    const bySpread = spreadOf(b) - spreadOf(a);
    if (bySpread !== 0) return bySpread;
    return (b.stats.likes ?? 0) - (a.stats.likes ?? 0);
  });

  const shortPosts = SHORTS.map(buildShortPost);
  const showPosts = SHOWS.map(buildShowPost);
  const marketPosts = SA_FLAGSHIP_MARKETS.slice(0, 8).map(buildMarketPost);
  const companyPosts = SA_FLAGSHIP_MERCHANTS.slice(0, 10).map(buildCompanyPost);

  // Blend items algorithmically like Twitter/X timeline:
  const blended: FeedPost[] = [];
  let prodIdx = 0;
  let shortIdx = 0;
  let showIdx = 0;
  let marketIdx = 0;
  let companyIdx = 0;

  while (
    prodIdx < rankedProducts.length ||
    shortIdx < shortPosts.length ||
    showIdx < showPosts.length ||
    marketIdx < marketPosts.length ||
    companyIdx < companyPosts.length
  ) {
    // 2 products
    if (prodIdx < rankedProducts.length) blended.push(rankedProducts[prodIdx++]);
    if (prodIdx < rankedProducts.length) blended.push(rankedProducts[prodIdx++]);

    // 1 video short
    if (shortIdx < shortPosts.length) blended.push(shortPosts[shortIdx++]);

    // 1 company showcase
    if (companyIdx < companyPosts.length) blended.push(companyPosts[companyIdx++]);

    // 1 show episode
    if (showIdx < showPosts.length) blended.push(showPosts[showIdx++]);

    // 1 wholesale market spotlight
    if (marketIdx < marketPosts.length) blended.push(marketPosts[marketIdx++]);
  }

  cachedFeed = blended;
  return blended;
}

export function getTrending(limit = 6): TrendRow[] {
  const rows: TrendRow[] = [];

  for (const post of getFeed()) {
    const p = post.product;
    if (!p || typeof p.priceNow !== 'number' || p.sellerCount === 0) continue;
    if (post.kind === 'short' || post.kind === 'show') continue;

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

export function getCommerceTrends(): CommerceTrend[] {
  return [
    {
      tag: '#SolarInverters',
      label: 'Solar & Load-Shedding',
      category: 'solar',
      postsCount: '4,280 inquiries today',
      isHot: true,
      query: 'inverter',
    },
    {
      tag: '#MidrandPackaging',
      label: 'Catering & Food Packaging',
      category: 'packaging',
      postsCount: '1,840 case packs traded',
      isHot: true,
      query: 'packaging',
    },
    {
      tag: '#DragonCityWholesale',
      label: 'Wholesale Malls & Importers',
      category: 'markets',
      postsCount: '6,120 floor walks',
      isHot: true,
      query: 'Dragon City',
    },
    {
      tag: '#PPC425N',
      label: 'Building & Bulk Cement',
      category: 'hardware',
      postsCount: '890 pallet orders',
      isHot: false,
      query: 'cement',
    },
    {
      tag: '#DynessBattery',
      label: 'LiFePO4 Lithium Storage',
      category: 'solar',
      postsCount: '2,410 price checks',
      isHot: true,
      query: 'battery',
    },
    {
      tag: '#OrientalPlazaFordsburg',
      label: 'B2B Trade Plazas',
      category: 'markets',
      postsCount: '3,100 active visitors',
      isHot: false,
      query: 'Oriental Plaza',
    },
  ];
}

export function getRecommendedCompanies(): RecommendedCompany[] {
  return [
    {
      id: 'loc_mitrend_midrand',
      name: 'Mitrend Products Midrand',
      handle: '@mitrend_midrand',
      initials: 'MP',
      verified: true,
      category: 'Food Packaging & Catering',
      location: 'Midrand, Gauteng',
      href: '/m/loc_mitrend_midrand',
      whatsapp: '+27105007670',
    },
    {
      id: 'solarbros_sandton',
      name: 'SolarBros Sandton',
      handle: '@solarbros_sa',
      initials: 'SB',
      verified: true,
      category: 'Inverters & Lithium Storage',
      location: 'Sandton, Gauteng',
      href: '/search?q=SolarBros',
      whatsapp: '+27117841000',
    },
    {
      id: 'buildmart_centurion',
      name: 'BuildMart Centurion',
      handle: '@buildmart_za',
      initials: 'BM',
      verified: true,
      category: 'Hardware, Cement & Steel',
      location: 'Centurion, Gauteng',
      href: '/search?q=BuildMart',
      whatsapp: '+27126539000',
    },
    {
      id: 'dragon_city_association',
      name: 'Dragon City Traders',
      handle: '@dragoncity_hub',
      initials: 'DC',
      verified: true,
      category: 'Direct Wholesale Importers',
      location: 'Crown Mines, Joburg',
      href: '/market/mkt_dragon_city',
      whatsapp: '+27118385800',
    },
  ];
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

