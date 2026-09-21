import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const outDir = path.join(rootDir, 'services', 'consumer-web', 'data');
fs.mkdirSync(outDir, { recursive: true });

console.log('--- Exporting Seeds for Go Platform ---');

// 1. Export 3,315 Malls
const mallsDbPath = path.join(rootDir, 'shoppage-commerce-intelligence-foundation', 'data', 'study', 'sa_malls_and_shopping_centres.sqlite');
if (fs.existsSync(mallsDbPath)) {
  const db = new DatabaseSync(mallsDbPath, { readOnly: true });
  const rows = db.prepare('SELECT * FROM sa_shopping_centres ORDER BY store_count DESC, name ASC').all();
  
  const malls = rows.map(r => {
    let anchors = [];
    try {
      if (r.anchor_tenants) anchors = JSON.parse(r.anchor_tenants);
    } catch {}
    
    return {
      id: r.id || r.canonical_slug,
      name: r.name,
      slug: r.canonical_slug,
      province: r.province || 'Gauteng',
      metro: r.metro || '',
      suburb: r.suburb || '',
      marketType: r.market_type || 'Regional Shopping Centre',
      streetAddress: r.street_address || `${r.name}, ${r.suburb || ''}`,
      storeCount: r.store_count || 100,
      anchorTenants: Array.isArray(anchors) ? anchors : [],
      latitude: r.latitude || -26.2041,
      longitude: r.longitude || 28.0473
    };
  });

  const mallsFile = path.join(outDir, 'malls.json');
  fs.writeFileSync(mallsFile, JSON.stringify(malls, null, 2), 'utf-8');
  console.log(`✓ Exported ${malls.length} Malls to ${mallsFile}`);
} else {
  console.warn(`! Malls DB missing at ${mallsDbPath}`);
}

// 2. Export Curated & Discovered Retailer Deals
const { SA_MAJOR_RETAILER_DEALS } = await import('../packages/kernel/dist/seed/sa_major_retailer_deals.js');
const deals = SA_MAJOR_RETAILER_DEALS.map(d => ({
  id: d.id,
  title: d.title,
  brand: d.brand,
  merchantName: d.merchantName,
  retailerDomain: d.retailerDomain,
  category: d.category,
  categoryLabel: d.categoryLabel,
  directUrl: d.directProductUrl,
  priceZar: d.dealPriceZar,
  oldPriceZar: d.oldPriceZar || 0,
  discountPct: d.discountPct || (d.oldPriceZar ? Math.round((1 - d.dealPriceZar / d.oldPriceZar) * 100) : 0),
  badge: d.badge || '🔥 SPECIAL',
  availability: d.availability,
  locationHint: d.locationHint,
  imageUrl: d.imageUrl,
  validUntil: d.validUntil || 'Limited Stock'
}));

const dealsFile = path.join(outDir, 'deals.json');
fs.writeFileSync(dealsFile, JSON.stringify(deals, null, 2), 'utf-8');
console.log(`✓ Exported ${deals.length} Retailer Deals to ${dealsFile}`);

// 3. Export Flagship Canonical Products
const { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS, SA_FLAGSHIP_MERCHANTS } = await import('../packages/kernel/dist/seed/sa_flagship_seed.js');

const products = SA_CANONICAL_PRODUCTS.map(p => {
  const offers = SA_FLAGSHIP_OFFERS.filter(o => o.variantRef === p.canonicalId).map(o => {
    const merchant = SA_FLAGSHIP_MERCHANTS.find(m => m.id === o.merchantRef) || {
      id: o.merchantRef,
      name: 'Verified Trade Depot',
      contacts: { whatsapp: '27825551234' }
    };
    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      city: 'Crown Mines, Johannesburg',
      province: 'Gauteng',
      priceZar: o.price?.amount || 0,
      inStock: o.availability?.stockState === 'in_stock',
      leadTimeDays: o.availability?.leadTimeDays || 0,
      verified: true,
      whatsapp: merchant.contacts?.whatsapp || '27825551234',
      rating: 4.9
    };
  });

  const lowestPrice = offers.length ? Math.min(...offers.map(o => o.priceZar)) : (p.attributes?.estimatedPriceZar || 0);

  return {
    canonicalId: p.canonicalId,
    title: p.title,
    brand: p.brand,
    model: p.modelNumber || '',
    category: p.categoryRef || 'general',
    description: p.attributes?.description || `${p.title} with high South African commercial durability.`,
    imageUrl: p.media?.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    gallery: (p.media?.gallery || []).map(g => g.url),
    specs: {
      'Category': p.categoryRef || 'Commercial',
      'Brand': p.brand,
      'Model': p.modelNumber || 'Standard',
      'GTIN': p.identifiers?.gtin13 || p.identifiers?.gtin14 || 'Verified'
    },
    estimatedPriceZar: p.attributes?.estimatedPriceZar || lowestPrice,
    lowestOfferPrice: lowestPrice,
    offers: offers
  };
});

const productsFile = path.join(outDir, 'products.json');
fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf-8');
console.log(`✓ Exported ${products.length} Canonical Products to ${productsFile}`);

// 4. Export Flagship Merchants
const merchants = SA_FLAGSHIP_MERCHANTS.map(m => ({
  id: m.id,
  name: m.name,
  category: m.category || 'General Wholesale',
  suburb: m.addressText?.split(',')?.[0] || 'Crown Mines',
  city: 'Johannesburg',
  province: 'Gauteng',
  address: m.addressText || 'Crown Mines, Johannesburg, 2025',
  phone: m.contacts?.telephone || '+27 11 839 2000',
  whatsapp: m.contacts?.whatsapp || '27825551234',
  rating: m.googleRating || 4.9,
  reviewsCount: m.googleReviewsCount || 100,
  cipcNumber: m.cipcEnterpriseNumber || '2018/194821/07',
  verified: m.verificationState === 'fully_verified',
  catalog: []
}));

const merchantsFile = path.join(outDir, 'merchants.json');
fs.writeFileSync(merchantsFile, JSON.stringify(merchants, null, 2), 'utf-8');
console.log(`✓ Exported ${merchants.length} Merchants to ${merchantsFile}`);

// 5. Export Social Feed Posts (Timeline & Price Drops)
const posts = [];

// Seed product posts
SA_CANONICAL_PRODUCTS.forEach((cp, idx) => {
  const offers = SA_FLAGSHIP_OFFERS.filter(o => o.variantRef === cp.canonicalId);
  const sortedPrices = offers.map(o => o.price?.amount).filter(p => typeof p === 'number').sort((a, b) => a - b);
  const lowest = sortedPrices[0] || cp.attributes?.estimatedPriceZar || 1500;
  const highest = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1] : undefined;
  const dropPct = highest && highest > lowest ? Math.round(((highest - lowest) / highest) * 100) : 0;
  const offer = offers[0];
  const merchant = offer ? SA_FLAGSHIP_MERCHANTS.find(m => m.id === offer.merchantRef) : SA_FLAGSHIP_MERCHANTS[0];
  const merchantName = merchant ? merchant.name : 'Verified Trade Counter';
  const handle = `@${merchantName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`;
  const relTimes = ['4m', '14m', '28m', '45m', '1h', '2h', '3h', '5h', '8h', '1d', '2d'];
  const time = relTimes[idx % relTimes.length];

  const badge = dropPct >= 20 ? { label: '⚡ PRICE DROP', type: 'drop' } : (offers.length > 1 ? { label: 'PRICE SWEEP', type: 'sweep' } : { label: 'VERIFIED STOCK', type: 'restock' });

  posts.push({
    id: cp.canonicalId,
    name: merchantName,
    handle,
    av: `g${(idx % 8) + 1}`,
    ini: merchantName.slice(0, 2).toUpperCase(),
    verified: true,
    time,
    badge,
    cat: cp.categoryRef || 'Commercial',
    tabs: ['foryou', 'deals'],
    text: highest && highest > lowest
      ? `${cp.title} at R ${lowest.toLocaleString('en-ZA')} — down ${dropPct}% from R ${highest.toLocaleString('en-ZA')} across ${offers.length} trade counters. #PriceDrop #SouthAfrica`
      : `${cp.title} listed at R ${lowest.toLocaleString('en-ZA')} by ${merchantName}. Same-day dispatch available in Gauteng. #SouthAfrica #TradeCounter`,
    product: {
      name: cp.title,
      price: `R ${lowest.toLocaleString('en-ZA')}`,
      old: highest && highest > lowest ? `R ${highest.toLocaleString('en-ZA')}` : undefined,
      off: dropPct > 0 ? `-${dropPct}%` : undefined,
      note: `Verified trade counter · ${merchant?.addressText || 'Crown Mines, Johannesburg'}`,
      href: `/p/${cp.canonicalId}`
    },
    image: cp.media?.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    stats: {
      replies: ((idx * 7 + 3) % 22) + 1,
      reposts: ((idx * 11 + 5) % 55) + 3,
      likes: ((idx * 37 + 42) % 380) + 24,
      views: `${(((idx * 1420 + 2150) % 16000) / 1000).toFixed(1)}K`
    },
    whatsapp: merchant?.contacts?.whatsapp || '27825551234'
  });
});

// Insert Community Trade Poll
posts.splice(1, 0, {
  id: 'poll_solar_inverters_2026',
  name: 'Gauteng Solar & Electrical Contractors',
  handle: '@gauteng_solar_guild',
  av: 'g2',
  ini: 'GS',
  verified: true,
  time: '24m',
  badge: { label: 'COMMUNITY POLL', type: 'sweep' },
  cat: 'Solar & Power',
  tabs: ['foryou'],
  text: 'Trade poll for Gauteng installers: Which hybrid inverter capacity is currently moving fastest for your residential installations this quarter?',
  poll: {
    options: [
      { l: 'Deye 5kW Hybrid SG03LP1 (Low Voltage)', v: 142 },
      { l: 'Sunsynk 8kW Hybrid (Dual MPPT)', v: 189 },
      { l: 'Deye 12kW 3-Phase Commercial', v: 47 }
    ],
    voted: null
  },
  stats: {
    replies: 48,
    reposts: 26,
    likes: 215,
    views: '8.4K'
  }
});

// Insert BUCO Clearance Post
posts.splice(3, 0, {
  id: 'deal_buco_cement_clearance',
  name: 'BUCO Trade Counter Midrand',
  handle: '@buco_midrand',
  av: 'g1',
  ini: 'BC',
  verified: true,
  time: '1h',
  badge: { label: '🔥 RETAILER CLEARANCE', type: 'drop' },
  cat: 'Building & Tools',
  tabs: ['foryou', 'deals'],
  text: 'Direct yard special: PPC Surebuild 50kg Cement (42.5N) bulk pallets available for contractor collection at Midrand trade desk. First-come basis.',
  product: {
    name: 'Pretoria Portland Cement (PPC) Surebuild 50kg',
    price: 'R 108',
    old: 'R 125',
    off: '-14%',
    note: 'In-store collection · BUCO Midrand Commercial Yard',
    href: '/p/prod_cement_ppc'
  },
  image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  stats: {
    replies: 19,
    reposts: 41,
    likes: 180,
    views: '6.2K'
  },
  whatsapp: '27118392000'
});

const postsFile = path.join(outDir, 'posts.json');
fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), 'utf-8');
console.log(`✓ Exported ${posts.length} Social Feed Posts to ${postsFile}`);

// 6. Export Trade Video Reels (Shorts)
const shorts = [
  {
    id: 'sh_01',
    title: '🔥 Deye 5kW Hybrid Inverter Full Teardown & Real Load Test under Stage 6',
    views: '48.5K',
    dur: '0:58',
    img: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'solar',
    merchantName: 'SolarBros Sandton',
    merchantWhatsApp: '+27117841000',
    priceZar: 14850,
    likes: 2140,
    summary: 'Testing dual MPPT strings and 4ms UPS switchover under continuous 5000W load test.'
  },
  {
    id: 'sh_02',
    title: '🔋 6,000 Cycles! Dyness BX51100 5.12kWh Lithium Battery Inside Look & Runtime',
    views: '34.9K',
    dur: '0:48',
    img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'solar',
    merchantName: 'SunPower Solutions Crown Mines',
    merchantWhatsApp: '+27118301100',
    priceZar: 16999,
    likes: 1620,
    summary: 'Smart CAN/RS485 BMS communication test and 11.4h backup runtime on home essentials.'
  },
  {
    id: 'sh_03',
    title: '🍽️ Unboxing 157 Commercial Food Packaging & Catering Items in Midrand Showroom',
    views: '22.1K',
    dur: '0:54',
    img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=480&h=854&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'packaging',
    merchantName: 'Mitrend Catering Packaging',
    merchantWhatsApp: '+27105007670',
    priceZar: 185,
    likes: 980,
    summary: 'Heavy-duty kraft containers, corrugated boxes, and greaseproof paper packs direct from importer.'
  },
  {
    id: 'sh_04',
    title: '🧱 PPC Surebuild 50kg Strength Test: Slump & Cube Compression in Concrete Lab',
    views: '19.4K',
    dur: '0:42',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=480&h=854&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'hardware',
    merchantName: 'BUCO Trade Counter',
    merchantWhatsApp: '+27118392000',
    priceZar: 108,
    likes: 850,
    summary: 'Testing 42.5N high-early-strength Portland cement for structural lintels and foundations.'
  }
];

const shortsFile = path.join(outDir, 'shorts.json');
fs.writeFileSync(shortsFile, JSON.stringify(shorts, null, 2), 'utf-8');
console.log(`✓ Exported ${shorts.length} Video Shorts to ${shortsFile}`);

// 7. Export Commerce Trends
const trends = [
  { tag: '#LoadSheddingSolutions', count: '48.2K posts', category: 'Energy' },
  { tag: '#DeyeHybridInverters', count: '31.5K posts', category: 'Solar' },
  { tag: '#PPCCement', count: '19.8K posts', category: 'Construction' },
  { tag: '#CorrugatedBoxes', count: '14.2K posts', category: 'Packaging' },
  { tag: '#CrownMinesWholesale', count: '12.4K posts', category: 'Trade Hubs' },
  { tag: '#BlackFridayWholesale', count: '9.6K posts', category: 'Specials' }
];

const trendsFile = path.join(outDir, 'trends.json');
fs.writeFileSync(trendsFile, JSON.stringify(trends, null, 2), 'utf-8');
console.log(`✓ Exported ${trends.length} Commerce Trends to ${trendsFile}`);

// 8. Export Featured Guilds & Community Hubs
const guilds = [
  {
    id: 'grp_sandton_buy_sell',
    name: 'Sandton Community Buy & Sell',
    location: 'Sandton, Johannesburg',
    members: '42.5K members',
    dailyPosts: '140 posts/day',
    tag: 'Public Group',
    initials: 'SC',
    avatarClass: 'g1',
    query: 'Sandton'
  },
  {
    id: 'grp_pta_solar',
    name: 'Pretoria Solar & Inverter Guild',
    location: 'Pretoria East & Centurion',
    members: '28.4K members',
    dailyPosts: '95 posts/day',
    tag: 'Solar & Power',
    initials: 'PS',
    avatarClass: 'g2',
    query: 'Solar'
  },
  {
    id: 'grp_crown_mines_importers',
    name: 'Crown Mines Wholesale Importers',
    location: 'Crown Mines & Amalgam, JHB',
    members: '51.2K members',
    dailyPosts: '210 posts/day',
    tag: 'Direct Import Hub',
    initials: 'CM',
    avatarClass: 'g3',
    query: 'Crown Mines'
  },
  {
    id: 'grp_east_rand_contractors',
    name: 'East Rand Contractors Network',
    location: 'Boksburg & Benoni, Gauteng',
    members: '19.8K members',
    dailyPosts: '75 posts/day',
    tag: 'Building & Civils',
    initials: 'ER',
    avatarClass: 'g5',
    query: 'Contractor'
  }
];

const guildsFile = path.join(outDir, 'guilds.json');
fs.writeFileSync(guildsFile, JSON.stringify(guilds, null, 2), 'utf-8');
console.log(`✓ Exported ${guilds.length} Community Guilds to ${guildsFile}`);

// Also mirror to root data directory if exists
const rootDataDir = path.join(rootDir, 'data');
if (fs.existsSync(rootDataDir)) {
  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith('.json')) {
      fs.copyFileSync(path.join(outDir, file), path.join(rootDataDir, file));
    }
  }
  console.log(`✓ Mirrored all seed files to ${rootDataDir}`);
}

console.log('--- Seed Export Complete ---');
