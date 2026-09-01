/**
 * Payload 3 Collection: Offers
 * Live merchant offers, current prices, and SLA freshness monitor
 */

export const OffersCollection = {
  slug: 'offers',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'variantRef', 'merchantRef', 'price', 'availabilityState', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req }: any) => Boolean(req?.user),
    update: ({ req }: any) => Boolean(req?.user),
    delete: ({ req }: any) => Boolean(req?.user),
  },
  hooks: {
    afterChange: [
      async ({ doc, operation }: any) => {
        return doc;
      },
    ],
    afterDelete: [
      async ({ id }: any) => {
        return id;
      },
    ],
  },
  fields: [
    {
      name: 'variantRef',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
    },
    {
      name: 'merchantRef',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
    },
    {
      name: 'destinationType',
      type: 'select',
      options: [
        { label: 'Merchant WhatsApp Direct', value: 'merchant_whatsapp' },
        { label: 'Retailer Website', value: 'retailer_website' },
        { label: 'Marketplace Listing', value: 'marketplace_listing' },
        { label: 'Physical Stall Visit', value: 'physical_stall' },
      ],
      defaultValue: 'merchant_whatsapp',
      required: true,
    },
    {
      name: 'price',
      type: 'group',
      fields: [
        { name: 'amount', type: 'number' },
        {
          name: 'currency',
          type: 'select',
          options: [
            { label: 'South African Rand (ZAR)', value: 'ZAR' },
            { label: 'US Dollar (USD)', value: 'USD' },
            { label: 'Zimbabwe Gold (ZWG)', value: 'ZWG' },
          ],
          defaultValue: 'ZAR',
          required: true,
        },
        { name: 'sourceTimestamp', type: 'date', defaultValue: () => new Date().toISOString() },
      ],
    },
    {
      name: 'availabilityState',
      type: 'select',
      options: [
        { label: 'Fresh (Active SLA)', value: 'fresh' },
        { label: 'Confirmation Required', value: 'confirm_required' },
        { label: 'Quote Required', value: 'quote_required' },
        { label: 'Out of Stock', value: 'out_of_stock' },
        { label: 'Expired / Stale', value: 'expired' },
        { label: 'Hidden / Suspended', value: 'hidden' },
      ],
      defaultValue: 'fresh',
      required: true,
    },
    {
      name: 'freshness',
      type: 'group',
      fields: [
        {
          name: 'slaClass',
          type: 'select',
          options: [
            { label: 'Fast Moving (24h Window)', value: 'fast_moving_24h' },
            { label: 'Retail Stock (72h Window)', value: 'retail_72h' },
            { label: 'Catalogue Price (7 Days)', value: 'catalogue_7d' },
            { label: 'Service Capability (30 Days)', value: 'service_30d' },
          ],
          defaultValue: 'retail_72h',
          required: true,
        },
        { name: 'lastConfirmedAt', type: 'date', defaultValue: () => new Date().toISOString() },
        { name: 'expiresAt', type: 'date' },
      ],
    },
  ],
};
