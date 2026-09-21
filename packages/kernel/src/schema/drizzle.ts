import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  char,
  integer,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Raw Drizzle Schema for Shoppage Moat Assets
 */

export const masterProducts = pgTable(
  'master_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productLevel: text('product_level').notNull(), // 'family', 'model', 'generic'
    canonicalName: text('canonical_name').notNull(),
    brand: text('brand').notNull(),
    primaryCategoryCode: text('primary_category_code'),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('master_product_name_idx').on(table.canonicalName),
    brandIdx: index('master_product_brand_idx').on(table.brand),
  })
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    masterProductId: uuid('master_product_id').references(() => masterProducts.id).notNull(),
    canonicalName: text('canonical_name').notNull(),
    gtin13: text('gtin13'),
    gtin14: text('gtin14'),
    mpn: text('mpn'),
    attributes: jsonb('attributes').default({}).notNull(),
    aliases: jsonb('aliases').default([]).notNull(),
    compatibilityEdgeCount: integer('compatibility_edge_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    gtin13Idx: index('variant_gtin13_idx').on(table.gtin13),
    masterProductIdx: index('variant_master_product_idx').on(table.masterProductId),
  })
);

export const markets = pgTable(
  'markets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    canonicalSlug: text('canonical_slug').unique().notNull(),
    marketType: text('market_type').notNull(),
    countryCode: char('country_code', { length: 2 }).default('ZA').notNull(),
    province: text('province').notNull(),
    metro: text('metro').notNull(),
    parentMarketId: uuid('parent_market_id'),
    boundaryGeojson: jsonb('boundary_geojson'),
    verificationState: text('verification_state').default('unverified').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    parentMarketIdx: index('market_parent_idx').on(table.parentMarketId),
    countryProvinceIdx: index('market_country_prov_idx').on(table.countryCode, table.province),
  })
);

export const referralEvents = pgTable(
  'referral_events',
  {
    eventId: uuid('event_id').defaultRandom().primaryKey(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    countryCode: char('country_code', { length: 2 }).default('ZA').notNull(),
    sessionFingerprint: text('session_fingerprint').notNull(),
    sourceCampaign: text('source_campaign'),
    sourceAssetQrId: text('source_asset_qr_id'),
    offerId: uuid('offer_id'),
    variantId: uuid('variant_id'),
    merchantId: uuid('merchant_id').notNull(),
    marketId: uuid('market_id'),
    action: text('action').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 4 }).notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    payload: jsonb('payload'),
  },
  (table) => ({
    dedupeIdx: index('referral_dedupe_idx').on(table.dedupeKey),
    merchantActionIdx: index('referral_merchant_action_idx').on(table.merchantId, table.action),
    occurredAtIdx: index('referral_occurred_idx').on(table.occurredAt),
  })
);

export const offerStateHistory = pgTable(
  'offer_state_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    offerId: uuid('offer_id').notNull(),
    price: numeric('price', { precision: 18, scale: 4 }),
    currency: char('currency', { length: 3 }),
    availabilityState: text('availability_state').notNull(),
    updateType: text('update_type').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    sourceRef: text('source_ref'),
  },
  (table) => ({
    offerHistoryIdx: index('offer_history_idx').on(table.offerId, table.observedAt),
  })
);

export const demandEvents = pgTable(
  'demand_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rawQuery: text('raw_query'),
    zeroResultReason: text('zero_result_reason'),
    countryCode: char('country_code', { length: 2 }).default('ZA').notNull(),
    province: text('province'),
    metro: text('metro'),
    categoryCode: text('category_code'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    demandGeoIdx: index('demand_geo_idx').on(table.countryCode, table.province),
    demandOccurredIdx: index('demand_occurred_idx').on(table.occurredAt),
  })
);

export const organisations = pgTable(
  'organisations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legalName: text('legal_name').notNull(),
    registrationNumber: text('registration_number'), // CIPC / CIPZ
    taxNumber: text('tax_number'),
    jurisdiction: char('jurisdiction', { length: 2 }).default('ZA').notNull(),
    tier: text('tier').default('Tier3_IndependentShop').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    regNumIdx: index('org_reg_num_idx').on(table.registrationNumber),
  })
);

export const merchants = pgTable(
  'merchants',
  {
    id: text('id').primaryKey(), // loc_...
    organisationId: uuid('organisation_id').references(() => organisations.id),
    tradingName: text('trading_name').notNull(),
    category: text('category').notNull(),
    addressText: text('address_text').notNull(),
    province: text('province').notNull(),
    telephone: text('telephone'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    website: text('website'),
    verificationState: text('verification_state').default('unverified').notNull(),
    trustScore: integer('trust_score').default(50).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    merchantProvIdx: index('merchant_prov_idx').on(table.province),
    merchantTrustIdx: index('merchant_trust_idx').on(table.trustScore),
  })
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash'),
    fullName: text('full_name').notNull(),
    role: text('role').default('merchant_owner').notNull(), // superadmin, merchant_owner, merchant_staff, buyer
    merchantId: text('merchant_id').references(() => merchants.id),
    organisationId: uuid('organisation_id').references(() => organisations.id),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userEmailIdx: index('user_email_idx').on(table.email),
    userMerchantIdx: index('user_merchant_idx').on(table.merchantId),
  })
);

export const rfqRequests = pgTable(
  'rfq_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    buyerName: text('buyer_name').notNull(),
    buyerPhone: text('buyer_phone').notNull(),
    buyerEmail: text('buyer_email'),
    category: text('category').notNull(),
    itemSummary: text('item_summary').notNull(),
    province: text('province').notNull(),
    budgetEstimateZar: numeric('budget_estimate_zar', { precision: 18, scale: 2 }),
    status: text('status').default('submitted').notNull(), // submitted, broadcasting, quoted, closed
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    rfqStatusIdx: index('rfq_status_idx').on(table.status),
    rfqProvIdx: index('rfq_prov_idx').on(table.province),
  })
);

export const tradeOrders = pgTable(
  'trade_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: text('merchant_id').references(() => merchants.id).notNull(),
    rfqId: uuid('rfq_id').references(() => rfqRequests.id),
    buyerName: text('buyer_name').notNull(),
    buyerPhone: text('buyer_phone').notNull(),
    orderStatus: text('order_status').default('pending_invoice').notNull(), // pending_invoice, confirmed, collected, cancelled
    totalAmountZar: numeric('total_amount_zar', { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderMerchantIdx: index('order_merchant_idx').on(table.merchantId),
    orderStatusIdx: index('order_status_idx').on(table.orderStatus),
  })
);

export const tradeOrderLines = pgTable(
  'trade_order_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => tradeOrders.id).notNull(),
    productTitle: text('product_title').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceZar: numeric('unit_price_zar', { precision: 18, scale: 2 }).notNull(),
    lineTotalZar: numeric('line_total_zar', { precision: 18, scale: 2 }).notNull(),
  },
  (table) => ({
    orderLineOrderIdx: index('order_line_order_idx').on(table.orderId),
  })
);

export const verificationClaims = pgTable(
  'verification_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: text('merchant_id').references(() => merchants.id).notNull(),
    applicantEmail: text('applicant_email').notNull(),
    claimType: text('claim_type').notNull(), // cipc_enterprise, physical_storefront, regulator_license
    status: text('status').default('pending').notNull(), // pending, verified, rejected
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    claimMerchantIdx: index('claim_merchant_idx').on(table.merchantId),
    claimStatusIdx: index('claim_status_idx').on(table.status),
  })
);

export const evidenceArtifacts = pgTable(
  'evidence_artifacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceType: text('source_type').notNull(), // cipc_extract, storefront_photo, sitemap_scrape
    artifactUrl: text('artifact_url').notNull(),
    sha256Hash: text('sha256_hash').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 4 }).notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    evidenceHashIdx: index('evidence_hash_idx').on(table.sha256Hash),
  })
);

/**
 * ============================================================================
 * Section 3.1: Shoppage Commerce Chat & Structured Quote Relational Schemas
 * ============================================================================
 */

export const buyerChatProfiles = pgTable(
  'buyer_chat_profiles',
  {
    buyerId: uuid('buyer_id').primaryKey(),
    displayName: text('display_name').notNull(),
    phoneHash: text('phone_hash').notNull(),
    email: text('email'),
    defaultPostalCode: text('default_postal_code'),
    preferences: jsonb('preferences').default({}).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    whatsappOptIn: boolean('whatsapp_opt_in').default(true).notNull(),
    pushEnabled: boolean('push_enabled').default(true).notNull(),
  },
  (table) => ({
    buyerPhoneIdx: index('buyer_phone_idx').on(table.phoneHash),
  })
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    buyerId: uuid('buyer_id').notNull(),
    merchantId: text('merchant_id').notNull(), // loc_...
    productId: text('product_id'),
    status: text('status').default('active').notNull(), // active, closed, archived
    quoteId: uuid('quote_id'),
    orderId: uuid('order_id'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
    unreadBuyer: integer('unread_buyer').default(0).notNull(),
    unreadMerchant: integer('unread_merchant').default(0).notNull(),
    channel: text('channel').default('shoppage').notNull(), // shoppage, whatsapp, mixed
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    convBuyerIdx: index('conv_buyer_idx').on(table.buyerId),
    convMerchantIdx: index('conv_merchant_idx').on(table.merchantId),
    convLastMsgIdx: index('conv_last_msg_idx').on(table.lastMessageAt),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
    senderType: text('sender_type').notNull(), // buyer, merchant, system, ai
    senderId: text('sender_id').notNull(),
    messageType: text('message_type').notNull(), // text, inquiry, quote, quote_action, proforma_invoice, payment_link
    content: jsonb('content').default({}).notNull(),
    text: text('text').default('').notNull(),
    status: text('status').default('sending').notNull(), // sending, sent, delivered, read, failed
    replyToId: uuid('reply_to_id'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    msgConvIdx: index('msg_conv_idx').on(table.conversationId),
    msgCreatedIdx: index('msg_created_idx').on(table.createdAt),
  })
);

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
    quoteNumber: text('quote_number').unique().notNull(), // e.g. QUO-2026-001234
    status: text('status').default('draft').notNull(), // draft, sent, viewed, approved, expired, cancelled
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    deliveryEstimate: numeric('delivery_estimate', { precision: 12, scale: 2 }).default('0.00').notNull(),
    vat: numeric('vat', { precision: 12, scale: 2 }).default('0.00').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    stockReservedUntil: timestamp('stock_reserved_until', { withTimezone: true }).notNull(),
    buyerApprovalAt: timestamp('buyer_approval_at', { withTimezone: true }),
    orderId: uuid('order_id'),
    pdfUrl: text('pdf_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    quoteConvIdx: index('quote_conv_idx').on(table.conversationId),
    quoteNumIdx: index('quote_num_idx').on(table.quoteNumber),
    quoteStatusIdx: index('quote_status_idx').on(table.status),
  })
);

export const quoteLines = pgTable(
  'quote_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quoteId: uuid('quote_id').references(() => quotes.id).notNull(),
    productId: text('product_id').notNull(),
    variantId: uuid('variant_id'),
    productName: text('product_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    stockConfirmed: boolean('stock_confirmed').default(false).notNull(),
    stockLocationId: text('stock_location_id'),
    metadata: jsonb('metadata').default({}),
  },
  (table) => ({
    quoteLineQuoteIdx: index('quote_line_quote_idx').on(table.quoteId),
  })
);

export const merchantChatSettings = pgTable(
  'merchant_chat_settings',
  {
    merchantId: text('merchant_id').primaryKey(),
    autoQuoteEnabled: boolean('auto_quote_enabled').default(false).notNull(),
    autoQuoteRules: jsonb('auto_quote_rules').default([]).notNull(),
    aiSuggestionsEnabled: boolean('ai_suggestions_enabled').default(true).notNull(),
    responseTimeSla: integer('response_time_sla').default(30).notNull(), // minutes
    teamSize: integer('team_size').default(1).notNull(),
    awayMessage: text('away_message'),
    businessHours: jsonb('business_hours').default({}).notNull(),
    maxOpenQuotes: integer('max_open_quotes').default(50).notNull(),
  }
);

