import { RawProductRecord } from './bulk_ingest';

/**
 * Open Dataset Source Adapters for 100M+ Master Catalog Ingestion
 */

export class OpenFoodFactsAdapter {
  /**
   * Transforms an Open Food Facts JSON export item into a standardized RawProductRecord
   */
  public static parseItem(item: Record<string, any>): RawProductRecord {
    const title = item.product_name || item.generic_name || item.product_name_en || 'Unknown Food Item';
    const brand = item.brands ? item.brands.split(',')[0].trim() : undefined;
    const barcode = item.code || item._id;

    return {
      id: item.code || item._id,
      title,
      brand,
      barcode: barcode && /^\d+$/.test(barcode) ? barcode : undefined,
      categoryPath: 'Food, Beverages & Tobacco > Food Items',
      description: item.ingredients_text,
      attributes: {
        quantity: item.quantity,
        packaging: item.packaging,
        nutriscore: item.nutriscore_grade,
      },
      source: 'OpenFoodFacts',
      language: item.lang || 'en',
    };
  }
}

export class OpenIcecatAdapter {
  /**
   * Transforms an Open Icecat Tech/Electronics spec sheet into a RawProductRecord
   */
  public static parseItem(item: Record<string, any>): RawProductRecord {
    const title = item.title || `${item.brand || ''} ${item.model || ''} ${item.product_family || ''}`.trim();
    const barcode = item.ean || item.gtin || item.upc;

    return {
      id: item.product_id || item.id,
      title,
      brand: item.brand || item.vendor,
      model: item.model || item.mpn,
      barcode: barcode && /^\d+$/.test(barcode) ? barcode : undefined,
      categoryPath: item.category_path || 'Electronics',
      description: item.summary_description,
      attributes: item.specifications || {},
      source: 'Icecat',
      language: item.language || 'en',
    };
  }
}

export class AmazonOpenDatasetAdapter {
  /**
   * Transforms a UCSD/Stanford Amazon metadata record into a RawProductRecord
   */
  public static parseItem(item: Record<string, any>): RawProductRecord {
    const title = item.title || 'Amazon Product';
    const barcode = item.asin || item.id;

    return {
      id: item.asin || item.id,
      title,
      brand: item.brand,
      categoryPath: Array.isArray(item.categories) ? item.categories.flat().join(' > ') : undefined,
      description: Array.isArray(item.description) ? item.description.join(' ') : item.description,
      attributes: {
        price: item.price,
        salesRank: item.salesRank,
      },
      source: 'AmazonCorpus',
      language: 'en',
    };
  }
}

export class SolarHardwareRegistryAdapter {
  /**
   * Transforms CEC / Manufacturer Solar Datasheet into a RawProductRecord with typed electrical specs
   */
  public static parseItem(item: Record<string, any>): RawProductRecord {
    return {
      id: item.serial || item.model,
      title: `${item.brand} ${item.model} ${item.ratedPowerKw || item.ratedPowerW || ''} ${item.type || 'Solar'}`.trim(),
      brand: item.brand,
      model: item.model,
      barcode: item.gtin13,
      categoryPath: 'Hardware > Solar Energy > Solar Inverters',
      attributes: {
        ratedPowerKw: item.ratedPowerKw,
        maxPvVoltage: item.maxPvVoltage,
        batteryNominalVoltage: item.batteryVoltage,
        efficiencyPercent: item.efficiencyPercent,
        ipRating: item.ipRating || 'IP65',
      },
      source: 'SolarRegistry',
      language: 'en',
    };
  }
}
