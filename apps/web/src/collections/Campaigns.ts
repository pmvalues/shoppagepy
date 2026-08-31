/**
 * Payload 3 Collection: Campaigns (Advertising & Sponsored Placement Engine)
 * Powers 25km local showroom geo-ads, sponsored keyword bidding, and BuyBox boosts
 */

export const CampaignsCollection = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'campaignName',
    defaultColumns: ['campaignName', 'merchantRef', 'campaignType', 'dailyBudgetZar', 'status', 'totalSpendZar'],
  },
  fields: [
    {
      name: 'campaignName',
      type: 'text',
      required: true,
    },
    {
      name: 'merchantRef',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
    },
    {
      name: 'campaignType',
      type: 'select',
      options: [
        { label: 'Local Showroom Geo-Ad (25km Walk-in Radius)', value: 'geo_showroom_25km' },
        { label: 'Sponsored Search & BuyBox Boost', value: 'sponsored_search' },
        { label: 'Category & SERP Top Rail Placement', value: 'category_top_rail' },
        { label: '9:16 Video Short Sponsored Discovery', value: 'video_short_sponsored' },
      ],
      defaultValue: 'geo_showroom_25km',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active (Serving Impressions)', value: 'active' },
        { label: 'Paused by Merchant', value: 'paused' },
        { label: 'Daily Budget Exhausted', value: 'budget_exhausted' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'bidding',
      type: 'group',
      fields: [
        {
          name: 'bidStrategy',
          type: 'select',
          options: [
            { label: 'CPC (Cost Per Click / WhatsApp Chat)', value: 'cpc' },
            { label: 'CPM (Cost Per 1,000 Impressions)', value: 'cpm' },
            { label: 'Flat Monthly Sponsorship', value: 'flat_monthly' },
          ],
          defaultValue: 'cpc',
        },
        { name: 'cpcBidZar', type: 'number', defaultValue: 2.50 },
        { name: 'dailyBudgetZar', type: 'number', defaultValue: 50.00, required: true },
        { name: 'totalBudgetZar', type: 'number' },
      ],
    },
    {
      name: 'targeting',
      type: 'group',
      fields: [
        { name: 'targetRadiusKm', type: 'number', defaultValue: 25 },
        { name: 'targetMetro', type: 'text', admin: { description: 'e.g. City of Johannesburg, Cape Town' } },
        { name: 'targetCategories', type: 'text', admin: { description: 'Comma-separated taxonomy category slugs' } },
        { name: 'targetKeywords', type: 'text', admin: { description: 'Comma-separated search keywords (e.g. solar, inverter, lithium)' } },
      ],
    },
    {
      name: 'performance',
      type: 'group',
      fields: [
        { name: 'impressionsCount', type: 'number', defaultValue: 0 },
        { name: 'clicksCount', type: 'number', defaultValue: 0 },
        { name: 'whatsappInitiationsCount', type: 'number', defaultValue: 0 },
        { name: 'totalSpendZar', type: 'number', defaultValue: 0.00 },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'endsAt',
      type: 'date',
    },
  ],
};
