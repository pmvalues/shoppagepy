// Payload CMS Collection: Merchants (Multi-Tenant Storefront Profiles)
export const MerchantsCollection = {
  slug: 'merchants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'province', 'verificationState', 'googleRating'],
  },
  access: {
    read: () => true, // Public storefronts can read verified profiles
    create: ({ req }: any) => Boolean(req.user),
    update: ({ req, id }: any) => {
      if (req.user?.role === 'superadmin') return true;
      return req.user?.merchantId === id;
    },
    delete: ({ req }: any) => req.user?.role === 'superadmin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Store Trading Name',
    },
    {
      name: 'legalName',
      type: 'text',
      label: 'Registered CIPC Enterprise Name',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Solar & Renewable Energy', value: 'solar_energy' },
        { label: 'Food Packaging & Catering Supplies', value: 'packaging_catering' },
        { label: 'Industrial Hardware & Building Materials', value: 'hardware' },
        { label: 'Wholesale General Merchandise', value: 'wholesale' },
        { label: 'Electronics & Smart Tech', value: 'electronics' },
        { label: 'Automotive Spares & Tools', value: 'automotive' },
      ],
    },
    {
      name: 'addressText',
      type: 'text',
      required: true,
      label: 'Physical Address & Showroom Location',
    },
    {
      name: 'province',
      type: 'select',
      required: true,
      options: [
        { label: 'Gauteng', value: 'Gauteng' },
        { label: 'Western Cape', value: 'Western Cape' },
        { label: 'KwaZulu-Natal', value: 'KwaZulu-Natal' },
        { label: 'Eastern Cape', value: 'Eastern Cape' },
        { label: 'Free State', value: 'Free State' },
        { label: 'Mpumalanga', value: 'Mpumalanga' },
        { label: 'Limpopo', value: 'Limpopo' },
        { label: 'North West', value: 'North West' },
        { label: 'Northern Cape', value: 'Northern Cape' },
      ],
    },
    {
      name: 'stallIdentifier',
      type: 'text',
      label: 'Warehouse / Concourse / Stall Unit',
    },
    {
      name: 'googleRating',
      type: 'number',
      defaultValue: 4.9,
      label: 'Google Maps Star Rating',
    },
    {
      name: 'operatingHours',
      type: 'text',
      defaultValue: 'Mon-Fri 08:00 - 17:00',
      label: 'Public Operating Hours',
    },
    {
      name: 'verificationState',
      type: 'select',
      defaultValue: 'fully_verified',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Phone Verified', value: 'phone_verified' },
        { label: 'Fully Verified & CIPC Audited', value: 'fully_verified' },
      ],
    },
    {
      name: 'contacts',
      type: 'group',
      fields: [
        { name: 'telephone', type: 'text', required: true, label: 'Direct Telephone (+27...)' },
        { name: 'whatsapp', type: 'text', required: true, label: 'Verified WhatsApp Business (+27...)' },
        { name: 'email', type: 'email', required: true, label: 'Official Inquiries Email' },
        { name: 'website', type: 'text', label: 'Merchant Website URL' },
      ],
    },
    {
      name: 'branding',
      type: 'group',
      fields: [
        { name: 'primaryColor', type: 'text', defaultValue: '#2563EB', label: 'Primary Brand Color Hex' },
        { name: 'bannerUrl', type: 'text', label: 'Hero Storefront Banner URL' },
        { name: 'logoUrl', type: 'text', label: 'Store Logo URL' },
        { name: 'tagline', type: 'text', label: 'Marketing Tagline' },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        { name: 'currency', type: 'text', defaultValue: 'ZAR' },
        { name: 'taxRate', type: 'number', defaultValue: 15, label: 'VAT Tax Rate (%)' },
        { name: 'enableWhatsappCart', type: 'checkbox', defaultValue: true, label: 'Enable 1-Click WhatsApp Quick Cart' },
        { name: 'enableDirectEft', type: 'checkbox', defaultValue: true, label: 'Enable Direct In-Store & EFT Bank Orders' },
        { name: 'shippingFlatRateZar', type: 'number', defaultValue: 150, label: 'Courier SA Flat Rate (ZAR)' },
        { name: 'freeShippingThresholdZar', type: 'number', defaultValue: 2500, label: 'Free Shipping Threshold (ZAR)' },
      ],
    },
  ],
};
