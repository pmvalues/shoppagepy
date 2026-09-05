import { NextResponse } from 'next/server';
import { getLedgerStats } from '@/server/action-ledger';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health & readiness endpoint (/api/ops/health).
 *
 * Exposes process-level health plus ledger/dataset presence so deployment
 * orchestration (Dokploy healthchecks, probe monitoring) has a real signal
 * instead of only "process is up".
 */
export async function GET() {
  const dataDir = resolve(process.cwd(), 'shoppage-commerce-intelligence-foundation', 'data', 'study');
  const datasets = [
    'sa_discovered_offers.sqlite',
    'sa_malls_and_shopping_centres.sqlite',
    'sa_nationwide_merchants.sqlite',
    'global_food_master_products.sqlite',
  ].map((f) => ({ file: f, present: existsSync(resolve(dataDir, f)) }));

  let ledger;
  try {
    ledger = getLedgerStats();
  } catch {
    ledger = { totalEvents: 0, byAction: {}, byMerchant: {} };
  }

  return NextResponse.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    ledger,
    datasets,
  });
}
