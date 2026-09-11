import { describe, it, expect } from 'vitest';
import {
  RIGHTS_REGISTER,
  resolveSourceId,
  isSourcePublishable,
  canPublishSource,
  checkSourceRights,
  RETAIL_FIELDS,
  type SourceRightsRecord,
} from '../src/rights/register';

describe('WS-2.1: source rights register is instantiated', () => {
  it('contains the third-party retail sources as BLOCKED', () => {
    const scraped = [
      'takealot',
      'makro',
      'builders_warehouse',
      'leroy_merlin',
      'solar_advice',
      'inverter_warehouse',
      'incredible_connection',
      'checkers_sixty60',
      'ishop',
      // Discovered by the WS-2.2 live-data impact audit.
      'buco',
      'game',
      'expertstores',
      'solartechdirect',
      'clicks',
      'midas',
    ];
    for (const id of scraped) {
      expect(RIGHTS_REGISTER[id], `${id} must be registered`).toBeDefined();
      expect(RIGHTS_REGISTER[id].status, `${id} must be BLOCKED`).toBe('BLOCKED');
      expect(RIGHTS_REGISTER[id].aiUsePermitted, `${id} must deny AI use`).toBe(false);
    }
  });

  it('clears first-party and merchant-authorised sources', () => {
    expect(RIGHTS_REGISTER.shoppage_canonical_catalog.status).toBe('CLEARED');
    expect(RIGHTS_REGISTER.mitrend_midrand_showroom.status).toBe('CLEARED');
    expect(RIGHTS_REGISTER.mitrend_midrand_showroom.aiUsePermitted).toBe(true);
  });

  it('does not permit AI use over statutory records containing personal data', () => {
    expect(RIGHTS_REGISTER.cipc_enterprise_registry.aiUsePermitted).toBe(false);
    expect(RIGHTS_REGISTER.sa_municipal_trading_registers.aiUsePermitted).toBe(false);
  });
});

describe('WS-2.1: source id resolution', () => {
  it('resolves common website spellings to register keys', () => {
    expect(resolveSourceId('takealot.com')).toBe('takealot');
    expect(resolveSourceId('www.takealot.com')).toBe('takealot');
    expect(resolveSourceId('https://www.makro.co.za')).toBe('makro');
    expect(resolveSourceId('Builders Warehouse')).toBe('builders_warehouse');
    expect(resolveSourceId('leroymerlin')).toBe('leroy_merlin');
    expect(resolveSourceId('Takealot')).toBe('takealot');
  });

  it('returns null for an unknown source', () => {
    expect(resolveSourceId('some-random-shop.co.za')).toBeNull();
    expect(resolveSourceId('')).toBeNull();
  });
});

describe('WS-2.2: default-deny enforcement at the read boundary', () => {
  it('denies publication for a BLOCKED scraped source', () => {
    const res = isSourcePublishable('takealot.com', RETAIL_FIELDS, false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('BLOCKED');
  });

  it('denies EVERY registered third-party retailer', () => {
    for (const id of ['takealot', 'makro', 'builders_warehouse', 'leroy_merlin', 'ishop']) {
      expect(canPublishSource(id), `${id} must not be publishable`).toBe(false);
    }
  });

  it('denies an unregistered source under the default-deny rule', () => {
    const res = isSourcePublishable('unvetted-scraper-target.com', RETAIL_FIELDS, false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('default-deny');
  });

  it('permits a CLEARED first-party source', () => {
    expect(canPublishSource('shoppage_canonical_catalog')).toBe(true);
    expect(canPublishSource('mitrend_midrand_showroom')).toBe(true);
  });

  it('denies AI processing on a cleared source that forbids it', () => {
    // CIPC records are CLEARED for display of business identity fields only.
    const res = isSourcePublishable('cipc_enterprise_registry', ['name', 'address'], true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('AI');
  });

  it('permits AI processing on a source that explicitly allows it', () => {
    const res = isSourcePublishable('shoppage_canonical_catalog', RETAIL_FIELDS, true);
    expect(res.allowed).toBe(true);
  });

  it('every register entry is internally consistent', () => {
    const entries = Object.entries(RIGHTS_REGISTER);
    expect(entries.length).toBeGreaterThan(10);
    for (const [key, record] of entries) {
      expect(record.sourceId, `${key} sourceId mismatch`).toBe(key);
      // A BLOCKED source must never permit fields or AI use.
      if (record.status !== 'CLEARED') {
        expect(record.permittedFields, `${key} must expose no fields`).toEqual([]);
        expect(record.aiUsePermitted, `${key} must not permit AI`).toBe(false);
      }
      expect(record.suppressionSlaHours).toBeGreaterThan(0);
    }
  });
});

describe('WS-2.3: existing checkSourceRights semantics are preserved', () => {
  const cleared: SourceRightsRecord = {
    sourceId: 'x',
    name: 'X',
    rightsClass: 'PARTNER_CONTRACTUAL_FEED',
    status: 'CLEARED',
    permittedFields: ['title', 'price'],
    aiUsePermitted: true,
    suppressionSlaHours: 24,
  };

  it('allows cleared sources with authorised fields', () => {
    expect(checkSourceRights(cleared, ['title']).allowed).toBe(true);
  });

  it('rejects fields that are not authorised', () => {
    expect(checkSourceRights(cleared, ['secretInternalNote']).allowed).toBe(false);
  });
});
