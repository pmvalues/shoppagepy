import { mkdirSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

/**
 * Billing event store — disk-authoritative.
 *
 * Subscription webhooks (Paystack / Stripe) were previously acknowledged and
 * discarded, so a paid merchant never received an entitlement record. This
 * store makes every verified event idempotent and durable, and derives a
 * minimal subscription state table for entitlement checks.
 */

const BILLING_DIR = pathResolve(
  process.cwd(),
  'shoppage-commerce-intelligence-foundation',
  'data',
  'study'
);
const BILLING_DB = pathResolve(BILLING_DIR, 'shoppage_billing.sqlite');

let db: any = null;

function openDb(): any | null {
  if (db) return db;
  try {
    mkdirSync(BILLING_DIR, { recursive: true });
    const req = eval('require');
    const { DatabaseSync } = req('node:sqlite');
    db = new DatabaseSync(BILLING_DB, { open: true });
    db.exec(
      'CREATE TABLE IF NOT EXISTS billing_events (' +
      '  event_key TEXT PRIMARY KEY,' +
      '  provider TEXT NOT NULL,' +
      '  event_type TEXT NOT NULL,' +
      '  subscription_ref TEXT,' +
      '  customer_ref TEXT,' +
      '  received_at TEXT NOT NULL' +
      ');' +
      'CREATE TABLE IF NOT EXISTS subscriptions (' +
      '  provider TEXT NOT NULL,' +
      '  subscription_ref TEXT NOT NULL,' +
      '  status TEXT NOT NULL,' +
      '  customer_ref TEXT,' +
      '  plan_ref TEXT,' +
      '  updated_at TEXT NOT NULL,' +
      '  PRIMARY KEY (provider, subscription_ref)' +
      ');' +
      'CREATE INDEX IF NOT EXISTS idx_billing_events_received ON billing_events(received_at);'
    );
    return db;
  } catch {
    return null;
  }
}

export interface BillingEventInput {
  eventKey: string;
  provider: string;
  eventType: string;
  subscriptionRef?: string | null;
  customerRef?: string | null;
}

export interface BillingEventResult {
  stored: boolean;
  duplicate: boolean;
}

export function recordBillingEvent(input: BillingEventInput): BillingEventResult {
  const d = openDb();
  if (!d) return { stored: false, duplicate: false };
  try {
    const result = d.prepare(
      'INSERT OR IGNORE INTO billing_events ' +
      '(event_key, provider, event_type, subscription_ref, customer_ref, received_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      input.eventKey,
      input.provider,
      input.eventType,
      input.subscriptionRef || null,
      input.customerRef || null,
      new Date().toISOString()
    );
    const changes = Number(result?.changes ?? 0);
    return { stored: changes > 0, duplicate: changes === 0 };
  } catch {
    return { stored: false, duplicate: false };
  }
}

export function applySubscriptionTransition(input: {
  provider: string;
  subscriptionRef: string;
  status: string;
  customerRef?: string | null;
  planRef?: string | null;
}): boolean {
  const d = openDb();
  if (!d) return false;
  try {
    d.prepare(
      'INSERT INTO subscriptions (provider, subscription_ref, status, customer_ref, plan_ref, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)' +
      ' ON CONFLICT(provider, subscription_ref) DO UPDATE SET' +
      ' status = excluded.status,' +
      ' customer_ref = COALESCE(excluded.customer_ref, subscriptions.customer_ref),' +
      ' plan_ref = COALESCE(excluded.plan_ref, subscriptions.plan_ref),' +
      ' updated_at = excluded.updated_at'
    ).run(
      input.provider,
      input.subscriptionRef,
      input.status,
      input.customerRef || null,
      input.planRef || null,
      new Date().toISOString()
    );
    return true;
  } catch {
    return false;
  }
}

export function getSubscription(provider: string, subscriptionRef: string): {
  provider: string;
  subscriptionRef: string;
  status: string;
  customerRef?: string;
  planRef?: string;
} | null {
  const d = openDb();
  if (!d) return null;
  try {
    const row = d.prepare(
      'SELECT provider, subscription_ref, status, customer_ref, plan_ref FROM subscriptions WHERE provider = ? AND subscription_ref = ?'
    ).get(provider, subscriptionRef) as any;
    if (!row) return null;
    return {
      provider: row.provider,
      subscriptionRef: row.subscription_ref,
      status: row.status,
      customerRef: row.customer_ref || undefined,
      planRef: row.plan_ref || undefined,
    };
  } catch {
    return null;
  }
}

export function getBillingEventCount(): number {
  const d = openDb();
  if (!d) return 0;
  try {
    return Number((d.prepare('SELECT count(*) as c FROM billing_events').get() as any)?.c || 0);
  } catch {
    return 0;
  }
}
