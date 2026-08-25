/**
 * Payload 3 Collection: Shorts
 * High-utility proof videos tethered to canonical products, offers, and markets
 */

export const ShortsCollection = {
  slug: 'shorts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'productRef', 'merchantRef', 'marketRef', 'moderationState'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'videoUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'productRef',
      type: 'relationship',
      relationTo: 'product-variants',
      hasMany: false,
      admin: {
        description: 'Canonical Product demonstrated in this Short',
      },
    },
    {
      name: 'merchantRef',
      type: 'relationship',
      relationTo: 'merchants',
      hasMany: false,
    },
    {
      name: 'marketRef',
      type: 'relationship',
      relationTo: 'markets',
      hasMany: false,
    },
    {
      name: 'moderationState',
      type: 'select',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved & Published', value: 'approved' },
        { label: 'Rejected (Misleading / Prohibited)', value: 'rejected' },
      ],
      defaultValue: 'approved',
    },
    {
      name: 'isSponsored',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mandatory visible sponsorship disclosure flag',
      },
    },
  ],
};
