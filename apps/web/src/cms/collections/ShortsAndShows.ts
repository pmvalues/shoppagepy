// Payload CMS Collection: ShortsAndShows (Video Commerce Studio)
export const ShortsAndShowsCollection = {
  slug: 'shorts-and-shows',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'viewsCount', 'isPublished', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req }: any) => Boolean(req.user),
    update: ({ req, doc }: any) => req.user?.role === 'superadmin' || req.user?.merchantId === doc?.merchantId,
    delete: ({ req, doc }: any) => req.user?.role === 'superadmin' || req.user?.merchantId === doc?.merchantId,
  },
  fields: [
    {
      name: 'merchantId',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
      label: 'Merchant Channel',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Video Title',
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'short',
      options: [
        { label: 'Vertical Video Short (9:16 Unboxing & Demo)', value: 'short' },
        { label: 'Long-Form Masterclass Show (Installation & Tech Guides)', value: 'show' },
        { label: 'Live Stream Broadcast', value: 'live' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      required: true,
      label: 'Video Stream URL (MP4 / HLS / CDN Embed)',
    },
    {
      name: 'thumbnailUrl',
      type: 'text',
      required: true,
      label: 'Cover Thumbnail Poster Image URL',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Video Description & Chapters',
    },
    {
      name: 'taggedProductIds',
      type: 'array',
      label: 'Tagged Products in Video',
      fields: [{ name: 'productId', type: 'text' }],
    },
    {
      name: 'viewsCount',
      type: 'number',
      defaultValue: 0,
      label: 'Total View Count',
    },
    {
      name: 'likesCount',
      type: 'number',
      defaultValue: 0,
      label: 'Total Likes',
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: true,
      label: 'Published on Public Storefront',
    },
  ],
};
