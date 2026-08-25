/**
 * GS1 GTIN Identifier Validation & Normalization Engine
 * Supports GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13), and GTIN-14 (ITF-14)
 */

export interface GtinValidationResult {
  isValid: boolean;
  gtinType: 'GTIN-8' | 'GTIN-12' | 'GTIN-13' | 'GTIN-14' | 'INVALID';
  normalizedGtin14?: string;
  checkDigit?: number;
  calculatedCheckDigit?: number;
  error?: string;
}

/**
 * Calculates standard GS1 modulo-10 check digit
 * Alternate weighting of 3 and 1 starting from right-to-left
 */
export function calculateGs1CheckDigit(digitsWithoutCheck: string): number {
  let sum = 0;
  const len = digitsWithoutCheck.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(digitsWithoutCheck[len - 1 - i], 10);
    if (isNaN(digit)) return -1;
    // Odd positions from right are weighted 3, even positions are weighted 1
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates and normalizes any GTIN barcode string
 */
export function validateGtin(rawInput: string): GtinValidationResult {
  if (!rawInput) {
    return { isValid: false, gtinType: 'INVALID', error: 'Empty GTIN string' };
  }

  // Strip whitespace, hyphens, and leading zeroes if formatting
  const clean = rawInput.trim().replace(/[\s-]/g, '');

  if (!/^\d+$/.test(clean)) {
    return { isValid: false, gtinType: 'INVALID', error: 'GTIN must contain numeric digits only' };
  }

  const length = clean.length;
  let gtinType: GtinValidationResult['gtinType'] = 'INVALID';

  if (length === 8) gtinType = 'GTIN-8';
  else if (length === 12) gtinType = 'GTIN-12';
  else if (length === 13) gtinType = 'GTIN-13';
  else if (length === 14) gtinType = 'GTIN-14';
  else {
    return {
      isValid: false,
      gtinType: 'INVALID',
      error: `Invalid GTIN length (${length}). Must be 8, 12, 13, or 14 digits.`,
    };
  }

  const body = clean.slice(0, -1);
  const actualCheckDigit = parseInt(clean.slice(-1), 10);
  const expectedCheckDigit = calculateGs1CheckDigit(body);

  if (actualCheckDigit !== expectedCheckDigit) {
    return {
      isValid: false,
      gtinType,
      checkDigit: actualCheckDigit,
      calculatedCheckDigit: expectedCheckDigit,
      error: `Check digit mismatch: expected ${expectedCheckDigit}, got ${actualCheckDigit}`,
    };
  }

  // Normalize to 14-digit GTIN-14 format with leading zeroes
  const normalizedGtin14 = clean.padStart(14, '0');

  return {
    isValid: true,
    gtinType,
    checkDigit: actualCheckDigit,
    calculatedCheckDigit: expectedCheckDigit,
    normalizedGtin14,
  };
}
