import { mkdirSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

/**
 * Referral lead store — disk-authoritative.
 *
 * Shoppage is a referral engine, not a commerce/cart platform. The unit of
 * value here is a qualified lead: a buyer expressed intent for a product or
 * need, Shoppage routed that intent to a merchant (WhatsApp / call /
 * directions / quote), and the merchant owns the transaction. The lead record
 * tracks routing + outcome evidence only — no order numbers, no invoicing, no
 * payment custody.
 *
 * IMPORTANT: reads must always hit disk. next start runs route handlers in
 * separate worker processes, so a per-process in-memory cache returns stale
 * (or empty) data across requests. SQLite is the single source of truth.
 */

export interface ReferralLead {
  id: string;
  merchantId: string;
  merchantName?: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  productSummary: string;
  intentAction: 'whatsapp' | 'call' | 'directions' | 'quote' | 'rfq';
  source: 'trade_inquiry' | 'merchant_page' | 'search' | 'short' | 'market' | 'rfq';
  status: 'new' | 'responded' | 'resolved' | 'closed' | 'lost';
  eventIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const LEAD_DIR = pathResolve(
  process.cwd(),
  'shoppage-commerce-intelligence-foundation',
  'data',
  'study'
);
const LEAD_DB = pathResolve(LEAD_DIR, 'sa_referral_leads.sqlite');

let db: any = null;

function openDb(): any | null {
  if (db) return db;
  try {
    mkdirSync(LEAD_DIR, { recursive: true });
    const req = eval('require');
    const { DatabaseSync } = req('node:sqlite');
    db = new DatabaseSync(LEAD_DB, { open: true });
    db.exec(
      'CREATE TABLE IF NOT EXISTS referral_leads (' +
      '  id TEXT PRIMARY KEY,' +
      '  merchant_id TEXT NOT NULL,' +
      '  merchant_name TEXT,' +
      '  buyer_name TEXT NOT NULL,' +
      '  buyer_phone TEXT NOT NULL,' +
      '  buyer_email TEXT,' +
      '  product_summary TEXT NOT NULL,' +
      '  intent_action TEXT NOT NULL,' +
      '  source TEXT NOT NULL,' +
      '  status TEXT NOT NULL,' +
      '  event_ids TEXT,' +
      '  notes TEXT,' +
      '  created_at TEXT NOT NULL,' +
      '  updated_at TEXT NOT NULL' +
      ');' +
      'CREATE INDEX IF NOT EXISTS idx_leads_merchant ON referral_leads(merchant_id, created_at);' +
      'CREATE INDEX IF NOT EXISTS idx_leads_status ON referral_leads(status);'
    );
    return db;
  } catch {
    return null;
  }
}

function rowToLead(row: any): ReferralLead {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name || undefined,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email || undefined,
    productSummary: row.product_summary,
    intentAction: row.intent_action,
    source: row.source,
    status: row.status,
    eventIds: row.event_ids ? JSON.parse(row.event_ids) : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function persist(lead: ReferralLead): boolean {
  const d = openDb();
  if (!d) return false;
  try {
    d.prepare(
      'INSERT OR REPLACE INTO referral_leads ' +
      '(id, merchant_id, merchant_name, buyer_name, buyer_phone, buyer_email,' +
      ' product_summary, intent_action, source, status, event_ids, notes, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      lead.id,
      lead.merchantId,
      lead.merchantName || null,
      lead.buyerName,
      lead.buyerPhone,
      lead.buyerEmail || null,
      lead.productSummary,
      lead.intentAction,
      lead.source,
      lead.status,
      lead.eventIds ? JSON.stringify(lead.eventIds) : null,
      lead.notes || null,
      lead.createdAt,
      lead.updatedAt
    );
    return true;
  } catch {
    return false;
  }
}

export function createReferralLead(input: Omit<ReferralLead, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ReferralLead {
  const now = new Date().toISOString();
  const lead: ReferralLead = {
    id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    ...input,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };
  persist(lead);
  return lead;
}

export function getLeadsByMerchant(merchantId: string): ReferralLead[] {
  const d = openDb();
  if (!d) return [];
  try {
    const rows = d.prepare(
      'SELECT * FROM referral_leads WHERE merchant_id = ? ORDER BY created_at DESC'
    ).all(merchantId);
    return (rows as any[]).map(rowToLead);
  } catch {
    return [];
  }
}

export function getLeadById(id: string): ReferralLead | null {
  const d = openDb();
  if (!d) return null;
  try {
    const row = d.prepare('SELECT * FROM referral_leads WHERE id = ?').get(id) as any;
    return row ? rowToLead(row) : null;
  } catch {
    return null;
  }
}

export function updateLeadStatus(id: string, status: ReferralLead['status'], eventId?: string): ReferralLead | null {
  const lead = getLeadById(id);
  if (!lead) return null;
  lead.status = status;
  if (eventId) {
    lead.eventIds = lead.eventIds ? [...lead.eventIds, eventId] : [eventId];
  }
  lead.updatedAt = new Date().toISOString();
  persist(lead);
  return lead;
}
