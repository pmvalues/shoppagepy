// Payload CMS Configuration for Shoppage Merchant OS
import { MerchantsCollection } from './collections/Merchants';
import { ProductsCollection } from './collections/Products';
import { MediaCollection } from './collections/Media';
import { ShortsAndShowsCollection } from './collections/ShortsAndShows';
import { OrdersCollection } from './collections/Orders';
import { CustomersCollection } from './collections/Customers';

export const payloadConfig = {
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
    routes: {
      admin: '/merchant/os',
    },
    meta: {
      titleSuffix: '— Shoppage Merchant OS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.png',
    },
  },
  collections: [
    MerchantsCollection,
    ProductsCollection,
    MediaCollection,
    ShortsAndShowsCollection,
    OrdersCollection,
    CustomersCollection,
  ],
  typescript: {
    outputFile: './src/cms/payload-types.ts',
  },
  telemetry: false,
};

export default payloadConfig;
