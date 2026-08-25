import { describe, it, expect } from 'vitest';
import { buildReferralActionEvent, generateDedupeKey } from '../src/actions/ledger.js';

describe('Action Ledger Event Builder', () => {
  it('generates consistent deduplication keys for identical sessions in 15-min bucket', () => {
    const key1 = generateDedupeKey({
      sessionFingerprint: 'fp_user_abc123',
      action: 'whatsapp_start',
      merchantRef: 'loc_sunpower_crownmines',
      variantRef: 'var_deye_5kw',
      bucket15Min: 198000,
    });

    const key2 = generateDedupeKey({
      sessionFingerprint: 'fp_user_abc123',
      action: 'whatsapp_start',
      merchantRef: 'loc_sunpower_crownmines',
      variantRef: 'var_deye_5kw',
      bucket15Min: 198000,
    });

    expect(key1).toBe(key2);
  });

  it('assigns high confidence score to high-intent actions', () => {
    const event = buildReferralActionEvent({
      country: 'ZA',
      sessionFingerprint: 'fp_test_1',
      action: 'whatsapp_start',
      merchantRef: 'loc_sunpower_crownmines',
      variantRef: 'var_deye_5kw',
    });

    expect(event.confidenceScore).toBe(0.85);
    expect(event.dedupeKey).toBeDefined();
    expect(event.eventId).toContain('evt_');
  });
});
