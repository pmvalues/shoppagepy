import { MasterProduct, Merchant } from '@shoppage/contracts';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_MERCHANTS } from '../seed/sa_flagship_seed';
import { NationwideMerchantStore } from '../repository/merchant_store';

export interface YouTubeShortCampaign {
  id: string;
  productId: string;
  productTitle: string;
  shortTitle: string;
  verticalVideoPreviewUrl: string;
  durationSeconds: number;
  totalViews: number;
  likesCount: number;
  sharesCount: number;
  whatsAppLeadsGenerated: number;
  youtubeShortUrl: string;
  scriptStoryboard: string[];
  suggestedTags: string[];
  ctaDescription: string;
}

/**
 * YouTube Shorts & Video Commerce Studio
 * Powers automated vertical product video generation, teardown highlight clips,
 * and direct WhatsApp conversion attribution from YouTube.
 */
export class YouTubeShortsCommerceService {
  public static getShortsCampaignsForMerchant(merchantId: string): YouTubeShortCampaign[] {
    const merchant = NationwideMerchantStore.getMerchantById(merchantId) || SA_FLAGSHIP_MERCHANTS[0];

    return [
      {
        id: `short_deye_teardown_${merchant.id}`,
        productId: 'var_deye_5kw_hybrid',
        productTitle: 'Deye 5kW 48V Single Phase Hybrid Inverter',
        shortTitle: '🔥 Why Everyone in SA is Buying this 5kW Inverter! (Real Teardown & Load Test)',
        verticalVideoPreviewUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
        durationSeconds: 48,
        totalViews: 14200,
        likesCount: 840,
        sharesCount: 310,
        whatsAppLeadsGenerated: 64,
        youtubeShortUrl: 'https://youtube.com/shorts/sample_deye_teardown',
        scriptStoryboard: [
          '00:00 - 00:08: Hook: Can this 5kW inverter run your kettle AND air fryer simultaneously during Stage 6?',
          '00:08 - 00:22: Unboxing & Port Teardown (Dual MPPT, Smart Load port, Generator input)',
          '00:22 - 00:36: Live Load Test: Seamless 4ms UPS switchover under full 5000W load',
          '00:36 - 00:48: CTA: In stock today at ' + merchant.name + '. Tap description link for instant WhatsApp quote!',
        ],
        suggestedTags: ['#SolarSouthAfrica', '#LoadSheddingSolutions', '#Deye5kW', '#InverterPriceSA', '#BackupPower'],
        ctaDescription: `Get the genuine Deye 5kW Hybrid Inverter with 5-year SABS warranty at ${merchant.name} (${merchant.addressText}). Chat directly on WhatsApp: https://wa.me/${(merchant.contacts.whatsapp || '27829876543').replace(/[^0-9]/g, '')}`,
      },
      {
        id: `short_dyness_test_${merchant.id}`,
        productId: 'var_dyness_5kwh_battery',
        productTitle: 'Dyness BX51100 5.12kWh 48V Lithium-ion Battery',
        shortTitle: '🔋 6,000 Cycles! Dyness 5.12kWh Lithium Battery Full Test & Teardown',
        verticalVideoPreviewUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
        durationSeconds: 42,
        totalViews: 9800,
        likesCount: 620,
        sharesCount: 190,
        whatsAppLeadsGenerated: 41,
        youtubeShortUrl: 'https://youtube.com/shorts/sample_dyness_test',
        scriptStoryboard: [
          '00:00 - 00:06: 10-Year Warranty & 6000 Cycles: The math behind lithium battery investment in SA.',
          '00:06 - 00:20: Inside the LiFePO4 cells: Smart BMS communication with Deye & Sunsynk.',
          '00:20 - 00:34: Runtime calculator: 11.4 hours on essential fridge and Wi-Fi load.',
          '00:34 - 00:42: Verified physical stock at ' + merchant.name + '. WhatsApp us now!',
        ],
        suggestedTags: ['#LithiumBattery', '#Dyness', '#SolarPowerSA', '#HomeBackup', '#EnergySecurity'],
        ctaDescription: `Direct supplier Dyness BX51100 stock at ${merchant.name}. Instant WhatsApp dispatch: https://wa.me/${(merchant.contacts.whatsapp || '27829876543').replace(/[^0-9]/g, '')}`,
      },
    ];
  }

  /**
   * Generates a new YouTube Short creation package for any Master Product
   */
  public static createShortPackage(product: MasterProduct, merchant: Merchant): YouTubeShortCampaign {
    return {
      id: `short_gen_${product.canonicalId}_${merchant.id}`,
      productId: product.canonicalId,
      productTitle: product.title,
      shortTitle: `⚡ ${product.title} — Real South Africa Performance Review`,
      verticalVideoPreviewUrl: product.media?.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
      durationSeconds: 45,
      totalViews: 0,
      likesCount: 0,
      sharesCount: 0,
      whatsAppLeadsGenerated: 0,
      youtubeShortUrl: `https://youtube.com/shorts/new_${product.canonicalId}`,
      scriptStoryboard: [
        `00:00 - 00:08: Why ${product.brand} is trending across South Africa today.`,
        `00:08 - 00:24: Technical highlights and verified SABS standards.`,
        `00:24 - 00:36: Real-world load test in South African conditions.`,
        `00:36 - 00:45: Available now at ${merchant.name}. Direct WhatsApp message in bio!`,
      ],
      suggestedTags: ['#Shoppage', `#${product.brand.replace(/\s+/g, '')}`, '#SouthAfricaCommerce', '#LocalSupplier'],
      ctaDescription: `Buy from ${merchant.name} (${merchant.addressText}). WhatsApp: https://wa.me/${(merchant.contacts.whatsapp || '27829876543').replace(/[^0-9]/g, '')}`,
    };
  }
}
