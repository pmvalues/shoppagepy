#!/usr/bin/env node

/**
 * Shoppage Autonomous Retail Intelligence Agent Runner
 *
 * Runs scheduled or on-demand sweeps across South African retail catalogs:
 * - Product Sourcing & Data Cleansing
 * - Link Verification & 404 Elimination
 * - Differential Price & Stock Change Detection
 * - Database Upsert & Typesense Indexing
 *
 * Usage:
 *   node scripts/agents/run_retail_agents.mjs [options]
 *
 * Options:
 *   --dry-run          Simulate run without writing to SQLite
 *   --verify-links     Perform HTTP link integrity checks
 *   --batch-size=N     Batch processing size (default: 20)
 *   --category=CAT     Filter by category (solar_energy, hardware, electronics, etc.)
 */

import {
  AutonomousRetailAgentOrchestrator,
  RetailNewsAgent,
  DiscoveredOffersStore,
} from '../../packages/kernel/dist/index.js';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipLinkCheck = args.includes('--skip-verify');
const batchSizeArg = args.find((a) => a.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 25;

console.log('================================================================');
console.log('🤖 SHOPPAGE AUTONOMOUS RETAIL INTELLIGENCE AGENTS');
console.log('   Country Scope: South Africa (ZAR) · B2C Consumer Commerce');
console.log(`   Mode: ${isDryRun ? 'DRY RUN (Read Only)' : 'LIVE SYNC (Persist to SQLite)'}`);
console.log(`   Link Verification: ${skipLinkCheck ? 'SKIPPED' : 'ENABLED (HTTP HEAD/GET probes)'}`);
console.log(`   Batch Size: ${batchSize}`);
console.log('================================================================\n');

async function main() {
  const orchestrator = new AutonomousRetailAgentOrchestrator();
  const newsAgent = new RetailNewsAgent();

  console.log('📦 Step 1: Loading Discovered Catalog Offers from Store...');
  const existingCatalog = DiscoveredOffersStore.getDiscoveredCatalogOffers(batchSize);
  console.log(`   Found ${existingCatalog.length} catalog offers in queue.\n`);

  // Transform into RawProductOffer format
  const rawFeeds = existingCatalog.map((o) => ({
    id: o.id,
    masterProductRef: o.masterProductRef,
    title: o.productTitle || o.masterProductRef,
    brand: o.brand,
    category: o.category || 'general',
    price: o.discoveredPrice.amount,
    oldPrice: o.oldPriceZar,
    imageUrl: o.imageUrl,
    merchantName: o.merchantName,
    sourceWebsite: o.sourceWebsite,
    sourceUrl: o.sourceUrl,
    locationHint: o.locationHint,
    availabilityText: o.availabilityText,
    sku: o.sku,
  }));

  console.log('⚡ Step 2: Executing Autonomous Pipeline (Cleansing + Verification + Change Detection)...');
  const telemetry = await orchestrator.processBatch(rawFeeds, {
    dryRun: isDryRun,
    verifyUrls: !skipLinkCheck,
    detectDiffChanges: true,
    persistToDatabase: !isDryRun,
    retireDeadLinks: !isDryRun,
  });

  console.log('\n📊 PIPELINE EXECUTION TELEMETRY:');
  console.log(`   • Total Ingested:        ${telemetry.totalIngested}`);
  console.log(`   • Data Cleansed:         ${telemetry.cleansedCount}`);
  console.log(`   • Verified Live (200 OK):${telemetry.verifiedLiveCount}`);
  console.log(`   • Dead 404 Links:        ${telemetry.dead404sCount}`);
  console.log(`   • Soft 404 Links:        ${telemetry.soft404sCount}`);
  console.log(`   • Redirects Resolved:    ${telemetry.redirectedCount}`);
  console.log(`   • Price Drops Detected:  ${telemetry.priceDropsCount}`);
  console.log(`   • Stock Shifts Detected: ${telemetry.stockChangesCount}`);
  console.log(`   • Persisted to DB:       ${telemetry.persistedCount}`);
  console.log(`   • Retired 404 Links:     ${telemetry.retiredCount}`);
  console.log(`   • Duration:              ${telemetry.durationMs}ms`);

  if (telemetry.changeEvents.length > 0) {
    console.log('\n🔍 DETECTED PRODUCT & PRICE CHANGES:');
    for (const ch of telemetry.changeEvents) {
      console.log(`   [${ch.changeType}] ${ch.summary}`);
    }
  }

  if (telemetry.deadLinkUrls.length > 0) {
    console.log('\n⚠️ RETIRED DEAD 404 LINKS:');
    for (const url of telemetry.deadLinkUrls) {
      console.log(`   ❌ ${url}`);
    }
  }

  console.log('\n📰 Step 3: Sourcing Retail Specials & Circulars...');
  const activeCampaigns = newsAgent.getActiveCampaigns();
  console.log(`   Sourced ${activeCampaigns.length} active retail circular campaigns:`);
  for (const c of activeCampaigns) {
    console.log(`   • [${c.retailerName}] ${c.headline} (${c.totalDealsCount} deals)`);
  }

  console.log('\n✅ Retail Intelligence Sweep Finished Successfully.');
}

main().catch((err) => {
  console.error('❌ Agent Sweep Encountered Error:', err);
  process.exit(1);
});
