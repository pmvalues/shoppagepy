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
