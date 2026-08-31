// Centralized high-performance media catalogue for Shoppage video surfaces (Shorts + Shows).
// Standardized on responsive video sources and rich commerce metadata.

export interface FeaturedProduct {
  title: string;
  price: number;
  stockist: string;
  link: string;
  badge?: string;
}

export interface Chapter {
  time: string;
  title: string;
}

export interface MediaItem {
  id: string;
  type: 'short' | 'show';
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: number;
  likes?: number;
  shares?: number;
  category?: 'solar' | 'packaging' | 'tech' | 'hardware' | 'auto' | 'fmcg' | 'markets';
  summary?: string;
  description?: string;
  productTitle?: string;
  productRef?: string;
  priceZar?: number;
  discountText?: string;
  merchantName?: string;
  merchantWhatsApp?: string;
  merchantPhone?: string;
  series?: string;
  marketName?: string;
  featuredProductsCount?: number;
  featuredProducts?: FeaturedProduct[];
  chapters?: Chapter[];
}

const SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

export const SHORTS: MediaItem[] = [
  {
    id: 'sh_01',
    type: 'short',
    title: '🔥 Deye 5kW Hybrid Inverter Full Teardown & Real Load Test under Stage 6',
    productTitle: 'Deye 5kW 48V Hybrid Inverter',
    productRef: 'var_deye_5kw_hybrid',
    priceZar: 14850,
    discountText: 'Direct Importer Price (Save R3,100)',
    category: 'solar',
    merchantName: 'SolarBros Sandton',
    merchantPhone: '+27 11 884 1234',
    views: 48500,
    likes: 2140,
    shares: 520,
    duration: '0:58',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerBlazes.mp4',
    summary: 'Testing dual MPPT strings and 4ms UPS switchover under a continuous 5000W load test.',
    featuredProducts: [
      { title: 'Deye 5kW Hybrid Inverter', price: 14850, stockist: 'SolarBros Sandton', link: '/p/var_deye_5kw_hybrid', badge: 'NRS 097 Certified' },
      { title: 'Dyness 5.12kWh Battery', price: 16999, stockist: 'SolarBros Sandton', link: '/p/var_dyness_5kwh_battery', badge: '10-Yr Warranty' },
    ],
  },
  {
    id: 'sh_02',
    type: 'short',
    title: '🔋 6,000 Cycles! Dyness BX51100 5.12kWh Lithium Battery Inside Look & Runtime',
    productTitle: 'Dyness BX51100 5.12kWh Lithium Battery',
    productRef: 'var_dyness_5kwh_battery',
    priceZar: 16999,
    discountText: 'Warehouse Clearance',
    category: 'solar',
    merchantName: 'SunPower Solutions Crown Mines',
    merchantPhone: '+27 11 830 5678',
    views: 34900,
    likes: 1620,
    shares: 380,
    duration: '0:48',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerEscapes.mp4',
    summary: 'Smart CAN/RS485 BMS communication test and 11.4h backup runtime on home essentials.',
    featuredProducts: [
      { title: 'Dyness BX51100 5.12kWh Battery', price: 16999, stockist: 'SunPower Solutions', link: '/p/var_dyness_5kwh_battery', badge: 'Tier-1 LiFePO4' },
    ],
  },
  {
    id: 'sh_03',
    type: 'short',
    title: '🍽️ Unboxing 157 Commercial Food Packaging & Catering Items in Midrand Showroom',
    productTitle: 'Mitrend Catering & Packaging Range',
    productRef: 'p_mitrend_001',
    priceZar: 185,
    discountText: 'Case Pack Tier (500 Units)',
    category: 'packaging',
    merchantName: 'Mitrend Products (Pty) Ltd',
    merchantPhone: '+27 10 500 7670',
    views: 41200,
    likes: 1950,
    shares: 430,
    duration: '0:55',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerFun.mp4',
    summary: 'Tour of SABS food-grade portioning spoons, tamper-evident containers, and hotel anti-theft hangers.',
    featuredProducts: [
      { title: 'Mitrend 500ml Food Tub (Pack of 250)', price: 185, stockist: 'Mitrend Midrand', link: '/m/loc_mitrend_midrand', badge: 'SABS Approved' },
      { title: 'Mitrend Anti-Theft Hotel Hanger (50pk)', price: 420, stockist: 'Mitrend Midrand', link: '/m/loc_mitrend_midrand', badge: 'Hospitality Grade' },
    ],
  },
  {
    id: 'sh_04',
    type: 'short',
    title: '🏢 Dragon City Wholesale Mall: Walking the Solar & Tech Aisles in Crown Mines',
    productTitle: 'Dragon City Wholesale Mall',
    productRef: 'mkt_dragon_city',
    category: 'markets',
    merchantName: 'Dragon City Traders Association',
    merchantPhone: '+27 11 830 1234',
    views: 92400,
    likes: 4780,
    shares: 1120,
    duration: '1:12',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerJoyrides.mp4',
    summary: 'Exploring building 2 wholesale pricing, trade counters, and direct container arrivals.',
    featuredProducts: [
      { title: 'Solar Inverter Trade Counter Hub', price: 13900, stockist: 'Building 2 Importers', link: '/market/mkt_dragon_city', badge: 'Direct Import' },
    ],
  },
  {
    id: 'sh_05',
    type: 'short',
    title: '⚡ Sunsynk 8kW Single Phase vs Three Phase: Which One Fits Your Home?',
    productTitle: 'Sunsynk 8kW Single Phase Hybrid Inverter',
    productRef: 'var_sunsynk_8kw_hybrid',
    priceZar: 23500,
    discountText: 'Free Local Delivery in Gauteng',
    category: 'solar',
    merchantName: 'SolarBros Sandton',
    merchantPhone: '+27 71 234 5678',
    views: 39800,
    likes: 1840,
    shares: 410,
    duration: '0:55',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerMeltdowns.mp4',
    summary: 'Auxiliary load port configuration for geysers, pool pumps, and smart generator integration.',
    featuredProducts: [
      { title: 'Sunsynk 8kW Hybrid Inverter', price: 23500, stockist: 'SolarBros Sandton', link: '/p/var_sunsynk_8kw_hybrid', badge: 'Smart AUX Port' },
    ],
  },
  {
    id: 'sh_06',
    type: 'short',
    title: '🧱 Building SABS Approved: Cement, Brick & Steel Price Walk at Builders Wholesale',
    productTitle: 'Building & Hardware Bundle',
    productRef: 'cat_hardware',
    priceZar: 94,
    discountText: 'Pallet Rate (40 Bags)',
    category: 'hardware',
    merchantName: 'BuildMart Centurion',
    merchantPhone: '+27 12 845 1234',
    views: 24600,
    likes: 1120,
    shares: 240,
    duration: '0:51',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'BigBuckBunny.mp4',
    summary: 'Comparing 42.5N cement bags and face-brick pallet pricing across the trade aisle.',
    featuredProducts: [
      { title: 'PPC 42.5N Cement 50kg Bag', price: 94, stockist: 'BuildMart Centurion', link: '/search?q=cement', badge: 'SABS 42.5N' },
    ],
  },
];

export const SHOWS: MediaItem[] = [
  {
    id: 'ep_01',
    type: 'show',
    title: 'Dragon City Wholesale Walk: Exploring Building 2 Solar & Inverter Importers',
    series: 'Market Walk South Africa',
    duration: '14:20',
    marketName: 'Dragon City Wholesale Mall, Crown Mines',
    views: 52400,
    featuredProductsCount: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'WeAreGoingOnBullrun.mp4',
    description:
      'We walk through Dragon City Wholesale with local traders, comparing bulk prices for 5kW Deye and Sunsynk inverters directly from verified importers.',
    chapters: [
      { time: '00:00', title: 'Introduction & Crown Mines Wholesale Hub Overview' },
      { time: '03:15', title: 'Building 2: Solar Inverters & Direct Import Aisles' },
      { time: '08:40', title: 'Lithium Battery Warranties & Importer Paperwork' },
      { time: '12:10', title: 'How to Negotiate Trade Counter Discounts' },
    ],
    featuredProducts: [
      { title: 'Deye 5kW Hybrid Inverter', price: 14850, stockist: 'Building 2 Importers', link: '/p/var_deye_5kw_hybrid', badge: 'Best Seller' },
      { title: 'Dyness 5.12kWh Battery', price: 16999, stockist: 'Crown Mines Solar', link: '/p/var_dyness_5kwh_battery', badge: 'Direct Stock' },
      { title: 'Tier-1 550W Mono Solar Panels', price: 1250, stockist: 'SunPower Solutions', link: '/search?q=solar+panel', badge: 'Pallet Deal' },
    ],
  },
  {
    id: 'ep_02',
    type: 'show',
    title: 'Deye 8kW vs Sunsynk 8kW: Lab Load Benchmarks & Auxiliary Generator Switching',
    series: 'Product Battles: Solar & Tech',
    duration: '22:10',
    marketName: 'Shoppage Engineering Lab',
    views: 98200,
    featuredProductsCount: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'TearsOfSteel.mp4',
    description:
      'Comprehensive side-by-side electrical test: MPPT efficiency, fan noise under 8000W continuous load, and smart BMS communication with Dyness lithium batteries.',
    chapters: [
      { time: '00:00', title: 'Test Bench Setup & Safety Calibrations' },
      { time: '05:20', title: '8,000W Continuous Load & Thermal Thermal Scans' },
      { time: '11:45', title: 'AUX Load Generator Automation' },
      { time: '18:10', title: 'Final Benchmark Verdict & ROI Breakdown' },
    ],
    featuredProducts: [
      { title: 'Deye 8kW Hybrid Inverter', price: 24999, stockist: 'SolarBros Sandton', link: '/p/var_deye_5kw_hybrid', badge: 'Winner: Value' },
      { title: 'Sunsynk 8kW Hybrid Inverter', price: 27500, stockist: 'SolarBros Sandton', link: '/p/var_sunsynk_8kw_hybrid', badge: 'Winner: AUX Control' },
    ],
  },
  {
    id: 'ep_03',
    type: 'show',
    title: 'Mitrend Midrand Factory Tour: How Food Packaging & Hospitality Smalls Are Made',
    series: 'Factory & Warehouse Tours',
    duration: '16:45',
    marketName: 'Halfway Gardens, Midrand',
    views: 37500,
    featuredProductsCount: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'Sintel.mp4',
    description:
      'Behind the scenes at Mitrend Products: injection molding, tamper-evident safety tests, and commercial hotel displayware storage.',
    chapters: [
      { time: '00:00', title: 'Welcome to Mitrend Midrand Facility' },
      { time: '04:10', title: 'SABS Food-Grade Plastic Injection Lines' },
      { time: '09:30', title: 'Anti-Theft Hotel Hanger Assembly & Quality Test' },
      { time: '13:50', title: 'B2B Wholesale Ordering & Midrand Trade Counter' },
    ],
    featuredProducts: [
      { title: 'Tamper-Evident Round Tubs 500ml', price: 185, stockist: 'Mitrend Products', link: '/m/loc_mitrend_midrand', badge: 'SABS 100% Virgin' },
      { title: 'Measuring Dosage Spoons (10ml - 50ml)', price: 45, stockist: 'Mitrend Products', link: '/m/loc_mitrend_midrand', badge: 'Pharma Grade' },
    ],
  },
  {
    id: 'ep_04',
    type: 'show',
    title: 'Oriental Plaza Grand Bazaar: Tech Gadgets, Battery Packs & Bargain Hunting',
    series: 'Market Walk South Africa',
    duration: '16:05',
    marketName: 'Oriental Plaza Fordsburg, Johannesburg',
    views: 58900,
    featuredProductsCount: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'WhatCarCanYouGetForAGrand.mp4',
    description:
      'Navigating the Grand Bazaar at Oriental Plaza for cellular accessories, portable power stations, and wholesale electronics.',
    chapters: [
      { time: '00:00', title: 'Entering the Historic Grand Bazaar' },
      { time: '04:30', title: 'Phone Accessories & Fast Charging Hubs' },
      { time: '10:15', title: 'Portable Power Stations for Load-Shedding' },
    ],
    featuredProducts: [
      { title: '65W GaN Fast Charger Multi-Port', price: 349, stockist: 'TechHub Oriental Plaza', link: '/search?q=charger', badge: 'In Stock' },
    ],
  },
];

export const ALL_MEDIA: MediaItem[] = [...SHORTS, ...SHOWS];

export function getMediaById(id: string): MediaItem | undefined {
  return ALL_MEDIA.find((m) => m.id === id);
}
