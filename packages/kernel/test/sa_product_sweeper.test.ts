import { describe, it, expect } from 'vitest';
import {
  calculateEan13CheckDigit,
  isValidSouthAfricanGtin,
  cleanSaProductTitle,
  SA_MAJOR_PRODUCT_RETAILERS,
} from '../src/index';

describe('South African National Product Sweeper & GS1 Barcode Engine', () => {
  it('calculates GS1 standard Modulo-10 check digits for South African EAN-13 barcodes', () => {
    // 600100700123 -> check digit calculation
    const checkDigit = calculateEan13CheckDigit('600100700123');
    expect(checkDigit).toBeDefined();
    expect(checkDigit).toMatch(/^\d$/);

    // Full 13-digit barcode with correct check digit
    const fullBarcode = `600100700123${checkDigit}`;
    expect(isValidSouthAfricanGtin(fullBarcode)).toBe(true);
  });

  it('correctly rejects non-South African or invalid length GTIN barcodes', () => {
    expect(isValidSouthAfricanGtin('1234567890123')).toBe(false); // Does not start with 600 or 601
    expect(isValidSouthAfricanGtin('600123')).toBe(false); // Wrong length
    expect(isValidSouthAfricanGtin('')).toBe(false);
  });

  it('cleans retail promotional noise from product titles and extracts pack sizes', () => {
    const raw1 = 'SPECIAL OFFER! White Star Super Maize Meal 2.5kg SAVE R20';
    const cleaned1 = cleanSaProductTitle(raw1);
    expect(cleaned1.title).toContain('White Star Super Maize Meal 2.5kg');
    expect(cleaned1.title).not.toContain('SPECIAL OFFER');
    expect(cleaned1.title).not.toContain('SAVE R20');
    expect(cleaned1.packSize).toBe('2.5kg');

    const raw2 = 'Sunsynk 5kW Hybrid Inverter 48V Low Voltage';
    const cleaned2 = cleanSaProductTitle(raw2);
    expect(cleaned2.packSize).toBe('5kW');
  });

  it('provides comprehensive coverage of major South African retail & wholesale data sources', () => {
    expect(SA_MAJOR_PRODUCT_RETAILERS.length).toBeGreaterThanOrEqual(8);
    const retailerIds = SA_MAJOR_PRODUCT_RETAILERS.map((r) => r.id);
    expect(retailerIds).toContain('takealot');
    expect(retailerIds).toContain('shoprite_checkers');
    expect(retailerIds).toContain('makro_massmart');
    expect(retailerIds).toContain('builders_warehouse');
    expect(retailerIds).toContain('solar_distributors');
  });
});
