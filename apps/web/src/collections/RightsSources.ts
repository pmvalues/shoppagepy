/**
 * Payload 3 Collection: RightsSources
 * Source Rights Register with default-BLOCKED permissions enforcement
 */

export const RightsSourcesCollection = {
  slug: 'rights-sources',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'rightsClass', 'status', 'aiUsePermitted', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'rightsClass',
      type: 'select',
      options: [
        { label: 'Public Official Record', value: 'PUBLIC_RECORD' },
        { label: 'Direct Merchant Authorized', value: 'DIRECT_MERCHANT_AUTHORISED' },
        { label: 'Partner Contractual API Feed', value: 'PARTNER_CONTRACTUAL_FEED' },
        { label: 'Open Data Commercial License', value: 'OPEN_DATA_COMMERCIAL' },
        { label: 'Blocked / Unverified', value: 'BLOCKED' },
      ],
      defaultValue: 'BLOCKED',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'BLOCKED (Default)', value: 'BLOCKED' },
        { label: 'CLEARED for Publication', value: 'CLEARED' },
        { label: 'SUSPENDED', value: 'SUSPENDED' },
        { label: 'TERMINATED', value: 'TERMINATED' },
      ],
      defaultValue: 'BLOCKED',
      required: true,
    },
    {
      name: 'permittedFields',
      type: 'array',
      fields: [{ name: 'fieldName', type: 'text' }],
    },
    {
      name: 'aiUsePermitted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Explicit consent for AI model inference and training processing',
      },
    },
    {
      name: 'suppressionSlaHours',
      type: 'number',
      defaultValue: 24,
    },
  ],
};
