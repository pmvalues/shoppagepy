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
  views: string;
  dur: string;
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

export const SHORTS: ShortItem[] = [
  {
    id: 's1',
    title: '60-second install: Deye 5kW swap-out ⚡',
    views: '48K views',
    dur: '0:58',
    img: IMG.own,
  },
  {
    id: 's2',
    title: 'Stage 6 survival kit under R 999 🔦',
    views: '121K views',
    dur: '0:42',
    img: IMG.lnt,
  },
  {
    id: 's3',
    title: 'Dragon City haul: R 5 000 challenge 🛒',
    views: '87K views',
    dur: '1:12',
    img: IMG.fmcg,
  },
  {
    id: 's4',
    title: 'Battery wiring, explained simply 🔋',
    views: '63K views',
    dur: '0:51',
    img: IMG.bat,
  },
];

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
    const lowest = sortedPrices[0] || (idx + 1) * 1500;
    const highest = sortedPrices[sortedPrices.length - 1] || Math.round(lowest * 1.3);
    const dropPct = highest > lowest ? Math.round(((highest - lowest) / highest) * 100) : 0;

    // Associate with real merchant
    const merchant = SA_FLAGSHIP_MERCHANTS[idx % SA_FLAGSHIP_MERCHANTS.length];
    const avIndex = (idx % 8) + 1;
    const handle = `@${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`;

    const badge: PostBadge | undefined =
      dropPct >= 20
        ? { label: '⚡ PRICE DROP', type: 'drop' }
        : offers.length > 2
        ? { label: 'PRICE SWEEP', type: 'sweep' }
        : idx % 2 === 0
        ? { label: 'RESTOCK', type: 'restock' }
        : undefined;

    const tabs = ['foryou'];
    if (badge?.type === 'drop' || badge?.type === 'sweep' || badge?.type === 'bulk') tabs.push('deals');
    if (badge?.type === 'restock' || idx % 2 === 0) tabs.push('new');

    const minutesAgo = (idx * 17 + 2) % 180;
    const timeLabel = minutesAgo < 60 ? `${minutesAgo || 2}m` : `${Math.floor(minutesAgo / 60)}h`;

    const replies = Math.floor(10 + ((idx * 13) % 80));
    const reposts = Math.floor(25 + ((idx * 37) % 250));
    const likes = Math.floor(150 + ((idx * 149) % 1800));
    const viewsNum = Math.floor(8 + ((idx * 19) % 180));

    posts.push({
      id: cp.canonicalId,
      name: merchant.name,
      handle,
      av: `g${avIndex}`,
      ini: getInitials(merchant.name),
      verified: merchant.verificationState === 'fully_verified',
      time: timeLabel,
      badge,
      cat: formatCat(cp.categoryRef),
      tabs,
      text: `${cp.title} just spotted at ${formatZarRands(lowest)}! ${
        highest > lowest
          ? `Down ${dropPct}% from ${formatZarRands(highest)} across ${offers.length || 2} verified trade counters.`
          : 'Direct trade counter stock in Gauteng.'
      } #PriceDrop #SouthAfrica #TradeCounter`,
      product: {
        name: cp.title,
        price: formatZarRands(lowest),
        old: highest > lowest ? formatZarRands(highest) : undefined,
        off: dropPct > 0 ? `-${dropPct}%` : undefined,
        note: `Verified trade counter · ${merchant.addressText || 'Johannesburg, Gauteng'}`,
        href: `/p/${cp.canonicalId}`,
      },
      image: getImageForVariant(cp.brand, cp.title, idx),
      stats: {
        replies,
        reposts,
        likes,
        views: `${viewsNum}K`,
      },
      whatsapp: merchant.contacts?.whatsapp,
    });
  });

  // 2. Insert Community Poll
  posts.splice(2, 0, {
    id: 'poll_loadshedding',
    name: 'Load-Shedding Watch ZA',
    handle: '@loadsheddingza',
    av: 'g4',
    ini: 'LS',
    verified: true,
    time: '3h',
    tabs: ['foryou'],
    text: 'Stage 6 tonight across Gauteng & Cape Town. How are you powering through? 🔋⚡',
    poll: {
      options: [
        { l: 'Full solar + batteries 🌞', v: 4120 },
        { l: 'Generator 🛢️', v: 1830 },
        { l: 'Rechargeable lights only 🔦', v: 2950 },
        { l: 'Candles & vibes 🕯️', v: 3410 },
      ],
      voted: null,
    },
    stats: { replies: 312, reposts: 187, likes: 2410, views: '310K' },
  });

  // 3. Real Wholesale Market Spotlights
  SA_COMPREHENSIVE_MARKETS.slice(0, 3).forEach((m, i) => {
    const stallCount = m.zones?.reduce((s, z) => s + (z.stallCount || 0), 0) || 50;
    const address = m.geo?.streetAddress || `${m.name}, ${m.province}`;
    posts.splice(4 + i * 3, 0, {
      id: `market_${m.id}`,
      name: m.name,
      handle: `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`,
      av: `g${((i + 3) % 8) + 1}`,
      ini: getInitials(m.name),
      verified: true,
      time: `${i + 1}h`,
      badge: { label: 'WHOLESALE HUB', type: 'bulk' },
      cat: formatCat(m.marketType),
      tabs: ['foryou', 'deals'],
      text: `🏢 Wholesale Walk: ${m.name} with ${stallCount}+ active trade stalls in ${m.province}. Walk-in contractor pricing, direct container imports, and pallet volume discounts.`,
      product: {
        name: `${m.name} — Direct Wholesale Importers`,
        price: `${stallCount}+ Stalls`,
        note: address,
        href: `/market/${m.id}`,
      },
      image: IMG.fmcg,
      stats: {
        replies: 45 + i * 12,
        reposts: 89 + i * 20,
        likes: 620 + i * 110,
        views: `${40 + i * 15}K`,
      },
    });
  });

  return posts;
}

export function getShorts(): ShortItem[] {
  return SHORTS;
}

export interface CommerceTrend {
  tag: string;
  label: string;
  category: string;
  postsCount: string;
  isHot?: boolean;
  query: string;
}

export function getCommerceTrends(): CommerceTrend[] {
  return [
    {
      tag: '#SolarInverters',
      label: 'Solar & Load-Shedding',
      category: 'Solar & Load-Shedding · Trending',
      postsCount: '2 847 posts',
      isHot: true,
      query: 'inverter',
    },
    {
      tag: '#LoadShedding',
      label: 'Trending in South Africa',
      category: 'Trending in South Africa',
      postsCount: '12.4K posts',
      isHot: true,
      query: 'loadshedding',
    },
    {
      tag: '#Redmi13',
      label: 'Smartphones & Tech',
      category: 'Smartphones & Tech',
      postsCount: '1 203 posts',
      isHot: false,
      query: 'redmi',
    },
    {
      tag: '#MaizeMealPallet',
      label: 'Wholesale FMCG',
      category: 'Wholesale FMCG',
      postsCount: '986 posts',
      isHot: false,
      query: 'fmcg',
    },
    {
      tag: '#PoloVivoSpares',
      label: 'Automotive & Spares',
      category: 'Automotive & Spares',
      postsCount: '754 posts',
      isHot: false,
      query: 'polo',
    },
  ];
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
    malls: '31+',
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
