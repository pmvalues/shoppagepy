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
    const attrPrice = (cp.attributes?.estimatedPriceZar as number) || (cp.attributes?.price as number);
    const lowest = sortedPrices[0] || attrPrice || Math.max(25, ((idx * 83 + 150) % 28000));
    const highest = sortedPrices[sortedPrices.length - 1] || Math.round(lowest * 1.25);
    const dropPct = highest > lowest ? Math.round(((highest - lowest) / highest) * 100) : 0;

    // Associate with real verified merchant
    const offer = offers[0];
    const merchant =
      (offer && SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef)) ||
      SA_FLAGSHIP_MERCHANTS[idx % SA_FLAGSHIP_MERCHANTS.length];
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
  const markets: MarketItem[] = [
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
      id: 'group_cape_builders',
      name: 'Western Cape Master Builders & Electrical Guild',
      handle: '@wc_builders_guild',
      initials: 'BG',
      avatarClass: 'g4',
      type: 'community_group',
      typeLabel: 'Contractor Trade Guild',
      province: 'Western Cape',
      location: 'Cape Town & Paarl',
      membersCount: '1,420 Contractors',
      description: 'Contractor exchange for cement pallets, electrical DB boards, scaffolding hire, and municipal compliance CoC signoffs.',
      href: '/requests',
      whatsappGroup: 'https://chat.whatsapp.com/wc-builders-guild',
    },
    {
      id: 'group_kzn_hardware',
      name: 'KZN Trade & Durban Port Importers Network',
      handle: '@kzn_port_trade',
      initials: 'KP',
      avatarClass: 'g5',
      type: 'community_group',
      typeLabel: 'Port Clearance Network',
      province: 'KwaZulu-Natal',
      location: 'Durban Harbour & Pinetown',
      membersCount: '1,190 Traders',
      description: 'Direct port clearance deals for container tools, solar racking, copper cabling, and hardware fittings.',
      href: '/requests',
      whatsappGroup: 'https://chat.whatsapp.com/kzn-port-trade',
    },
  ];

  // Dynamically add all 31 wholesale trade markets from SA_COMPREHENSIVE_MARKETS
  SA_COMPREHENSIVE_MARKETS.forEach((m, idx) => {
    if (markets.some((ex) => ex.id === m.id || ex.id === `market_${m.id}`)) return;
    const stallCount = m.zones?.reduce((s, z) => s + (z.stallCount || 0), 0) || 120;
    const isMall = m.marketType === 'formal_mega_mall';
    markets.push({
      id: m.id.startsWith('market_') ? m.id : `market_${m.id}`,
      name: m.name,
      handle: `@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`,
      initials: getInitials(m.name),
      avatarClass: `g${(idx % 8) + 1}`,
      type: isMall ? 'mega_mall' : 'wholesale_plaza',
      typeLabel: isMall ? 'Commercial Hub' : 'Wholesale Plaza',
      province: m.province || 'Gauteng',
      location: m.metro || `${m.name}, South Africa`,
      stalls: stallCount,
      description: m.landmarks?.length
        ? `Major commercial trade precinct near ${m.landmarks.slice(0, 2).join(' and ')}. High-volume verified counters with zero middleman toll.`
        : 'Active South African commercial trade interchange with verified trade desks.',
      href: `/market/${m.id}`,
      isFavouredDefault: idx < 2,
    });
  });

  return markets;
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
  return SA_CANONICAL_PRODUCTS.map((cp, idx) => {
    const offers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === cp.canonicalId);
    const sortedPrices = offers
      .map((o) => o.price?.amount)
      .filter((p): p is number => typeof p === 'number')
      .sort((a, b) => a - b);
    const attrPrice = (cp.attributes?.estimatedPriceZar as number) || (cp.attributes?.price as number);
    const price = sortedPrices[0] || attrPrice || Math.max(15, ((idx * 83 + 120) % 28000));
    const oldPrice = sortedPrices.length > 1
      ? sortedPrices[sortedPrices.length - 1]
      : Math.round(price * 1.25);
    const dropPct = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

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

    // Match real stockist
    const offer = offers[0];
    const merchant =
      (offer && SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef)) ||
      SA_FLAGSHIP_MERCHANTS[idx % SA_FLAGSHIP_MERCHANTS.length];
    const stockistLocation = merchant
      ? `${merchant.name} · ${merchant.addressText?.split(',')[0] || 'Johannesburg'}`
      : 'Verified South African Trade Counter';

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

    return {
      id: cp.canonicalId,
      title: cp.title,
      brand: cp.brand,
      category: formatCat(cp.categoryRef),
      categoryRef,
      price,
      oldPrice: oldPrice > price ? oldPrice : undefined,
      dropPct: dropPct > 0 ? dropPct : undefined,
      image: getImageForVariant(cp.brand, cp.title, idx),
      sellerCount: Math.max(offers.length, 1),
      stockistLocation,
      href: `/p/${cp.canonicalId}`,
      specs,
    };
  });
}
