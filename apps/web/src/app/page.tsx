export const dynamic = 'force-dynamic';

import DiscoveryFeed from '@/components/DiscoveryFeed';
import { getFeed, getRetailerSpecials, getProductsCatalog } from '@/lib/feed';

/**
 * Hard ceiling on how many catalog rows may be serialised into the RSC payload.
 *
 * Every value passed to `DiscoveryFeed` is a client component prop, so Next.js
 * inlines it into the flight payload shipped to the browser. Requesting the full
 * catalog here previously serialised ~91,700 product objects into a single 58 MB
 * inline script. Keep this bounded; anything beyond it must be fetched from the
 * paginated API (/api/v1/products) on demand rather than sent with the document.
 */
const INITIAL_PRODUCT_LIMIT = 96;
const INITIAL_SPECIALS_LIMIT = 96;

export default function HomePage() {
  const posts = getFeed();
  const specials = getRetailerSpecials(INITIAL_SPECIALS_LIMIT);
  const products = getProductsCatalog(INITIAL_PRODUCT_LIMIT);

  return <DiscoveryFeed posts={posts} specials={specials} initialProducts={products} />;
}
