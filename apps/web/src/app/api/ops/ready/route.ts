import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateEnvironment } from '@/server/env-check';
import { getBillingEventCount } from '@/server/billing-store';
import { getLedgerStats } from '@/server/action-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Readiness probe (/api/ops/ready) — WS-3.3.
 *
 * Unlike /api/ops/health (liveness), this returns 503 when the deployment is
 * fatally misconfigured (the same fatal checks env-check enforces at boot) so
 * orchestration can hold traffic away from a broken instance.
 */
export async function GET() {
  const issues = validateEnvironment();
  const fatalIssues = issues.filter((i) => i.severity === 'fatal');

  const dataDir = resolve(process.cwd(), 'shoppage-commerce-intelligence-foundation', 'data', 'study');
  const datasets = [
    'sa_discovered_offers.sqlite',
    'sa_malls_and_shopping_centres.sqlite',
    'sa_nationwide_merchants.sqlite',
    'global_food_master_products.sqlite',
  ].map((file) => ({ file, present: existsSync(resolve(dataDir, file)) }));

  let ledger: { totalEvents: number } | null = null;
  try {
    ledger = getLedgerStats();
  } catch {
    ledger = null;
  }

  let billingEventCount: number | null = null;
  try {
    billingEventCount = getBillingEventCount();
  } catch {
    billingEventCount = null;
  }

  const ready = fatalIssues.length === 0;

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      fatalIssues,
      checks: {
        datasets,
        datasetsPresent: datasets.filter((d) => d.present).length,
        ledger: ledger ? { reachable: true, totalEvents: ledger.totalEvents } : { reachable: false },
        billingStore: billingEventCount !== null ? { reachable: true } : { reachable: false },
      },
    },
    { status: ready ? 200 : 503 }
  );
}
