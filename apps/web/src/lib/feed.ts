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

export interface MarketItem {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarClass: string;
  type: 'wholesale_plaza' | 'mega_mall' | 'community_group';
  typeLabel: string;
  province: string;
  location: string;
  stalls?: number;
  membersCount?: string;
  description: string;
  href: string;
  whatsappGroup?: string;
  isFavouredDefault?: boolean;
}

export function getMarkets(): MarketItem[] {
  return [
    {
      id: 'market_dragon_city',
      name: 'Dragon City Wholesale Mall',
      handle: '@dragoncity_jhb',
      initials: 'DC',
      avatarClass: 'g1',
      type: 'wholesale_plaza',
      typeLabel: 'Wholesale Hub',
      province: 'Gauteng',
      location: 'Crown Mines, Johannesburg',
      stalls: 450,
      description: 'South Africa’s premier wholesale commercial plaza. Direct container imports, textiles, electronics, hardware, and pallet-load FMCG trade.',
      href: '/market/market_dragon_city',
      isFavouredDefault: true,
    },
    {
      id: 'market_oriental_plaza',
      name: 'Oriental Plaza Fordsburg',
      handle: '@orientalplaza_za',
      initials: 'OP',
      avatarClass: 'g2',
      type: 'wholesale_plaza',
      typeLabel: 'Trade Plaza',
      province: 'Gauteng',
      location: 'Fordsburg, Johannesburg',
      stalls: 360,
      description: 'Historic trade centre renowned for curtaining, tailoring, apparel, commercial catering supplies, and fabric rolls.',
      href: '/market/market_oriental_plaza',
      isFavouredDefault: true,
    },
    {
      id: 'group_gauteng_solar',
      name: 'Gauteng Solar & Electrical Contractors Hub',
      handle: '@gauteng_solar_hub',
      initials: 'GS',
      avatarClass: 'g3',
      type: 'community_group',
      typeLabel: 'WhatsApp Contractor Network',
      province: 'Gauteng',
      location: 'Johannesburg & Pretoria',
      membersCount: '2,480 Active Members',
      description: 'Verified trade community for SABS/NRS 097 inverter deals, battery pallet drops, CoC tips, and load-shedding hardware stock alerts.',
      href: '/requests',
      whatsappGroup: 'https://chat.whatsapp.com/solar-gauteng-verified',
      isFavouredDefault: true,
    },
    {
      id: 'market_china_mall_amalgam',
      name: 'China Mall Amalgam',
      handle: '@chinamall_amalgam',
      initials: 'CM',
      avatarClass: 'g4',
      type: 'wholesale_plaza',
      typeLabel: 'Import Wholesale',
      province: 'Gauteng',
      location: 'Amalgam, Johannesburg',
      stalls: 280,
      description: 'Bulk wholesale lighting, security hardware, packaging supplies, and homeware directly from factory importers.',
      href: '/market/market_china_mall_amalgam',
    },
    {
      id: 'group_jhb_spaza_fmcg',
      name: 'Joburg FMCG & Spaza Bulk Buyers Syndicate',
      handle: '@fmcg_spaza_syndicate',
      initials: 'FS',
      avatarClass: 'g6',
      type: 'community_group',
      typeLabel: 'FMCG Trade Group',
      province: 'Gauteng',
      location: 'Crown Mines & Soweto',
      membersCount: '1,830 Traders',
      description: 'Group buying network for maize meal, cooking oil, rice, sugar, and dry grocery pallets direct from wholesale mills.',
      href: '/requests',
      whatsappGroup: 'https://chat.whatsapp.com/fmcg-spaza-syndicate',
    },
    {
      id: 'market_pretoria_showgrounds',
      name: 'Pretoria Showgrounds Trade Mart',
      handle: '@pta_trademart',
      initials: 'PT',
      avatarClass: 'g5',
      type: 'wholesale_plaza',
      typeLabel: 'Wholesale Mart',
      province: 'Gauteng',
      location: 'Pretoria West, Tshwane',
      stalls: 190,
      description: 'Northern Gauteng industrial and building trade counter hub with high-volume contractor rates.',
      href: '/market/market_pretoria_showgrounds',
    },
    {
      id: 'market_maitland_precinct',
      name: 'Maitland Wholesale & Industrial Precinct',
      handle: '@maitland_trade',
      initials: 'MP',
      avatarClass: 'g7',
      type: 'wholesale_plaza',
      typeLabel: 'Industrial Mart',
      province: 'Western Cape',
      location: 'Maitland, Cape Town',
      stalls: 140,
      description: 'Cape Peninsula hub for electrical wholesalers, marine trade fittings, fasteners, and workshop equipment.',
      href: '/market/market_maitland_precinct',
    },
    {
      id: 'mall_sandton_city',
      name: 'Sandton City Commercial Hub',
      handle: '@sandtoncity_trade',
      initials: 'SC',
      avatarClass: 'g8',
      type: 'mega_mall',
      typeLabel: 'Commercial Hub',
      province: 'Gauteng',
      location: 'Sandton Central, Johannesburg',
      stalls: 300,
      description: 'Africa’s flagship retail and corporate destination with nationwide brand flagships, tech service centres, and direct showrooms.',
      href: '/malls',
    },
  ];
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

export function getProductsCatalog(): ProductCatalogItem[] {
  return [
    {
      id: 'var_deye_5kw_hybrid',
      title: 'Deye 5kW 48V Single Phase Hybrid Inverter (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      category: 'Solar & Power Backup',
      categoryRef: 'solar',
      price: 14999,
      oldPrice: 21500,
      dropPct: 30,
      image: IMG.inv,
      sellerCount: 4,
      stockistLocation: 'Crown Mines, Gauteng · Rubicon & Herholdt’s Stock',
      href: '/p/var_deye_5kw_hybrid',
      specs: 'NRS 097-2-1 Grid Certified · Dual MPPT · 48V Battery Port · 5-Year Warranty',
    },
    {
      id: 'var_freedomwon_home_5_4',
      title: 'Freedom Won LiTE Home 5/4 LiFePO4 5.2kWh Lithium Battery',
      brand: 'Freedom Won',
      category: 'Solar & Power Backup',
      categoryRef: 'solar',
      price: 23800,
      oldPrice: 29900,
      dropPct: 20,
      image: IMG.bat,
      sellerCount: 3,
      stockistLocation: 'Midrand Distribution Centre · Immediate Dispatch',
      href: '/p/var_freedomwon_home_5_4',
      specs: '10-Year Factory Warranty · 6000+ Cycles · CAN Bus Communication · Made in SA',
    },
    {
      id: 'var_sunsynk_8kw_hybrid',
      title: 'Sunsynk 8.8kW Single Phase Smart Hybrid Inverter',
      brand: 'Sunsynk',
      category: 'Solar & Power Backup',
      categoryRef: 'solar',
      price: 27450,
      oldPrice: 33000,
      dropPct: 16,
      image: IMG.inv,
      sellerCount: 3,
      stockistLocation: 'Sandton & Pretoria Counters',
      href: '/p/var_sunsynk_8kw_hybrid',
      specs: 'Aux/Generator Input · Parallel Up to 16 Units · Full Wi-Fi Monitoring App',
    },
    {
      id: 'var_ja_solar_550w',
      title: 'JA Solar 550W Mono PERC Half-Cell Solar Panel',
      brand: 'JA Solar',
      category: 'Solar & Power Backup',
      categoryRef: 'solar',
      price: 1495,
      oldPrice: 1950,
      dropPct: 23,
      image: IMG.inv,
      sellerCount: 5,
      stockistLocation: 'Dragon City & Crown Mines Yard',
      href: '/p/var_ja_solar_550w',
      specs: 'Tier 1 Quality · 21.2% Module Efficiency · 12-Year Product Warranty',
    },
    {
      id: 'var_ppc_cement_50kg',
      title: 'PPC Surebuild 42.5N General Purpose Cement 50kg (Pallet 40 Bags)',
      brand: 'PPC',
      category: 'Building & Hardware',
      categoryRef: 'hardware',
      price: 3920,
      oldPrice: 4400,
      dropPct: 10,
      image: IMG.brk,
      sellerCount: 4,
      stockistLocation: 'Pretoria West & Elandsfontein Yard',
      href: '/p/var_ppc_cement_50kg',
      specs: 'SABS 50197-1 CEM II 42.5N · High Early Strength · Free Forklift Loading',
    },
    {
      id: 'var_afrisam_cement_50kg',
      title: 'AfriSam All Purpose Cement 50kg Bag (CEM II 32.5R)',
      brand: 'AfriSam',
      category: 'Building & Hardware',
      categoryRef: 'hardware',
      price: 96,
      oldPrice: 115,
      dropPct: 16,
      image: IMG.brk,
      sellerCount: 6,
      stockistLocation: 'Aeroton, Gauteng & Chamdor Depot',
      href: '/p/var_afrisam_cement_50kg',
      specs: 'SANS 50197-1 Certified · Ideal for Bricklaying, Plastering, and Slabs',
    },
    {
      id: 'var_redmi_13_128gb',
      title: 'Xiaomi Redmi 13 128GB Midnight Black (ICASA Approved)',
      brand: 'Xiaomi',
      category: 'Smartphones & Tech',
      categoryRef: 'electronics',
      price: 2499,
      oldPrice: 3299,
      dropPct: 24,
      image: IMG.phn,
      sellerCount: 5,
      stockistLocation: 'Dragon City Block A, Stall 114',
      href: '/p/var_redmi_13_128gb',
      specs: '108MP Camera · 5030mAh 33W Turbo Charging · 6.79" 90Hz FHD+ Display',
    },
    {
      id: 'var_galaxy_a16_128gb',
      title: 'Samsung Galaxy A16 128GB LTE Dual-SIM Blue-Black',
      brand: 'Samsung',
      category: 'Smartphones & Tech',
      categoryRef: 'electronics',
      price: 2899,
      oldPrice: 3599,
      dropPct: 19,
      image: IMG.phn,
      sellerCount: 4,
      stockistLocation: 'Oriental Plaza & Sandton Stockists',
      href: '/p/var_galaxy_a16_128gb',
      specs: 'Super AMOLED 90Hz · 6 OS Upgrades Guaranteed · Official Samsung ZA Warranty',
    },
    {
      id: 'var_white_hangers_box50',
      title: 'Anti-Theft Wooden Suit Hangers with Security Ring (Box of 50)',
      brand: 'Mitrend',
      category: 'Packaging & Catering',
      categoryRef: 'packaging',
      price: 840,
      oldPrice: 1100,
      dropPct: 23,
      image: IMG.pkg,
      sellerCount: 2,
      stockistLocation: 'Mitrend Commercial Warehouse, Midrand',
      href: '/p/var_white_hangers_box50',
      specs: 'Solid Hardwood · Chrome Security Collar · Hotels, Lodges & Retail Showrooms',
    },
    {
      id: 'var_clear_tubs_500ml',
      title: 'Food-Grade Clear Deli Containers 500ml with Airtight Lids (Case of 250)',
      brand: 'Mitrend',
      category: 'Packaging & Catering',
      categoryRef: 'packaging',
      price: 320,
      oldPrice: 420,
      dropPct: 23,
      image: IMG.pkg,
      sellerCount: 3,
      stockistLocation: 'Crown Mines & Midrand Dispatch',
      href: '/p/var_clear_tubs_500ml',
      specs: 'Microwave Safe · BPA-Free Polypropylene · Takeaway, Butchery & Meal Prep',
    },
    {
      id: 'var_polo_vivo_brakes',
      title: 'VW Polo Vivo 1.4 / 1.6 Front Brake Discs & Ceramic Pads Kit',
      brand: 'Ferodo / ATE',
      category: 'Automotive Spares',
      categoryRef: 'automotive',
      price: 1150,
      oldPrice: 1480,
      dropPct: 22,
      image: IMG.brk,
      sellerCount: 3,
      stockistLocation: 'Mayfair Motor Spares & Amalgam Counter',
      href: '/p/var_polo_vivo_brakes',
      specs: 'OEM Spec Replacement · Low Dust Ceramic Compound · Fits 2010–2024 Models',
    },
    {
      id: 'var_golden_cloud_flour_10kg',
      title: 'Golden Cloud Cake Wheat Flour 10kg (Bundle of 5 Bags)',
      brand: 'Golden Cloud',
      category: 'Wholesale FMCG',
      categoryRef: 'fmcg',
      price: 485,
      oldPrice: 590,
      dropPct: 17,
      image: IMG.fmcg,
      sellerCount: 4,
      stockistLocation: 'Crown Mines Wholesalers & Soweto Trade Rank',
      href: '/p/var_golden_cloud_flour_10kg',
      specs: 'Super Fine Milled · Bakeries, Caterers & Retail Resellers',
    },
  ];
}
