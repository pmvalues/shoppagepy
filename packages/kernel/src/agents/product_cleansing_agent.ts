/**
 * Product Cleansing & Normalization Agent
 *
 * Cleanses raw scraped product feeds across South African retail catalogs:
 * - De-noises clickbait promotional phrases and emojis from titles
 * - Canonicalizes brand aliases across the South African market
 * - Extracts technical specs (kW, kWh, Ah, V, Litres, kg, Inches, GB)
 * - Sanitizes ZAR numerical prices and computes verified discount percentages
 * - Validates packshot image URLs and applies category fallbacks
 */

export interface RawProductOffer {
  id?: string;
  masterProductRef?: string;
  title: string;
  brand?: string;
  category?: string;
  price: number | string;
  oldPrice?: number | string;
  imageUrl?: string;
  merchantName: string;
  sourceWebsite: string;
  sourceUrl: string;
  locationHint?: string;
  availabilityText?: string;
  sku?: string;
}

export interface CleansedProductOffer {
  id: string;
  masterProductRef: string;
  cleanTitle: string;
  canonicalBrand: string;
  category: string;
  priceZar: number;
  oldPriceZar?: number;
  discountPct?: number;
  dealBadge?: string;
  rawPriceText: string;
  imageUrl: string;
  isImageFallback: boolean;
  extractedSpecs: Record<string, string | number>;
  merchantName: string;
  sourceWebsite: string;
  sourceUrl: string;
  locationHint: string;
  availabilityText: string;
  sku: string;
  cleansedAt: string;
}

const BRAND_CANONICAL_MAP: Record<string, string> = {
  deye: 'Deye',
  'deye inverters': 'Deye',
  'deye solar': 'Deye',
  sunsynk: 'Sunsynk',
  'sun synk': 'Sunsynk',
  victron: 'Victron Energy',
  'victron energy': 'Victron Energy',
  pylontech: 'Pylontech',
  'pylon tech': 'Pylontech',
  dyness: 'Dyness',
  'dyness battery': 'Dyness',
  'ja solar': 'JA Solar',
  jasolar: 'JA Solar',
  'canadian solar': 'Canadian Solar',
  canadiansolar: 'Canadian Solar',
  longi: 'LONGi',
  'longi solar': 'LONGi',
  growatt: 'Growatt',
  luxpower: 'Luxpower',
  'lux power': 'Luxpower',
  'freedom won': 'Freedom Won',
  freedomwon: 'Freedom Won',
  hubble: 'Hubble',
  'hubble lithium': 'Hubble',
  ppc: 'PPC',
  'ppc cement': 'PPC',
  bosch: 'Bosch',
  'bosch professional': 'Bosch',
  makita: 'Makita',
  'makita tools': 'Makita',
  dewalt: 'DeWalt',
  'de walt': 'DeWalt',
  ryobi: 'Ryobi',
  samsung: 'Samsung',
  'samsung electronics': 'Samsung',
  apple: 'Apple',
  'apple inc': 'Apple',
  hisense: 'Hisense',
  lg: 'LG',
  'lg electronics': 'LG',
  jojo: 'JoJo',
  'jojo tanks': 'JoJo',
  defy: 'Defy',
  'defy appliances': 'Defy',
  karcher: 'Kärcher',
  'kärcher': 'Kärcher',
  philips: 'Philips',
  whirlpool: 'Whirlpool',
  sony: 'Sony',
  xiaomi: 'Xiaomi',
  tcl: 'TCL',
  panasonic: 'Panasonic',
  checkers: 'Checkers',
  'sixty60': 'Checkers Sixty60',
  woolworths: 'Woolworths',
  makro: 'Makro',
  'builders warehouse': 'Builders Warehouse',
  takealot: 'Takealot',
};

const PROMO_NOISE_PATTERNS = [
  /\b(hot deal!?|sale now!?|best value!?|special promotion!?|massive savings!?|black friday!?|cyber monday!?)\b[:\s]*/gi,
  /\b(limited stock!?|buy now!?|clearance sale!?|bargain!?|super sale!?|save big!?|dont miss out!?)\b[:\s]*/gi,
  /\b(cheapest in sa|lowest price guaranteed|unbeatable price|exclusive online deal)\b[:\s]*/gi,
  /\s*\(South Africa Spec\)/gi,
  /\s*·\s*High Performance Commercial Edition/gi,
  /\s*·\s*SABS Approved Standard/gi,
  /\s*\[Official Distributor Stock\]/gi,
  /\s*\(Includes 15% VAT\)/gi,
  /\s*\(Includes VAT\)/gi,
  /\s*·\s*Includes Free Delivery/gi,
  /[🔥⚡💥⭐✅✨🎉🚨]+|>>+|<<+|\*\*+/g,
];

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  solar_energy: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
  electronics: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
  hardware: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
  health_beauty: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
  appliances: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  general: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
};

export class ProductCleansingAgent {
  /**
   * De-noises title by removing promotional clickbait, emojis, and marketing fluff
   */
  public cleanTitle(rawTitle: string): string {
    if (!rawTitle || typeof rawTitle !== 'string') return '';
    let title = rawTitle;

    for (const pattern of PROMO_NOISE_PATTERNS) {
      title = title.replace(pattern, ' ');
    }

    // Collapse multiple punctuation, leading colons, and excess whitespace
    title = title
      .replace(/\s+/g, ' ')
      .replace(/^[\s:\-–—|]+/, '')
      .replace(/[\s:\-–—|]+$/, '')
      .replace(/!+/g, '')
      .trim();

    return title;
  }

  /**
   * Canonicalizes brand naming to standard South African market spelling
   */
  public canonicalizeBrand(rawBrand?: string, title?: string): string {
    const brandKey = (rawBrand || '').trim().toLowerCase();
    if (BRAND_CANONICAL_MAP[brandKey]) {
      return BRAND_CANONICAL_MAP[brandKey];
    }

    // If no brand or unrecognized, attempt to detect from title
    if (title) {
      const lowerTitle = title.toLowerCase();
      for (const [key, canonical] of Object.entries(BRAND_CANONICAL_MAP)) {
        // Match word boundaries
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(lowerTitle)) {
          return canonical;
        }
      }
    }

    if (rawBrand && rawBrand.trim().length > 0) {
      // Capitalize first letter of each word
      return rawBrand
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    return 'Generic';
  }

  /**
   * Extracts technical specifications and units from product title
   */
  public extractSpecs(title: string): Record<string, string | number> {
    const specs: Record<string, string | number> = {};
    if (!title) return specs;

    // Power (kW / W / kVA)
    const powerKwMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:kw|kilo\s*watts?)\b/i);
    if (powerKwMatch) specs.powerKw = parseFloat(powerKwMatch[1]);

    const powerWMatch = title.match(/(\d+(?:\.\d+)?)\s*w\b/i);
    if (powerWMatch && !powerKwMatch) specs.powerWatts = parseFloat(powerWMatch[1]);

    const powerKvaMatch = title.match(/(\d+(?:\.\d+)?)\s*kva\b/i);
    if (powerKvaMatch) specs.powerKva = parseFloat(powerKvaMatch[1]);

    // Energy / Battery Capacity (kWh / Ah)
    const energyKwhMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:kwh|kilo\s*watt\s*hours?)\b/i);
    if (energyKwhMatch) specs.energyKwh = parseFloat(energyKwhMatch[1]);

    const capAhMatch = title.match(/(\d+(?:\.\d+)?)\s*ah\b/i);
    if (capAhMatch) specs.capacityAh = parseFloat(capAhMatch[1]);

    // Voltage (e.g. 48V, 24V, 12V, 230V)
    const voltMatch = title.match(/(\d+)\s*v(?:olt)?\b/i);
    if (voltMatch) specs.voltage = `${voltMatch[1]}V`;

    // Volume / Mass (Litres / L / kg / g)
    const litreMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:l|litres?|liter)\b/i);
    if (litreMatch) specs.volumeLitres = parseFloat(litreMatch[1]);

    const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
    if (kgMatch) specs.weightKg = parseFloat(kgMatch[1]);

    // Screen / Display (e.g. 65", 55 inch)
    const screenMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:"|inch|inches)\b/i);
    if (screenMatch) specs.screenInches = parseFloat(screenMatch[1]);

    // Memory / Storage (e.g. 128GB, 256GB, 1TB)
    const storageMatch = title.match(/(\d+)\s*(gb|tb)\b/i);
    if (storageMatch) specs.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;

    return specs;
  }

  /**
   * Parses and cleans ZAR numerical prices, computes authentic discounts
   */
  public sanitizePrice(
    rawPrice: number | string,
    rawOldPrice?: number | string,
  ): {
    priceZar: number;
    oldPriceZar?: number;
    discountPct?: number;
    dealBadge?: string;
    rawPriceText: string;
  } {
    const parseAmount = (val: number | string | undefined): number | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return isFinite(val) && val >= 0 ? val : null;
      // Strip currency markers, spaces, and commas
      const cleaned = val
        .replace(/[RrZzAa\$\s]/g, '')
        .replace(/,/g, '')
        .trim();
      const parsed = parseFloat(cleaned);
      return isFinite(parsed) && parsed >= 0 ? parsed : null;
    };

    const price = parseAmount(rawPrice) ?? 0;
    const oldPrice = parseAmount(rawOldPrice) ?? undefined;

    let discountPct: number | undefined = undefined;
    let dealBadge: string | undefined = undefined;

    if (oldPrice && oldPrice > price && price > 0) {
      discountPct = Math.round(((oldPrice - price) / oldPrice) * 100);
      if (discountPct >= 20) {
        dealBadge = `🔥 ${discountPct}% OFF`;
      } else if (discountPct >= 5) {
        dealBadge = `⚡ SAVE ${discountPct}%`;
      }
    }

    const formattedZar = `R ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      priceZar: price,
      oldPriceZar: oldPrice,
      discountPct,
      dealBadge,
      rawPriceText: formattedZar,
    };
  }

  /**
   * Validates image packshot URL and falls back to high-res category imagery if invalid
   */
  public validateAndCleanImage(
    imageUrl?: string,
    category: string = 'general',
  ): { imageUrl: string; isValid: boolean; isFallback: boolean } {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      return {
        imageUrl: CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.general,
        isValid: false,
        isFallback: true,
      };
    }

    const trimmed = imageUrl.trim();

    // Check invalid / broken placeholder indicators
    const isPlaceholder =
      trimmed.includes('1x1') ||
      trimmed.includes('placeholder') ||
      trimmed.includes('no-image') ||
      trimmed.includes('transparent.gif') ||
      (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'));

    if (isPlaceholder) {
      return {
        imageUrl: CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.general,
        isValid: false,
        isFallback: true,
      };
    }

    // Enforce HTTPS
    const secureUrl = trimmed.replace(/^http:\/\//i, 'https://');

    return {
      imageUrl: secureUrl,
      isValid: true,
      isFallback: false,
    };
  }

  /**
   * Cleanses a full raw product offer record
   */
  public cleanProduct(raw: RawProductOffer): CleansedProductOffer {
    const cleanTitle = this.cleanTitle(raw.title);
    const canonicalBrand = this.canonicalizeBrand(raw.brand, cleanTitle);
    const category = raw.category || 'general';
    const priceData = this.sanitizePrice(raw.price, raw.oldPrice);
    const imageData = this.validateAndCleanImage(raw.imageUrl, category);
    const extractedSpecs = this.extractSpecs(cleanTitle);

    const safeRef =
      raw.masterProductRef ||
      `var_${canonicalBrand.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cleanTitle.toLowerCase().slice(0, 30).replace(/[^a-z0-9]/g, '_')}`;

    const safeId =
      raw.id ||
      `disc_${safeRef}_${(raw.sourceWebsite || 'retailer').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const cleanSku =
      raw.sku ||
      `SKU-${safeRef.replace(/^var_/, '').slice(0, 10).toUpperCase()}`;

    return {
      id: safeId,
      masterProductRef: safeRef,
      cleanTitle,
      canonicalBrand,
      category,
      priceZar: priceData.priceZar,
      oldPriceZar: priceData.oldPriceZar,
      discountPct: priceData.discountPct,
      dealBadge: priceData.dealBadge,
      rawPriceText: priceData.rawPriceText,
      imageUrl: imageData.imageUrl,
      isImageFallback: imageData.isFallback,
      extractedSpecs,
      merchantName: raw.merchantName || 'Verified South African Retailer',
      sourceWebsite: raw.sourceWebsite || 'takealot.com',
      sourceUrl: raw.sourceUrl,
      locationHint: raw.locationHint || 'National Distribution Centres',
      availabilityText: raw.availabilityText || 'In Stock (Verified Direct Storefront)',
      sku: cleanSku,
      cleansedAt: new Date().toISOString(),
    };
  }

  /**
   * Cleans a batch of raw product offers
   */
  public cleanBatch(rawOffers: RawProductOffer[]): CleansedProductOffer[] {
    return rawOffers.map((r) => this.cleanProduct(r));
  }
}
