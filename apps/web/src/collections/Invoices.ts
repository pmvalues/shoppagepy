/**
 * Payload 3 Collection: Invoices
 * Merchant OS SaaS billing receipts, payment ledger, and audit history
 */

export const InvoicesCollection = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'merchantRef', 'amountZar', 'status', 'paidAt', 'createdAt'],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'merchantRef',
      type: 'relationship',
      relationTo: 'merchants',
      required: true,
    },
    {
      name: 'subscriptionRef',
      type: 'relationship',
      relationTo: 'subscriptions',
    },
    {
      name: 'amountZar',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'South African Rand (ZAR)', value: 'ZAR' },
        { label: 'US Dollar (USD)', value: 'USD' },
      ],
      defaultValue: 'ZAR',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Voided', value: 'voided' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'billingProvider',
      type: 'select',
      options: [
        { label: 'Paystack', value: 'paystack' },
        { label: 'Stripe', value: 'stripe' },
        { label: 'Manual EFT', value: 'manual_eft' },
      ],
      defaultValue: 'paystack',
    },
    {
      name: 'providerReference',
      type: 'text',
      admin: {
        description: 'Payment provider transaction reference or charge ID',
      },
    },
    {
      name: 'receiptPdfUrl',
      type: 'text',
    },
    {
      name: 'paidAt',
      type: 'date',
    },
  ],
};
