/**
 * Payload 3 Collection: Subscriptions
 * Merchant OS SaaS subscriptions, plan tiers, and billing lifecycle
 */

export const SubscriptionsCollection = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'merchantRef', 'plan', 'status', 'currentPeriodEnd', 'updatedAt'],
  },
  fields: [
    {
      name: 'merchantRef',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
      unique: true,
    },
    {
      name: 'plan',
      type: 'select',
      options: [
        { label: 'Free (R0/month)', value: 'free' },
        { label: 'Business (R199/month)', value: 'business' },
        { label: 'Business Pro (R499/month)', value: 'business_pro' },
        { label: 'Enterprise (Quote-based)', value: 'enterprise' },
      ],
      defaultValue: 'free',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'billingProvider',
      type: 'select',
      options: [
        { label: 'Paystack', value: 'paystack' },
        { label: 'Stripe', value: 'stripe' },
        { label: 'Direct EFT / Manual Invoice', value: 'manual_invoice' },
        { label: 'System Default (Free Tier)', value: 'none' },
      ],
      defaultValue: 'none',
      required: true,
    },
    {
      name: 'externalCustomerId',
      type: 'text',
      admin: {
        description: 'Paystack/Stripe Customer ID (e.g. CUS_xxx or cus_xxx)',
      },
    },
    {
      name: 'externalSubscriptionId',
      type: 'text',
      admin: {
        description: 'Paystack/Stripe Subscription Code (e.g. SUB_xxx or sub_xxx)',
      },
    },
    {
      name: 'billingCycle',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual (15% Discount)', value: 'annual' },
      ],
      defaultValue: 'monthly',
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'entitlements',
      type: 'group',
      fields: [
        { name: 'maxBranches', type: 'number', defaultValue: 1 },
        { name: 'hasCipcVerifiedBadge', type: 'checkbox', defaultValue: false },
        { name: 'canSyndicateGoogleMerchantCenter', type: 'checkbox', defaultValue: false },
        { name: 'hasPrioritySerpPlacement', type: 'checkbox', defaultValue: false },
        { name: 'hasLiveBroadcastStudio', type: 'checkbox', defaultValue: false },
        { name: 'hasRfqTenderDeskAccess', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
};
