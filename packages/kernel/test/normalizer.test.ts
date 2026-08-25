import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  canonicalizeToEnglish,
  MasterProductStore,
} from '../src/index';

describe('Multilingual English Normalization Layer', () => {
  it('decodes HTML entities properly', () => {
    expect(decodeHtmlEntities('M&amp;M white')).toBe('M&M white');
    expect(decodeHtmlEntities('Caf&#39;e &quot;Delight&quot;')).toBe("Caf'e \"Delight\"");
  });

  it('canonicalizes foreign master product titles to standard English', () => {
    const res = canonicalizeToEnglish('Limonade artisanale a la rose');
    expect(res.englishTitle).toBe('Artisanal Lemonade with Rose Essence');
    expect(res.aliases.length).toBeGreaterThanOrEqual(2);
    expect(res.aliases.some((a) => a.locale === 'fr')).toBe(true);
  });

  it('translates chocolate and beverage titles to clean English in MasterProductStore', () => {
    const p = MasterProductStore.getProductById('off_000000000054');
    expect(p).toBeDefined();
    expect(p?.title).toBe('Artisanal Lemonade with Rose Essence');
  });
});
