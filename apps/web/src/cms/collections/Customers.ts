// Payload CMS Collection: Customers (Mini-CRM Ledger)
export const CustomersCollection = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'city', 'segment', 'totalOrdersCount', 'lifetimeValueZar'],
  },
  access: {
    read: ({ req }: any) => Boolean(req.user),
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
      label: 'Merchant',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Customer / Company Name',
    },
    {
      name: 'contactPerson',
      type: 'text',
      label: 'Primary Contact Person',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'WhatsApp / Telephone (+27...)',
    },
    {
      name: 'city',
      type: 'text',
      defaultValue: 'Johannesburg',
      label: 'Primary City / Region',
    },
    {
      name: 'segment',
      type: 'select',
      defaultValue: 'Trade Buyer',
      options: [
        { label: 'VIP Gold Contractor', value: 'VIP Gold Contractor' },
        { label: 'Commercial Wholesale', value: 'Commercial Wholesale' },
        { label: 'Trade Buyer', value: 'Trade Buyer' },
        { label: 'Residential Retail', value: 'Residential Retail' },
      ],
    },
    {
      name: 'totalOrdersCount',
      type: 'number',
      defaultValue: 1,
      label: 'Total Orders Count',
    },
    {
      name: 'lifetimeValueZar',
      type: 'number',
      defaultValue: 0,
      label: 'Total Lifetime Value (ZAR)',
    },
    {
      name: 'notes',
      type: 'array',
      label: 'CRM Contractor Interaction Notes',
      fields: [{ name: 'note', type: 'text' }],
    },
  ],
};
