export const dynamic = 'force-dynamic';

import DiscoveryFeed from '@/components/DiscoveryFeed';
import { getFeed, getRetailerSpecials, getProductsCatalog } from '@/lib/feed';

export default function HomePage() {
  const posts = getFeed();
  const specials = getRetailerSpecials(5000);
  const products = getProductsCatalog(100000);

  return <DiscoveryFeed posts={posts} specials={specials} initialProducts={products} />;
}
