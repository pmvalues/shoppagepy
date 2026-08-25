import { ProductVariant } from '@shoppage/contracts';

export interface SaProductSweepResult {
  totalSwept: number;
  categoriesCovered: string[];
  retailersSwept: string[];
  sampleProducts: ProductVariant[];
  sweepTimestamp: string;
}

export interface SaProductSweepSource {
  id: string;
  name: string;
  sector: string;
  coverageEstimate: string;
  dataAccessProtocol: string;
  gs1Prefix: string;
}

export const SA_MAJOR_PRODUCT_RETAILERS: SaProductSweepSource[] = [
  {
    id: 'takealot',
    name: 'Takealot Marketplace',
    sector: 'General Merchandise, Electronics & Home',
    coverageEstimate: '3,500,000+ SKUs',
    dataAccessProtocol: 'Public Catalog Sitemap & JSON Endpoints',
    gs1Prefix: '600 / Global',
  },
  {
    id: 'shoprite_checkers',
    name: 'Shoprite & Checkers (Sixty60)',
    sector: 'FMCG, Fresh Groceries & Butchery',
    coverageEstimate: '45,000+ SKUs',
    dataAccessProtocol: 'Retail Storefront Catalog Feeds',
    gs1Prefix: '600 / 601',
  },
  {
    id: 'picknpay',
    name: 'Pick n Pay (Hyper & ASAP)',
    sector: 'FMCG, Groceries, General Merchandise',
    coverageEstimate: '35,000+ SKUs',
    dataAccessProtocol: 'Digital Storefront Product Feeds',
    gs1Prefix: '600 / 601',
  },
  {
    id: 'woolworths',
    name: 'Woolworths South Africa',
    sector: 'Premium Food, Beauty & Homeware',
    coverageEstimate: '22,000+ SKUs',
    dataAccessProtocol: 'Digital Catalog API',
    gs1Prefix: '600',
  },
  {
    id: 'makro_massmart',
    name: 'Makro & Massmart / Walmart SA',
    sector: 'Wholesale, Bulk Groceries, DIY & Appliances',
    coverageEstimate: '120,000+ SKUs',
    dataAccessProtocol: 'B2B Trade Feed & Marketplace API',
    gs1Prefix: '600 / Global',
  },
  {
    id: 'builders_warehouse',
    name: 'Builders Warehouse & Express',
    sector: 'Building Materials, Hardware, Timber & Electrical',
    coverageEstimate: '55,000+ SKUs',
    dataAccessProtocol: 'Trade Portal Product Feeds',
    gs1Prefix: '600 / SABS Certified',
  },
  {
    id: 'solar_distributors',
    name: 'Rubicon, Herholdt’s & SolarAdvice',
    sector: 'Solar PV, Lithium Batteries & Hybrid Inverters',
    coverageEstimate: '12,500+ Solar SKUs',
    dataAccessProtocol: 'B2B Technical Spec Sheets & NRS 097 Registries',
    gs1Prefix: 'Global & SABS NRS 097',
  },
  {
    id: 'dischem_clicks',
    name: 'Dis-Chem & Clicks Pharmacy',
    sector: 'OTC Pharmaceuticals, Health & Personal Care',
    coverageEstimate: '48,000+ SKUs',
    dataAccessProtocol: 'Retail Pharmacy Catalog Index',
    gs1Prefix: '600 / SAHPRA Approved',
  },
  {
    id: 'openfoodfacts_za',
    name: 'Open Food Facts (South Africa)',
    sector: 'National Packaged Foods & Barcode Registry',
    coverageEstimate: '85,000+ EAN-13 Records',
    dataAccessProtocol: 'Open JSON / GDSN Export',
    gs1Prefix: '6000000000000 - 6019999999999',
  },
];

/**
 * Calculates GS1 standard Modulo-10 check digit for EAN-13 barcodes
 */
export function calculateEan13CheckDigit(first12Digits: string): string {
  if (first12Digits.length !== 12 || !/^\d+$/.test(first12Digits)) {
    throw new Error('EAN-13 requires exactly 12 numeric digits to compute check digit');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit.toString();
}

/**
 * Validates whether a barcode is a legitimate GS1 South African EAN-13
 */
export function isValidSouthAfricanGtin(barcode: string): boolean {
  if (!barcode || barcode.length !== 13 || !/^\d+$/.test(barcode)) return false;
  if (!barcode.startsWith('600') && !barcode.startsWith('601')) return false;

  const first12 = barcode.slice(0, 12);
  const expectedCheck = calculateEan13CheckDigit(first12);
  return barcode[12] === expectedCheck;
}

/**
 * Clean and canonicalize South African retail product titles
 */
export function cleanSaProductTitle(rawTitle: string): { title: string; packSize?: string } {
  // Remove promotional noise commonly scraped from retailer sites
  let cleaned = rawTitle
    .replace(/\b(SPECIAL|PROMOTION|SAVE R\d+|NEW PACKAGING|BULK BUY|ON OFFER)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Extract pack size (e.g. 500g, 2kg, 24 x 330ml, 5kW, 5.12kWh)
  const sizeMatch = cleaned.match(/\b(\d+(?:\.\d+)?\s*(?:kg|g|mg|L|ml|kWh|kW|Ah|V|mm|cm|m|pack|pk|sachets|tablets))\b/i);
  const packSize = sizeMatch ? sizeMatch[0] : undefined;

  return { title: cleaned, packSize };
}
