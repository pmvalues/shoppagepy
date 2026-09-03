// ==============================================================================
// Shoppage v7.0 TypeScript Domain Contracts (Massively Enriched Master Graph)
// ==============================================================================

export type CountryCode = 'ZA' | 'ZW' | 'KE' | 'NG' | 'GB' | 'US';

export type AvailabilityState =
  | 'fresh'
  | 'confirm_required'
  | 'quote_required'
  | 'out_of_stock'
  | 'expired'
  | 'hidden';

export type DestinationType =
  | 'merchant_whatsapp'
  | 'retailer_website'
  | 'marketplace_listing'
  | 'physical_stall';

export type RightsClass =
  | 'PUBLIC_RECORD'
  | 'DIRECT_MERCHANT_AUTHORISED'
  | 'PARTNER_CONTRACTUAL_FEED'
  | 'OPEN_DATA_COMMERCIAL'
  | 'BLOCKED';

export interface MultilingualAlias {
  phrase: string;
  locale: 'en' | 'zu' | 'xh' | 'af' | 'sn' | 'sw';
  source: 'merchant_usage' | 'buyer_query' | 'ai_normalized' | 'curator' | 'search_query';
  confidence: number;
}

export interface ProductMediaItem {
  id: string;
  type: 'image' | 'diagram' | 'packshot' | 'installation';
  url: string;
  thumbnailUrl?: string;
  altText: string;
  isPrimary?: boolean;
}

export interface ProductVideoItem {
  id: string;
  title: string;
  type: 'teardown' | 'unboxing' | 'installation_guide' | 'proof_demo' | 'battle';
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  authorName: string;
}

export interface ProductDocumentItem {
  id: string;
  title: string;
  type: 'datasheet_pdf' | 'user_manual_pdf' | 'wiring_diagram' | 'certificate_pdf';
  fileUrl: string;
  fileSizeBytes: number;
  language: string;
}

export interface ProductReviewItem {
  id: string;
  authorName: string;
  authorLocation: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  date: string;
  usageContext?: string; // e.g. "Powers 4-bedroom house with 5kW solar"
}

export interface ProductReviewsSummary {
  averageRating: number;
  totalReviewsCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  pros: string[];
  cons: string[];
  reviews: ProductReviewItem[];
}

export interface TroubleshootingItem {
  code: string;
  symptom: string;
  probableCause: string;
  solution: string;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
  category: 'sizing' | 'installation' | 'warranty' | 'compatibility';
}

export interface ProductGuides {
  summaryGuide?: string;
  installationOverview?: string;
  cocComplianceNotes?: string; // South Africa SANS 10142-1 CoC advice
  troubleshooting: TroubleshootingItem[];
  faqs: ProductFaqItem[];
}

export interface ProductCompliance {
  sabsApproved?: boolean;
  nrs097Certified?: boolean; // Grid-tied certified for Eskom / City of Cape Town / City Power
  icasaApproved?: boolean;
  warrantyYears: number;
  certificationNumber?: string;
}

export interface MasterProduct {
  /** Canonical UUID or GS1 GTIN-based identifier */
  canonicalId: string;
  familyRef: string;
  categoryRef: string;
  title: string;
  brand: string;
  modelNumber?: string;
  identifiers: {
    gtin13?: string;
    gtin14?: string;
    gtin12?: string;
    gtin8?: string;
    mpn?: string;
    asin?: string;
  };
  attributes: Record<string, string | number | boolean | Array<string>>;
  aliases: MultilingualAlias[];
  media?: {
    gallery: ProductMediaItem[];
    videos: ProductVideoItem[];
    documents: ProductDocumentItem[];
  };
  reviewsSummary?: ProductReviewsSummary;
  guides?: ProductGuides;
  compliance?: ProductCompliance;
  compatibilityEdgeCount: number;
  status: 'active' | 'reference_only' | 'draft';
  countryScope: CountryCode[];
  provenance: {
    sourceRef: string;
    rightsClass: RightsClass;
    confidence: number;
    fieldOwner: string;
    validFrom: string;
  };
}

/** Backward-compatible alias for MasterProduct */
export type ProductVariant = MasterProduct;

/**
 * Merchant Variant:
 * A merchant's specific sellable configuration of a Master Product, including
 * merchant-specific SKU, attributes, packaging, bundle configuration and other
 * commercial distinctions.
 */
export interface MerchantVariant {
  id: string;
  masterProductRef: string;
  merchantRef: string;
  merchantSku: string;
  variantTitle?: string;
  packagingUnit?: string; // e.g. "Single Unit", "Pack of 6", "Box of 24", "Bulk Pallet"
  bundleComponents?: string[];
  condition: 'new' | 'refurbished' | 'open_box' | 'used';
  warrantyMonths?: number;
  customAttributes?: Record<string, string | number | boolean>;
}

export interface CommercialLocation {
  id: string;
  marketId?: string;
  country: CountryCode;
  addressText: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
}

export interface Merchant {
  id: string;
  name: string;
  country: CountryCode;
  marketId?: string;
  stallIdentifier?: string;
  category?: string; // solar_energy, electronics, hardware, wholesale, supermarket, spaza, automotive
  addressText: string;
  province?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  googleRating?: number;
  googleReviewsCount?: number;
  googleReviewsUrl?: string;
  googleMapsUrl?: string;
  operatingHours?: string;
  sourceRef?: string; // google_maps_sweep, osm_overpass_sweep, overture_maps, cipc_registry, csd_registry
  cipcEnterpriseNumber?: string;
  csdSupplierNumber?: string;
  cidbRegistrationNumber?: string;
  cidbGrade?: string;
  wiremanLicenseNumber?: string;
  bbbeeLevel?: string;
  taxCompliancePin?: string;
  overtureGersId?: string;
  osmNodeId?: string;
  yearsInBusiness?: number;
  medianResponseMinutes?: number;
  deliveryOptions?: string[];
  paymentMethods?: string[];
  facilities?: string[];
  languagesSpoken?: string[];
  storefrontPhotoUrl?: string;
  contacts: {
    whatsapp?: string;
    telephone?: string;
    email?: string;
    website?: string;
  };
  verificationState: 'unverified' | 'phone_verified' | 'fully_verified';
}

export interface TrustPassport {
  merchantId: string;
  merchantName: string;
  country?: CountryCode;
  score: number; // 0-100
  freshOffersTodayCount: number;
  medianResponseMinutes: number;
  complaintCountLast90d: number;
  state: 'VERIFIED_ACTIVE' | 'FLAGGED' | 'SUSPENDED';
}

export type ReferralAction =
  | 'impression'
  | 'comparison_view'
  | 'outbound_click'
  | 'whatsapp_start'
  | 'call_reveal'
  | 'directions_open'
  | 'quote_submitted'
  | 'reserve_intent'
  | 'destination_ack'
  | 'merchant_responded'
  | 'buyer_resolved'
  | 'purchase_confirmed';

export interface ReferralActionEvent {
  eventId: string;
  occurredAt: string;
  country: string;
  sessionFingerprint: string;
  sourceCampaign?: string;
  sourceAssetQrId?: string;
  offerRef?: string;
  variantRef?: string;
  marketRef?: string;
  stallRef?: string;
  merchantRef: string;
  action: ReferralAction;
  confidenceScore: number;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

/**
 * Offer:
 * The merchant's commercial proposition for that variant — price, availability,
 * location, delivery, condition, etc. (Directly confirmed by merchant or first-party feeds).
 */
export interface Offer {
  id: string;
  variantRef: string; // References MasterProduct.canonicalId
  merchantRef: string;
  merchantVariantRef?: string;
  marketRef?: string;
  stallRef?: string;
  destinationType: DestinationType;
  actionTarget?: {
    type: 'whatsapp' | 'url';
    whatsappNumber?: string;
    destinationUrl?: string;
  };
  price: {
    amount?: number;
    currency: 'ZAR' | 'USD' | 'ZWG';
    sourceTimestamp: string;
  };
  availabilityState: AvailabilityState;
  updateType: 'stock_confirmed' | 'price_changed' | 'stall_visited' | 'api_feed_update';
  freshness: {
    slaClass: 'fast_moving_24h' | 'retail_72h' | 'catalogue_7d' | 'service_30d';
    expiresAt: string;
    lastConfirmedAt: string;
  };
  status?: 'confirmed';
}

/**
 * Discovered Offer:
 * An Offer that Shoppage discovered externally (from websites, catalogs, open web scraping,
 * public registries, digital storefronts) and has not yet received direct merchant confirmation for.
 */
export interface DiscoveredOffer {
  id: string;
  masterProductRef: string; // References MasterProduct.canonicalId
  merchantRef?: string; // Mapped merchant if known
  merchantName: string;
  sourceWebsite: string;
  sourceUrl: string;
  discoveredPrice: {
    amount: number;
    currency: 'ZAR' | 'USD' | 'ZWG';
    rawPriceText?: string;
  };
  availabilityText: string;
  discoverySource: 'retailer_web_sweep' | 'catalog_index' | 'public_registry' | 'e_commerce_scrape' | 'google_shopping_feed' | 'sitemap_harvest';
  confidenceScore: number; // 0.0 - 1.0
  discoveredAt: string;
  status: 'discovered';
  locationHint?: string;
  sku?: string;
  oldPriceZar?: number;
  discountPct?: number;
  dealBadge?: string;
  productTitle?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
}

export interface MarketGeo {
  streetAddress: string;
  suburb: string;
  metro: string;
  province: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  googlePlaceId?: string;
}

export interface MarketSubZone {
  id: string;
  name: string;
  zoneCode?: string;
  categoryFocus?: string;
  stallCount?: number;
  description?: string;
}

export interface CommunityAutoPostRule {
  enabled: boolean;
  frequency: 'instant_on_publish' | 'daily_digest' | 'price_drops_only';
  templateFormat: 'compact_price_drop' | 'full_specs_with_buybox' | 'rfq_broadcast';
  includeCipcBadge: boolean;
  lastSyncedAt?: string;
  totalBroadcastsCount: number;
}

export interface InboundGroupListing {
  id: string;
  postAuthor: string;
  postTime: string;
  content: string;
  extractedTitle: string;
  extractedPriceZar?: number;
  extractedPhone?: string;
  verifiedMerchantStatus: boolean;
  status: 'published' | 'pending_verification' | 'archived';
}

export interface TwitterXPost {
  id: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  isVerified: boolean;
  timestamp: string;
  text: string;
  likesCount: number;
  retweetsCount: number;
  hashtags: string[];
  attachedProductSku?: string;
  attachedPriceZar?: number;
}

export interface TwitterXMeta {
  officialHandle?: string;
  targetHashtags: string[];
  autoTweetOnPriceDrop: boolean;
  totalTweetsSyndicated: number;
  liveFeed?: TwitterXPost[];
}

export interface CommunityGroupMeta {
  groupCategory: 'suburb_buy_sell' | 'b2b_contractor_network' | 'wholesale_importers' | 'solar_inverter_exchange' | 'farming_livestock' | 'auto_parts_spares' | 'fmcg_spaza_trade';
  memberCount: number;
  dailyPostVolume: number;
  cityOrTown: string;
  sourcePlatform?: string;
  externalCommunityUrl?: string; // Direct Public Facebook Group / Community Link
  facebookGroupId?: string;
  facebookGroupName?: string;
  moderationType: 'open_public' | 'vetted_trade_only' | 'cipc_verified_merchants';
  autoPostRule?: CommunityAutoPostRule;
  inboundFeed?: InboundGroupListing[];
  twitterX?: TwitterXMeta;
}

export interface VirtualMarketMeta {
  platformUrl: string;
  portalType: 'open_marketplace' | 'b2b_trade_portal' | 'spaza_fintech_switch' | 'classifieds_network' | 'energy_portal' | 'community_group_exchange';
  merchantOnboardingUrl?: string;
  buyerAppUrl?: string;
  apiIntegrationType?: 'rest_webhook' | 'csv_catalog_sync' | 'whatsapp_bot_agent';
  operationalModel: string;
}

export interface Market {
  id: string;
  name: string;
  canonicalSlug: string;
  country: CountryCode;
  province: string;
  metro: string;
  parentMarketId?: string; // Recursive Markets-in-Markets parent (e.g. Dragon City -> Building 2)
  marketType:
    | 'formal_mega_mall'
    | 'shopping_centre'
    | 'strip_mall'
    | 'wholesale_market'
    | 'informal_transport_rank'
    | 'township_commercial_cluster'
    | 'flea_market'
    | 'street_corridor'
    | 'industrial_commercial_zone'
    | 'virtual_marketplace'
    | 'virtual_b2b_network'
    | 'virtual_social_commerce'
    | 'virtual_spaza_fintech'
    | 'virtual_community_group';
  geo?: MarketGeo;
  zones?: MarketSubZone[];
  virtualMeta?: VirtualMarketMeta;
  communityGroupMeta?: CommunityGroupMeta;
  landmarks?: string[];
  safetyNotices?: string[];
  operatingHours?: string;
  stallCapacity?: number;
  activeMerchantsCount?: number;
}
