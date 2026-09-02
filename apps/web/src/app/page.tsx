export const dynamic = 'force-dynamic';

import DiscoveryFeed from '@/components/DiscoveryFeed';
import { getFeed } from '@/lib/feed';

export default function HomePage() {
  const posts = getFeed();

  return <DiscoveryFeed posts={posts} />;
}
