import { NextRequest, NextResponse } from 'next/server';
import {
  AutonomousRetailAgentOrchestrator,
  RetailNewsAgent,
  DiscoveredOffersStore,
} from '@shoppage/kernel';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ops/agents
 * Telemetry and health status for the autonomous retail intelligence agent suite
 */
export async function GET() {
  try {
    const totalOffers = DiscoveredOffersStore.getTotalDiscoveredOffersCount();
    const newsAgent = new RetailNewsAgent();
    const activeCampaigns = newsAgent.getActiveCampaigns();

    return NextResponse.json({
      status: 'healthy',
      agentSuite: {
        name: 'Shoppage Autonomous Retail Intelligence Pipeline',
        countryScope: 'ZA',
        currency: 'ZAR',
        agents: [
          {
            id: 'product_cleansing_agent',
            role: 'De-noises clickbait titles, standardizes brands, extracts specs, sanitizes ZAR prices & images',
            status: 'active',
          },
          {
            id: 'link_verifier_agent',
            role: 'Validates live HTTP links, strips tracking params, detects 404s/soft-404s, tracks redirects',
            status: 'active',
          },
          {
            id: 'change_detector_agent',
            role: 'Monitors differential price drops, price increases, and stock availability shifts',
            status: 'active',
          },
          {
            id: 'merchant_sourcing_agent',
            role: 'Geofences merchants & stores across South Africa 3,296 malls and trade corridors',
            status: 'active',
          },
          {
            id: 'retail_news_agent',
            role: 'Sources weekly circulars, deals, flyers, and specials from top SA chains',
            status: 'active',
          },
        ],
        metrics: {
          totalDiscoveredOffers: totalOffers,
          activeCircularCampaignsCount: activeCampaigns.length,
          activeCampaigns: activeCampaigns.map((c) => ({
            id: c.id,
            retailer: c.retailerName,
            headline: c.headline,
            dealsCount: c.totalDealsCount,
          })),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve agent status', details: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ops/agents
 * Triggers an on-demand sweep cycle through the autonomous retail agent orchestrator
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body.batchSize === 'number' ? Math.min(body.batchSize, 50) : 15;
    const isDryRun = body.dryRun ?? false;
    const verifyUrls = body.verifyLinks ?? true;

    const catalogOffers = DiscoveredOffersStore.getDiscoveredCatalogOffers(batchSize);

    const rawFeeds = catalogOffers.map((o) => ({
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

    const orchestrator = new AutonomousRetailAgentOrchestrator();
    const telemetry = await orchestrator.processBatch(rawFeeds, {
      dryRun: isDryRun,
      verifyUrls,
      detectDiffChanges: true,
      persistToDatabase: !isDryRun,
      retireDeadLinks: !isDryRun,
    });

    return NextResponse.json({
      success: true,
      telemetry,
      meta: {
        batchSize,
        dryRun: isDryRun,
        verifyUrls,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Agent execution failed', details: error.message },
      { status: 500 },
    );
  }
}
