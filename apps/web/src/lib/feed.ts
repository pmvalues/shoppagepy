/**
 * Discovery feed data layer — South Africa's commercial grid.
 * Maps real database records (canonical products, flagship merchants, markets, shorts)
 * into Twitter/X posts, polls, product deals, and video shorts.
 */

import {
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_MERCHANTS,
  SA_FLAGSHIP_OFFERS,
  SA_COMPREHENSIVE_MARKETS,
  DiscoveredOffersStore,
  SA_MAJOR_RETAILER_DEALS,
} from '@shoppage/kernel';

export interface PostProduct {
  name: string;
  price: string;
  old?: string;
  off?: string;
  note?: string;
  href?: string;
}

export interface PollOption {
  l: string;
  v: number;
}

export interface PostPoll {
  options: PollOption[];
  voted: number | null;
}

export interface PostStats {
  replies: number;
  reposts: number;
  likes: number;
  views: string;
}

export interface PostBadge {
  label: string;
  type: 'drop' | 'sweep' | 'restock' | 'bulk' | string;
}

export interface PostItem {
  id: number | string;
  name: string;
  handle: string;
  av: string;
  ini: string;
  verified: boolean;
  time: string;
  badge?: PostBadge;
  cat?: string;
  tabs: string[];
  text: string;
  product?: PostProduct;
  image?: string;
  poll?: PostPoll;
  stats: PostStats;
  whatsapp?: string;
}

export type FeedPost = PostItem;

export interface ShortItem {
  id: string;
  title: string;
  views?: string;
  dur?: string;
  meta?: string;
  img: string;
}

export const IMG = {
  inv: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/146126218-3e40-4440-9efd-bd3ad3724a94.png',
  bat: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/1da833edd-72fb-4c50-9ca5-8ad475125d09.png',
  phn: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/1f0f3de55-f81b-4ded-921c-e20cc8c56824.png',
  fmcg: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/1aa1d1272-5647-4446-9901-3d2d3ef99289.png',
  brk: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/11e15b512-d9b9-463f-9cab-1d07a11d02f7.png',
  pkg: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/13a656d11-248f-4658-b2ac-e022bc92c1f1.png',
  lnt: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/1b4b0653f-439a-4ccf-a92c-cfe32e974808.png',
  own: 'https://image.qwenlm.ai/public_source/799adab8-af82-468a-997e-65ab7df589b4/1786d84fe-193a-405e-a9aa-91666f8f0410.png',
};

function formatZarRands(rands: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(rands);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatCat(ref?: string): string {
  if (!ref) return 'Commerce';
  if (ref.includes('solar')) return 'Solar & Load-Shedding';
  if (ref.includes('phone') || ref.includes('telecom')) return 'Smartphones & Tech';
  if (ref.includes('pack')) return 'Packaging & Catering';
  if (ref.includes('build') || ref.includes('hard')) return 'Building & Hardware';
  if (ref.includes('auto')) return 'Automotive & Spares';
  if (ref.includes('fmcg')) return 'Wholesale FMCG';
  return ref.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getImageForVariant(brand: string, title: string, idx: number): string {
  const l = `${brand} ${title}`.toLowerCase();
  if (l.includes('deye') || l.includes('sunsynk') || l.includes('inverter')) return IMG.inv;
  if (l.includes('dyness') || l.includes('battery') || l.includes('lithium')) return IMG.bat;
  if (l.includes('redmi') || l.includes('samsung') || l.includes('phone')) return IMG.phn;
  if (l.includes('pack') || l.includes('kraft') || l.includes('tray')) return IMG.pkg;
  if (l.includes('brake') || l.includes('polo') || l.includes('clutch')) return IMG.brk;
  if (l.includes('maize') || l.includes('oil') || l.includes('fmcg')) return IMG.fmcg;
  const values = Object.values(IMG);
  return values[idx % values.length];
}

/**
 * Transforms real database records into Twitter/X post items.
 */
export function getFeed(): PostItem[] {
  const posts: PostItem[] = [];

  // 1. Real Products from SA_CANONICAL_PRODUCTS & SA_FLAGSHIP_OFFERS
  SA_CANONICAL_PRODUCTS.forEach((cp, idx) => {
    const offers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === cp.canonicalId);
    const sortedPrices = offers
      .map((o) => o.price?.amount)
      .filter((p): p is number => typeof p === 'number')
      .sort((a, b) => a - b);
    const attrPrice = (cp.attributes?.estimatedPriceZar as number) || (cp.attributes?.price as number);
    const lowest = sortedPrices[0] ?? attrPrice;
    const offer = offers[0];
    const merchant = offer ? SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef) : undefined;
    if (typeof lowest !== 'number' || !merchant) return;
    const highest = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1] : undefined;
    const dropPct = highest && highest > lowest ? Math.round(((highest - lowest) / highest) * 100) : 0;
    const avIndex = (idx % 8) + 1;
    const handle = `@${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`;

    const badge: PostBadge | undefined =
      dropPct >= 20
        ? { label: '⚡ PRICE DROP', type: 'drop' }
        : offers.length > 2
        ? { label: 'PRICE SWEEP', type: 'sweep' }
        : undefined;

    const tabs = ['foryou'];
    if (badge) tabs.push('deals');

    posts.push({
      id: cp.canonicalId,
      name: merchant.name,
      handle,
      av: `g${avIndex}`,
      ini: getInitials(merchant.name),
      verified: merchant.verificationState === 'fully_verified',
      time: '',
      badge,
      cat: formatCat(cp.categoryRef),
      tabs,
      text:
        highest && highest > lowest
          ? `${cp.title} at ${formatZarRands(lowest)} — down ${dropPct}% from ${formatZarRands(highest)} across ${offers.length} trade counters. #PriceDrop #SouthAfrica`
          : `${cp.title} listed at ${formatZarRands(lowest)} by ${merchant.name}. #SouthAfrica #TradeCounter`,
      product: {
        name: cp.title,
        price: formatZarRands(lowest),
        old: highest && highest > lowest ? formatZarRands(highest) : undefined,
        off: dropPct > 0 ? `-${dropPct}%` : undefined,
        note: `${merchant.verificationState === 'fully_verified' ? 'Verified trade counter · ' : ''}${merchant.addressText || merchant.name}`,
        href: `/p/${cp.canonicalId}`,
      },
      image: getImageForVariant(cp.brand, cp.title, idx),
      stats: {
        replies: 0,
        reposts: 0,
        likes: 0,
        views: '0',
      },
      whatsapp: merchant.contacts?.whatsapp,
    });
  });

  // 2. Wholesale Market Spotlights (kernel data only)
  SA_COMPREHENSIVE_MARKETS.slice(0, 3).forEach((m, i) => {
    const address = m.geo?.streetAddress || m.metro || `${m.name}, ${m.province}`;
    const hubBadge =
      m.marketType === 'wholesale_market'
        ? { label: 'WHOLESALE HUB', type: 'bulk' }
        : m.marketType === 'formal_mega_mall'
        ? { label: 'TRADE HUB', type: 'bulk' }
        : { label: 'TRANSIT HUB', type: 'bulk' };
    posts.splice(4 + i * 3, 0, {
      id: `market_${m.id}`,
      name: m.name,
      handle: `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`,
      av: `g${((i + 3) % 8) + 1}`,
      ini: getInitials(m.name),
      verified: true,
      time: '',
      badge: hubBadge,
      cat: formatCat(m.marketType),
      tabs: ['foryou'],
      text: `🏢 ${m.name} — ${m.province}. ${address}.${
        m.activeMerchantsCount ? ` ${m.activeMerchantsCount} active merchants on the precinct.` : ''
      }${m.landmarks?.length ? ` Near ${m.landmarks.slice(0, 2).join(' and ')}.` : ''}`,
      product: {
        name: m.name,
        price: m.metro || m.province || 'South Africa',
        note: address,
        href: `/market/${m.id}`,
      },
      image: IMG.fmcg,
      stats: {
        replies: 0,
        reposts: 0,
        likes: 0,
        views: '0',
      },
    });
  });

  return posts;
}

export interface RetailSpecial {
  id: string;
  title: string;
  brand: string;
  merchant: string;
  retailerDomain: string;
  category: string;
  categoryLabel: string;
  url: string; // The direct retailer product page URL!
  priceZar: number;
  oldPriceZar?: number;
  priceText: string;
  dropPct?: number;
  badge?: string;
  image: string;
  availability: string;
  locationHint: string;
}

function humanizeRef(ref: string): string {
  const clean = ref
    .replace(/^(?:var_|za_hard_|za_fmcg_|disc_|ext_[a-z0-9]+_)/, '')
    .replace(/_/g, ' ')
    .trim();
  return clean || ref;
}

export function getRetailerSpecials(limit = 60): RetailSpecial[] {
  const out: RetailSpecial[] = [];
  const seen = new Set<string>();

  // 1. Curated major South African retail circular specials (Makro, Game, Builders, Checkers, Pick n Pay, Woolworths, Takealot, Incredible, Clicks, Dis-Chem, Leroy Merlin, SolarAdvice)
  for (const d of SA_MAJOR_RETAILER_DEALS) {
    seen.add(d.directProductUrl);
    out.push({
      id: d.id,
      title: d.title,
      brand: d.brand,
      merchant: d.merchantName,
      retailerDomain: d.retailerDomain,
      category: d.category,
      categoryLabel: d.categoryLabel,
      url: d.directProductUrl,
      priceZar: d.dealPriceZar,
      oldPriceZar: d.oldPriceZar,
      priceText: `R ${d.dealPriceZar.toLocaleString('en-ZA')}`,
      dropPct: d.discountPct,
      badge: d.badge || (d.discountPct ? `-${d.discountPct}%` : 'SPECIAL'),
      image: d.imageUrl,
      availability: d.availability,
      locationHint: d.locationHint,
    });
  }

  // 2. Database-backed discovered offers from sa_discovered_offers.sqlite
  const offers = DiscoveredOffersStore.getAllDiscoveredSpecials(limit);
  for (const o of offers) {
    if (!o.sourceUrl || seen.has(o.sourceUrl)) continue;
    seen.add(o.sourceUrl);
    const amount = o.discoveredPrice?.amount;
    if (typeof amount !== 'number' || amount <= 0) continue;

    const known = SA_CANONICAL_PRODUCTS.find((p) => p.canonicalId === o.masterProductRef);
    const title = o.productTitle || (known ? known.title : humanizeRef(o.masterProductRef));
    const brand = o.brand || (known ? known.brand : (o.merchantName.split(' ')[0] || 'Verified'));
    const domain = o.sourceWebsite || 'retail';
    const category = o.category || known?.categoryRef || 'general';
    const image = o.imageUrl || getImageForVariant(brand, title, out.length);
    const oldPrice = o.oldPriceZar;
    const dropPct =
      o.discountPct ||
      (oldPrice && oldPrice > amount ? Math.round(((oldPrice - amount) / oldPrice) * 100) : undefined);
    const badge = o.dealBadge || (dropPct ? `-${dropPct}%` : 'VERIFIED DEAL');

    out.push({
      id: o.id,
      title,
      brand,
      merchant: o.merchantName,
      retailerDomain: domain,
      category,
      categoryLabel: formatCat(category),
      url: o.sourceUrl,
      priceZar: amount,
      oldPriceZar: oldPrice,
      priceText: o.discoveredPrice.rawPriceText || `R ${amount.toLocaleString('en-ZA')}`,
      dropPct,
      badge,
      image,
      availability: o.availabilityText || 'In Stock · Direct Retailer Listing',
      locationHint: o.locationHint || 'National Distribution',
    });
  }

  return out;
}

export function getShorts(): ShortItem[] {
  return SA_CANONICAL_PRODUCTS.filter((cp) =>
    SA_FLAGSHIP_OFFERS.some(
      (o) => o.variantRef === cp.canonicalId && typeof o.price?.amount === 'number',
    ),
  )
    .slice(0, 4)
    .map((cp, i) => {
      const offer = SA_FLAGSHIP_OFFERS.find(
        (o) => o.variantRef === cp.canonicalId && typeof o.price?.amount === 'number',
      );
      const merchant = offer
        ? SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef)
        : undefined;
      const price = offer?.price?.amount ?? 0;
      return {
        id: `short_${cp.canonicalId}`,
        title: cp.title,
        meta: `${merchant ? `${merchant.name} · ` : ''}${formatZarRands(price)}`,
        img: getImageForVariant(cp.brand, cp.title, i),
      };
    });
}

export interface CommerceTrend {
  tag: string;
  label: string;
  category: string;
  postsCount: string;
  isHot?: boolean;
  query: string;
}

function countLiveOffers(keywords: string[]): number {
  const terms = keywords.map((k) => k.toLowerCase());
  const ids = new Set(
    SA_CANONICAL_PRODUCTS.filter((cp) =>
      terms.some((t) => `${cp.title} ${cp.brand} ${cp.categoryRef}`.toLowerCase().includes(t)),
    ).map((p) => p.canonicalId),
  );
  return SA_FLAGSHIP_OFFERS.filter(
    (o) => ids.has(o.variantRef) && typeof o.price?.amount === 'number',
  ).length;
}

export function getCommerceTrends(): CommerceTrend[] {
  const defs = [
    { tag: '#SolarInverters', label: 'Solar & Load-Shedding', category: 'Solar & Load-Shedding · Trending', isHot: true, query: 'inverter', match: ['inverter', 'sunsynk', 'deye', 'solar', 'panel'] },
    { tag: '#LoadShedding', label: 'Trending in South Africa', category: 'Trending in South Africa', isHot: true, query: 'loadshedding', match: ['battery', 'solar', 'inverter', 'power'] },
    { tag: '#Redmi13', label: 'Smartphones & Tech', category: 'Smartphones & Tech', isHot: false, query: 'redmi', match: ['redmi', 'samsung', 'iphone', 'phone'] },
    { tag: '#MaizeMealPallet', label: 'Wholesale FMCG', category: 'Wholesale FMCG', isHot: false, query: 'fmcg', match: ['maize', 'flour', 'oil', 'fmcg', 'sugar'] },
    { tag: '#PoloVivoSpares', label: 'Automotive & Spares', category: 'Automotive & Spares', isHot: false, query: 'polo', match: ['polo', 'brake', 'vivo', 'spares'] },
  ];
  return defs.map((d) => {
    const n = countLiveOffers(d.match);
    return {
      tag: d.tag,
      label: d.label,
      category: d.category,
      postsCount: `${n} live offer${n === 1 ? '' : 's'}`,
      isHot: d.isHot,
      query: d.query,
    };
  });
}

export interface RecommendedCompany {
  id: string;
  name: string;
  handle: string;
  initials: string;
  category: string;
  verified: boolean;
  href: string;
}

export function getRecommendedCompanies(): RecommendedCompany[] {
  return SA_FLAGSHIP_MERCHANTS.slice(0, 5).map((m) => ({
    id: m.id,
    name: m.name,
    handle: `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`,
    initials: getInitials(m.name),
    category: 'Verified Trade Counter',
    verified: m.verificationState === 'fully_verified',
    href: `/m/${m.id}`,
  }));
}

export function getPlatformStats() {
  return {
    products: '1.0M+',
    merchants: '3.1M+',
    malls: '3.3K+',
    takeRate: '0%',
  };
}

export function formatZar(rands: number): string {
  return formatZarRands(rands);
}

export function formatViews(v: number | string): string {
  if (typeof v === 'string') return v;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export interface MarketItem {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarClass: string;
  type: 'wholesale_plaza' | 'mega_mall' | 'transport_hub';
  typeLabel: string;
  province: string;
  location: string;
  stalls?: number;
  description: string;
  href: string;
}

export function getMarkets(): MarketItem[] {
  return SA_COMPREHENSIVE_MARKETS.map((m, idx) => {
    const isMall = m.marketType === 'formal_mega_mall';
    const isWholesale = m.marketType === 'wholesale_market';
    return {
      id: m.id.startsWith('market_') ? m.id : `market_${m.id}`,
      name: m.name,
      handle: `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`,
      initials: getInitials(m.name),
      avatarClass: `g${(idx % 8) + 1}`,
      type: isMall ? 'mega_mall' : isWholesale ? 'wholesale_plaza' : 'transport_hub',
      typeLabel: isMall ? 'Commercial Hub' : isWholesale ? 'Wholesale Plaza' : 'Transit Hub',
      province: m.province || 'South Africa',
      location: m.geo?.streetAddress || m.metro || m.name,
      stalls: m.activeMerchantsCount,
      description: m.landmarks?.length
        ? `Major trade precinct near ${m.landmarks.slice(0, 2).join(' and ')}.`
        : `${m.name} — verified South African trade precinct.`,
      href: `/market/${m.id}`,
    };
  });
}

export interface ProductCatalogItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  categoryRef: string;
  price: number;
  oldPrice?: number;
  dropPct?: number;
  image: string;
  sellerCount: number;
  stockistLocation: string;
  href: string;
  specs: string;
}

export function getProductsCatalog(limit = 2500): ProductCatalogItem[] {
  const items: ProductCatalogItem[] = [];
  SA_CANONICAL_PRODUCTS.forEach((cp, idx) => {
    const offers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === cp.canonicalId);
    const sortedPrices = offers
      .map((o) => o.price?.amount)
      .filter((p): p is number => typeof p === 'number')
      .sort((a, b) => a - b);
    const attrPrice = (cp.attributes?.estimatedPriceZar as number) || (cp.attributes?.price as number);
    const price = sortedPrices[0] ?? attrPrice;
    const offer = offers[0];
    const merchant = offer ? SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef) : undefined;
    if (typeof price !== 'number' || !merchant) return;
    const oldPrice = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1] : undefined;
    const dropPct = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

    // Determine categoryRef
    let categoryRef = 'solar';
    const cLower = (cp.categoryRef + ' ' + (cp.attributes?.category || '')).toLowerCase();
    if (cLower.includes('solar') || cLower.includes('inverter') || cLower.includes('battery') || cLower.includes('panel')) {
      categoryRef = 'solar';
    } else if (cLower.includes('phone') || cLower.includes('smart') || cLower.includes('tech') || cLower.includes('elect')) {
      categoryRef = 'electronics';
    } else if (cLower.includes('pack') || cLower.includes('cater') || cLower.includes('tubs') || cLower.includes('hangers')) {
      categoryRef = 'packaging';
    } else if (cLower.includes('hard') || cLower.includes('build') || cLower.includes('cement') || cLower.includes('brick') || cLower.includes('grind')) {
      categoryRef = 'hardware';
    } else if (cLower.includes('auto') || cLower.includes('brake') || cLower.includes('car') || cLower.includes('spares') || cLower.includes('service')) {
      categoryRef = 'automotive';
    } else if (cLower.includes('fmcg') || cLower.includes('food') || cLower.includes('flour') || cLower.includes('oil') || cLower.includes('maize') || cLower.includes('sugar')) {
      categoryRef = 'fmcg';
    }

    const stockistLocation = `${merchant.name} · ${merchant.addressText?.split(',')[0] || 'South Africa'}`;

    // Specs
    const complianceParts: string[] = [];
    if (cp.compliance?.nrs097Certified) complianceParts.push('NRS 097-2-1 Grid Certified');
    if (cp.compliance?.sabsApproved) complianceParts.push('SABS Approved');
    if (cp.compliance?.icasaApproved) complianceParts.push('ICASA Approved');
    if (cp.compliance?.warrantyYears) complianceParts.push(`${cp.compliance.warrantyYears}-Year Warranty`);

    const specs =
      (complianceParts.length > 0 ? complianceParts.join(' · ') : null) ||
      (cp.attributes?.specs as string) ||
      (cp.attributes?.warrantyYears ? `${cp.attributes.warrantyYears}-Year Warranty · SABS Certified` : 'Commercial Grade · Direct Trade Counter');

    items.push({
      id: cp.canonicalId,
      title: cp.title,
      brand: cp.brand,
      category: formatCat(cp.categoryRef),
      categoryRef,
      price,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
      dropPct: dropPct > 0 ? dropPct : undefined,
      image: getImageForVariant(cp.brand, cp.title, idx),
      sellerCount: offers.length,
      stockistLocation,
      href: `/p/${cp.canonicalId}`,
      specs,
    });
  });

  // 2. Add verified products from DiscoveredOffersStore (sa_discovered_offers.sqlite)
  try {
    const discoveredOffers = DiscoveredOffersStore.getLatestDiscoveredOffers(limit);
    const seenCatalogTitles = new Set(items.map((i) => i.title.toLowerCase().trim()));
    for (const o of discoveredOffers) {
      const rawTitle = o.productTitle || humanizeRef(o.masterProductRef);
      const cleanTitle = rawTitle.toLowerCase().trim();
      if (!cleanTitle || seenCatalogTitles.has(cleanTitle)) continue;
      seenCatalogTitles.add(cleanTitle);

      const price = typeof o.discoveredPrice?.amount === 'number' && o.discoveredPrice.amount > 0
        ? o.discoveredPrice.amount
        : undefined;

      let categoryRef = 'solar';
      const cLower = `${o.category || ''} ${cleanTitle} ${o.brand || ''}`.toLowerCase();
      if (cLower.includes('solar') || cLower.includes('inverter') || cLower.includes('battery') || cLower.includes('panel')) {
        categoryRef = 'solar';
      } else if (cLower.includes('phone') || cLower.includes('smart') || cLower.includes('tech') || cLower.includes('elect')) {
        categoryRef = 'electronics';
      } else if (cLower.includes('pack') || cLower.includes('cater') || cLower.includes('tubs') || cLower.includes('hangers')) {
        categoryRef = 'packaging';
      } else if (cLower.includes('hard') || cLower.includes('build') || cLower.includes('cement') || cLower.includes('brick') || cLower.includes('grind') || cLower.includes('tool')) {
        categoryRef = 'hardware';
      } else if (cLower.includes('auto') || cLower.includes('brake') || cLower.includes('car') || cLower.includes('spares') || cLower.includes('service')) {
        categoryRef = 'automotive';
      } else if (cLower.includes('fmcg') || cLower.includes('food') || cLower.includes('flour') || cLower.includes('oil') || cLower.includes('maize') || cLower.includes('sugar') || cLower.includes('grocer')) {
        categoryRef = 'fmcg';
      }

      const dropPct = o.discountPct || (o.oldPriceZar && price && o.oldPriceZar > price ? Math.round(((o.oldPriceZar - price) / o.oldPriceZar) * 100) : undefined);

      items.push({
        id: o.id || o.masterProductRef,
        title: rawTitle,
        brand: o.brand || o.merchantName.split(' ')[0] || 'Verified',
        category: formatCat(categoryRef),
        categoryRef,
        price: price || 0,
        oldPrice: o.oldPriceZar,
        dropPct: dropPct && dropPct > 0 ? dropPct : undefined,
        image: o.imageUrl || getImageForVariant(o.brand || '', rawTitle, items.length),
        sellerCount: 1,
        stockistLocation: `${o.merchantName} · Direct Retailer`,
        href: o.sourceUrl || `/p/${o.masterProductRef}`,
        specs: o.availabilityText || 'Verified Retail Catalog Listing',
      });
    }
  } catch {
    // Graceful fallback to canonical products only
  }

  return items;
}
