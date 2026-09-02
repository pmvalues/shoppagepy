/**
 * Discovery feed data layer — South Africa's commercial grid.
 * Provides Twitter/X style posts, polls, product deals, and video shorts.
 */

import type { PostItem } from '@/components/FeedPost';

export type { PostItem, PostProduct, PostPoll, PostBadge, PostStats } from '@/components/FeedPost';
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

export const POSTS: PostItem[] = [
  {
    id: 1,
    name: 'SunPower Solutions',
    handle: '@sunpowersolutionsc',
    av: 'g1',
    ini: 'SP',
    verified: true,
    time: '34m',
    badge: { label: '⚡ PRICE DROP', type: 'drop' },
    cat: 'Solar & Load-Shedding',
    tabs: ['foryou', 'deals'],
    text: 'Deye 5kW 48V Single Phase Hybrid Inverter (SUN-5K-SG03LP1-EU) just moved to R 14 999 — down from R 21 500. Cheapest of 2 verified sellers at Dragon City Wholesale Mall, Crown Mines. Video proof at the counter 📉',
    product: {
      name: 'Deye 5kW 48V Hybrid Inverter',
      price: 'R 14 999',
      old: 'R 21 500',
      off: '-30%',
      note: 'Cheapest of 2 verified sellers · Dragon City Wholesale Mall, Crown Mines',
      href: '/p/var_deye_5kw_hybrid',
    },
    image: IMG.inv,
    stats: { replies: 48, reposts: 213, likes: 1284, views: '112K' },
  },
  {
    id: 2,
    name: 'Takealot.com',
    handle: '@takealotcom',
    av: 'g2',
    ini: 'T',
    verified: true,
    time: '2m',
    badge: { label: 'PRICE SWEEP', type: 'sweep' },
    cat: 'Solar & Load-Shedding',
    tabs: ['foryou', 'deals'],
    text: 'Price sweep: Dyness BX51100 5.12kWh 48V Lithium-ion Battery found at R 23 904 — lowest of 11 retailers tracked online, R 4 580 under the highest web price of R 28 484. 🤖',
    product: {
      name: 'Dyness BX51100 5.12kWh 48V Li-ion Battery',
      price: 'R 23 904',
      old: 'R 28 484',
      off: '-16%',
      note: 'Lowest of 11 retailers tracked online',
      href: '/p/var_dyness_bx51100',
    },
    image: IMG.bat,
    stats: { replies: 21, reposts: 96, likes: 542, views: '48K' },
  },
  {
    id: 3,
    name: 'Dragon City Wholesale Mall',
    handle: '@dragoncitymall',
    av: 'g3',
    ini: 'DC',
    verified: true,
    time: '1h',
    badge: { label: 'RESTOCK', type: 'restock' },
    cat: 'Smartphones & Tech',
    tabs: ['foryou', 'new'],
    text: '📱 Restock alert: Redmi 13 128GB back on the shelf at R 2 999 while stocks last. 200 units landed this morning — first come, first served, counter 47. Bring your ID for trade pricing.',
    product: {
      name: 'Redmi 13 128GB (Midnight Black)',
      price: 'R 2 999',
      old: 'R 3 799',
      off: '-21%',
      note: '200 units in stock · Counter 47, Dragon City',
      href: '/search?q=redmi',
    },
    image: IMG.phn,
    stats: { replies: 64, reposts: 310, likes: 1902, views: '203K' },
  },
  {
    id: 4,
    name: 'Load-Shedding Watch ZA',
    handle: '@loadsheddingza',
    av: 'g4',
    ini: 'LS',
    verified: true,
    time: '3h',
    tabs: ['foryou'],
    text: 'Stage 6 tonight. How are you powering through? 🔋⚡',
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
  },
  {
    id: 5,
    name: 'Joburg Packaging Direct',
    handle: '@joburgpackaging',
    av: 'g5',
    ini: 'JP',
    verified: false,
    time: '2h',
    badge: { label: 'BULK DEAL', type: 'bulk' },
    cat: 'Packaging & Catering',
    tabs: ['foryou', 'deals'],
    text: 'Kraft takeaway combo: 500× clamshell containers + 200× paper bags — R 1 850 per bundle this week only. Trade counter open till 6pm, Booysens. 📦',
    product: {
      name: 'Kraft Takeaway Combo Bundle (700 pcs)',
      price: 'R 1 850',
      old: 'R 2 400',
      off: '-23%',
      note: 'This week only · Booysens trade counter',
      href: '/search?q=packaging',
    },
    image: IMG.pkg,
    stats: { replies: 12, reposts: 44, likes: 231, views: '19K' },
  },
  {
    id: 6,
    name: 'AutoSpares Counter',
    handle: '@autosparesza',
    av: 'g6',
    ini: 'AS',
    verified: true,
    time: '5h',
    badge: { label: '⚡ PRICE DROP', type: 'drop' },
    cat: 'Automotive & Spares',
    tabs: ['foryou', 'deals'],
    text: 'Front brake kit (disc + pads) for Polo Vivo / Golf 1 down to R 1 299 — was R 1 899. Verified at 3 counters in Booysens this morning. Fitment available next door. 🚗',
    product: {
      name: 'Front Brake Kit — Polo Vivo / Golf 1',
      price: 'R 1 299',
      old: 'R 1 899',
      off: '-32%',
      note: 'Verified at 3 counters · Booysens',
      href: '/search?q=brake+kit',
    },
    image: IMG.brk,
    stats: { replies: 18, reposts: 67, likes: 402, views: '35K' },
  },
  {
    id: 7,
    name: 'FMCG Wholesale Feed',
    handle: '@fmcgwholesale',
    av: 'g7',
    ini: 'FM',
    verified: false,
    time: '4h',
    badge: { label: 'PALLET DEAL', type: 'bulk' },
    cat: 'Wholesale FMCG',
    tabs: ['foryou', 'deals', 'new'],
    text: 'Mixed FMCG pallet: maize meal, cooking oil, tinned tomatoes & rice — R 18 400 landed anywhere in Gauteng. 12 pallets left. DM to lock yours. 🛒',
    product: {
      name: 'Mixed FMCG Pallet (Gauteng landed)',
      price: 'R 18 400',
      old: 'R 21 900',
      off: '-16%',
      note: '12 pallets remaining · Delivery included',
      href: '/search?q=fmcg',
    },
    image: IMG.fmcg,
    stats: { replies: 9, reposts: 38, likes: 176, views: '22K' },
  },
];

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

export function getFeed(): PostItem[] {
  return POSTS;
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
  return [
    {
      id: 'sunpower',
      name: 'SunPower Solutions',
      handle: '@sunpowersolutionsc',
      initials: 'SP',
      category: 'Solar & Lithium Storage',
      verified: true,
      href: '/m/loc_sunpower_crownmines',
    },
    {
      id: 'takealot',
      name: 'Takealot.com',
      handle: '@takealotcom',
      initials: 'T',
      category: 'E-commerce & Retail',
      verified: true,
      href: 'https://www.takealot.com',
    },
    {
      id: 'pricehawk',
      name: 'PriceHawk ZA',
      handle: '@pricehawkza',
      initials: 'PH',
      category: 'Price Intelligence',
      verified: false,
      href: '/search?q=pricehawk',
    },
  ];
}

export function getPlatformStats() {
  return {
    products: '1.0M+',
    merchants: '3.1M+',
    malls: '31+',
    takeRate: '0%',
  };
}

export function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatViews(v: number | string): string {
  if (typeof v === 'string') return v;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
