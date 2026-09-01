'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatViews, formatZar, type FeedKind, type FeedPost } from '@/lib/feed';

const EVENT_LABEL: Record<FeedKind, string> = {
  price_drop: 'Price drop',
  sweep: 'Price sweep',
  new_listing: 'New listing',
  restock: 'Back in stock',
  short: 'Video proof',
  demand: 'Buyer demand',
  sponsored: 'Sponsored',
};

const EVENT_CLASS: Record<FeedKind, string> = {
  price_drop: 'is-drop',
  sweep: 'is-sweep',
  new_listing: 'is-new',
  restock: 'is-restock',
  short: 'is-short',
  demand: 'is-demand',
  sponsored: 'is-sponsored',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0B0F14 0%, #334155 100%)',
  'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #134E4A 0%, #14B8A6 100%)',
  'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)',
  'linear-gradient(135deg, #581C87 0%, #A855F7 100%)',
  'linear-gradient(135deg, #164E63 0%, #0891B2 100%)',
];

function gradientFor(id: string): string {
  let total = 0;
  for (let i = 0; i < id.length; i += 1) total += id.charCodeAt(i);
  return AVATAR_GRADIENTS[total % AVATAR_GRADIENTS.length];
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function ReplyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 1.6 2.7-.2.9 2.6 2.4 1.3-.7 2.6.7 2.6-2.4 1.3-.9 2.6-2.7-.2L12 22l-2.2-1.6-2.7.2-.9-2.6L3.8 16.7l.7-2.6-.7-2.6 2.4-1.3.9-2.6 2.7.2z" />
      <path d="M8.8 12.2l2.1 2.1 4.3-4.3" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function FeedPostCard({ post, index = 0 }: { post: FeedPost; index?: number }) {
  const [saved, setSaved] = useState(false);
  const [saves, setSaves] = useState(post.stats.saves);

  // Hydrate saved state after mount so server and client markup agree.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('shoppage_saved_posts');
      if (raw) {
        const list = JSON.parse(raw) as string[];
        if (Array.isArray(list) && list.includes(post.id)) setSaved(true);
      }
    } catch {
      /* storage unavailable — saved state stays session-only */
    }
  }, [post.id]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    setSaves((n) => n + (next ? 1 : -1));
    try {
      const raw = localStorage.getItem('shoppage_saved_posts');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const nextList = next ? [...new Set([...list, post.id])] : list.filter((id) => id !== post.id);
      localStorage.setItem('shoppage_saved_posts', JSON.stringify(nextList));
    } catch {
      /* ignore quota / private mode */
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${post.product?.href ?? '/'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.author.name, text: post.text, url });
        return;
      } catch {
        /* user dismissed the sheet */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <article
      className="post"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      aria-labelledby={`post-author-${post.id}`}
    >
      <div
        className={`post-avatar${post.author.verified ? ' is-verified' : ''}`}
        style={{ background: gradientFor(post.author.id) }}
        aria-hidden="true"
      >
        {post.author.initials}
      </div>

      <div className="post-body">
        <div className="post-head">
          <Link href={post.author.href} className="post-name" id={`post-author-${post.id}`}>
            {post.author.name}
          </Link>
          {post.author.verified && (
            <span className="post-verified" title="CIPC verified merchant">
              <VerifiedIcon />
              <span className="visually-hidden">Verified</span>
            </span>
          )}
          <span className="post-meta">{post.author.handle}</span>
          <span className="post-dot">·</span>
          <span className="post-meta">{post.timeLabel}</span>
        </div>

        <span className={`post-event ${EVENT_CLASS[post.kind]}`}>{EVENT_LABEL[post.kind]}</span>

        <p className="post-text">{post.text}</p>

        {post.product && (
          <Link href={post.product.href} className="post-product">
            <div className="post-product-media" aria-hidden="true">
              <span className="post-product-emoji">{post.product.emoji}</span>
            </div>
            <div className="post-product-info">
              <div className="post-product-title">{post.product.title}</div>
              <div className="post-product-merchant">
                {post.product.brand}
                {post.product.sellerCount > 0 &&
                  (post.product.verifiedSellers > 0
                    ? ` · ${post.product.verifiedSellers} verified · ${post.product.sellerCount} sources`
                    : ` · ${post.product.sellerCount} web sources`)}
              </div>
              <div className="price-row">
                {typeof post.product.priceNow === 'number' && (
                  <span className="price-now">{formatZar(post.product.priceNow)}</span>
                )}
                {typeof post.product.priceWas === 'number' && (
                  <span className="price-was">{formatZar(post.product.priceWas)}</span>
                )}
                {post.product.dropPct ? (
                  <span className="price-drop">▼ {post.product.dropPct}%</span>
                ) : null}
              </div>
            </div>
          </Link>
        )}

        {post.media && (
          <Link href={post.cta.href} className="post-media">
            {/* Real thumbnail from the media catalogue */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media.thumbnailUrl}
              alt={post.text}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span className="post-play">
              <span className="post-play-badge">
                <PlayIcon />
              </span>
            </span>
            <span className="post-duration">{post.media.duration}</span>
          </Link>
        )}

        {post.viewers ? (
          <div className="post-proof">
            <span className="live-dot" />
            {post.viewers} people checking this right now
          </div>
        ) : null}

        <div className="post-actions">
          <button type="button" className="post-action" aria-label={`Reply (${post.stats.replies})`}>
            <ReplyIcon />
            <span className="post-action-count">{post.stats.replies}</span>
          </button>

          <button
            type="button"
            className={`post-action${saved ? ' is-saved' : ''}`}
            onClick={toggleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
          >
            <SaveIcon filled={saved} />
            <span className="post-action-count">{saves}</span>
          </button>

          <button type="button" className="post-action" onClick={share} aria-label="Share">
            <ShareIcon />
          </button>

          {post.media ? (
            <span className="post-proof" style={{ marginLeft: 'auto', marginTop: 0 }}>
              {formatViews(post.media.views)} views
            </span>
          ) : null}

          {post.cta.external ? (
            <a
              href={post.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`post-cta${post.cta.whatsapp ? ' is-whatsapp' : ''}`}
              style={post.media ? { marginLeft: 0 } : undefined}
            >
              {post.cta.whatsapp ? '💬 ' : ''}
              {post.cta.label}
            </a>
          ) : (
            <Link
              href={post.cta.href}
              className="post-cta"
              style={post.media ? { marginLeft: 0 } : undefined}
            >
              {post.cta.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
