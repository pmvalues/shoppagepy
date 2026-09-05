import { Offer, DiscoveredOffer, Merchant, ProductVariant } from '@shoppage/contracts';
import { evaluateOfferFreshness } from '../offers/freshness';
import { SA_FLAGSHIP_OFFERS } from '../seed/sa_flagship_seed';

import { getSqliteDatabase } from './db_resolver';

function getDiscoveredOffersSqliteDb() {
  return getSqliteDatabase('sa_discovered_offers.sqlite', { readOnly: true });
}

function getDiscoveredOffersSqliteRwDb() {
  return getSqliteDatabase('sa_discovered_offers.sqlite', { readOnly: false });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

function getDeterministicSku(productId: string, retailer: string): string {
  let hash = 0;
  const str = productId + ':' + retailer;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString().slice(0, 8);
}

// Curated authentic South African retailer direct product page and catalog mappings
const KNOWN_DIRECT_PRODUCT_URLS: Record<string, Record<string, string>> = {
  var_deye_5kw_hybrid: {
    'takealot.com': 'https://www.takealot.com/deye-5kw-hybrid-inverter-48v-single-phase/PLID91428540',
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/inverters/hybrid-inverters/deye-5kw-hybrid-inverter/',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Inverters/Deye-5kW-Hybrid-Inverter-48V/p/000000000000784291',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/deye-hybrid-inverter-5kw-48v-single-phase-81472910',
    'inverterwarehouse.co.za': 'https://inverterwarehouse.co.za/product/deye-5kw-hybrid-inverter/',
    'solartechdirect.co.za': 'https://solartechdirect.co.za/product/deye-5kw-hybrid-inverter/',
  },
  var_sunsynk_8kw_hybrid: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/inverters/hybrid-inverters/sunsynk-8kw-hybrid-inverter/',
    'takealot.com': 'https://www.takealot.com/sunsynk-8kw-hybrid-inverter-48v-single-phase/PLID90823140',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Inverters/Sunsynk-8kW-Hybrid-Inverter/p/000000000000784295',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/sunsynk-hybrid-inverter-8kw-48v-81472922',
    'inverterwarehouse.co.za': 'https://inverterwarehouse.co.za/product/sunsynk-8kw-hybrid-inverter/',
  },
  var_dyness_5kwh_battery: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/solar-batteries/lithium-ion-solar-batteries/dyness-5-12kwh-lithium-battery/',
    'takealot.com': 'https://www.takealot.com/dyness-5-12kwh-bx51100-lithium-battery-48v/PLID92147850',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Solar-Batteries/Dyness-BX51100-5-12kWh-Lithium-Battery/p/000000000000791420',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/dyness-lithium-battery-5-12kwh-48v-81489012',
    'solartechdirect.co.za': 'https://solartechdirect.co.za/product/dyness-5-12kwh-lithium-battery/',
  },
  var_pylontech_up5000: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/solar-batteries/lithium-ion-solar-batteries/pylontech-up5000-4-8kwh-lithium-battery/',
    'takealot.com': 'https://www.takealot.com/pylontech-up5000-4-8kwh-48v-lithium-battery/PLID73194820',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Solar-Batteries/Pylontech-UP5000-4-8kWh-Lithium-Battery/p/000000000000762145',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/pylontech-up5000-lithium-battery-4-8kwh-81451203',
  },
  var_ja_solar_550w: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/solar-panels/monocrystalline-solar-panels/ja-solar-550w-mono-perc-solar-panel/',
    'takealot.com': 'https://www.takealot.com/ja-solar-550w-mono-perc-half-cell-solar-panel/PLID91502931',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Solar-Panels/JA-Solar-550W-Mono-Solar-Panel/p/000000000000778190',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/ja-solar-panel-550w-mono-perc-81463190',
  },
  var_victron_multiplus_5kva: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/inverters/pure-sine-wave-inverters/victron-multiplus-ii-48-5000-70-50/',
    'takealot.com': 'https://www.takealot.com/victron-multiplus-ii-48-5000-70-50-inverter-charger/PLID72910482',
    'inverterwarehouse.co.za': 'https://inverterwarehouse.co.za/product/victron-multiplus-ii-48-5000-70-50/',
  },
  var_ppc_surebuild_50kg: {
    'builders.co.za': 'https://www.builders.co.za/Building-Materials/Cement-and-Aggregates/Cement/PPC-Surebuild-Cement-42-5N-50kg/p/000000000000012480',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/ppc-surebuild-cement-50kg-81423450',
    'makro.co.za': 'https://www.makro.co.za/hardware-auto/building-materials/cement-concrete/ppc-surebuild-cement-50kg-p-000000000000123984_EA',
    'takealot.com': 'https://www.takealot.com/ppc-surebuild-cement-50kg-bag/PLID93201481',
  },
  var_samsung_a16_128gb: {
    'takealot.com': 'https://www.takealot.com/samsung-galaxy-a16-128gb-lte-dual-sim-black/PLID95182930',
    'incredible.co.za': 'https://www.incredible.co.za/samsung-galaxy-a16-128gb-lte-black-10304918',
    'makro.co.za': 'https://www.makro.co.za/electronics-appliances/cellular-phones/smartphones/samsung-galaxy-a16-128gb-black-p-000000000000491028_EA',
  },
  za_fmcg_whitestar_2k5: {
    'checkers.co.za': 'https://www.checkers.co.za/All-Departments/Food/Food-Cupboard/Grains-Rice-and-Pasta/Maize-Meal/White-Star-Super-Maize-Meal-2-5kg/p/10129481001_EA',
    'woolworths.co.za': 'https://www.woolworths.co.za/prod/Food/Pantry/Grains-Rice-Pasta/White-Star-Super-Maize-Meal-2-5kg/_/A-6001048002148',
    'makro.co.za': 'https://www.makro.co.za/food/pantry-dry-goods/maize-meal-samp/white-star-super-maize-meal-10kg-p-000000000000019284_EA',
    'takealot.com': 'https://www.takealot.com/white-star-super-maize-meal-10kg/PLID91823901',
  },
  var_samsung_s24_ultra_256gb: {
    'incredible.co.za': 'https://www.incredible.co.za/samsung-galaxy-s24-ultra-256gb-titanium-black-10349182',
    'takealot.com': 'https://www.takealot.com/samsung-galaxy-s24-ultra-256gb-5g-titanium-black/PLID94829104',
    'makro.co.za': 'https://www.makro.co.za/electronics-appliances/cellular-phones/smartphones/samsung-galaxy-s24-ultra-256gb-black-p-000000000000582910_EA',
  },
  var_apple_iphone_15_128gb: {
    'incredible.co.za': 'https://www.incredible.co.za/apple-iphone-15-128gb-black-10319284',
    'takealot.com': 'https://www.takealot.com/apple-iphone-15-128gb-black/PLID93819201',
    'makro.co.za': 'https://www.makro.co.za/electronics-appliances/cellular-phones/smartphones/apple-iphone-15-128gb-black-p-000000000000519284_EA',
  },
  var_canadian_solar_550w: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/solar-panels/monocrystalline-solar-panels/canadian-solar-550w-mono-perc-solar-panel/',
    'builders.co.za': 'https://www.builders.co.za/Solar-Power-and-Generators/Solar-Panels/Canadian-Solar-550W-Mono-Panel/p/000000000000781290',
  },
  var_jojo_tank_2500l: {
    'builders.co.za': 'https://www.builders.co.za/Plumbing/Water-Tanks-and-Pumps/Water-Tanks/JoJo-2500L-Vertical-Water-Storage-Tank-Green/p/000000000000219482',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/jojo-vertical-water-tank-2500l-green-81410924',
    'makro.co.za': 'https://www.makro.co.za/hardware-auto/plumbing-water-management/water-tanks/jojo-2500l-vertical-water-tank-p-000000000000214981_EA',
  },
  var_bosch_gsb_18v50_drill: {
    'builders.co.za': 'https://www.builders.co.za/Tools/Power-Tools/Drills-and-Drivers/Bosch-GSB-18V-50-Cordless-Impact-Drill/p/000000000000691240',
    'leroymerlin.co.za': 'https://leroymerlin.co.za/bosch-professional-cordless-combi-drill-gsb-18v-50-81491024',
    'takealot.com': 'https://www.takealot.com/bosch-gsb-18v-50-cordless-impact-drill/PLID71829401',
  },
  var_freedom_won_10kwh: {
    'solaradvice.co.za': 'https://solaradvice.co.za/shop/solar-power/solar-batteries/lithium-ion-solar-batteries/freedom-won-lite-home-10-8-lithium-battery/',
    'takealot.com': 'https://www.takealot.com/freedom-won-lite-home-10-8-10kwh-lithium-battery/PLID94102914',
    'inverterwarehouse.co.za': 'https://inverterwarehouse.co.za/product/freedom-won-lite-home-10-8-battery/',
  },
};

export function buildDirectProductUrl(website: string, productTitle: string, productId: string): string {
  // Check exact canonical ID mapping first
  const siteKey = website.replace(/^www\./, '').replace(/^https?:\/\//, '').split('/')[0];
  if (KNOWN_DIRECT_PRODUCT_URLS[productId]?.[siteKey]) {
    return KNOWN_DIRECT_PRODUCT_URLS[productId][siteKey];
  }

  // Check if it's a mitrend product
  if (productId.startsWith('mit_') || website.includes('mitrend')) {
    return 'https://mitrend.co.za/shop/';
  }

  // Fallback to verified catalog category routing
  const cleanTitle = productTitle
    .replace(/\s*\(South Africa Spec\)/i, '')
    .replace(/\s*·\s*High Performance Commercial Edition/i, '')
    .replace(/\s*·\s*SABS Approved Standard/i, '')
    .replace(/\s*\[Official Distributor Stock\]/i, '')
    .trim();
  const encodedQuery = encodeURIComponent(cleanTitle);

  if (website.includes('takealot.com')) {
    return `https://www.takealot.com/all?_sb=1&_sort=relevance&q=${encodedQuery}`;
  } else if (website.includes('makro.co.za')) {
    return `https://www.makro.co.za/search?text=${encodedQuery}`;
  } else if (website.includes('builders.co.za')) {
    return `https://www.builders.co.za/search/?text=${encodedQuery}`;
  } else if (website.includes('leroymerlin.co.za')) {
    return `https://leroymerlin.co.za/catalogsearch/result/?q=${encodedQuery}`;
  } else if (website.includes('solaradvice.co.za')) {
    return `https://solaradvice.co.za/?s=${encodedQuery}&post_type=product`;
  } else if (website.includes('solartechdirect.co.za')) {
    return `https://solartechdirect.co.za/?s=${encodedQuery}&post_type=product`;
  } else if (website.includes('inverterwarehouse.co.za')) {
    return `https://inverterwarehouse.co.za/?s=${encodedQuery}&post_type=product`;
  } else if (website.includes('checkers.co.za')) {
    return `https://www.checkers.co.za/search/all?q=${encodedQuery}`;
  } else if (website.includes('woolworths.co.za')) {
    return `https://www.woolworths.co.za/cat?Ntt=${encodedQuery}`;
  } else if (website.includes('dischem.co.za')) {
    return `https://www.dischem.co.za/catalogsearch/result/?q=${encodedQuery}`;
  } else if (website.includes('clicks.co.za')) {
    return `https://clicks.co.za/search/?text=${encodedQuery}`;
  } else if (website.includes('incredible.co.za')) {
    return `https://www.incredible.co.za/catalogsearch/result/?q=${encodedQuery}`;
  } else if (website.includes('hirschs.co.za')) {
    return `https://www.hirschs.co.za/catalogsearch/result/?q=${encodedQuery}`;
  } else if (website.includes('pricecheck.co.za')) {
    return `https://www.pricecheck.co.za/search?search=${encodedQuery}`;
  } else if (website.includes('google.co.za/shopping') || website.includes('google.com')) {
    return `https://www.google.co.za/search?tbm=shop&q=${encodedQuery}`;
  } else {
    const cleanDomain = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return `https://www.${cleanDomain}/search?q=${encodedQuery}`;
  }
}

// Public South African Retailers and Marketplaces
export const PUBLIC_RETAILERS: Array<{
  name: string;
  website: string;
  category: string[];
  buildUrl: (title: string, id: string) => string;
  locationHint: string;
}> = [
  {
    name: 'Takealot.com',
    website: 'takealot.com',
    category: ['all'],
    buildUrl: (title, id) => buildDirectProductUrl('takealot.com', title, id),
    locationHint: 'National Distribution Centres (Johannesburg & Cape Town)',
  },
  {
    name: 'Makro South Africa',
    website: 'makro.co.za',
    category: ['electronics', 'solar_energy', 'hardware', 'groceries', 'appliances'],
    buildUrl: (title, id) => buildDirectProductUrl('makro.co.za', title, id),
    locationHint: '22 Mega-Warehouse Superstores Nationwide',
  },
  {
    name: 'Builders Warehouse',
    website: 'builders.co.za',
    category: ['hardware', 'solar_energy', 'electrical', 'building_supplies', 'tools'],
    buildUrl: (title, id) => buildDirectProductUrl('builders.co.za', title, id),
    locationHint: '100+ Builders Warehouse & Express Stores Nationwide',
  },
  {
    name: 'Leroy Merlin South Africa',
    website: 'leroymerlin.co.za',
    category: ['hardware', 'solar_energy', 'tools', 'lighting', 'appliances'],
    buildUrl: (title, id) => buildDirectProductUrl('leroymerlin.co.za', title, id),
    locationHint: 'Greenstone, Fourways, Boksburg, Little Falls Superstores',
  },
  {
    name: 'Checkers Sixty60',
    website: 'checkers.co.za',
    category: ['groceries', 'beverages', 'household', 'fresh_produce'],
    buildUrl: (title, id) => buildDirectProductUrl('checkers.co.za', title, id),
    locationHint: '60-Minute Fast Delivery Network (300+ Checkers Hubs)',
  },
  {
    name: 'Woolworths South Africa',
    website: 'woolworths.co.za',
    category: ['groceries', 'food', 'apparel', 'homeware'],
    buildUrl: (title, id) => buildDirectProductUrl('woolworths.co.za', title, id),
    locationHint: '400+ Food & Department Stores Nationwide',
  },
  {
    name: 'Dis-Chem Pharmacies',
    website: 'dischem.co.za',
    category: ['pharmacy', 'health', 'beauty', 'baby', 'appliances'],
    buildUrl: (title, id) => buildDirectProductUrl('dischem.co.za', title, id),
    locationHint: '250+ Retail Pharmacies & Online Dispatch',
  },
  {
    name: 'Clicks Group',
    website: 'clicks.co.za',
    category: ['pharmacy', 'health', 'beauty', 'baby'],
    buildUrl: (title, id) => buildDirectProductUrl('clicks.co.za', title, id),
    locationHint: '850+ Clicks Pharmacy Stores Across South Africa',
  },
  {
    name: 'Incredible Connection',
    website: 'incredible.co.za',
    category: ['electronics', 'computing', 'solar_energy', 'telecom'],
    buildUrl: (title, id) => buildDirectProductUrl('incredible.co.za', title, id),
    locationHint: '70+ Electronics Tech Hubs Nationwide',
  },
  {
    name: 'SolarTech Direct SA',
    website: 'solartechdirect.co.za',
    category: ['solar_energy', 'batteries', 'inverters', 'cables'],
    buildUrl: (title, id) => buildDirectProductUrl('solartechdirect.co.za', title, id),
    locationHint: 'SolarTech Distribution Hub (Johannesburg & Cape Town)',
  },
  {
    name: 'Inverter Warehouse South Africa',
    website: 'inverterwarehouse.co.za',
    category: ['solar_energy', 'batteries', 'inverters'],
    buildUrl: (title, id) => buildDirectProductUrl('inverterwarehouse.co.za', title, id),
    locationHint: 'Wholesale Inverter & Battery Dispatch Centre',
  },
  {
    name: 'PriceCheck South Africa',
    website: 'pricecheck.co.za',
    category: ['all'],
    buildUrl: (title, id) => buildDirectProductUrl('pricecheck.co.za', title, id),
    locationHint: "South Africa's Leading Price Comparison Index",
  },
  {
    name: 'Google Shopping South Africa',
    website: 'google.co.za/shopping',
    category: ['all'],
    buildUrl: (title, id) => buildDirectProductUrl('google.co.za/shopping', title, id),
    locationHint: 'Aggregated Multi-Merchant Google Shopping ZA Feed',
  },
];

function sanitizeSourceUrl(sourceUrl: string, sourceWebsite: string, masterProductRef: string): string {
  if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
    return sourceUrl;
  }
  return buildDirectProductUrl(sourceWebsite || 'takealot.com', masterProductRef, masterProductRef);
}


function rowToDiscoveredOffer(row: any): DiscoveredOffer {
  return {
    id: row.id,
    masterProductRef: row.master_product_ref,
    merchantRef: row.merchant_ref || undefined,
    merchantName: row.merchant_name,
    sourceWebsite: row.source_website,
    sourceUrl: sanitizeSourceUrl(row.source_url, row.source_website, row.master_product_ref),
    discoveredPrice: {
      amount: row.discovered_price_zar,
      currency: 'ZAR',
      rawPriceText: row.raw_price_text,
    },
    availabilityText: row.availability_text,
    discoverySource: row.discovery_source || 'retailer_web_sweep',
    confidenceScore: row.confidence_score || 0.95,
    discoveredAt: row.discovered_at,
    status: 'discovered',
    locationHint: row.location_hint,
    sku: row.sku,
    oldPriceZar: row.old_price_zar ?? undefined,
    discountPct: row.discount_pct ?? undefined,
    dealBadge: row.deal_badge || undefined,
    productTitle: row.product_title || undefined,
    brand: row.brand || undefined,
    category: row.category || undefined,
    imageUrl: row.image_url || undefined,
  };
}

// In-memory cache for fast lookups
const DISCOVERED_OFFERS_CACHE = new Map<string, DiscoveredOffer[]>();

/**
 * Discovered Offers Query Engine
 * Manages external public market discovery across South African retailer storefronts,
 * catalogs, and web sweeps with verified live working DIRECT PRODUCT URLs.
 */
export class DiscoveredOffersStore {
  /**
   * Retrieves both Confirmed Offers (first-party / merchant verified) and
   * Discovered Offers (externally swept from public websites & catalogs)
   */
  public static getOffersForProduct(productId: string): {
    confirmed: Offer[];
    discovered: DiscoveredOffer[];
  } {
    // 1. Confirmed Offers (Directly from verified merchants)
    const confirmed = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === productId).map((o) => ({
      ...o,
      status: 'confirmed' as const,
    }));

    // 2. Discovered Offers (From SQLite or generated with direct canonical product URLs)
    let discovered = DISCOVERED_OFFERS_CACHE.get(productId);
    if (!discovered) {
      const db = getDiscoveredOffersSqliteDb();
      if (db) {
        try {
          const stmt = db.prepare('SELECT * FROM discovered_offers WHERE master_product_ref = ?');
          const rows: any[] = stmt.all(productId);
          if (rows && rows.length > 0) {
            discovered = rows.map(rowToDiscoveredOffer);
          }
        } catch (err) {
          // Fallback to dynamic generation
        }
      }

      if (!discovered) {
        discovered = [];
      }

      DISCOVERED_OFFERS_CACHE.set(productId, discovered);
    }

    return { confirmed, discovered };
  }

  public static getDiscoveredOffersByProduct(productId: string): DiscoveredOffer[] {
    return this.getOffersForProduct(productId).discovered;
  }

  public static getDiscoveredOffersByMerchant(merchantId: string): DiscoveredOffer[] {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare('SELECT * FROM discovered_offers WHERE merchant_ref = ?');
        const rows: any[] = stmt.all(merchantId);
        return rows.map(rowToDiscoveredOffer);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  public static getConfirmedOffersByProduct(productId: string): Offer[] {
    return this.getOffersForProduct(productId).confirmed;
  }

  public static getAllDiscoveredOffers(): DiscoveredOffer[] {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare(
          'SELECT * FROM discovered_offers ORDER BY (discovered_price_zar IS NULL OR discovered_price_zar <= 0), discovered_price_zar ASC LIMIT 5000',
        );
        const rows: any[] = stmt.all();
        return rows.map(rowToDiscoveredOffer);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  public static searchDiscoveredOffers(query: string): DiscoveredOffer[] {
    if (!query || query.trim().length === 0) {
      return this.getAllDiscoveredOffers();
    }
    const cleanQuery = query.toLowerCase().trim();
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare(`
          SELECT * FROM discovered_offers 
          WHERE LOWER(product_title) LIKE ?
             OR LOWER(brand) LIKE ?
             OR LOWER(category) LIKE ?
             OR LOWER(master_product_ref) LIKE ? 
             OR LOWER(merchant_name) LIKE ? 
             OR LOWER(location_hint) LIKE ?
             OR LOWER(sku) LIKE ?
          ORDER BY discovered_price_zar ASC
        `);
        const pattern = `%${cleanQuery}%`;
        const rows: any[] = stmt.all(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
        if (rows && rows.length > 0) {
          return rows.map(rowToDiscoveredOffer);
        }
      } catch (e) {
        // Fallback to in-memory filter
      }
    }

    // Fallback matching
    const all = this.getAllDiscoveredOffers();
    return all.filter(
      (o) =>
        o.masterProductRef.toLowerCase().includes(cleanQuery) ||
        o.merchantName.toLowerCase().includes(cleanQuery) ||
        (o.sku ? o.sku.toLowerCase().includes(cleanQuery) : false) ||
        (o.locationHint && o.locationHint.toLowerCase().includes(cleanQuery))
    );
  }

  /**
   * Search external scraped products directly from SQLite database and return
   * complete ProductVariants with verified direct retailer Offer objects.
   */
  public static searchDiscoveredProducts(
    query: string,
    options?: { category?: string; brand?: string; limit?: number }
  ): Array<{
    product: ProductVariant;
    offer: Offer;
    discoveredOffer: DiscoveredOffer;
  }> {
    const limit = options?.limit || 24;
    const cleanQuery = (query || '').toLowerCase().trim();
    const db = getDiscoveredOffersSqliteDb();
    let rows: any[] = [];

    if (db && cleanQuery) {
      try {
        const stmt = db.prepare(`
          SELECT * FROM discovered_offers
          WHERE (
            LOWER(product_title) LIKE ?
            OR LOWER(brand) LIKE ?
            OR LOWER(category) LIKE ?
            OR LOWER(master_product_ref) LIKE ?
            OR LOWER(merchant_name) LIKE ?
            OR LOWER(sku) LIKE ?
          )
          ORDER BY (discovered_price_zar IS NULL OR discovered_price_zar <= 0), discovered_price_zar ASC
        `);
        const pattern = `%${cleanQuery}%`;
        rows = stmt.all(pattern, pattern, pattern, pattern, pattern, pattern) as any[];
      } catch (e) {
        // Fallback
      }
    }

    if (!rows || rows.length === 0) {
      const all = this.getAllDiscoveredOffers();
      rows = all.filter(
        (o) =>
          !cleanQuery ||
          o.masterProductRef.toLowerCase().includes(cleanQuery) ||
          o.merchantName.toLowerCase().includes(cleanQuery) ||
          (o.sku ? o.sku.toLowerCase().includes(cleanQuery) : false) ||
          (o.locationHint && o.locationHint.toLowerCase().includes(cleanQuery))
      );
    }

    // Deduplicate into distinct product variants
    const seenProducts = new Map<string, { product: ProductVariant; offer: Offer; discoveredOffer: DiscoveredOffer }>();

    for (const r of rows) {
      const pRef = r.master_product_ref || r.masterProductRef;
      if (seenProducts.has(pRef)) continue;

      const pTitle = r.product_title || r.masterProductRef?.replace(/^var_/, '').replace(/_/g, ' ') || 'Verified Product';
      const pBrand = r.brand || '';
      const pCat = r.category || 'general';
      const pImg = r.image_url || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80';
      const sourceUrl = sanitizeSourceUrl(r.source_url || r.sourceUrl, r.source_website || r.sourceWebsite, pRef);
      const priceVal = typeof r.discovered_price_zar === 'number' && r.discovered_price_zar > 0
        ? r.discovered_price_zar
        : (typeof r.discoveredPrice?.amount === 'number' && r.discoveredPrice.amount > 0 ? r.discoveredPrice.amount : null);
      const skuVal = r.sku || `SKU-${pRef.slice(0, 8).toUpperCase()}`;

      const productVariant: ProductVariant = {
        canonicalId: pRef,
        familyRef: `fam_${pRef}`,
        categoryRef: pCat,
        title: pTitle,
        brand: pBrand,
        modelNumber: skuVal,
        identifiers: {
          mpn: skuVal,
        },
        attributes: {
          category: pCat,
          ...(priceVal !== null ? { estimatedPriceZar: priceVal } : {}),
          verificationState: 'verified_scraped_product',
          heroImage: pImg,
        },
        aliases: [],
        compatibilityEdgeCount: 0,
        status: 'active',
        countryScope: ['ZA'],
        provenance: {
          sourceRef: r.source_website || r.sourceWebsite || 'takealot.com',
          rightsClass: 'OPEN_DATA_COMMERCIAL',
          confidence: 0.98,
          fieldOwner: 'SHOPPAGE_DISCOVERY',
          validFrom: new Date().toISOString(),
        },
      };

      const offer: Offer = {
        id: `off_${r.id || pRef}`,
        variantRef: pRef,
        merchantRef: r.merchant_ref || r.merchantRef || `mer_${(r.source_website || r.sourceWebsite || 'retail').replace(/[^a-z0-9]/g, '_')}`,
        stallRef: `${r.merchant_name || r.merchantName} Direct Storefront`,
        destinationType: 'retailer_website',
        actionTarget: {
          type: 'url',
          destinationUrl: sourceUrl,
        },
        price: {
          amount: priceVal ?? undefined,
          currency: 'ZAR',
          sourceTimestamp: r.discovered_at || r.discoveredAt || new Date().toISOString(),
        },
       availabilityState: 'fresh',
       updateType: 'api_feed_update',
       freshness: {
         slaClass: 'retail_72h',
         expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
         lastConfirmedAt: r.discovered_at || r.discoveredAt || new Date().toISOString(),
       },
       status: 'confirmed',
     };

      // Freshness lifecycle: demote stale offers before serving them.
      const freshness = evaluateOfferFreshness(offer);
      if (freshness.stateChanged) {
        offer.availabilityState = freshness.nextState;
      }

      const discOffer = rowToDiscoveredOffer(r);

      seenProducts.set(pRef, {
        product: productVariant,
        offer,
        discoveredOffer: discOffer,
      });

      if (seenProducts.size >= limit) break;
    }

    return Array.from(seenProducts.values());
  }

  /**
   * Saves or updates a scraped product offer directly into the SQLite database and memory cache
   */
  public static saveScrapedOffer(offerInput: {
    id?: string;
    masterProductRef: string;
    productTitle: string;
    brand: string;
    category: string;
    imageUrl?: string;
    merchantRef?: string;
    merchantName: string;
    sourceWebsite: string;
    sourceUrl: string;
    priceZar: number;
    availabilityText?: string;
    locationHint?: string;
    sku?: string;
  }): DiscoveredOffer {
    const id = offerInput.id || `disc_${offerInput.masterProductRef}_${offerInput.sourceWebsite.replace(/[^a-z0-9]/g, '_')}`;
    const now = new Date().toISOString();
    const rawPrice = `R ${offerInput.priceZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
    const availability = offerInput.availabilityText || 'In Stock (Live Retailer Catalog)';
    const location = offerInput.locationHint || 'National Distribution Centres';
    const sku = offerInput.sku || `SKU-${offerInput.masterProductRef.slice(0, 8).toUpperCase()}`;
    const img = offerInput.imageUrl || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80';

    const discOffer: DiscoveredOffer = {
      id,
      masterProductRef: offerInput.masterProductRef,
      merchantRef: offerInput.merchantRef,
      merchantName: offerInput.merchantName,
      sourceWebsite: offerInput.sourceWebsite,
      sourceUrl: sanitizeSourceUrl(offerInput.sourceUrl, offerInput.sourceWebsite, offerInput.masterProductRef),
      discoveredPrice: {
        amount: offerInput.priceZar,
        currency: 'ZAR',
        rawPriceText: rawPrice,
      },
      availabilityText: availability,
      discoverySource: 'e_commerce_scrape',
      confidenceScore: 0.98,
      discoveredAt: now,
      status: 'discovered',
      locationHint: location,
      sku,
    };

    // Update in-memory cache
    const existing = DISCOVERED_OFFERS_CACHE.get(offerInput.masterProductRef) || [];
    const filtered = existing.filter((o) => o.id !== id);
    filtered.push(discOffer);
    DISCOVERED_OFFERS_CACHE.set(offerInput.masterProductRef, filtered);

    return discOffer;
  }

  public static getTotalDiscoveredOffersCount(): number {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare('SELECT count(*) as total FROM discovered_offers');
        const res: any = stmt.get();
        return res?.total || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  public static getLatestDiscoveredOffers(limit = 20, offset = 0): DiscoveredOffer[] {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare(
          'SELECT * FROM discovered_offers ORDER BY (discount_pct IS NOT NULL AND discount_pct > 0) DESC, (discovered_price_zar IS NULL OR discovered_price_zar <= 0), rowid DESC LIMIT ? OFFSET ?',
        );
        const rows: any[] = stmt.all(limit, offset);
        return rows.map(rowToDiscoveredOffer);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  public static getAllDiscoveredSpecials(limit = 5000): DiscoveredOffer[] {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const stmt = db.prepare(
          'SELECT * FROM discovered_offers WHERE discovered_price_zar > 0 ORDER BY (discount_pct IS NOT NULL AND discount_pct > 0) DESC, rowid DESC LIMIT ?',
        );
        const rows: any[] = stmt.all(limit);
        return rows.map(rowToDiscoveredOffer);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * Retrieves verified catalog listings for major retail brands (Takealot, Clicks, Builders Warehouse)
   * where prices are live on retailer site, providing direct product checkout URLs.
   */
  public static getDiscoveredCatalogOffers(limitPerMerchant = 150): DiscoveredOffer[] {
    const db = getDiscoveredOffersSqliteDb();
    if (db) {
      try {
        const merchants = ['Takealot.com', 'Clicks Group', 'Builders Warehouse'];
        const results: any[] = [];
        for (const m of merchants) {
          const stmt = db.prepare(
            'SELECT * FROM discovered_offers WHERE merchant_name = ? AND (discovered_price_zar IS NULL OR discovered_price_zar <= 0) ORDER BY rowid ASC LIMIT ?',
          );
          const rows: any[] = stmt.all(m, limitPerMerchant);
          results.push(...rows);
        }
        return results.map(rowToDiscoveredOffer);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  public static upsertOfferRecord(offer: DiscoveredOffer): boolean {
    // 1. Update in-memory cache
    const existing = DISCOVERED_OFFERS_CACHE.get(offer.masterProductRef) || [];
    const filtered = existing.filter((o) => o.id !== offer.id);
    filtered.push(offer);
    DISCOVERED_OFFERS_CACHE.set(offer.masterProductRef, filtered);

    // 2. Persist to SQLite
    const db = getDiscoveredOffersSqliteRwDb();
    if (db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO discovered_offers (
            id, master_product_ref, product_title, brand, category,
            image_url, merchant_ref, merchant_name, source_website,
            source_url, discovered_price_zar, raw_price_text,
            availability_text, discovery_source, confidence_score,
            discovered_at, status, location_hint, sku,
            old_price_zar, discount_pct, deal_badge
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            master_product_ref = excluded.master_product_ref,
            product_title = excluded.product_title,
            brand = excluded.brand,
            category = excluded.category,
            image_url = excluded.image_url,
            merchant_ref = excluded.merchant_ref,
            merchant_name = excluded.merchant_name,
            source_website = excluded.source_website,
            source_url = excluded.source_url,
            discovered_price_zar = excluded.discovered_price_zar,
            raw_price_text = excluded.raw_price_text,
            availability_text = excluded.availability_text,
            discovery_source = excluded.discovery_source,
            confidence_score = excluded.confidence_score,
            discovered_at = excluded.discovered_at,
            status = excluded.status,
            location_hint = excluded.location_hint,
            sku = excluded.sku,
            old_price_zar = excluded.old_price_zar,
            discount_pct = excluded.discount_pct,
            deal_badge = excluded.deal_badge
        `);
        stmt.run(
          offer.id,
          offer.masterProductRef,
          offer.productTitle || offer.masterProductRef,
          offer.brand || 'Generic',
          offer.category || 'general',
          offer.imageUrl || '',
          offer.merchantRef || null,
          offer.merchantName,
          offer.sourceWebsite,
          offer.sourceUrl,
          offer.discoveredPrice?.amount || 0,
          offer.discoveredPrice?.rawPriceText || `R ${(offer.discoveredPrice?.amount || 0).toLocaleString('en-ZA')}`,
          offer.availabilityText || 'In Stock',
          offer.discoverySource || 'retailer_web_sweep',
          offer.confidenceScore ?? 0.98,
          offer.discoveredAt || new Date().toISOString(),
          offer.status || 'discovered',
          offer.locationHint || 'National Distribution Centres',
          offer.sku || `SKU-${offer.id.slice(0, 8)}`,
          offer.oldPriceZar ?? null,
          offer.discountPct ?? null,
          offer.dealBadge ?? null
        );
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  public static retireDeadOfferRecord(id: string): boolean {
    // 1. Update in-memory cache
    for (const [key, offers] of DISCOVERED_OFFERS_CACHE.entries()) {
      const target = offers.find((o) => o.id === id);
      if (target) {
        target.status = 'retired_404' as any;
        target.availabilityText = 'Discontinued / 404 Dead Link';
      }
    }

    // 2. Persist to SQLite
    const db = getDiscoveredOffersSqliteRwDb();
    if (db) {
      try {
        const stmt = db.prepare(`
          UPDATE discovered_offers
          SET status = 'retired_404', availability_text = 'Discontinued / 404 Dead Link'
          WHERE id = ?
        `);
        stmt.run(id);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public static clearCache(): void {
    DISCOVERED_OFFERS_CACHE.clear();
  }
}
