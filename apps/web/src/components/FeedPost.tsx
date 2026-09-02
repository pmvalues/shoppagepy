'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatViews, formatZar, type FeedKind, type FeedPost } from '@/lib/feed';
import { showToast } from '@/lib/toast';

const EVENT_LABEL: Record<FeedKind, string> = {
  price_drop: 'Price Drop',
  sweep: 'Price Sweep',
  new_listing: 'New Listing',
  restock: 'Back in Stock',
  short: 'Video Proof',
  show: 'Original Series',
  market: 'Wholesale Market',
  company: 'Verified Company',
  demand: 'Buyer Demand',
  sponsored: 'Sponsored',
};

const EVENT_CLASS: Record<FeedKind, string> = {
  price_drop: 'is-drop',
  sweep: 'is-sweep',
  new_listing: 'is-new',
  restock: 'is-restock',
  short: 'is-short',
  show: 'is-show',
  market: 'is-market',
  company: 'is-company',
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

/* ── Twitter/X Style Icons ─────────────────────────────────────────────── */

function ReplyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? '#FF3B5C' : 'none'} stroke={filled ? '#FF3B5C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function FeedPostCard({
  post,
  index = 0,
  onOpenInquiry,
  onOpenRepost,
}: {
  post: FeedPost;
  index?: number;
  onOpenInquiry?: (post: FeedPost) => void;
  onOpenRepost?: (post: FeedPost) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [saves, setSaves] = useState(post.stats.saves);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.stats.likes);
  const [reposted, setReposted] = useState(false);
  const [reposts, setReposts] = useState(post.stats.reposts || 0);
  const [following, setFollowing] = useState(false);

  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hydrate states from localStorage
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('shoppage_saved_posts');
      if (savedRaw) {
        const list = JSON.parse(savedRaw) as string[];
        if (Array.isArray(list) && list.includes(post.id)) setSaved(true);
      }

      const likedRaw = localStorage.getItem('shoppage_liked_posts');
      if (likedRaw) {
        const list = JSON.parse(likedRaw) as string[];
        if (Array.isArray(list) && list.includes(post.id)) setLiked(true);
      }

      const repostedRaw = localStorage.getItem('shoppage_reposted_posts');
      if (repostedRaw) {
        const list = JSON.parse(repostedRaw) as string[];
        if (Array.isArray(list) && list.includes(post.id)) setReposted(true);
      }

      if (post.company) {
        const followedRaw = localStorage.getItem('shoppage_followed_companies');
        if (followedRaw) {
          const list = JSON.parse(followedRaw) as string[];
          if (Array.isArray(list) && list.includes(post.company.id)) setFollowing(true);
        }
      }
    } catch {
      /* storage unavailable */
    }
  }, [post.id, post.company]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    setSaves((n) => n + (next ? 1 : -1));
    try {
      const raw = localStorage.getItem('shoppage_saved_posts');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const nextList = next ? [...new Set([...list, post.id])] : list.filter((id) => id !== post.id);
      localStorage.setItem('shoppage_saved_posts', JSON.stringify(nextList));
      showToast(next ? 'Saved to your Watchlist' : 'Removed from Watchlist', 'success');
    } catch {
      /* ignore */
    }
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const raw = localStorage.getItem('shoppage_liked_posts');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const nextList = next ? [...new Set([...list, post.id])] : list.filter((id) => id !== post.id);
      localStorage.setItem('shoppage_liked_posts', JSON.stringify(nextList));
    } catch {
      /* ignore */
    }
  };

  const toggleRepost = () => {
    if (onOpenRepost) {
      onOpenRepost(post);
      return;
    }
    const next = !reposted;
    setReposted(next);
    setReposts((n) => n + (next ? 1 : -1));
    try {
      const raw = localStorage.getItem('shoppage_reposted_posts');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const nextList = next ? [...new Set([...list, post.id])] : list.filter((id) => id !== post.id);
      localStorage.setItem('shoppage_reposted_posts', JSON.stringify(nextList));
      showToast(next ? 'Deal reposted to your network' : 'Deal repost removed', 'info');
    } catch {
      /* ignore */
    }
  };

  const toggleFollow = () => {
    if (!post.company) return;
    const compId = post.company.id;
    const next = !following;
    setFollowing(next);
    try {
      const raw = localStorage.getItem('shoppage_followed_companies');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const nextList = next ? [...new Set([...list, compId])] : list.filter((id) => id !== compId);
      localStorage.setItem('shoppage_followed_companies', JSON.stringify(nextList));
      showToast(next ? `Now following ${post.author.name}` : `Unfollowed ${post.author.name}`, 'info');
    } catch {
      /* ignore */
    }
  };

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) {
      setIsPlaying(true);
      return;
    }
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    } else {
      setIsMuted((m) => !m);
    }
  };

  return (
    <article
      className="post"
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      aria-labelledby={`post-author-${post.id}`}
    >
      {/* 1. Author Avatar */}
      <div
        className={`post-avatar${post.author.verified ? ' is-verified' : ''}`}
        style={{ background: gradientFor(post.author.id) }}
        aria-hidden="true"
      >
        {post.author.initials}
      </div>

      {/* 2. Main Post Body */}
      <div className="post-body">
        {/* Post Header Line */}
        <div className="post-head">
          <Link href={post.author.href} className="post-name" id={`post-author-${post.id}`}>
            {post.author.name}
          </Link>
          {post.author.verified && (
            <span className="post-verified" title="CIPC verified trade counter">
              <VerifiedIcon />
              <span className="visually-hidden">Verified</span>
            </span>
          )}
          <span className="post-meta">{post.author.handle}</span>
          <span className="post-dot">·</span>
          <span className="post-meta">{post.timeLabel}</span>
          <span className="post-dot">·</span>
          <span className="post-event-subtle">{EVENT_LABEL[post.kind]}</span>

          {post.company && (
            <button
              type="button"
              onClick={toggleFollow}
              className={`follow-pill-btn${following ? ' is-following' : ''}`}
              style={{ marginLeft: 'auto' }}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Text Content */}
        <p className="post-text">{post.text}</p>

        {/* ── EMBED: PRODUCT ────────────────────────────────────────────── */}
        {post.product && (
          <Link href={post.product.href} className="post-product">
            <div className="post-product-media" aria-hidden="true">
              {post.product.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={post.product.imageUrl}
                  alt={post.product.title}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const span = document.createElement('span');
                      span.className = 'post-product-emoji';
                      span.innerText = post.product?.emoji || '📦';
                      target.parentElement.appendChild(span);
                    }
                  }}
                />
              ) : (
                <span className="post-product-emoji">{post.product.emoji}</span>
              )}
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
                  <span className="price-drop">▼ {post.product.dropPct}% OFF</span>
                ) : null}
              </div>
            </div>
          </Link>
        )}

        {/* ── EMBED: VIDEO SHORT (9:16 INLINE PLAYER) ────────────────────── */}
        {post.kind === 'short' && post.media && (
          <div className="post-video-container">
            {isPlaying ? (
              <video
                ref={videoRef}
                src={post.media.videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                loop
                className="post-inline-video"
                onClick={toggleVideoPlay}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.media.thumbnailUrl}
                alt={post.text}
                className="post-video-thumb"
              />
            )}

            <div className="post-video-overlay" onClick={toggleVideoPlay}>
              {!isPlaying && (
                <div className="post-play-badge">
                  <PlayIcon />
                </div>
              )}
            </div>

            <div className="post-video-controls">
              <button
                type="button"
                className="video-ctrl-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                <VolumeIcon muted={isMuted} />
              </button>

              <span className="post-duration">{post.media.duration}</span>
            </div>

            {post.product && (
              <Link href={post.product.href} className="video-product-pill">
                <span className="vpp-emoji">{post.product.emoji}</span>
                <span className="vpp-title">{post.product.title}</span>
                {typeof post.product.priceNow === 'number' && (
                  <span className="vpp-price">{formatZar(post.product.priceNow)}</span>
                )}
              </Link>
            )}
          </div>
        )}

        {/* ── EMBED: SHOW EPISODE ───────────────────────────────────────── */}
        {post.kind === 'show' && post.show && (
          <div className="post-show-card">
            <div className="post-show-media" onClick={() => setIsPlaying(true)}>
              {isPlaying ? (
                <video
                  ref={videoRef}
                  src={post.show.videoUrl}
                  autoPlay
                  playsInline
                  controls
                  className="post-show-video"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.show.thumbnailUrl}
                    alt={post.show.title}
                    className="post-show-thumb"
                  />
                  <div className="post-video-overlay">
                    <div className="post-play-badge is-show-play">
                      <PlayIcon />
                    </div>
                  </div>
                  <span className="post-duration">{post.show.duration}</span>
                </>
              )}
            </div>

            <div className="post-show-info">
              <div className="post-show-header">
                <span className="post-series-chip">{post.show.series}</span>
                <span className="post-runtime-label">{post.show.duration}</span>
              </div>
              <h3 className="post-show-title">{post.show.title}</h3>
              {post.show.featuredProducts && post.show.featuredProducts.length > 0 && (
                <Link href="/shows" className="post-show-products-link">
                  📦 {post.show.featuredProducts.length} verified products in this episode · Watch now →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── EMBED: WHOLESALE MARKET SPOTLIGHT ───────────────────────────── */}
        {post.kind === 'market' && post.market && (
          <Link href={post.market.href} className="post-market-card">
            <div className="post-market-thumb-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.market.imageUrl || 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop'}
                alt={post.market.name}
                className="post-market-thumb"
              />
            </div>
            <div className="post-market-details">
              <div className="post-market-name">{post.market.name}</div>
              <div className="post-market-meta">🏢 {post.market.stallCount}+ Stalls · {post.market.province}</div>
              <div className="post-market-address">{post.market.address}</div>
            </div>
          </Link>
        )}

        {/* ── EMBED: COMPANY SHOWCASE ─────────────────────────────────────── */}
        {post.kind === 'company' && post.company && (
          <div className="post-company-card">
            <div className="post-company-main">
              <div className="post-company-avatar">
                {post.author.initials}
              </div>
              <div className="post-company-info">
                <div className="post-company-name-row">
                  <span className="post-company-name">{post.company.name}</span>
                  <span className="post-verified">✓</span>
                </div>
                <span className="post-company-cat">{post.company.primaryCategory} · {post.company.province}</span>
                <span className="post-company-address">{post.company.address}</span>
              </div>
            </div>
            {post.company.whatsapp && (
              <a
                href={`https://wa.me/${post.company.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="post-company-wa-btn"
              >
                💬 WhatsApp Trade Counter
              </a>
            )}
          </div>
        )}

        {/* ── EMBED: COMMUNITY POLL ─────────────────────────────────────── */}
        {post.poll && (
          <div className="post-poll-wrap">
            <div className={`poll${post.poll.voted !== null ? ' voted' : ''}`}>
              {post.poll.options.map((opt, i) => {
                const voted = post.poll?.voted !== null && post.poll?.voted !== undefined;
                const total = post.poll?.options.reduce((s, o) => s + o.v, 0) || 1;
                const pct = Math.round((opt.v / total) * 100);
                const isMine = post.poll?.voted === i;

                if (!voted) {
                  return (
                    <button
                      key={opt.l}
                      type="button"
                      className="opt"
                      onClick={() => {
                        if (post.poll) {
                          post.poll.options[i].v += 1;
                          post.poll.voted = i;
                          showToast('Thanks — your vote was counted', 'info');
                        }
                      }}
                    >
                      {opt.l}
                    </button>
                  );
                }

                return (
                  <div key={opt.l} className={`opt${isMine ? ' mine' : ''}`} style={{ cursor: 'default' }}>
                    <div className="bar" style={{ width: `${pct}%` }} />
                    <span className="lbl">
                      <span>{isMine ? '✓ ' : ''}{opt.l}</span>
                      <b>{pct}%</b>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="polltotal">
              {post.poll.options.reduce((s, o) => s + o.v, 0).toLocaleString()} votes · {post.poll.voted !== null ? 'Final results' : '18h left'}
            </div>
          </div>
        )}

        {/* Social Proof Line */}
        {post.viewers ? (
          <div className="post-proof">
            <span className="live-dot" />
            {post.viewers} trade buyers viewing right now
          </div>
        ) : null}

        {/* ── TWITTER/X INTERACTION BAR ─────────────────────────────────── */}
        <div className="post-actions" role="toolbar" aria-label="Tweet commerce actions">
          {/* Reply / Discuss */}
          <button
            type="button"
            className="post-action is-reply"
            onClick={() => onOpenInquiry && onOpenInquiry(post)}
            aria-label={`Reply (${post.stats.replies})`}
            title="Ask a question or inquire on this listing"
          >
            <ReplyIcon />
            <span className="post-action-count">{post.stats.replies}</span>
          </button>

          {/* Repost / Retweet */}
          <button
            type="button"
            className={`post-action is-repost${reposted ? ' is-reposted' : ''}`}
            onClick={toggleRepost}
            aria-label={`Repost (${reposts})`}
            title="Repost or share deal"
          >
            <RepostIcon />
            <span className="post-action-count">{reposts}</span>
          </button>

          {/* Like */}
          <button
            type="button"
            className={`post-action is-like${liked ? ' is-liked' : ''}`}
            onClick={toggleLike}
            aria-label={`Like (${likes})`}
            title={liked ? 'Unlike' : 'Like'}
          >
            <HeartIcon filled={liked} />
            <span className="post-action-count">{likes}</span>
          </button>

          {/* Bookmark / Watchlist */}
          <button
            type="button"
            className={`post-action is-bookmark${saved ? ' is-saved' : ''}`}
            onClick={toggleSave}
            aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
            title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
          >
            <BookmarkIcon filled={saved} />
            <span className="post-action-count">{saves}</span>
          </button>

          {/* Views / Impressions */}
          <div className="post-action is-views" title="Total impressions">
            <ChartIcon />
            <span className="post-action-count">
              {post.media ? formatViews(post.media.views) : `${formatViews((post.stats.likes * 14) + 120)}`}
            </span>
          </div>

          {/* Direct CTA */}
          <div style={{ marginLeft: 'auto' }}>
            {post.cta.external ? (
              <a
                href={post.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`post-cta${post.cta.whatsapp ? ' is-whatsapp' : ''}`}
              >
                {post.cta.whatsapp ? '💬 ' : ''}
                {post.cta.label}
              </a>
            ) : (
              <Link href={post.cta.href} className="post-cta">
                {post.cta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

