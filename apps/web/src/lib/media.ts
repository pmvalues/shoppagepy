// Centralized media catalogue for the Shoppage video surfaces (Shorts + Shows).
// Videos use Google's public sample bucket so the UI is fully functional offline.

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
  summary?: string;
  description?: string;
  productTitle?: string;
  productRef?: string;
  merchantName?: string;
  merchantWhatsApp?: string;
  series?: string;
  marketName?: string;
  featuredProductsCount?: number;
}

const SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

export const SHORTS: MediaItem[] = [
  {
    id: 'sh_01',
    type: 'short',
    title: '🔥 Deye 5kW Hybrid Inverter Full Teardown & Real Load Test under Stage 6',
    productTitle: 'Deye 5kW 48V Hybrid Inverter',
    productRef: 'var_deye_5kw_hybrid',
    merchantName: 'SolarBros Sandton',
    merchantWhatsApp: '27712345678',
    views: 42500,
    likes: 1840,
    shares: 420,
    duration: '0:58',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerBlazes.mp4',
    summary: 'Testing dual MPPT strings and 4ms UPS switchover with 5000W load.',
  },
  {
    id: 'sh_02',
    type: 'short',
    title: '🔋 6,000 Cycles! Dyness BX51100 5.12kWh Lithium Battery Inside Look & Runtime',
    productTitle: 'Dyness BX51100 5.12kWh Lithium Battery',
    productRef: 'var_dyness_5kwh_battery',
    merchantName: 'SunPower Solutions Crown Mines',
    merchantWhatsApp: '27829876543',
    views: 28900,
    likes: 1220,
    shares: 290,
    duration: '0:48',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerEscapes.mp4',
    summary: 'Checking smart BMS communication and 11.4h backup runtime on home essentials.',
  },
  {
    id: 'sh_03',
    type: 'short',
    title: '🏢 Dragon City Wholesale Mall: Walking the Solar & Tech Aisles in Crown Mines',
    productTitle: 'Dragon City Wholesale Mall',
    productRef: 'mkt_dragon_city',
    merchantName: 'Dragon City Traders Association',
    merchantWhatsApp: '27118301234',
    views: 88200,
    likes: 4100,
    shares: 980,
    duration: '1:12',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerFun.mp4',
    summary: 'Exploring building 2 wholesale pricing and importer trade counters.',
  },
  {
    id: 'sh_04',
    type: 'short',
    title: '⚡ Sunsynk 8kW Single Phase vs Three Phase: Which One Fits Your Home?',
    productTitle: 'Sunsynk 8kW Single Phase Hybrid Inverter',
    productRef: 'var_sunsynk_8kw_hybrid',
    merchantName: 'SolarBros Sandton',
    merchantWhatsApp: '27712345678',
    views: 34100,
    likes: 1560,
    shares: 340,
    duration: '0:55',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerJoyrides.mp4',
    summary: 'Auxiliary load port configuration for geysers and smart generator integration.',
  },
  {
    id: 'sh_05',
    type: 'short',
    title: '📱 Samsung Galaxy A16 Unboxing & First 24h Real-World Battery Test',
    productTitle: 'Samsung Galaxy A16 128GB',
    productRef: 'var_samsung_a16_128gb',
    merchantName: 'TechHub Oriental Plaza',
    merchantWhatsApp: '27831234567',
    views: 51200,
    likes: 2300,
    shares: 510,
    duration: '1:04',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'ForBiggerMeltdowns.mp4',
    summary: 'Exynos chipset thermals, 5000mAh endurance and camera samples in low light.',
  },
  {
    id: 'sh_06',
    type: 'short',
    title: '🧱 Building SABS Approved: Cement, Brick & Steel Price Walk at Builders Wholesale',
    productTitle: 'Building & Hardware Bundle',
    productRef: 'cat_hardware',
    merchantName: 'BuildMart Centurion',
    merchantWhatsApp: '27128451234',
    views: 19800,
    likes: 870,
    shares: 150,
    duration: '0:51',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=480&h=854&fit=crop',
    videoUrl: SAMPLE + 'BigBuckBunny.mp4',
    summary: 'Comparing 42.5N cement bags and face-brick pallet pricing across the aisle.',
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
    views: 48200,
    featuredProductsCount: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'WeAreGoingOnBullrun.mp4',
    description:
      'We walk through Dragon City Wholesale with local traders, comparing bulk prices for 5kW Deye and Sunsynk inverters directly from verified importers.',
  },
  {
    id: 'ep_02',
    type: 'show',
    title: 'Sandton City Diamond Walk & Level 2 Tech: Premium Solar & Computing Showcases',
    series: 'Market Walk South Africa',
    duration: '18:45',
    marketName: 'Sandton City, Johannesburg',
    views: 62100,
    featuredProductsCount: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'VolkswagenGTIReview.mp4',
    description:
      'Visiting authorized distributors and specialist clean-energy retail studios in Sandton City Nelson Mandela Square concourses.',
  },
  {
    id: 'ep_03',
    type: 'show',
    title: 'Deye 8kW vs Sunsynk 8kW: Lab Load Benchmarks & Auxiliary Generator Switching',
    series: 'Product Battles: Solar & Tech',
    duration: '22:10',
    marketName: 'Shoppage Engineering Lab',
    views: 94500,
    featuredProductsCount: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'TearsOfSteel.mp4',
    description:
      'Comprehensive side-by-side electrical test: MPPT efficiency, fan noise under 8000W load, and smart BMS communication with Dyness lithium batteries.',
  },
  {
    id: 'ep_04',
    type: 'show',
    title: 'Oriental Plaza Grand Bazaar: Tech Gadgets, Battery Packs & Bargain Hunting',
    series: 'Market Walk South Africa',
    duration: '16:05',
    marketName: 'Oriental Plaza Fordsburg, Johannesburg',
    views: 53800,
    featuredProductsCount: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'WhatCarCanYouGetForAGrand.mp4',
    description:
      'Navigating the Grand Bazaar at Oriental Plaza for cellular accessories, portable power stations, and wholesale electronics.',
  },
  {
    id: 'ep_05',
    type: 'show',
    title: 'SABS & NRS 097 Deep Dive: What Certification Actually Means for Your Inverter',
    series: 'Product Battles: Solar & Tech',
    duration: '19:30',
    marketName: 'Shoppage Compliance Studio',
    views: 38700,
    featuredProductsCount: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1545259741-2ea1417ae7a1?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'Sintel.mp4',
    description:
      'Breaking down grid-tie certification, CoC requirements under SANS 10142-1, and how to read a warranty certificate from an importer.',
  },
  {
    id: 'ep_06',
    type: 'show',
    title: 'Township Spaza to Mega-Mall: How South African Retail Actually Works',
    series: 'Market Walk South Africa',
    duration: '24:50',
    marketName: 'Soweto & Sandton, Johannesburg',
    views: 71200,
    featuredProductsCount: 20,
    thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop',
    videoUrl: SAMPLE + 'ElephantsDream.mp4',
    description:
      'A ground-level look at supply chains from informal spaza stores to super-regional malls and the role of verified merchant networks.',
  },
];

export const ALL_MEDIA: MediaItem[] = [...SHORTS, ...SHOWS];

export function getMediaById(id: string): MediaItem | undefined {
  return ALL_MEDIA.find((m) => m.id === id);
}
