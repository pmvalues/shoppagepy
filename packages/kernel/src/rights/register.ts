import { RightsClass } from '@shoppage/contracts';
import { RETAIL_FIELDS as RETAIL_FIELD_LIST, FULL_FIELDS as FULL_FIELD_LIST } from './fields';

export interface SourceRightsRecord {
  sourceId: string;
  name: string;
  rightsClass: RightsClass;
  status: 'BLOCKED' | 'CLEARED' | 'SUSPENDED' | 'TERMINATED';
  permittedFields: string[];
  aiUsePermitted: boolean;
  suppressionSlaHours: number;
  contractValidUntil?: string;
}

export interface RightsCheckResult {
  allowed: boolean;
  rightsClass: RightsClass;
  permittedFields: string[];
  reason?: string;
}

/**
 * Checks whether a data source and specific fields are cleared for public display or ingestion
 */
export function checkSourceRights(
  source: SourceRightsRecord,
  requestedFields: string[],
  isAiProcessing: boolean = false
): RightsCheckResult {
  // Hard constructor rule: BLOCKED / SUSPENDED / TERMINATED sources reject all reads/writes
  if (source.status !== 'CLEARED') {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `Source ${source.sourceId} is ${source.status}. Access denied under default-BLOCKED rule.`,
    };
  }

  if (isAiProcessing && !source.aiUsePermitted) {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `Source ${source.sourceId} does not permit AI training or inference processing.`,
    };
  }

  const allowedFields = requestedFields.filter(
    (f) => source.permittedFields.includes('*') || source.permittedFields.includes(f)
  );

  if (allowedFields.length === 0 && requestedFields.length > 0) {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `None of the requested fields [${requestedFields.join(', ')}] are permitted for display.`,
    };
  }

  return {
    allowed: true,
    rightsClass: source.rightsClass,
    permittedFields: allowedFields,
  };
}

// =============================================================================
// WS-2.1 — CONCRETE SOURCE RIGHTS REGISTER
// =============================================================================
//
// The enforcement function above was correct but was never instantiated for the
// actual ingested sources, so it never ran. This is the missing half.
//
// GOVERNANCE RULE: a source absent from this register is treated as BLOCKED.
// Adding a source is therefore an explicit, reviewable act. Nothing is published
// by default.
//
// Current posture (decided by Maga, 2026-09-10):
//   Third-party retail catalogues obtained by scraping are recorded as BLOCKED
//   pending written permission or a licensed feed. See docs/DATA_RIGHTS_DISPOSITION.md.
//   Flipping a source to CLEARED is a one-line edit below once permission exists.

/** Fields that a retail catalogue may expose when a source is cleared. */
const RETAIL_FIELDS: string[] = [...RETAIL_FIELD_LIST];
/** Fields exposed for first-party / merchant-authorised catalogue data. */
const FULL_FIELDS: string[] = [...FULL_FIELD_LIST];

export { RETAIL_FIELDS, FULL_FIELDS };

export const RIGHTS_REGISTER: Record<string, SourceRightsRecord> = {
  // --- First-party / canonically owned data ---------------------------------
  shoppage_canonical_catalog: {
    sourceId: 'shoppage_canonical_catalog',
    name: 'Shoppage Canonical Master Catalog (GS1 GTIN-13)',
    rightsClass: 'OPEN_DATA_COMMERCIAL',
    status: 'CLEARED',
    permittedFields: FULL_FIELDS,
    aiUsePermitted: true,
    suppressionSlaHours: 24,
  },
  shoppage_malls_dataset: {
    sourceId: 'shoppage_malls_dataset',
    name: 'Shoppage Shopping Centre & Market Geofence Dataset',
    rightsClass: 'OPEN_DATA_COMMERCIAL',
    status: 'CLEARED',
    permittedFields: FULL_FIELDS,
    aiUsePermitted: true,
    suppressionSlaHours: 24,
  },

  // --- Public official records ----------------------------------------------
  cipc_enterprise_registry: {
    sourceId: 'cipc_enterprise_registry',
    name: 'CIPC Enterprise Registry (public statutory records)',
    rightsClass: 'PUBLIC_RECORD',
    status: 'CLEARED',
    // Statutory records give business identity and address, NOT trading prices.
    permittedFields: ['name', 'registrationNumber', 'address', 'province', 'status'],
    // Reconcile with POPIA before enabling AI use over sole-trader records.
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  sa_municipal_trading_registers: {
    sourceId: 'sa_municipal_trading_registers',
    name: 'South African Municipal Trading Registers',
    rightsClass: 'PUBLIC_RECORD',
    status: 'CLEARED',
    permittedFields: ['name', 'address', 'province', 'category'],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },

  // --- Merchant-authorised --------------------------------------------------
  mitrend_midrand_showroom: {
    sourceId: 'mitrend_midrand_showroom',
    name: 'Mitrend Midrand Flagship Showroom (direct merchant authorisation)',
    rightsClass: 'DIRECT_MERCHANT_AUTHORISED',
    status: 'CLEARED',
    permittedFields: FULL_FIELDS,
    aiUsePermitted: true,
    suppressionSlaHours: 24,
  },

  // --- Third-party retail catalogues ---------------------------------------
  // ALL BLOCKED. These were obtained by scraping without a written agreement.
  // To clear one, change status to 'CLEARED' and record the agreement reference
  // in contractValidUntil / a comment below.
  takealot: {
    sourceId: 'takealot',
    name: 'Takealot (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  makro: {
    sourceId: 'makro',
    name: 'Makro / Massmart (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  builders_warehouse: {
    sourceId: 'builders_warehouse',
    name: 'Builders Warehouse (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  leroy_merlin: {
    sourceId: 'leroy_merlin',
    name: 'Leroy Merlin South Africa (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  solar_advice: {
    sourceId: 'solar_advice',
    name: 'Solar Advice (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  inverter_warehouse: {
    sourceId: 'inverter_warehouse',
    name: 'Inverter Warehouse (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  incredible_connection: {
    sourceId: 'incredible_connection',
    name: 'Incredible Connection (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  checkers_sixty60: {
    sourceId: 'checkers_sixty60',
    name: 'Checkers Sixty60 (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  ishop: {
    sourceId: 'ishop',
    name: 'iStore / Core Group (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  // Retailers discovered in the live dataset by the WS-2.2 impact audit. They were
  // already denied by the default-deny rule; listing them explicitly makes the
  // posture documented and reviewable instead of incidental.
  buco: {
    sourceId: 'buco',
    name: 'BUCO (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  game: {
    sourceId: 'game',
    name: 'Game / Massmart (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  expertstores: {
    sourceId: 'expertstores',
    name: 'Expert Stores (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  solartechdirect: {
    sourceId: 'solartechdirect',
    name: 'Solar Tech Direct (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  clicks: {
    sourceId: 'clicks',
    name: 'Clicks (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
  midas: {
    sourceId: 'midas',
    name: 'Midas (scraped catalogue — no agreement on record)',
    rightsClass: 'BLOCKED',
    status: 'BLOCKED',
    permittedFields: [],
    aiUsePermitted: false,
    suppressionSlaHours: 24,
  },
};

/**
 * Normalises a free-text website/source label (e.g. "Takealot", "www.makro.co.za")
 * into a register key. Returns null when no register entry can be resolved.
 */
export function resolveSourceId(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')[0]
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (RIGHTS_REGISTER[cleaned]) return cleaned;

  // Try a alias match against register keys (handles "builders" -> builders_warehouse).
  const aliasMap: Record<string, string> = {
    builders: 'builders_warehouse',
    builder: 'builders_warehouse',
    massmart: 'makro',
    leroy: 'leroy_merlin',
    leroymerlin: 'leroy_merlin',
    solaradvice: 'solar_advice',
    inverterwarehouse: 'inverter_warehouse',
    incredibleconnection: 'incredible_connection',
    sixty60: 'checkers_sixty60',
    istore: 'ishop',
    core: 'ishop',
    mitrend: 'mitrend_midrand_showroom',
    cipc: 'cipc_enterprise_registry',
  };
  if (aliasMap[cleaned] && RIGHTS_REGISTER[aliasMap[cleaned]]) return aliasMap[cleaned];

  return null;
}

/**
 * The single gate every federated read must pass through.
 *
 * GOVERNANCE: an unrecognised source is DENIED. New sources must be added to the
 * register explicitly — they do not inherit permission from anywhere.
 */
export function isSourcePublishable(
  rawSource: string,
  requestedFields: string[] = RETAIL_FIELDS,
  isAiProcessing = false
): RightsCheckResult {
  const sourceId = resolveSourceId(rawSource);

  if (!sourceId) {
    return {
      allowed: false,
      rightsClass: 'BLOCKED',
      permittedFields: [],
      reason:
        `Source "${rawSource}" is not present in the rights register and is therefore ` +
        'BLOCKED under the default-deny rule. Add it to RIGHTS_REGISTER to permit publication.',
    };
  }

  return checkSourceRights(RIGHTS_REGISTER[sourceId], requestedFields, isAiProcessing);
}

/**
 * Convenience predicate for filter call sites.
 */
export function canPublishSource(rawSource: string, isAiProcessing = false): boolean {
  return isSourcePublishable(rawSource, RETAIL_FIELDS, isAiProcessing).allowed;
}
