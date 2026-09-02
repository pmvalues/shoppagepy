'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import FeedPostCard from './FeedPost';
import type { FeedPost } from '@/lib/feed';
import { showToast } from '@/lib/toast';

type TabId = 'foryou' | 'products' | 'vids' | 'shows' | 'markets' | 'companies';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'foryou', label: 'For You' },
  { id: 'products', label: 'Products' },
  { id: 'vids', label: 'Shorts' },
  { id: 'shows', label: 'Shows' },
  { id: 'markets', label: 'Markets' },
  { id: 'companies', label: 'Companies' },
];

const CATEGORY_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'solar', label: 'Solar' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'tech', label: 'Tech' },
  { id: 'auto', label: 'Auto' },
  { id: 'fmcg', label: 'FMCG' },
];

const PAGE_SIZE = 8;

function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function matchesTab(post: FeedPost, tab: TabId): boolean {
  switch (tab) {
    case 'products':
      return (
        post.kind === 'price_drop' ||
        post.kind === 'sweep' ||
        post.kind === 'new_listing' ||
        post.kind === 'restock' ||
        post.kind === 'demand'
      );
    case 'vids':
      return post.kind === 'short';
    case 'shows':
      return post.kind === 'show';
    case 'markets':
      return post.kind === 'market';
    case 'companies':
      return post.kind === 'company';
    case 'foryou':
    default:
      return true;
  }
}

interface SimulatedInquiry {
  id: string;
  author: string;
  time: string;
  text: string;
  isMerchantReply?: boolean;
}

export default function DiscoveryFeed({ posts: initialPosts }: { posts: FeedPost[] }) {
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(initialPosts);
  const [tab, setTab] = useState<TabId>('foryou');
  const [category, setCategory] = useState<string>('all');
  const [composerText, setComposerText] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasNewPostsBanner, setHasNewPostsBanner] = useState(false);

  // Modals
  const [inquiryPost, setInquiryPost] = useState<FeedPost | null>(null);
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryList, setInquiryList] = useState<Record<string, SimulatedInquiry[]>>({});

  const [repostPost, setRepostPost] = useState<FeedPost | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Character counter ring calculation
  const charLen = composerText.length;
  const isOver = charLen > 280;
  const isNear = 280 - charLen <= 20;
  const ringUsed = Math.min(charLen, 280);
  const ringOffset = 62.83 * (1 - ringUsed / 280);
  const ringColor = isOver ? '#f4212e' : isNear ? '#ffd400' : '#1d9bf0';

  const handleComposerSubmit = () => {
    const trimmed = composerText.trim();
    if (!trimmed || trimmed.length > 280) return;

    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      kind: 'demand',
      author: {
        id: 'user_you',
        name: 'You',
        handle: '@you_za',
        initials: 'Y',
        verified: false,
        href: '/requests',
      },
      timeLabel: 'just now',
      text: trimmed,
      stats: { replies: 0, reposts: 0, likes: 0, saves: 0 },
      cta: { label: 'Sourcing Desk', href: '/requests' },
    };

    setLocalPosts([newPost, ...localPosts]);
    setComposerText('');
    showToast('Your trade inquiry was posted to the network', 'success');
  };

  // Filter posts by Tab and Category
  const filtered = useMemo(() => {
    return localPosts.filter((p) => {
      const matchT = matchesTab(p, tab);
      if (!matchT) return false;
      if (category === 'all') return true;
      return p.category === category;
    });
  }, [localPosts, tab, category]);

  // Reset pagination window on tab or category change
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [tab, category]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Infinite scroll observer
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
      { rootMargin: '800px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  // Track window scroll for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate a live deal pulse after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasNewPostsBanner(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation: j/k for stroll navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'j') {
        window.scrollBy({ top: 380, behavior: 'smooth' });
      } else if (e.key === 'k') {
        window.scrollBy({ top: -380, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHasNewPostsBanner(false);
  };

  // Seed sample inquiries for the active post
  const getInquiriesForPost = useCallback((post: FeedPost): SimulatedInquiry[] => {
    if (inquiryList[post.id]) return inquiryList[post.id];
    const initial: SimulatedInquiry[] = [
      {
        id: 'inq_1',
        author: 'Kagiso M. (Gauteng Contractor)',
        time: '24m ago',
        text: 'Do you offer bulk contractor terms for 10+ units with tax invoice?',
      },
      {
        id: 'inq_2',
        author: post.author.name,
        time: '18m ago',
        text: 'Yes absolutely, VAT invoice provided and trade counter collection ready today.',
        isMerchantReply: true,
      },
    ];
    return initial;
  }, [inquiryList]);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim() || !inquiryPost) return;
    const current = getInquiriesForPost(inquiryPost);
    const updated: SimulatedInquiry[] = [
      ...current,
      {
        id: `inq_${Date.now()}`,
        author: 'You',
        time: 'Just now',
        text: inquiryText.trim(),
      },
    ];
    setInquiryList({ ...inquiryList, [inquiryPost.id]: updated });
    setInquiryText('');
    showToast('Inquiry broadcast to verified trade counter', 'success');
  };

  const handleShareToWhatsApp = () => {
    if (!repostPost) return;
    const url = `${window.location.origin}${repostPost.product?.href || repostPost.cta.href || '/'}`;
    const text = encodeURIComponent(
      `🔥 Check this on Shoppage: ${repostPost.author.name} — ${repostPost.text.slice(0, 100)}...\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setRepostPost(null);
  };

  const handleShareToTwitter = () => {
    if (!repostPost) return;
    const url = `${window.location.origin}${repostPost.product?.href || repostPost.cta.href || '/'}`;
    const text = encodeURIComponent(
      `Check this deal on Shoppage South Africa: ${repostPost.text.slice(0, 120)} #Shoppage ${url}`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setRepostPost(null);
  };

  const handleCopyLink = () => {
    if (!repostPost) return;
    const url = `${window.location.origin}${repostPost.product?.href || repostPost.cta.href || '/'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Deal link copied to clipboard', 'success');
    }
    setRepostPost(null);
  };

  return (
    <div className="discovery-feed-root">
      {/* 1. STICKY TWITTER/X TABS BAR */}
      <div className="feed-sticky-header">
        <div className="feed-tabs" role="tablist" aria-label="Timeline navigation">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`feed-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="feed-tab-label">{t.label}</span>
              {tab === t.id && <span className="feed-tab-indicator" />}
            </button>
          ))}
        </div>

        {/* 2. CATEGORY MICRO-FILTERS */}
        <div className="feed-category-bar" role="toolbar" aria-label="Category filters">
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`category-chip${category === c.id ? ' is-selected' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SLEEK TWITTER/X COMPOSER */}
      <div className="feed-composer">
        <div className="avatar g8" style={{ width: 40, height: 40, flexShrink: 0 }}>
          Y
        </div>
        <div className="cbody" style={{ flex: 1, minWidth: 0 }}>
          <textarea
            rows={1}
            placeholder="What's the deal?! Search 1M+ items or post RFQ..."
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              resize: 'none',
              color: 'inherit',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
              padding: '0.35rem 0',
            }}
          />
          <div className="ctools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle, rgba(231,233,234,0.1))' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link href="/requests" className="category-chip" style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '2px 8px' }}>
                📋 Sourcing Desk
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {charLen > 0 && (
                <div className="ring on" style={{ position: 'relative', width: 24, height: 24 }}>
                  <svg width="24" height="24" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="12" cy="12" r="9" stroke="rgba(231,233,234,0.15)" fill="none" strokeWidth="2.5" />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      strokeWidth="2.5"
                      strokeDasharray="56.54"
                      strokeDashoffset={56.54 * (1 - Math.min(charLen, 280) / 280)}
                      stroke={ringColor}
                    />
                  </svg>
                </div>
              )}
              <button
                type="button"
                className="btn btn-signal btn-sm"
                style={{ borderRadius: '9999px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                disabled={charLen === 0 || isOver}
                onClick={handleComposerSubmit}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TIMELINE STREAM */}
      {shown.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon" aria-hidden="true">
            🔍
          </div>
          <h3>No posts found in this stream</h3>
          <p>Try switching category filters or search across 1M+ products and trade counters.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-signal"
              onClick={() => {
                setTab('foryou');
                setCategory('all');
              }}
            >
              Reset to For You
            </button>
            <Link href="/search" className="btn btn-outline">
              Search Catalog
            </Link>
          </div>
        </div>
      ) : (
        shown.map((post, i) => (
          <FeedPostCard
            key={post.id}
            post={post}
            index={i}
            onOpenInquiry={(p) => setInquiryPost(p)}
            onOpenRepost={(p) => setRepostPost(p)}
          />
        ))
      )}

      {/* 6. INFINITE SCROLL & SKELETON LOADERS */}
      {hasMore && (
        <>
          <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
          <div className="feed-more">
            <div className="feed-stroll-indicator">
              <span className="stroll-spinner" />
              <span>Strolling fresh counter deals...</span>
            </div>
          </div>
        </>
      )}

      {!hasMore && shown.length > 0 && (
        <div className="feed-more">
          <div className="feed-caught-up">
            <span className="checkmark-seal">✓</span>
            <div>
              <strong>You&apos;re completely caught up</strong>
              <p>Checked {filtered.length} live commerce updates on the national grid.</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. FLOATING BACK TO TOP BUTTON */}
      {showScrollTop && (
        <button
          type="button"
          className="feed-back-to-top"
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          title="Back to top (k)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span className="btt-label">Top</span>
        </button>
      )}

      {/* ── MODAL: BUYER DISCUSSION / INQUIRY DRAWER ─────────────────────── */}
      {inquiryPost && (
        <div className="modal-backdrop" onClick={() => setInquiryPost(null)}>
          <div
            className="inquiry-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="inquiry-modal-title"
          >
            <div className="inquiry-modal-head">
              <div>
                <span className="inquiry-badge">Direct Trade Discussion</span>
                <h3 id="inquiry-modal-title" className="inquiry-modal-title">
                  {inquiryPost.author.name}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setInquiryPost(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="inquiry-post-summary">
              <p className="ips-text">{inquiryPost.text}</p>
              {inquiryPost.product && (
                <div className="ips-price-pill">
                  {inquiryPost.product.title} · {typeof inquiryPost.product.priceNow === 'number' && formatZar(inquiryPost.product.priceNow)}
                </div>
              )}
            </div>

            <div className="inquiry-threads-list">
              <h4 className="threads-heading">Customer Inquiries & Trade Questions</h4>
              {getInquiriesForPost(inquiryPost).map((inq) => (
                <div
                  key={inq.id}
                  className={`thread-item${inq.isMerchantReply ? ' is-merchant' : ''}`}
                >
                  <div className="thread-head">
                    <span className="thread-author">{inq.author}</span>
                    {inq.isMerchantReply && <span className="merchant-tag">Verified Merchant</span>}
                    <span className="thread-time">{inq.time}</span>
                  </div>
                  <p className="thread-text">{inq.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendInquiry} className="inquiry-form">
              <textarea
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder={`Ask ${inquiryPost.author.name} about bulk pricing, specs, or delivery...`}
                rows={2}
                className="inquiry-textarea"
                required
              />
              <div className="inquiry-form-actions">
                <span className="ifa-guarantee">🔒 0% take-rate. Deal directly.</span>
                <button type="submit" className="btn btn-signal btn-sm">
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REPOST / SHARE DEAL ───────────────────────────────────── */}
      {repostPost && (
        <div className="modal-backdrop" onClick={() => setRepostPost(null)}>
          <div
            className="share-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="repost-modal-title"
          >
            <div className="share-modal-head">
              <h3 id="repost-modal-title" className="share-modal-title">
                Share Deal to Network
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRepostPost(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="share-modal-sub">
              Broadcast this trade deal directly to WhatsApp groups, Twitter / X, or copy link:
            </p>

            <div className="share-actions-stack">
              <button
                type="button"
                className="share-row-btn is-wa"
                onClick={handleShareToWhatsApp}
              >
                <span className="srb-icon">💬</span>
                <div className="srb-info">
                  <strong>Share to WhatsApp</strong>
                  <span>Broadcast to trade groups and contractor chats</span>
                </div>
              </button>

              <button
                type="button"
                className="share-row-btn is-x"
                onClick={handleShareToTwitter}
              >
                <span className="srb-icon">𝕏</span>
                <div className="srb-info">
                  <strong>Post on X (Twitter)</strong>
                  <span>Share price drop with South African trade community</span>
                </div>
              </button>

              <button
                type="button"
                className="share-row-btn"
                onClick={handleCopyLink}
              >
                <span className="srb-icon">🔗</span>
                <div className="srb-info">
                  <strong>Copy Deal Link</strong>
                  <span>Copy direct clean URL with attribution</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

