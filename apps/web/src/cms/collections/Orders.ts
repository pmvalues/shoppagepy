// Payload CMS Collection: Orders (Merchant Order Processing & WhatsApp Fulfillment)
export const OrdersCollection = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'grandTotal', 'paymentStatus', 'orderStatus', 'createdAt'],
  },
  access: {
    read: ({ req }: any) => Boolean(req.user),
    create: () => true, // Storefront checkout can place orders
    update: ({ req, doc }: any) => req.user?.role === 'superadmin' || req.user?.merchantId === doc?.merchantId,
    delete: ({ req }: any) => req.user?.role === 'superadmin',
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
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'Order ID (e.g. #ORD-9824)',
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      label: 'Customer Full Name',
    },
    {
      name: 'customerPhone',
      type: 'text',
      required: true,
      label: 'Customer WhatsApp / Phone',
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: 'Customer Email',
    },
    {
      name: 'deliveryAddress',
      type: 'text',
      label: 'Delivery Address / Courier Destination',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'productId', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'sku', type: 'text', required: true },
        { name: 'qty', type: 'number', required: true },
        { name: 'unitPrice', type: 'number', required: true },
        { name: 'totalPrice', type: 'number', required: true },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      label: 'Subtotal (ZAR)',
    },
    {
      name: 'taxTotal',
      type: 'number',
      defaultValue: 0,
      label: 'VAT Total (15%)',
    },
    {
      name: 'shippingTotal',
      type: 'number',
      defaultValue: 0,
      label: 'Shipping Total (ZAR)',
    },
    {
      name: 'grandTotal',
      type: 'number',
      required: true,
      label: 'Grand Total (ZAR)',
    },
    {
      name: 'paymentMethod',
      type: 'select',
      defaultValue: 'WhatsApp Direct & EFT',
      options: [
        { label: 'WhatsApp Direct & EFT', value: 'WhatsApp Direct & EFT' },
        { label: 'Instant EFT Bank Transfer', value: 'Instant EFT' },
        { label: 'PayFast Card / Scan', value: 'PayFast' },
        { label: 'In-Store Cash / POS', value: 'In-Store Cash' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Verification', value: 'pending' },
        { label: 'Paid & Cleared', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'orderStatus',
      type: 'select',
      defaultValue: 'processing',
      options: [
        { label: 'Processing / Packing', value: 'processing' },
        { label: 'Completed & Dispatched', value: 'completed' },
        { label: 'On Hold (Awaiting Payment)', value: 'on_hold' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Merchant Internal Order Notes',
    },
  ],
};
