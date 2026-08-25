import { z } from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(256),
  country: z.string().default('ZA'),
  province: z.string().optional(),
  metro: z.string().optional(),
  marketId: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  maxDistanceKm: z.coerce.number().positive().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  availability: z.enum(['fresh_only', 'all_confirmed', 'including_reference']).default('all_confirmed'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

export const CreateRequestSchema = z.object({
  needDescription: z.string().min(5).max(1000),
  categoryRef: z.string().optional(),
  quantity: z.number().positive().optional(),
  country: z.string().default('ZA'),
  province: z.string().optional(),
  metro: z.string().optional(),
  marketRef: z.string().optional(),
  urgency: z.enum(['immediate_today', 'within_48h', 'flexible']).default('within_48h'),
  contactConsent: z.boolean().default(true),
  visibility: z.enum(['private_broadcast', 'public_board']).default('private_broadcast'),
  buyerPhone: z.string().min(7).max(20),
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;

export const ReferralActionLogSchema = z.object({
  eventId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
  country: z.string().default('ZA'),
  sessionFingerprint: z.string().min(8),
  sourceCampaign: z.string().optional(),
  sourceAssetQrId: z.string().optional(),
  offerRef: z.string().optional(),
  variantRef: z.string().optional(),
  merchantRef: z.string().min(1),
  marketRef: z.string().optional(),
  stallRef: z.string().optional(),
  action: z.enum([
    'impression',
    'comparison_view',
    'outbound_click',
    'whatsapp_start',
    'call_reveal',
    'directions_open',
    'quote_submitted',
    'reserve_intent',
    'destination_ack',
    'merchant_responded',
    'buyer_resolved',
    'purchase_confirmed',
  ]),
  confidenceScore: z.number().min(0).max(1).default(1.0),
  metadata: z.record(z.unknown()).optional(),
});

export type ReferralActionLogInput = z.infer<typeof ReferralActionLogSchema>;

export const QuickFreshnessConfirmSchema = z.object({
  offerId: z.string().min(1),
  merchantId: z.string().min(1),
  stockState: z.enum(['in_stock', 'out_of_stock', 'quote_required']),
  confirmedPrice: z.number().positive().optional(),
  currency: z.string().default('ZAR'),
});

export type QuickFreshnessConfirmInput = z.infer<typeof QuickFreshnessConfirmSchema>;
