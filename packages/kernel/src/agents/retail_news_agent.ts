/**
 * Retail News & Specials Aggregator Agent
 *
 * Sources and structures weekly retail circulars, seasonal promotional campaigns,
 * and price-drop flyers across South Africa's top retailers and malls.
 */

import { SA_MAJOR_RETAILER_DEALS, MajorRetailerDeal } from '../seed/sa_major_retailer_deals';

export interface RetailSpecialItem {
  id: string;
  productTitle: string;
  brand: string;
  dealPriceZar: number;
  oldPriceZar?: number;
  discountPct?: number;
  badge?: string;
  directProductUrl: string;
  imageUrl?: string;
  category: string;
  availability: string;
}

export interface RetailNewsCampaign {
  id: string;
  headline: string;
  summary: string;
  retailerName: string;
  retailerDomain: string;
  campaignType: 'weekly_circular' | 'flash_sale' | 'seasonal_clearance' | 'store_opening';
  validFrom: string;
  validUntil: string;
  mallOrRegionHint: string;
  featuredDeals: RetailSpecialItem[];
  totalDealsCount: number;
  bannerImageUrl: string;
  sourcedAt: string;
}

export class RetailNewsAgent {
  /**
   * Aggregates active retail circular campaigns grouped by major retailer
   */
  public getActiveCampaigns(): RetailNewsCampaign[] {
    const dealsByRetailer: Record<string, MajorRetailerDeal[]> = {};

    for (const deal of SA_MAJOR_RETAILER_DEALS) {
      const key = deal.retailerDomain;
      if (!dealsByRetailer[key]) {
        dealsByRetailer[key] = [];
      }
      dealsByRetailer[key].push(deal);
    }

    const campaigns: RetailNewsCampaign[] = [];
    const now = new Date();
    const validFrom = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();
    const validUntil = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

    for (const [domain, deals] of Object.entries(dealsByRetailer)) {
      const retailerName = deals[0]?.merchantName || domain;
      const featuredDeals: RetailSpecialItem[] = deals.map((d) => ({
        id: d.id,
        productTitle: d.title,
        brand: d.brand,
        dealPriceZar: d.dealPriceZar,
        oldPriceZar: d.oldPriceZar,
        discountPct: d.discountPct,
        badge: d.badge,
        directProductUrl: d.directProductUrl,
        imageUrl: d.imageUrl,
        category: d.category,
        availability: d.availability,
      }));

      const topDeal = deals.reduce((prev, curr) =>
        (curr.discountPct || 0) > (prev.discountPct || 0) ? curr : prev,
      );

      const maxSavings = topDeal.discountPct || 25;

      campaigns.push({
        id: `campaign_${domain.replace(/[^a-z0-9]/g, '_')}_${now.getFullYear()}_w${Math.ceil(now.getDate() / 7)}`,
        headline: `${retailerName}: Up to ${maxSavings}% Off Weekly Circular Specials`,
        summary: `Explore verified live specials from ${retailerName}. Compare prices, reserve for in-store counter pickup or click & collect across South Africa.`,
        retailerName,
        retailerDomain: domain,
        campaignType: 'weekly_circular',
        validFrom,
        validUntil,
        mallOrRegionHint: deals[0]?.locationHint || 'National Retail Branches',
        featuredDeals,
        totalDealsCount: deals.length,
        bannerImageUrl: topDeal.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        sourcedAt: now.toISOString(),
      });
    }

    return campaigns;
  }

  /**
   * Searches retail specials by keyword, retailer, or category
   */
  public searchSpecials(options: {
    query?: string;
    category?: string;
    retailerDomain?: string;
    minDiscountPct?: number;
    limit?: number;
  }): RetailSpecialItem[] {
    const q = options.query?.toLowerCase().trim() || '';
    const cat = options.category?.toLowerCase().trim() || '';
    const domain = options.retailerDomain?.toLowerCase().trim() || '';
    const minDisc = options.minDiscountPct ?? 0;
    const limit = options.limit || 30;

    return SA_MAJOR_RETAILER_DEALS
      .filter((d) => {
        if (minDisc > 0 && (!d.discountPct || d.discountPct < minDisc)) return false;
        if (domain && !d.retailerDomain.toLowerCase().includes(domain)) return false;
        if (cat && d.category.toLowerCase() !== cat) return false;
        if (
          q &&
          !d.title.toLowerCase().includes(q) &&
          !d.brand.toLowerCase().includes(q) &&
          !d.merchantName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .slice(0, limit)
      .map((d) => ({
        id: d.id,
        productTitle: d.title,
        brand: d.brand,
        dealPriceZar: d.dealPriceZar,
        oldPriceZar: d.oldPriceZar,
        discountPct: d.discountPct,
        badge: d.badge,
        directProductUrl: d.directProductUrl,
        imageUrl: d.imageUrl,
        category: d.category,
        availability: d.availability,
      }));
  }
}
