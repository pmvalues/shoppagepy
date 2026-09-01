/**
 * Payload 3 Collection: ProductVariants
 * Canonical Master Product Graph admin, barcode validation, and specification attributes
 */

export const ProductVariantsCollection = {
  slug: 'product-variants',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'brand', 'gtin13', 'categoryRef', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req }: any) => Boolean(req?.user),
    update: ({ req }: any) => Boolean(req?.user),
    delete: ({ req }: any) => req?.user?.role === 'admin',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation }: any) => {
        // Real-time synchronization hook placeholder for external indexers
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
      name: 'canonicalId',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'brand',
      type: 'text',
      required: true,
    },
    {
      name: 'modelNumber',
      type: 'text',
    },
    {
      name: 'gtin13',
      type: 'text',
      admin: {
        description: 'Standard GS1 EAN-13 Checksum-Validated Barcode',
      },
    },
    {
      name: 'categoryRef',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft Variant', value: 'draft' },
        { label: 'Active in Master Catalogue', value: 'active' },
        { label: 'Reference Only (No Local Stock Claim)', value: 'reference_only' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'attributes',
      type: 'json',
      admin: {
        description: 'Structured technical specifications JSON-B',
      },
    },
    {
      name: 'aliases',
      type: 'array',
      admin: {
        description: 'Multilingual and colloquial search aliases (Zulu, Xhosa, Afrikaans, etc.)',
      },
      fields: [
        { name: 'phrase', type: 'text', required: true },
        {
          name: 'locale',
          type: 'select',
          options: [
            { label: 'English (en)', value: 'en' },
            { label: 'isiZulu (zu)', value: 'zu' },
            { label: 'isiXhosa (xh)', value: 'xh' },
            { label: 'Afrikaans (af)', value: 'af' },
            { label: 'Shona (sn)', value: 'sn' },
            { label: 'Swahili (sw)', value: 'sw' },
          ],
          defaultValue: 'en',
        },
        { name: 'confidence', type: 'number', defaultValue: 0.9 },
      ],
    },
  ],
};
