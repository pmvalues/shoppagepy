import { MerchantsCollection } from './collections/Merchants.js';
import { MarketsCollection } from './collections/Markets.js';
import { ProductVariantsCollection } from './collections/ProductVariants.js';
import { OffersCollection } from './collections/Offers.js';
import { RightsSourcesCollection } from './collections/RightsSources.js';
import { ShowsCollection } from './collections/Shows.js';
import { ShortsCollection } from './collections/Shorts.js';

/**
 * Payload CMS 3 Configuration
 * Powers the Application Shell, Operations Admin, and Editorial Collections
 */
export const payloadConfig = {
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— Shoppage Operations & Commerce Intelligence Admin',
    },
  },
  collections: [
    MerchantsCollection,
    MarketsCollection,
    ProductVariantsCollection,
    OffersCollection,
    RightsSourcesCollection,
    ShowsCollection,
    ShortsCollection,
  ],
  typescript: {
    outputFile: './src/payload-types.ts',
  },
};

export default payloadConfig;
