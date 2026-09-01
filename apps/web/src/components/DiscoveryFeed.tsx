'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import FeedPostCard from './FeedPost';
import type { FeedPost } from '@/lib/feed';

type TabId = 'foryou' | 'deals' | 'fresh' | 'shorts';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'foryou', label: 'For You' },
  { id: 'deals', label: 'Deals' },
  { id: 'fresh', label: 'New & Restocked' },
  { id: 'shorts', label: 'Shorts' },
];

const PAGE_SIZE = 8;

function matchesTab(post: FeedPost, tab: TabId): boolean {
  switch (tab) {
    case 'deals':
      return post.kind === 'price_drop' || post.kind === 'sweep' || post.kind === 'demand';
    case 'fresh':
      return post.kind === 'new_listing' || post.kind === 'restock';
    case 'shorts':
      return post.kind === 'short';
    case 'foryou':
    default:
      return true;
  }
}

export default function DiscoveryFeed({ posts }: { posts: FeedPost[] }) {
  const [tab, setTab] = useState<TabId>('foryou');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => posts.filter((p) => matchesTab(p, tab)), [posts, tab]);

  // Reset the window whenever the timeline changes underneath us.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [tab]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Infinite scroll — a real feed never makes you hunt for the next page.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => v + PAGE_SIZE);
        }
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  return (
    <div>
      <div className="feed-tabs" role="tablist" aria-label="Discovery feed filters">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`feed-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon" aria-hidden="true">
            🔍
          </div>
          <h3>Nothing here yet</h3>
          <p>No posts match this filter right now. Try another tab or run a search.</p>
          <Link href="/search" className="btn btn-signal">
            Search the grid
          </Link>
        </div>
      ) : (
        shown.map((post, i) => <FeedPostCard key={post.id} post={post} index={i} />)
      )}

      {hasMore && (
        <>
          <div ref={sentinelRef} aria-hidden="true" />
          <div className="feed-more">
            <button
              type="button"
              className="feed-more-btn"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Load more
            </button>
          </div>
        </>
      )}

      {!hasMore && shown.length > 0 && (
        <div className="feed-more">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            You&apos;re all caught up · {filtered.length} posts
          </span>
        </div>
      )}
    </div>
  );
}
