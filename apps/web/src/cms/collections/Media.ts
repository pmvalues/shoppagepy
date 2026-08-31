// Payload CMS Collection: Media (Digital Asset Management & Commercial Media)
export const MediaCollection = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mediaType', 'filesize', 'createdAt'],
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
      label: 'Merchant Owner',
    },
    {
      name: 'filename',
      type: 'text',
      required: true,
      label: 'Asset Filename',
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Asset Storage / CDN URL',
    },
    {
      name: 'mediaType',
      type: 'select',
      defaultValue: 'image',
      options: [
        { label: 'High-Res Product Photography', value: 'image' },
        { label: 'Short / Video Clip', value: 'video' },
        { label: 'PDF Datasheet / Compliance Certificate', value: 'datasheet_pdf' },
      ],
    },
    {
      name: 'altText',
      type: 'text',
      label: 'Accessibility Alt Text / Product Description',
    },
    {
      name: 'filesize',
      type: 'number',
      label: 'File Size (Bytes)',
    },
    {
      name: 'mimeType',
      type: 'text',
      label: 'MIME Type',
    },
  ],
};
