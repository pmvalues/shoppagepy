/**
 * Payload 3 Collection: Merchants
 * Admin operations for merchant onboarding, verification, and branch management
 */

export const MerchantsCollection = {
  slug: 'merchants',
  admin: {
    useAsTitle: 'publicName',
    defaultColumns: ['publicName', 'country', 'claimState', 'verificationState', 'updatedAt'],
  },
  fields: [
    {
      name: 'canonicalId',
      type: 'text',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'publicName',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'select',
      options: [
        { label: 'South Africa (ZA)', value: 'ZA' },
        { label: 'Zimbabwe (ZW)', value: 'ZW' },
        { label: 'Kenya (KE)', value: 'KE' },
        { label: 'Nigeria (NG)', value: 'NG' },
        { label: 'United Kingdom (GB)', value: 'GB' },
        { label: 'United States (US)', value: 'US' },
      ],
      defaultValue: 'ZA',
      required: true,
    },
    {
      name: 'claimState',
      type: 'select',
      options: [
        { label: 'Candidate Profile (Preloaded)', value: 'candidate' },
        { label: 'Claimed by Merchant', value: 'claimed' },
        { label: 'Disputed Ownership', value: 'disputed' },
        { label: 'Offboarded / Suspended', value: 'offboarded' },
      ],
      defaultValue: 'candidate',
      required: true,
    },
    {
      name: 'verificationState',
      type: 'select',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Phone Verified (OTP)', value: 'phone_verified' },
        { label: 'Fully Verified (Field/Document)', value: 'fully_verified' },
      ],
      defaultValue: 'unverified',
    },
    {
      name: 'primaryContacts',
      type: 'group',
      fields: [
        { name: 'whatsappNumber', type: 'text' },
        { name: 'telephone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'websiteUrl', type: 'text' },
      ],
    },
    {
      name: 'marketRef',
      type: 'relationship',
      relationTo: 'markets',
      hasMany: false,
      admin: {
        description: 'Physical Market, Mall, or Taxi Rank where this merchant operates',
      },
    },
    {
      name: 'stallIdentifier',
      type: 'text',
      admin: {
        description: 'Specific stall, aisle, or shop number (e.g., "Building 2, Shop B-18")',
      },
    },
  ],
};
