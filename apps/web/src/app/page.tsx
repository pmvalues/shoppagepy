export const dynamic = 'force-dynamic';

import Link from 'next/link';
import DiscoveryFeed from '@/components/DiscoveryFeed';
import { getFeed } from '@/lib/feed';

const CHIPS = [
  { label: 'Solar & Load-Shedding', query: 'inverter', icon: '⚡' },
  { label: 'Packaging & Catering', query: 'Mitrend', icon: '🍽️' },
  { label: 'Building & Hardware', query: 'cement', icon: '🧱' },
  { label: 'Smartphones & Tech', query: 'samsung', icon: '📱' },
  { label: 'Automotive & Spares', query: 'battery', icon: '🚗' },
  { label: 'Wholesale FMCG', query: 'wholesale', icon: '🛒' },
];

export default function HomePage() {
  const posts = getFeed();

  return (
    <>
      <div className="feed-heading">
        <h1>Discover</h1>
        <p>
          Price drops, restocks and video proof — straight from verified South African trade
          counters.
        </p>
        <div className="chip-row">
          {CHIPS.map((c) => (
            <Link key={c.query} href={`/search?q=${encodeURIComponent(c.query)}`} className="chip">
              <span aria-hidden="true">{c.icon}</span>
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <DiscoveryFeed posts={posts} />
    </>
  );
}
