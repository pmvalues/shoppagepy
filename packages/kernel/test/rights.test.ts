import { describe, it, expect } from 'vitest';
import { checkSourceRights, SourceRightsRecord } from '../src/rights/register.js';

describe('Source Rights Register & Default-BLOCKED Enforcer', () => {
  it('rejects access to BLOCKED or unverified data source', () => {
    const source: SourceRightsRecord = {
      sourceId: 'src_scraped_raw',
      name: 'Unverified Web Scrape',
      rightsClass: 'BLOCKED',
      status: 'BLOCKED',
      permittedFields: [],
      aiUsePermitted: false,
      suppressionSlaHours: 24,
    };

    const res = checkSourceRights(source, ['price', 'title']);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('default-BLOCKED rule');
  });

  it('allows access to CLEARED source with authorized fields', () => {
    const source: SourceRightsRecord = {
      sourceId: 'src_partner_takealot',
      name: 'Takealot Contractual API Feed',
      rightsClass: 'PARTNER_CONTRACTUAL_FEED',
      status: 'CLEARED',
      permittedFields: ['title', 'price', 'brand', 'gtin13'],
      aiUsePermitted: true,
      suppressionSlaHours: 24,
    };

    const res = checkSourceRights(source, ['title', 'price']);
    expect(res.allowed).toBe(true);
    expect(res.permittedFields).toEqual(['title', 'price']);
  });

  it('blocks AI processing when source disallows AI usage', () => {
    const source: SourceRightsRecord = {
      sourceId: 'src_partner_no_ai',
      name: 'Exclusive Partner Feed',
      rightsClass: 'PARTNER_CONTRACTUAL_FEED',
      status: 'CLEARED',
      permittedFields: ['*'],
      aiUsePermitted: false, // Forbidden
      suppressionSlaHours: 24,
    };

    const res = checkSourceRights(source, ['title'], true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('does not permit AI training or inference');
  });
});
