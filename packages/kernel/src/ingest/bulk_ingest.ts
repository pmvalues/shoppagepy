import { validateGtin } from '../matching/gtin';
import { GoogleTaxonomyEngine } from '../taxonomy/google_taxonomy';
import { ProductVariant, MultilingualAlias } from '@shoppage/contracts';

export interface RawProductRecord {
  id?: string;
  title: string;
  brand?: string;
  model?: string;
  barcode?: string;
  categoryPath?: string;
  description?: string;
  attributes?: Record<string, string | number | boolean | Array<string>>;
  source: string;
  language?: string;
}

export interface IngestionBatchResult {
  totalProcessed: number;
  validGtinCount: number;
  invalidGtinCount: number;
  mappedCategoryCount: number;
  canonicalVariantsCreated: number;
  errors: string[];
}

/**
 * Universal Ingestion Transformer:
 * Validates GTIN, maps category to Google Product Taxonomy, and generates multilingual aliases.
 */
export function transformRawRecordToCanonical(
  raw: RawProductRecord,
  taxonomy: GoogleTaxonomyEngine
): { variant: ProductVariant; isValid: boolean; reason?: string } {
  if (!raw.title || raw.title.trim().length < 2) {
    return { variant: null as any, isValid: false, reason: 'Missing or empty product title' };
  }

  // 1. Validate GTIN barcode
  let gtin13: string | undefined;
  let gtin14: string | undefined;
  let gtin12: string | undefined;
  let gtin8: string | undefined;

  if (raw.barcode) {
    const gtinRes = validateGtin(raw.barcode);
    if (gtinRes.isValid) {
      if (gtinRes.gtinType === 'GTIN-13') gtin13 = raw.barcode;
      if (gtinRes.gtinType === 'GTIN-12') gtin12 = raw.barcode;
      if (gtinRes.gtinType === 'GTIN-8') gtin8 = raw.barcode;
      gtin14 = gtinRes.normalizedGtin14;
    }
  }

  // 2. Map Category to Google Taxonomy
  let categoryRef = 'general';
  if (raw.categoryPath) {
    const matchedNodes = taxonomy.searchCategories(raw.categoryPath);
    if (matchedNodes.length > 0) {
      categoryRef = matchedNodes[0].slug;
    }
  }

  // 3. Generate localized aliases
  const aliases: MultilingualAlias[] = [
    { phrase: raw.title.trim(), locale: 'en', source: 'merchant_usage', confidence: 0.95 },
  ];

  if (raw.brand) {
    aliases.push({
      phrase: `${raw.brand} ${raw.model || ''}`.trim(),
      locale: 'en',
      source: 'ai_normalized',
      confidence: 0.9,
    });
  }

  const canonicalId = `var_${raw.source.toLowerCase()}_${raw.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const variant: ProductVariant = {
    canonicalId,
    familyRef: `fam_${raw.brand ? raw.brand.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'generic'}`,
    categoryRef,
    title: raw.title.trim(),
    brand: raw.brand?.trim() || 'Generic',
    modelNumber: raw.model?.trim(),
    identifiers: {
      gtin13,
      gtin14,
      gtin12,
      gtin8,
      mpn: raw.model?.trim(),
    },
    attributes: raw.attributes || {},
    aliases,
    compatibilityEdgeCount: 0,
    status: 'active',
    countryScope: ['ZA', 'ZW', 'KE', 'NG', 'GB', 'US'],
    provenance: {
      sourceRef: `src_${raw.source.toLowerCase()}`,
      rightsClass: 'OPEN_DATA_COMMERCIAL',
      confidence: gtin13 ? 0.99 : 0.85,
      fieldOwner: 'SHOPPAGE_CANONICAL',
      validFrom: new Date().toISOString(),
    },
  };

  return { variant, isValid: true };
}

/**
 * In-Memory & Streaming Batch Processor for 100M+ datasets
 */
export class BulkProductIngestionPipeline {
  private taxonomy: GoogleTaxonomyEngine;

  constructor(taxonomy: GoogleTaxonomyEngine = new GoogleTaxonomyEngine()) {
    this.taxonomy = taxonomy;
  }

  public processBatch(records: RawProductRecord[]): {
    variants: ProductVariant[];
    metrics: IngestionBatchResult;
  } {
    const variants: ProductVariant[] = [];
    const errors: string[] = [];
    let validGtinCount = 0;
    let invalidGtinCount = 0;
    let mappedCategoryCount = 0;

    for (const record of records) {
      const { variant, isValid, reason } = transformRawRecordToCanonical(record, this.taxonomy);

      if (!isValid) {
        errors.push(reason || 'Invalid record');
        continue;
      }

      if (variant.identifiers.gtin13 || variant.identifiers.gtin14) {
        validGtinCount++;
      } else if (record.barcode) {
        invalidGtinCount++;
      }

      if (variant.categoryRef !== 'general') {
        mappedCategoryCount++;
      }

      variants.push(variant);
    }

    return {
      variants,
      metrics: {
        totalProcessed: records.length,
        validGtinCount,
        invalidGtinCount,
        mappedCategoryCount,
        canonicalVariantsCreated: variants.length,
        errors,
      },
    };
  }
}
