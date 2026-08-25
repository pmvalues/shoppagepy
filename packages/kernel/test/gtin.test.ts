import { describe, it, expect } from 'vitest';
import { validateGtin, calculateGs1CheckDigit } from '../src/matching/gtin.js';

describe('GS1 GTIN Validation Engine', () => {
  it('correctly calculates GS1 check digits', () => {
    // EAN-13 body: "600987654321" -> check digit is 9 (sum = 101, 110 - 101 = 9)
    expect(calculateGs1CheckDigit('600987654321')).toBe(9);

    // EAN-13 body: "697123456789" -> check digit is 5 (sum = 135, 140 - 135 = 5)
    expect(calculateGs1CheckDigit('697123456789')).toBe(5);
  });

  it('validates genuine GTIN-13 barcodes', () => {
    const res = validateGtin('6009876543219');
    expect(res.isValid).toBe(true);
    expect(res.gtinType).toBe('GTIN-13');
    expect(res.normalizedGtin14).toBe('06009876543219');
  });

  it('validates genuine GTIN-12 (UPC-A) barcodes', () => {
    // UPC-A: 012345678905
    const res = validateGtin('012345678905');
    expect(res.isValid).toBe(true);
    expect(res.gtinType).toBe('GTIN-12');
  });

  it('rejects GTIN with corrupt check digit', () => {
    const res = validateGtin('6009876543210'); // Check digit is 9, not 0
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Check digit mismatch');
  });

  it('rejects invalid length and non-numeric characters', () => {
    expect(validateGtin('12345').isValid).toBe(false);
    expect(validateGtin('6009876ABC217').isValid).toBe(false);
  });
});
