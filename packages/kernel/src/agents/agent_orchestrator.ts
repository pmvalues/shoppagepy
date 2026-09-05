/**
 * Autonomous Retail Intelligence Agent Orchestrator
 *
 * Coordinates the full end-to-end data pipeline across South Africa:
 * 1. Sourcing & Ingestion (Raw retail offers & circulars)
 * 2. Product Cleansing & Normalization (De-noising, Brand Casing, Specs, Prices, Packshots)
 * 3. Link Integrity & 404 Verification (HEAD/GET probes, Soft-404 detection, Canonical Redirects)
 * 4. Change Detection & Differential Audit (Price drops, OOS status, Restocks)
 * 5. Database Upsert & Dead Link Retirement (SQLite & In-Memory Stores)
 */

import { DiscoveredOffer } from '@shoppage/contracts';
import { DiscoveredOffersStore } from '../repository/discovered_offers_store';
import {
  ProductCleansingAgent,
  RawProductOffer,
  CleansedProductOffer,
} from './product_cleansing_agent';
import {
  LinkVerifierAgent,
  VerificationResult,
  LinkVerifierOptions,
} from './link_verifier_agent';
import {
  ChangeDetectorAgent,
  ProductChangeEvent,
} from './change_detector_agent';
import { MerchantSourcingAgent } from './merchant_sourcing_agent';
import { RetailNewsAgent } from './retail_news_agent';

export interface OrchestratorRunOptions {
  verifyUrls?: boolean;
  detectDiffChanges?: boolean;
  persistToDatabase?: boolean;
  retireDeadLinks?: boolean;
  dryRun?: boolean;
  verifierOptions?: LinkVerifierOptions;
}

export interface OrchestrationTelemetry {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalIngested: number;
  cleansedCount: number;
  verifiedLiveCount: number;
  dead404sCount: number;
  soft404sCount: number;
  redirectedCount: number;
  priceDropsCount: number;
  priceIncreasesCount: number;
  stockChangesCount: number;
  persistedCount: number;
  retiredCount: number;
  changeEvents: ProductChangeEvent[];
  deadLinkUrls: string[];
}

export class AutonomousRetailAgentOrchestrator {
  private cleansingAgent: ProductCleansingAgent;
  private verifierAgent: LinkVerifierAgent;
  private changeDetector: ChangeDetectorAgent;
  private merchantAgent: MerchantSourcingAgent;
  private newsAgent: RetailNewsAgent;

  constructor(options: {
    verifierOptions?: LinkVerifierOptions;
  } = {}) {
    this.cleansingAgent = new ProductCleansingAgent();
    this.verifierAgent = new LinkVerifierAgent(options.verifierOptions);
    this.changeDetector = new ChangeDetectorAgent();
    this.merchantAgent = new MerchantSourcingAgent();
    this.newsAgent = new RetailNewsAgent();
  }

  public getCleansingAgent(): ProductCleansingAgent {
    return this.cleansingAgent;
  }

  public getVerifierAgent(): LinkVerifierAgent {
    return this.verifierAgent;
  }

  public getChangeDetector(): ChangeDetectorAgent {
    return this.changeDetector;
  }

  public getMerchantAgent(): MerchantSourcingAgent {
    return this.merchantAgent;
  }

  public getNewsAgent(): RetailNewsAgent {
    return this.newsAgent;
  }

  /**
   * Processes a batch of raw product offers through the entire autonomous agent pipeline
   */
  public async processBatch(
    rawOffers: RawProductOffer[],
    options: OrchestratorRunOptions = {},
  ): Promise<OrchestrationTelemetry> {
    const startedAtTime = Date.now();
    const startedAt = new Date(startedAtTime).toISOString();

    const verifyUrls = options.verifyUrls ?? true;
    const detectDiffChanges = options.detectDiffChanges ?? true;
    const persistToDatabase = options.persistToDatabase ?? true;
    const retireDeadLinks = options.retireDeadLinks ?? true;
    const dryRun = options.dryRun ?? false;

    // 1. Cleansing & Normalization
    const cleansed = this.cleansingAgent.cleanBatch(rawOffers);

    // 2. Link Integrity Verification
    const urlMap = new Map<string, VerificationResult>();
    const deadLinkUrls: string[] = [];
    let liveCount = 0;
    let dead404Count = 0;
    let soft404Count = 0;
    let redirectedCount = 0;

    if (verifyUrls) {
      const distinctUrls = Array.from(new Set(cleansed.map((c) => c.sourceUrl).filter(Boolean)));
      const verifications = await this.verifierAgent.verifyBatch(distinctUrls);

      for (const v of verifications) {
        urlMap.set(v.url, v);
        urlMap.set(v.cleanUrl, v);

        if (v.status === 'DEAD_404') {
          dead404Count++;
          deadLinkUrls.push(v.url);
        } else if (v.status === 'SOFT_404') {
          soft404Count++;
          deadLinkUrls.push(v.url);
        } else if (v.status === 'REDIRECTED') {
          redirectedCount++;
          liveCount++;
        } else if (v.status === 'LIVE') {
          liveCount++;
        }
      }
    } else {
      liveCount = cleansed.length;
    }

    // 3. Change Detection & Differential Audit
    const allChangeEvents: ProductChangeEvent[] = [];
    let priceDropsCount = 0;
    let priceIncreasesCount = 0;
    let stockChangesCount = 0;

    const validOffersToPersist: DiscoveredOffer[] = [];
    const deadOfferIdsToRetire: string[] = [];

    for (const item of cleansed) {
      const verification = urlMap.get(item.sourceUrl);
      const isDead = verification && (verification.status === 'DEAD_404' || verification.status === 'SOFT_404');

      if (isDead) {
        deadOfferIdsToRetire.push(item.id);
        continue;
      }

      // If URL redirected, update canonical destination
      const finalUrl =
        verification?.status === 'REDIRECTED' && verification.finalDestinationUrl
          ? verification.finalDestinationUrl
          : item.sourceUrl;

      // Check existing offer in store for change detection
      if (detectDiffChanges) {
        const existingOffers = DiscoveredOffersStore.getOffersForProduct(item.masterProductRef).discovered;
        const matchingExisting = existingOffers.find(
          (o) => o.id === item.id || o.merchantName === item.merchantName,
        );

        if (matchingExisting) {
          const changes = this.changeDetector.detectChanges(matchingExisting, {
            id: item.id,
            masterProductRef: item.masterProductRef,
            productTitle: item.cleanTitle,
            merchantName: item.merchantName,
            priceZar: item.priceZar,
            availabilityText: item.availabilityText,
            sourceUrl: finalUrl,
            imageUrl: item.imageUrl,
          });

          for (const ch of changes) {
            allChangeEvents.push(ch);
            if (ch.changeType === 'PRICE_DROP') priceDropsCount++;
            if (ch.changeType === 'PRICE_INCREASE') priceIncreasesCount++;
            if (ch.changeType === 'OUT_OF_STOCK' || ch.changeType === 'RESTOCKED') stockChangesCount++;
          }
        }
      }

      const discOffer: DiscoveredOffer = {
        id: item.id,
        masterProductRef: item.masterProductRef,
        merchantName: item.merchantName,
        sourceWebsite: item.sourceWebsite,
        sourceUrl: finalUrl,
        discoveredPrice: {
          amount: item.priceZar,
          currency: 'ZAR',
          rawPriceText: item.rawPriceText,
        },
        availabilityText: item.availabilityText,
        discoverySource: 'retailer_web_sweep',
        confidenceScore: 0.98,
        discoveredAt: new Date().toISOString(),
        status: 'discovered',
        locationHint: item.locationHint,
        sku: item.sku,
        oldPriceZar: item.oldPriceZar,
        discountPct: item.discountPct,
        dealBadge: item.dealBadge,
        productTitle: item.cleanTitle,
        brand: item.canonicalBrand,
        category: item.category,
        imageUrl: item.imageUrl,
      };

      validOffersToPersist.push(discOffer);
    }

    // 4. Database Persistence & Dead Link Retirement
    let persistedCount = 0;
    let retiredCount = 0;

    if (persistToDatabase && !dryRun) {
      for (const offer of validOffersToPersist) {
        const success = DiscoveredOffersStore.upsertOfferRecord(offer);
        if (success) persistedCount++;
      }

      if (retireDeadLinks) {
        for (const deadId of deadOfferIdsToRetire) {
          const retired = DiscoveredOffersStore.retireDeadOfferRecord(deadId);
          if (retired) retiredCount++;
        }
      }
    } else if (dryRun) {
      persistedCount = validOffersToPersist.length;
      retiredCount = deadOfferIdsToRetire.length;
    }

    const completedAtTime = Date.now();
    const completedAt = new Date(completedAtTime).toISOString();

    return {
      startedAt,
      completedAt,
      durationMs: completedAtTime - startedAtTime,
      totalIngested: rawOffers.length,
      cleansedCount: cleansed.length,
      verifiedLiveCount: liveCount,
      dead404sCount: dead404Count,
      soft404sCount: soft404Count,
      redirectedCount: redirectedCount,
      priceDropsCount,
      priceIncreasesCount,
      stockChangesCount,
      persistedCount,
      retiredCount,
      changeEvents: allChangeEvents,
      deadLinkUrls,
    };
  }
}
