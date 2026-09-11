/**
 * Canonical field lists used by the source rights register (WS-2).
 *
 * Kept in a dedicated module so that the register, the repository layer and any
 * future API surface all refer to the same definitions. Divergent copies of these
 * lists would make the rights checks inconsistent and unauditable.
 */

/** Fields a licensed/scraped retail catalogue may expose once its source is CLEARED. */
export const RETAIL_FIELDS = [
  'title',
  'price',
  'brand',
  'gtin13',
  'url',
  'imageUrl',
  'availability',
] as const;

/** All fields, for first-party and merchant-authorised sources. */
export const FULL_FIELDS = ['*'] as const;

/** Fields permitted when AI inference is applied to a source. */
export const AI_TEXT_FIELDS = ['title', 'specs', 'description', 'category', 'brand'] as const;

export type RetailField = (typeof RETAIL_FIELDS)[number];
