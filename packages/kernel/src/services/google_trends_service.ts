import { MasterProduct } from '@shoppage/contracts';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '../seed/sa_flagship_seed';

export interface TrendingTopic {
  id: string;
  keyword: string;
  province: string;
  demandIndex: number; // 0-100 relative search volume
  growthPercentLast30d: number;
  category: string;
  relatedMasterProductId?: string;
  matchedProductTitle?: string;
}

export interface StockOpportunityAlert {
  id: string;
  masterProductId: string;
  productTitle: string;
  brand: string;
  searchTrendGrowth: number;
  estimatedMonthlyBuyerQueries: number;
  averageCompetitorPriceZar: number;
  recommendedAction: string;
  urgency: 'high' | 'medium' | 'opportunity';
}

/**
 * Google Trends & Local Demand Intelligence Service
 * Monitors South African consumer search spikes and provides stock opportunity gap analysis for merchants.
 */
export class GoogleTrendsService {
  public static getTrendingDemandInSouthAfrica(province = 'Gauteng'): TrendingTopic[] {
    return [
      {
        id: 'trend_01',
        keyword: '5kw hybrid inverter price south africa',
        province,
        demandIndex: 96,
        growthPercentLast30d: 145,
        category: 'solar_energy',
        relatedMasterProductId: 'var_deye_5kw_hybrid',
        matchedProductTitle: 'Deye 5kW 48V Single Phase Hybrid Inverter',
      },
      {
        id: 'trend_02',
        keyword: 'lithium battery 5.12kwh 48v',
        province,
        demandIndex: 91,
        growthPercentLast30d: 180,
        category: 'solar_energy',
        relatedMasterProductId: 'var_dyness_5kwh_battery',
        matchedProductTitle: 'Dyness BX51100 5.12kWh 48V Lithium-ion Battery',
      },
      {
        id: 'trend_03',
        keyword: 'sunsynk 8kw inverter with battery',
        province,
        demandIndex: 88,
        growthPercentLast30d: 95,
        category: 'solar_energy',
        relatedMasterProductId: 'var_sunsynk_8kw_hybrid',
        matchedProductTitle: 'Sunsynk 8kW 48V Single Phase Hybrid Inverter',
      },
      {
        id: 'trend_04',
        keyword: '550w solar panels wholesale',
        province,
        demandIndex: 82,
        growthPercentLast30d: 110,
        category: 'solar_energy',
        relatedMasterProductId: 'var_ja_solar_550w',
        matchedProductTitle: 'JA Solar 550W Mono Deep Blue 3.0 PV Solar Panel',
      },
      {
        id: 'trend_05',
        keyword: 'loadshedding power backup for home office',
        province,
        demandIndex: 85,
        growthPercentLast30d: 210,
        category: 'solar_energy',
      },
    ];
  }

  /**
   * Identifies high-demand products trending in the merchant's area that they haven't yet confirmed stock for
   */
  public static getMerchantOpportunityAlerts(merchantId: string): StockOpportunityAlert[] {
    const merchantConfirmedProductIds = SA_FLAGSHIP_OFFERS
      .filter((o) => o.merchantRef === merchantId)
      .map((o) => o.variantRef);

    const alerts: StockOpportunityAlert[] = [];

    for (const p of SA_CANONICAL_PRODUCTS) {
      if (!merchantConfirmedProductIds.includes(p.canonicalId)) {
        alerts.push({
          id: `alert_${p.canonicalId}`,
          masterProductId: p.canonicalId,
          productTitle: p.title,
          brand: p.brand,
          searchTrendGrowth: 140,
          estimatedMonthlyBuyerQueries: 3800,
          averageCompetitorPriceZar: (p.attributes?.estimatedPriceZar as number) || 18500,
          recommendedAction: `Add your price for ${p.title} to capture immediate local search traffic.`,
          urgency: 'high',
        });
      }
    }

    if (alerts.length === 0) {
      // Return sample top opportunity
      const p = SA_CANONICAL_PRODUCTS[0];
      alerts.push({
        id: `alert_${p.canonicalId}_top`,
        masterProductId: p.canonicalId,
        productTitle: p.title,
        brand: p.brand,
        searchTrendGrowth: 125,
        estimatedMonthlyBuyerQueries: 4200,
        averageCompetitorPriceZar: 19500,
        recommendedAction: 'Keep pricing updated within 24h SLA for top Google Shopping placement.',
        urgency: 'medium',
      });
    }

    return alerts;
  }
}
