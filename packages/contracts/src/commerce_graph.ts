/**
 * ==============================================================================
 * SHOPPAGE COMMERCE GRAPH DOMAIN MODEL (CANONICAL OWNERSHIP SPECIFICATION)
 * ==============================================================================
 * Authoritative entity schemas mapping SQLite read models to PostgreSQL
 * canonical mutable write entities.
 */

export type JurisdictionCode = 'ZA' | 'ZW' | 'KE' | 'NG' | 'GB' | 'US';

export type UserRole = 'superadmin' | 'merchant_owner' | 'merchant_staff' | 'buyer';

export type EnterpriseTier =
  | 'Tier1_NationalChain'
  | 'Tier2_RegionalRetailer'
  | 'Tier3_IndependentShop'
  | 'Informal_MicroTrader';

export type VerificationStatus =
  | 'unverified'
  | 'phone_verified'
  | 'cipc_corroborated'
  | 'fully_verified_flagship';

export type OfferAvailabilityState =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'on_request'
  | 'confirm_required';

export type AttributionActionType =
  | 'search_impression'
  | 'comparison_view'
  | 'pdp_view'
  | 'whatsapp_click'
  | 'phone_reveal'
  | 'directions_open'
  | 'rfq_submit'
  | 'trade_cart_add'
  | 'order_confirmed';

// 1. User & Identity
export interface CanonicalUser {
  id: string; // usr_...
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  organisationId?: string;
  merchantId?: string; // Tenant binding
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 2. Organisation (Legal Entity)
export interface CanonicalOrganisation {
  id: string; // org_...
  legalName: string;
  registrationNumber?: string; // CIPC Enterprise # (e.g. 2021/123456/07)
  taxNumber?: string; // SARS Tax PIN / TIN
  jurisdiction: JurisdictionCode;
  tier: EnterpriseTier;
  createdAt: string;
  updatedAt: string;
}

// 3. Merchant (Commercial Storefront)
export interface CanonicalMerchant {
  id: string; // loc_...
  organisationId?: string;
  tradingName: string;
  category: string;
  locationId: string;
  contacts: {
    telephone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  verificationStatus: VerificationStatus;
  trustScore: number; // 0 - 100
  freshOffersCount: number;
  medianResponseMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 4. Commercial Location
export interface CanonicalLocation {
  id: string; // loc_geo_...
  marketId?: string; // References Malls / Markets
  stallIdentifier?: string;
  streetAddress: string;
  suburb?: string;
  metro?: string;
  province: string;
  country: JurisdictionCode;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
}

// 5. Canonical Master Product (GS1 Specification)
export interface CanonicalMasterProduct {
  id: string; // prod_...
  familyRef: string;
  categoryRef: string;
  title: string;
  brand: string;
  modelNumber?: string;
  gtin13?: string;
  attributes: Record<string, unknown>;
  status: 'active' | 'reference_only' | 'draft';
  countryScope: JurisdictionCode[];
  createdAt: string;
  updatedAt: string;
}

// 6. Merchant Sellable Variant
export interface CanonicalMerchantVariant {
  id: string; // mvar_...
  merchantId: string;
  masterProductId: string;
  merchantSku: string;
  variantTitle?: string;
  packagingUnit?: string;
  condition: 'new' | 'refurbished' | 'open_box' | 'used';
  warrantyMonths?: number;
}

// 7. Commercial Offer
export interface CanonicalOffer {
  id: string; // off_...
  merchantId: string;
  variantId: string;
  priceAmount: number;
  currency: 'ZAR' | 'USD' | 'ZWG';
  availability: OfferAvailabilityState;
  observedAt: string;
  confirmedAt?: string;
  expiresAt: string;
  isPromo: boolean;
  promoDiscountPct?: number;
}

// 8. Inventory State
export interface CanonicalInventory {
  id: string; // inv_...
  merchantId: string;
  variantId: string;
  quantityOnHand: number;
  quantityAllocated: number;
  reorderThreshold: number;
  lastAuditedAt?: string;
  updatedAt: string;
}

// 9. Buyer Request / RFQ
export interface CanonicalRFQ {
  id: string; // rfq_...
  buyerContact: {
    name: string;
    phone: string;
    email?: string;
  };
  category: string;
  itemSummary: string;
  targetLocation: {
    province: string;
    metro?: string;
  };
  status: 'submitted' | 'broadcasting' | 'quoted' | 'closed';
  budgetEstimateZar?: number;
  notes?: string;
  createdAt: string;
}

// 10. Trade Cart & Lines
export interface TradeCartLine {
  variantId: string;
  merchantId: string;
  productTitle: string;
  quantity: number;
  unitPriceZar: number;
}

export interface CanonicalTradeCart {
  id: string; // cart_...
  buyerUserId?: string;
  sessionFingerprint: string;
  lines: TradeCartLine[];
  totalEstimatedValueZar: number;
  updatedAt: string;
}

// 11. Trade Order & Order Lines
export interface TradeOrderLine {
  id: string;
  variantId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CanonicalTradeOrder {
  id: string; // ord_...
  cartId?: string;
  rfqId?: string;
  merchantId: string;
  buyerName: string;
  buyerPhone: string;
  orderStatus: 'pending_invoice' | 'confirmed' | 'collected' | 'cancelled';
  totalAmountZar: number;
  lines: TradeOrderLine[];
  createdAt: string;
  updatedAt: string;
}

// 12. Verification Claim & Evidence
export interface CanonicalVerificationClaim {
  id: string; // claim_...
  merchantId: string;
  applicantUserId: string;
  claimType: 'cipc_enterprise' | 'physical_storefront' | 'regulator_license';
  status: 'pending' | 'verified' | 'rejected';
  reviewedByUserId?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CanonicalEvidenceArtifact {
  id: string; // evi_...
  sourceType: 'cipc_extract' | 'storefront_photo' | 'distributor_pricelist' | 'sitemap_scrape';
  artifactUrl: string;
  sha256Hash: string;
  confidenceScore: number; // 0.0 - 1.0
  capturedAt: string;
}

// 13. Attribution Ledger
export interface CanonicalAttributionEvent {
  id: string; // attr_...
  action: AttributionActionType;
  merchantId: string;
  offerId?: string;
  variantId?: string;
  occurredAt: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

// 14. Social Entities (Timeline Posts, Deals & Shorts)
export interface CanonicalSocialPost {
  id: string; // post_...
  authorMerchantId: string;
  type: 'timeline_post' | 'deal_drop' | 'video_short' | 'live_show';
  content: string;
  mediaUrl?: string;
  linkedOfferIds?: string[];
  likeCount: number;
  repostCount: number;
  viewCount: number;
  createdAt: string;
}

// 15. Notification
export interface CanonicalNotification {
  id: string; // notif_...
  recipientUserId: string;
  merchantId?: string;
  type: 'rfq_match' | 'price_drop' | 'verification_approved' | 'order_inquiry';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
