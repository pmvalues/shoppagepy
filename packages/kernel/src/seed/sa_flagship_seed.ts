import { Market, ProductVariant, Offer, CommercialLocation, TrustPassport, Merchant } from '@shoppage/contracts';
import { enrichProductVariant } from '../enrichment/enricher';

/**
 * South African Flagship Seed Dataset (v7.0)
 * Markets, Canonical Products, Merchants & Live Offers
 */

export const SA_FLAGSHIP_MARKETS: Market[] = [
  {
    id: 'mkt_sandton_city',
    name: 'Sandton City & Nelson Mandela Square',
    canonicalSlug: 'sandton-city-johannesburg',
    marketType: 'formal_mega_mall',
    country: 'ZA',
    province: 'Gauteng',
    metro: 'City of Johannesburg',
    landmarks: ['Gautrain Sandton Station', 'Nelson Mandela Square Statue', 'Sandton Convention Centre'],
    safetyNotices: ['Secure covered parking', '24/7 security control room'],
  },
  {
    id: 'mkt_mall_of_africa',
    name: 'Mall of Africa (Waterfall City)',
    canonicalSlug: 'mall-of-africa-midrand',
    marketType: 'formal_mega_mall',
    country: 'ZA',
    province: 'Gauteng',
    metro: 'City of Johannesburg',
    landmarks: ['Waterfall City Park', 'Allandale Interchange'],
  },
  {
    id: 'mkt_dragon_city',
    name: 'Dragon City Wholesale Mall',
    canonicalSlug: 'dragon-city-crown-mines',
    marketType: 'wholesale_market',
    country: 'ZA',
    province: 'Gauteng',
    metro: 'City of Johannesburg',
    landmarks: ['Crown Mines Commercial Precinct', 'Main Reef Road'],
    safetyNotices: ['Cashless payments preferred', 'Wholesale minimum quantities apply at select stalls'],
  },
  {
    id: 'mkt_oriental_plaza',
    name: 'Oriental Plaza Fordsburg',
    canonicalSlug: 'oriental-plaza-fordsburg',
    marketType: 'wholesale_market',
    country: 'ZA',
    province: 'Gauteng',
    metro: 'City of Johannesburg',
    landmarks: ['Bree Street West', 'Lilian Ngoyi St'],
  },
  {
    id: 'mkt_soweto_bara',
    name: 'Chris Hani Baragwanath Transport & Commercial Hub',
    canonicalSlug: 'bara-taxi-rank-soweto',
    marketType: 'informal_transport_rank',
    country: 'ZA',
    province: 'Gauteng',
    metro: 'City of Johannesburg',
    landmarks: ['Chris Hani Baragwanath Hospital', 'Bara Taxi Rank Deck', 'Old Potch Road'],
    safetyNotices: ['Peak congestion 06:30-08:30 and 16:30-18:30'],
  },
  {
    id: 'mkt_gateway_durban',
    name: 'Gateway Theatre of Shopping (Umhlanga)',
    canonicalSlug: 'gateway-theatre-of-shopping-durban',
    marketType: 'formal_mega_mall',
    country: 'ZA',
    province: 'KwaZulu-Natal',
    metro: 'eThekwini',
    landmarks: ['Palm Boulevard', 'Wavehouse'],
  },
  {
    id: 'mkt_va_waterfront',
    name: 'V&A Waterfront',
    canonicalSlug: 'va-waterfront-cape-town',
    marketType: 'formal_mega_mall',
    country: 'ZA',
    province: 'Western Cape',
    metro: 'City of Cape Town',
    landmarks: ['Cape Town Harbour', 'Zeitz MOCAA'],
  },
];

const RAW_CANONICAL_PRODUCTS: ProductVariant[] = [
  {
    canonicalId: 'var_deye_5kw_hybrid',
    familyRef: 'fam_deye_inverters',
    categoryRef: 'solar_energy',
    title: 'Deye 5kW 48V Single Phase Hybrid Inverter (SUN-5K-SG03LP1-EU)',
    brand: 'Deye',
    modelNumber: 'SUN-5K-SG03LP1-EU',
    identifiers: {
      gtin13: '6971234567895',
      mpn: 'SUN-5K-SG03LP1-EU',
    },
    attributes: {
      ratedPowerKw: 5.0,
      dcBusVoltage: 48,
      maxPvInputVoltage: 500,
      mpptVoltageRange: '125-425V',
      ipRating: 'IP65',
      warrantyYears: 5,
    },
    aliases: [
      { phrase: 'Deye 5kVA inverter', locale: 'en', source: 'merchant_usage', confidence: 0.95 },
      { phrase: 'Deye omsetter 5kw', locale: 'af', source: 'merchant_usage', confidence: 0.9 },
      { phrase: 'Deye 5000W backup', locale: 'en', source: 'search_query', confidence: 0.85 },
    ],
    compatibilityEdgeCount: 14,
    status: 'active',
    countryScope: ['ZA', 'ZW', 'KE', 'NG'],
    provenance: {
      sourceRef: 'src_manufacturer_deye',
      rightsClass: 'PUBLIC_RECORD',
      confidence: 0.99,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: '2026-01-01T00:00:00Z',
    },
  },
  {
    canonicalId: 'var_sunsynk_8kw_hybrid',
    familyRef: 'fam_sunsynk_inverters',
    categoryRef: 'solar_energy',
    title: 'Sunsynk 8kW 48V Single Phase Hybrid Inverter',
    brand: 'Sunsynk',
    modelNumber: 'SUN-8K-SG01LP1',
    identifiers: {
      gtin13: '6009876543217',
      mpn: 'SUN-8K-SG01LP1',
    },
    attributes: {
      ratedPowerKw: 8.0,
      dcBusVoltage: 48,
      maxPvInputVoltage: 500,
      ipRating: 'IP65',
      warrantyYears: 5,
    },
    aliases: [
      { phrase: 'Sunsynk 8kVA inverter', locale: 'en', source: 'merchant_usage', confidence: 0.95 },
      { phrase: 'amapaneli sunsynk 8kw', locale: 'zu', source: 'search_query', confidence: 0.88 },
    ],
    compatibilityEdgeCount: 18,
    status: 'active',
    countryScope: ['ZA', 'ZW', 'KE'],
    provenance: {
      sourceRef: 'src_manufacturer_sunsynk',
      rightsClass: 'PUBLIC_RECORD',
      confidence: 0.99,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: '2026-01-01T00:00:00Z',
    },
  },
  {
    canonicalId: 'var_dyness_5kwh_battery',
    familyRef: 'fam_dyness_batteries',
    categoryRef: 'solar_energy',
    title: 'Dyness BX51100 5.12kWh 48V Lithium-ion Battery',
    brand: 'Dyness',
    modelNumber: 'BX51100',
    identifiers: {
      gtin13: '6979876543210',
      mpn: 'BX51100',
    },
    attributes: {
      nominalCapacityKwh: 5.12,
      nominalVoltage: 51.2,
      maxDischargeCurrentA: 100,
      cycleLife: 6000,
      warrantyYears: 10,
    },
    aliases: [
      { phrase: 'Dyness 5.12kwh battery', locale: 'en', source: 'merchant_usage', confidence: 0.98 },
      { phrase: 'Dyness lithium 48v', locale: 'en', source: 'search_query', confidence: 0.9 },
    ],
    compatibilityEdgeCount: 12,
    status: 'active',
    countryScope: ['ZA', 'ZW', 'KE', 'NG'],
    provenance: {
      sourceRef: 'src_manufacturer_dyness',
      rightsClass: 'PUBLIC_RECORD',
      confidence: 0.99,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: '2026-01-01T00:00:00Z',
    },
  },
  {
    canonicalId: 'var_samsung_a16_128gb',
    familyRef: 'fam_samsung_a_series',
    categoryRef: 'smartphones',
    title: 'Samsung Galaxy A16 128GB LTE Dual SIM (Black)',
    brand: 'Samsung',
    modelNumber: 'SM-A165F',
    identifiers: {
      gtin13: '8806091876543',
      mpn: 'SM-A165F-BLK',
    },
    attributes: {
      storageGb: 128,
      ramGb: 4,
      displaySizeInches: 6.7,
      batteryMah: 5000,
      network: '4G LTE',
    },
    aliases: [
      { phrase: 'Samsung A16 128GB', locale: 'en', source: 'merchant_usage', confidence: 0.98 },
      { phrase: 'Galaxy A16 phone', locale: 'en', source: 'search_query', confidence: 0.95 },
    ],
    compatibilityEdgeCount: 6,
    status: 'active',
    countryScope: ['ZA', 'ZW', 'KE', 'NG', 'GB'],
    provenance: {
      sourceRef: 'src_manufacturer_samsung',
      rightsClass: 'PUBLIC_RECORD',
      confidence: 0.99,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: '2026-01-01T00:00:00Z',
    },
  },
  {
    canonicalId: 'var_tesla_cybertruck_ref',
    familyRef: 'fam_tesla_cybertruck',
    categoryRef: 'automotive',
    title: 'Tesla Cybertruck Foundation Series Tri-Motor AWD',
    brand: 'Tesla',
    modelNumber: 'CYBERTRUCK-TRI',
    identifiers: {
      mpn: 'CYBER-TRI-2026',
    },
    attributes: {
      acceleration0to100: '2.6s',
      towingCapacityKg: 4990,
      rangeKm: 515,
    },
    aliases: [
      { phrase: 'Cybertruck South Africa', locale: 'en', source: 'search_query', confidence: 0.9 },
    ],
    compatibilityEdgeCount: 0,
    status: 'reference_only', // REFERENCE ONLY - No local availability in ZA
    countryScope: ['US'],
    provenance: {
      sourceRef: 'src_tesla_us',
      rightsClass: 'PUBLIC_RECORD',
      confidence: 0.95,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: '2026-01-01T00:00:00Z',
    },
  },
];

// Enrich canonical products with media, guides, reviews, and compliance certifications
export const SA_CANONICAL_PRODUCTS: ProductVariant[] = RAW_CANONICAL_PRODUCTS.map((p) =>
  enrichProductVariant(p)
);

export const SA_FLAGSHIP_MERCHANTS: Merchant[] = [
  {
    id: 'loc_sunpower_crownmines',
    marketId: 'mkt_dragon_city',
    stallIdentifier: 'Building 2, Shop B-18',
    name: 'SunPower Solutions Crown Mines (Dragon City)',
    addressText: 'Dragon City Wholesale Mall, Building 2 Shop B-18, Crown Mines, Johannesburg',
    contacts: {
      whatsapp: '+27829876543',
      telephone: '+27118301234',
      email: 'sales@sunpowersolutions.co.za',
    },
    verificationState: 'fully_verified',
    country: 'ZA',
  },
  {
    id: 'loc_solarbros_sandton',
    marketId: 'mkt_sandton_city',
    stallIdentifier: 'Level 2, Tech Zone T-04',
    name: 'SolarBros Sandton City',
    addressText: 'Sandton City Shopping Centre, 83 Rivonia Rd, Sandhurst, Sandton',
    contacts: {
      whatsapp: '+27712345678',
      telephone: '+27117841122',
      email: 'sandton@solarbros.co.za',
    },
    verificationState: 'fully_verified',
    country: 'ZA',
  },
  {
    id: 'loc_techhub_oriental',
    marketId: 'mkt_oriental_plaza',
    stallIdentifier: 'Shop N-45 Grand Bazaar',
    name: 'TechHub Cellular & Electronics Oriental Plaza',
    addressText: 'Oriental Plaza, Shop N-45, Lilian Ngoyi St, Fordsburg, Johannesburg',
    contacts: {
      whatsapp: '+27845551234',
      telephone: '+27118385678',
    },
    verificationState: 'fully_verified',
    country: 'ZA',
  },
  {
    id: 'loc_spaza_bara',
    marketId: 'mkt_soweto_bara',
    stallIdentifier: 'Stall #104 Taxi Rank Lower Deck',
    name: "Mama's Phone & Solar Spaza (Bara)",
    addressText: 'Chris Hani Baragwanath Taxi Rank, Stall #104, Soweto',
    contacts: {
      whatsapp: '+27734449876',
    },
    verificationState: 'fully_verified',
    country: 'ZA',
  },
  {
    id: 'loc_mitrend_midrand',
    marketId: 'mkt_midrand_commercial',
    stallIdentifier: 'Warehouse ERF710',
    name: 'Mitrend Products (Pty) Ltd',
    addressText: 'ERF710 Old Road, Halfway Gardens, Midrand, 1686, Gauteng',
    contacts: {
      whatsapp: '+27105007670',
      telephone: '+27105007670',
      email: 'sales@mitrend.co.za',
      website: 'https://mitrend.co.za',
    },
    verificationState: 'fully_verified',
    country: 'ZA',
  },
];

export const SA_FLAGSHIP_OFFERS: Offer[] = [
  {
    id: 'off_deye_5kw_sunpower',
    variantRef: 'var_deye_5kw_hybrid',
    destinationType: 'merchant_whatsapp',
    merchantRef: 'loc_sunpower_crownmines',
    marketRef: 'mkt_dragon_city',
    stallRef: 'Building 2, Shop B-18',
    price: {
      amount: 19850,
      currency: 'ZAR',
      sourceTimestamp: new Date().toISOString(),
    },
    availabilityState: 'fresh',
    updateType: 'stock_confirmed',
    freshness: {
      slaClass: 'retail_72h',
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      lastConfirmedAt: new Date().toISOString(),
    },
  },
  {
    id: 'off_deye_5kw_solarbros',
    variantRef: 'var_deye_5kw_hybrid',
    destinationType: 'retailer_website',
    merchantRef: 'loc_solarbros_sandton',
    marketRef: 'mkt_sandton_city',
    stallRef: 'Level 2, Tech Zone T-04',
    price: {
      amount: 21500,
      currency: 'ZAR',
      sourceTimestamp: new Date().toISOString(),
    },
    availabilityState: 'fresh',
    updateType: 'price_changed',
    freshness: {
      slaClass: 'retail_72h',
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      lastConfirmedAt: new Date().toISOString(),
    },
  },
  {
    id: 'off_samsung_a16_techhub',
    variantRef: 'var_samsung_a16_128gb',
    destinationType: 'merchant_whatsapp',
    merchantRef: 'loc_techhub_oriental',
    marketRef: 'mkt_oriental_plaza',
    stallRef: 'Shop N-45 Grand Bazaar',
    price: {
      amount: 2799,
      currency: 'ZAR',
      sourceTimestamp: new Date().toISOString(),
    },
    availabilityState: 'fresh',
    updateType: 'stock_confirmed',
    freshness: {
      slaClass: 'fast_moving_24h',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      lastConfirmedAt: new Date().toISOString(),
    },
  },
];

export const SA_FLAGSHIP_PASSPORTS: Record<string, TrustPassport> = {
  loc_sunpower_crownmines: {
    merchantId: 'loc_sunpower_crownmines',
    merchantName: 'SunPower Solutions (Crown Mines)',
    freshOffersTodayCount: 14,
    medianResponseMinutes: 12,
    complaintCountLast90d: 0,
    score: 94,
    state: 'VERIFIED_ACTIVE',
  },
  loc_solarbros_sandton: {
    merchantId: 'loc_solarbros_sandton',
    merchantName: 'SolarBros Sandton City',
    freshOffersTodayCount: 28,
    medianResponseMinutes: 8,
    complaintCountLast90d: 0,
    score: 96,
    state: 'VERIFIED_ACTIVE',
  },
};
