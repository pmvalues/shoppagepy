// Payload CMS Merchant OS TypeScript Domain Types
import type { Merchant, ProductVariant, Offer } from '@shoppage/contracts';

export interface CmsMerchantDocument {
  id: string;
  name: string;
  legalName?: string;
  category: string;
  addressText: string;
  province: string;
  locality?: string;
  stallIdentifier?: string;
  googleRating: number;
  googleReviewsCount: number;
  operatingHours: string;
  medianResponseMinutes: number;
  verificationState: 'unverified' | 'phone_verified' | 'fully_verified';
  contacts: {
    telephone: string;
    whatsapp: string;
    email: string;
    website?: string;
  };
  branding?: {
    primaryColor?: string;
    bannerUrl?: string;
    logoUrl?: string;
    tagline?: string;
  };
  settings?: {
    currency: 'ZAR';
    taxRate: number; // e.g. 15%
    enableWhatsappCart: boolean;
    enableDirectEft: boolean;
    enablePayfast: boolean;
    shippingFlatRateZar?: number;
    freeShippingThresholdZar?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CmsProductDocument {
  id: string;
  merchantId: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  taxStatus: 'taxable' | 'none';
  taxClass: 'standard' | 'reduced' | 'zero';
  inStock: boolean;
  stockQty: number;
  lowStockThreshold: number;
  backorders: 'no' | 'notify' | 'yes';
  weightKg?: number;
  dimensionsCm?: string;
  shippingClass?: string;
  warranty: string;
  specs: string;
  description: string;
  featuredImage: string;
  galleryImages: string[];
  compliance: {
    sabsApproved: boolean;
    nrs097Certified?: boolean;
    warrantyYears: number;
  };
  feedStatus: 'Active' | 'Draft' | 'Needs Action';
  viewsCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CmsMediaDocument {
  id: string;
  merchantId: string;
  filename: string;
  mimeType: string;
  filesize: number;
  url: string;
  altText: string;
  mediaType: 'image' | 'video' | 'datasheet_pdf';
  createdAt: string;
}

export interface CmsShortOrShowDocument {
  id: string;
  merchantId: string;
  type: 'short' | 'show' | 'live';
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  viewsCount: number;
  likesCount: number;
  taggedProductIds: string[];
  isPublished: boolean;
  scheduledLiveAt?: string;
  createdAt: string;
}

export interface CmsOrderDocument {
  id: string;
  merchantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderStatus: 'processing' | 'completed' | 'on_hold' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsCustomerDocument {
  id: string;
  merchantId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  segment: 'VIP Gold Contractor' | 'Commercial Wholesale' | 'Residential Retail' | 'Trade Buyer';
  totalOrdersCount: number;
  lifetimeValueZar: number;
  lastOrderDate: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export type MerchantPlanTier = 'free' | 'business' | 'business_pro' | 'enterprise';

export interface PlanFeatureEntitlements {
  tier: MerchantPlanTier;
  name: string;
  monthlyFeeZar: number;
  maxBranches: number;
  hasCipcVerifiedBadge: boolean;
  canSyndicateGoogleMerchantCenter: boolean;
  hasPrioritySerpPlacement: boolean;
  hasLiveBroadcastStudio: boolean;
  hasRfqTenderDeskAccess: boolean;
  supportSla: string;
}

export const MERCHANT_PLAN_TIERS: Record<MerchantPlanTier, PlanFeatureEntitlements> = {
  free: {
    tier: 'free',
    name: 'Free Starter',
    monthlyFeeZar: 0,
    maxBranches: 1,
    hasCipcVerifiedBadge: false,
    canSyndicateGoogleMerchantCenter: false,
    hasPrioritySerpPlacement: false,
    hasLiveBroadcastStudio: false,
    hasRfqTenderDeskAccess: false,
    supportSla: 'Community / Best Effort',
  },
  business: {
    tier: 'business',
    name: 'Business',
    monthlyFeeZar: 199,
    maxBranches: 3,
    hasCipcVerifiedBadge: true,
    canSyndicateGoogleMerchantCenter: true,
    hasPrioritySerpPlacement: true,
    hasLiveBroadcastStudio: false,
    hasRfqTenderDeskAccess: false,
    supportSla: '48h Standard Email/WhatsApp',
  },
  business_pro: {
    tier: 'business_pro',
    name: 'Business Pro',
    monthlyFeeZar: 499,
    maxBranches: 10,
    hasCipcVerifiedBadge: true,
    canSyndicateGoogleMerchantCenter: true,
    hasPrioritySerpPlacement: true,
    hasLiveBroadcastStudio: true,
    hasRfqTenderDeskAccess: true,
    supportSla: '12h Priority WhatsApp Desk',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise Flagship',
    monthlyFeeZar: 0, // Quote-based
    maxBranches: 999,
    hasCipcVerifiedBadge: true,
    canSyndicateGoogleMerchantCenter: true,
    hasPrioritySerpPlacement: true,
    hasLiveBroadcastStudio: true,
    hasRfqTenderDeskAccess: true,
    supportSla: '1h Dedicated Key Account Manager & Custom API',
  },
};

export interface CmsSubscriptionDocument {
  id: string;
  merchantId: string;
  plan: MerchantPlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  billingProvider: 'paystack' | 'stripe' | 'manual_invoice' | 'none';
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  entitlements: {
    maxBranches: number;
    hasCipcVerifiedBadge: boolean;
    canSyndicateGoogleMerchantCenter: boolean;
    hasPrioritySerpPlacement: boolean;
    hasLiveBroadcastStudio: boolean;
    hasRfqTenderDeskAccess: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CmsInvoiceDocument {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  subscriptionId?: string;
  amountZar: number;
  currency: 'ZAR' | 'USD';
  status: 'paid' | 'pending' | 'failed' | 'voided' | 'refunded';
  billingProvider: 'paystack' | 'stripe' | 'manual_eft';
  providerReference?: string;
  receiptPdfUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CmsCampaignDocument {
  id: string;
  merchantId: string;
  campaignName: string;
  campaignType: 'geo_showroom_25km' | 'sponsored_search' | 'category_top_rail' | 'video_short_sponsored';
  status: 'active' | 'paused' | 'budget_exhausted' | 'pending_review' | 'completed';
  bidding: {
    bidStrategy: 'cpc' | 'cpm' | 'flat_monthly';
    cpcBidZar: number;
    dailyBudgetZar: number;
    totalBudgetZar?: number;
  };
  targeting: {
    targetRadiusKm: number;
    targetMetro?: string;
    targetCategories?: string;
    targetKeywords?: string;
  };
  performance: {
    impressionsCount: number;
    clicksCount: number;
    whatsappInitiationsCount: number;
    totalSpendZar: number;
  };
  startsAt: string;
  endsAt?: string;
  createdAt: string;
}
