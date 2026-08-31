// Payload CMS Collection: Products (Shoppage Native Store Catalog Management)
export const ProductsCollection = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'price', 'inStock', 'stockQty', 'feedStatus'],
  },
  access: {
    read: () => true, // Publicly discoverable by search engine and storefronts
    create: ({ req }: any) => Boolean(req.user),
    update: ({ req, doc }: any) => {
      if (req.user?.role === 'superadmin') return true;
      return req.user?.merchantId === doc?.merchantId;
    },
    delete: ({ req, doc }: any) => {
      if (req.user?.role === 'superadmin') return true;
      return req.user?.merchantId === doc?.merchantId;
    },
  },
  fields: [
    {
      name: 'merchantId',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
      label: 'Merchant Store Owner',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Product Title',
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      label: 'SKU / MPN Identifier',
    },
    {
      name: 'brand',
      type: 'text',
      defaultValue: 'Verified Brand',
      label: 'Brand / Manufacturer',
    },
    {
      name: 'category',
      type: 'text',
      required: true,
      label: 'Category Taxonomy Ref',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Active Selling Price (ZAR)',
    },
    {
      name: 'regularPrice',
      type: 'number',
      label: 'Regular Price (ZAR)',
    },
    {
      name: 'salePrice',
      type: 'number',
      label: 'Discounted Sale Price (ZAR)',
    },
    {
      name: 'taxStatus',
      type: 'select',
      defaultValue: 'taxable',
      options: [
        { label: 'Taxable', value: 'taxable' },
        { label: 'None (Tax Exempt)', value: 'none' },
      ],
    },
    {
      name: 'taxClass',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Standard (15% VAT)', value: 'standard' },
        { label: 'Zero Rate', value: 'zero' },
      ],
    },
    {
      name: 'inStock',
      type: 'checkbox',
      defaultValue: true,
      label: 'In Stock & Ready for Dispatch',
    },
    {
      name: 'stockQty',
      type: 'number',
      defaultValue: 50,
      label: 'Live Inventory Quantity',
    },
    {
      name: 'lowStockThreshold',
      type: 'number',
      defaultValue: 5,
      label: 'Low Stock Alert Threshold',
    },
    {
      name: 'warranty',
      type: 'text',
      defaultValue: '1 Year Commercial Warranty',
      label: 'Warranty Period & Guarantee',
    },
    {
      name: 'specs',
      type: 'textarea',
      label: 'Technical Specifications & Commercial Highlights',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Detailed Product Description',
    },
    {
      name: 'featuredImage',
      type: 'text',
      label: 'Primary Product Photo URL',
    },
    {
      name: 'galleryImages',
      type: 'array',
      label: 'Product Gallery Images',
      fields: [{ name: 'url', type: 'text' }],
    },
    {
      name: 'compliance',
      type: 'group',
      fields: [
        { name: 'sabsApproved', type: 'checkbox', defaultValue: true, label: 'SABS Approved / Food Grade' },
        { name: 'nrs097Certified', type: 'checkbox', defaultValue: false, label: 'NRS 097 Grid Certified' },
        { name: 'warrantyYears', type: 'number', defaultValue: 1, label: 'Warranty Years' },
      ],
    },
    {
      name: 'feedStatus',
      type: 'select',
      defaultValue: 'Active',
      options: [
        { label: 'Active (Syndicated to Google Shopping & SERP)', value: 'Active' },
        { label: 'Draft / Inactive', value: 'Draft' },
        { label: 'Needs Action (Missing Required Info)', value: 'Needs Action' },
      ],
    },
  ],
};
