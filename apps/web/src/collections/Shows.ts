/**
 * Payload 3 Collection: Shows
 * Product discovery media franchises (e.g. Market Walk, What's Trending, Product Battles)
 */

export const ShowsCollection = {
  slug: 'shows',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedEpisodesCount', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Market Walk (Physical Market Tours)', value: 'market_walk' },
        { label: "What's Trending (Real-Time Grok Radar)", value: 'whats_trending' },
        { label: 'Product Battles (Side-by-side Teardowns)', value: 'product_battles' },
        { label: 'Under R500 / Budget Finds', value: 'budget_finds' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft Series', value: 'draft' },
        { label: 'Active Franchise', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'publishedEpisodesCount',
      type: 'number',
      defaultValue: 0,
    },
  ],
};
