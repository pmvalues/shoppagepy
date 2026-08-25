import { describe, it, expect } from 'vitest';
import {
  BulkProductIngestionPipeline,
  OpenFoodFactsAdapter,
  OpenIcecatAdapter,
  SolarHardwareRegistryAdapter,
  GoogleTaxonomyEngine,
} from '../src/index.js';

describe('100M+ Universal Product Ingestion Pipeline', () => {
  const taxonomy = new GoogleTaxonomyEngine();
  const pipeline = new BulkProductIngestionPipeline(taxonomy);

  it('transforms Open Food Facts items into canonical product variants with valid GTIN-13', () => {
    const rawOffItem = {
      _id: '6001234567899', // Mathematically valid South African EAN-13 (check digit: 9)
      product_name: 'Albany Superior White Bread 700g',
      brands: 'Albany, Tiger Brands',
      quantity: '700g',
      packaging: 'Plastic bag',
    };

    const record = OpenFoodFactsAdapter.parseItem(rawOffItem);
    const { variants, metrics } = pipeline.processBatch([record]);

    expect(metrics.totalProcessed).toBe(1);
    expect(metrics.canonicalVariantsCreated).toBe(1);
    expect(metrics.validGtinCount).toBe(1);
    expect(variants[0].title).toBe('Albany Superior White Bread 700g');
    expect(variants[0].brand).toBe('Albany');
    expect(variants[0].identifiers.gtin13).toBe('6001234567899');
  });

  it('transforms Icecat Electronics spec sheets into canonical variants', () => {
    const rawIcecat = {
      id: 'ice_12345',
      title: 'Samsung Galaxy A16 128GB LTE Dual SIM',
      brand: 'Samsung',
      model: 'SM-A165F',
      ean: '6009876543219',
      category_path: 'Electronics > Communications > Telephony > Mobile Phones',
      specifications: { storage: '128GB', ram: '4GB', battery: '5000mAh' },
    };

    const record = OpenIcecatAdapter.parseItem(rawIcecat);
    const { variants, metrics } = pipeline.processBatch([record]);

    expect(metrics.canonicalVariantsCreated).toBe(1);
    expect(variants[0].categoryRef).toBe('mobile-phones');
    expect(variants[0].brand).toBe('Samsung');
  });

  it('transforms Solar Hardware Registry datasheets into typed canonical solar variants', () => {
    const rawSolar = {
      model: 'SUN-5K-SG03LP1-EU',
      brand: 'Deye',
      ratedPowerKw: 5.0,
      maxPvVoltage: 500,
      batteryVoltage: 48,
      gtin13: '6009876543219',
    };

    const record = SolarHardwareRegistryAdapter.parseItem(rawSolar);
    const { variants, metrics } = pipeline.processBatch([record]);

    expect(metrics.canonicalVariantsCreated).toBe(1);
    expect(variants[0].categoryRef).toBe('solar-inverters');
    expect(variants[0].attributes.maxPvVoltage).toBe(500);
  });
});
