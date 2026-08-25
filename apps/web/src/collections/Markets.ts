/**
 * Payload 3 Collection: Markets
 * Spatial and commercial digital twins for Malls, Wholesale Hubs, Taxi Ranks, and Markets
 */

export const MarketsCollection = {
  slug: 'markets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'marketType', 'province', 'metro', 'verificationState'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'canonicalSlug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'marketType',
      type: 'select',
      options: [
        { label: 'Formal Mega-Mall', value: 'formal_mega_mall' },
        { label: 'Shopping Centre', value: 'shopping_centre' },
        { label: 'Strip Mall / Retail Park', value: 'strip_mall' },
        { label: 'Wholesale / B2B Trade Market', value: 'wholesale_market' },
        { label: 'Informal Transport / Taxi Rank Hub', value: 'informal_transport_rank' },
        { label: 'Township Commercial Cluster', value: 'township_commercial_cluster' },
        { label: 'Flea / Street Market', value: 'flea_market' },
        { label: 'Commercial Street Corridor', value: 'street_corridor' },
      ],
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
      ],
      defaultValue: 'ZA',
      required: true,
    },
    {
      name: 'province',
      type: 'text',
      required: true,
      admin: { description: 'e.g. Gauteng, Western Cape, KwaZulu-Natal' },
    },
    {
      name: 'metro',
      type: 'text',
      required: true,
      admin: { description: 'e.g. City of Johannesburg, City of Cape Town, eThekwini' },
    },
    {
      name: 'parentMarket',
      type: 'relationship',
      relationTo: 'markets',
      hasMany: false,
      admin: {
        description: 'Enclosing parent market (Strict Markets-in-Markets containment)',
      },
    },
    {
      name: 'verificationState',
      type: 'select',
      options: [
        { label: 'Unverified Discovery Scaffolding', value: 'unverified' },
        { label: 'Claimed by Operator', value: 'claimed' },
        { label: 'Field / Cadastral Verified', value: 'evidence_verified' },
      ],
      defaultValue: 'unverified',
    },
    {
      name: 'landmarks',
      type: 'array',
      fields: [{ name: 'landmarkName', type: 'text' }],
    },
    {
      name: 'safetyNotices',
      type: 'array',
      fields: [{ name: 'noticeText', type: 'text' }],
    },
  ],
};
