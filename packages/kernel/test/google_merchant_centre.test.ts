import { describe, it, expect } from 'vitest';
import {
  GoogleMerchantCenterService,
  GoogleBusinessProfileService,
  GoogleSearchConsoleService,
  GoogleTrendsService,
  YouTubeShortsCommerceService,
  ShoppageMerchantCentreService,
  SA_FLAGSHIP_MERCHANTS,
} from '../src/index';

describe('Shoppage Merchant Centre — Google Ecosystem & Video Commerce Suite', () => {
  const merchantId = 'loc_sunpower_crownmines';

  it('generates valid Google Shopping RSS 2.0 / XML feed with standard Google tags', () => {
    const xml = GoogleMerchantCenterService.generateGoogleShoppingFeedXml(merchantId);

    expect(xml).toBeDefined();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">');
    expect(xml).toContain('<g:id>');
    expect(xml).toContain('<g:title>');
    expect(xml).toContain('<g:price>');
    expect(xml).toContain('<g:availability>in_stock</g:availability>');
    expect(xml).toContain('<g:brand>');
    expect(xml).toContain('<g:gtin>');
    expect(xml).toContain('ZAR');
  });

  it('generates Local Inventory Ads (LIA) feed for physical mall stalls', () => {
    const lia = GoogleMerchantCenterService.getLocalInventoryFeed(merchantId);

    expect(lia).toBeDefined();
    expect(lia.length).toBeGreaterThan(0);
    expect(lia[0].storeCode).toBe(merchantId);
    expect(lia[0].availability).toBe('in_stock');
    expect(lia[0].pickupMethod).toBe('in_store');
  });

  it('retrieves Google Business Profile status, reviews stream, and drafts AI replies', () => {
    const status = GoogleBusinessProfileService.getProfileStatus(merchantId);

    expect(status.businessName).toBeDefined();
    expect(status.isVerified).toBe(true);
    expect(status.averageRating).toBeGreaterThanOrEqual(4.0);
    expect(status.recentReviews.length).toBeGreaterThan(0);

    const review = status.recentReviews[0];
    const reply = GoogleBusinessProfileService.draftReviewReply(review, status.businessName);
    expect(reply).toBeDefined();
    expect(reply).toContain(review.reviewerName);
  });

  it('generates Google Search Console local SEO keyword ranks and Schema.org rich snippets', () => {
    const report = GoogleSearchConsoleService.getReport(merchantId);

    expect(report.totalOrganicClicks).toBeGreaterThan(0);
    expect(report.totalImpressions).toBeGreaterThan(0);
    expect(report.topQueries.length).toBeGreaterThan(0);

    const schema: any = GoogleSearchConsoleService.generateJsonLdSchema(merchantId);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph'][0]['@type']).toBe('LocalBusiness');
  });

  it('tracks Google Trends demand surges in South Africa and detects stock gap opportunities', () => {
    const trends = GoogleTrendsService.getTrendingDemandInSouthAfrica('Gauteng');

    expect(trends.length).toBeGreaterThan(0);
    expect(trends[0].growthPercentLast30d).toBeGreaterThan(0);

    const alerts = GoogleTrendsService.getMerchantOpportunityAlerts(merchantId);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].searchTrendGrowth).toBeGreaterThan(0);
  });

  it('generates YouTube Shorts video commerce campaigns with direct WhatsApp attribution', () => {
    const shorts = YouTubeShortsCommerceService.getShortsCampaignsForMerchant(merchantId);

    expect(shorts.length).toBeGreaterThan(0);
    expect(shorts[0].shortTitle).toBeDefined();
    expect(shorts[0].scriptStoryboard.length).toBeGreaterThan(0);
    expect(shorts[0].ctaDescription).toContain('wa.me');
  });

  it('orchestrates complete unified Merchant Centre dashboard', () => {
    const dashboard = ShoppageMerchantCentreService.getUnifiedDashboard(merchantId);

    expect(dashboard.overview.trustPassportScore).toBeGreaterThan(0);
    expect(dashboard.googleMerchantCenter.feedUrl).toBeDefined();
    expect(dashboard.googleBusinessProfile).toBeDefined();
    expect(dashboard.googleSearchConsole).toBeDefined();
    expect(dashboard.googleTrends).toBeDefined();
    expect(dashboard.youtubeShorts).toBeDefined();
    expect(dashboard.qrCodeUrl).toMatch(/^https:\/\/api\.qrserver\.com/);
  });
});
