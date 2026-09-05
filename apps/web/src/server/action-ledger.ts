import { mkdirSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildReferralActionEvent } from '@shoppage/kernel';
import type { ReferralActionEvent } from '@shoppage/contracts';

/**
 * Append-only referral/action ledger — disk-authoritative.
 *
 * Production-write path for the business model's core measurement spine.
 * Every referral action (impression -> outbound_click -> whatsapp_start ->
 * quote_submitted -> merchant_responded -> buyer_resolved) is written here as
 * an append-only NDJSON + SQLite file so RQNR, merchant response analytics and
 * ranking signals are computable.
 *
 * IMPORTANT: reads always hit disk. next start runs route handlers in separate
 * worker processes, so per-process caches return stale/empty data.
 */

const LEDGER_DIR = resolve(
  process.cwd(),
  'shoppage-commerce-intelligence-foundation',
  'data',
  'study'
);
const LEDGER_NDJSON = resolve(LEDGER_DIR, 'shoppage_action_ledger.ndjson');
const LEDGER_DB = resolve(LEDGER_DIR, 'shoppage_action_ledger.sqlite');

let db: any = null;

function openDb(): any | null {
  if (db) return db;
  try {
    mkdirSync(LEDGER_DIR, { recursive: true });
    const req = eval('require');
    const { DatabaseSync } = req('node:sqlite');
    db = new DatabaseSync(LEDGER_DB, { open: true });
    db.exec(
      'CREATE TABLE IF NOT EXISTS referral_events (' +
      '  event_id TEXT PRIMARY KEY,' +
      '  occurred_at TEXT NOT NULL,' +
      '  country TEXT NOT NULL,' +
      '  session_fingerprint TEXT NOT NULL,' +
      '  source_campaign TEXT,' +
      '  source_asset_qr_id TEXT,' +
      '  offer_ref TEXT,' +
      '  variant_ref TEXT,' +
      '  merchant_ref TEXT NOT NULL,' +
      '  market_ref TEXT,' +
      '  stall_ref TEXT,' +
      '  action TEXT NOT NULL,' +
      '  confidence_score REAL NOT NULL,' +
      '  dedupe_key TEXT NOT NULL,' +
      '  metadata TEXT' +
      ');' +
      'CREATE INDEX IF NOT EXISTS idx_ledger_merchant_action ON referral_events(merchant_ref, action);' +
      'CREATE INDEX IF NOT EXISTS idx_ledger_occurred ON referral_events(occurred_at);' +
      'CREATE INDEX IF NOT EXISTS idx_ledger_dedupe ON referral_events(dedupe_key);'
    );
    return db;
  } catch {
    return null;
  }
}

export function getLedgerEvents(limit = 500): ReferralActionEvent[] {
  const d = openDb();
  if (!d) return [];
  try {
    const rows = d.prepare(
      'SELECT * FROM referral_events ORDER BY occurred_at DESC LIMIT ?'
    ).all(limit);
    return (rows as any[]).map((row) => ({
      eventId: row.event_id,
      occurredAt: row.occurred_at,
      country: row.country,
      sessionFingerprint: row.session_fingerprint,
      sourceCampaign: row.source_campaign || undefined,
      sourceAssetQrId: row.source_asset_qr_id || undefined,
      offerRef: row.offer_ref || undefined,
      variantRef: row.variant_ref || undefined,
      merchantRef: row.merchant_ref,
      marketRef: row.market_ref || undefined,
      stallRef: row.stall_ref || undefined,
      action: row.action as any,
      confidenceScore: row.confidence_score,
      dedupeKey: row.dedupe_key,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  } catch {
    return [];
  }
}

export function getLedgerStats(): {
  totalEvents: number;
  byAction: Record<string, number>;
  byMerchant: Record<string, number>;
} {
  const d = openDb();
  if (!d) return { totalEvents: 0, byAction: {}, byMerchant: {} };
  try {
    const total = (d.prepare('SELECT count(*) as c FROM referral_events').get() as any)?.c || 0;
    const actionRows = d.prepare('SELECT action, count(*) as c FROM referral_events GROUP BY action').all() as any[];
    const merchantRows = d.prepare('SELECT merchant_ref, count(*) as c FROM referral_events GROUP BY merchant_ref').all() as any[];
    const byAction: Record<string, number> = {};
    const byMerchant: Record<string, number> = {};
    for (const r of actionRows) byAction[r.action] = r.c;
    for (const r of merchantRows) byMerchant[r.merchant_ref] = r.c;
    return { totalEvents: total, byAction, byMerchant };
  } catch {
    return { totalEvents: 0, byAction: {}, byMerchant: {} };
  }
}

export function appendReferralEvent(event: ReferralActionEvent): boolean {
  const line = JSON.stringify(event);
  try {
    mkdirSync(LEDGER_DIR, { recursive: true });
    appendFileSync(LEDGER_NDJSON, line + String.fromCharCode(10), 'utf8');
  } catch {
    // NDJSON is best-effort mirror; SQLite is authoritative below.
  }

  const d = openDb();
  if (!d) return false;
  try {
    d.prepare(
      'INSERT OR IGNORE INTO referral_events ' +
      '(event_id, occurred_at, country, session_fingerprint, source_campaign, source_asset_qr_id,' +
      ' offer_ref, variant_ref, merchant_ref, market_ref, stall_ref, action, confidence_score, dedupe_key, metadata)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      event.eventId,
      event.occurredAt,
      event.country,
      event.sessionFingerprint,
      event.sourceCampaign || null,
      event.sourceAssetQrId || null,
      event.offerRef || null,
      event.variantRef || null,
      event.merchantRef,
      event.marketRef || null,
      event.stallRef || null,
      event.action,
      event.confidenceScore,
      event.dedupeKey,
      event.metadata ? JSON.stringify(event.metadata) : null
    );
  } catch {
    return false;
  }
  return true;
}

export function createReferralEvent(input: Parameters<typeof buildReferralActionEvent>[0]): ReferralActionEvent {
  const event = buildReferralActionEvent(input);
  appendReferralEvent(event);
  return event;
}
