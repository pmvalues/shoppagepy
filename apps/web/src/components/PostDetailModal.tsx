'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PostItem } from '@/lib/feed';
import { showToast } from '@/lib/toast';

interface ReplyItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  ini: string;
  time: string;
  text: string;
  verified?: boolean;
}

const DEFAULT_REPLIES: Record<string, ReplyItem[]> = {
  default: [
    {
      id: 'rep_1',
      name: 'Kallie Electrical Wholesalers',
      handle: '@kallie_elect',
      avatar: 'g3',
      ini: 'KE',
      time: '18m',
      text: 'Do you have same-day dispatch to Pretoria if order is placed before 14:00?',
      verified: true,
    },
    {
      id: 'rep_2',
      name: 'AfriTrade Bulk Desk',
      handle: '@afritrade_hq',
      avatar: 'g7',
      ini: 'AT',
      time: '12m',
      text: 'Yes, pallet quantities are in stock in the Crown Mines warehouse. WhatsApp our counter desk for the wholesale invoice.',
      verified: true,
    },
    {
      id: 'rep_3',
      name: 'Highveld Solar & Tooling',
      handle: '@highveld_sol',
      avatar: 'g1',
      ini: 'HS',
      time: '5m',
      text: 'Great pricing on this batch. Tested on two client sites in Centurion and performance is solid.',
      verified: false,
    },
  ],
};

export default function PostDetailModal({
  post,
  onClose,
  onLike,
  onRepost,
  onBookmark,
  isLiked = false,
  isReposted = false,
  isBookmarked = false,
}: {
  post: PostItem | null;
  onClose: () => void;
  onLike?: (id: string | number) => void;
  onRepost?: (id: string | number) => void;
  onBookmark?: (id: string | number) => void;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}) {
  const [replies, setReplies] = useState<ReplyItem[]>(DEFAULT_REPLIES.default);
  const [newReplyText, setNewReplyText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!post) return null;

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim()) return;

    const reply: ReplyItem = {
      id: `rep_${Date.now()}`,
      name: 'You',
      handle: '@you_za',
      avatar: 'g8',
      ini: 'Y',
      time: 'Just now',
      text: newReplyText.trim(),
      verified: true,
    };

    setReplies((prev) => [...prev, reply]);
    setNewReplyText('');
    showToast('Reply published to timeline thread', 'info');
  };

  const shareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://shoppage.co.za/post/${post.id}`).catch(() => {});
      showToast('Post link copied to clipboard', 'info');
    }
  };

  const whatsappInquiryUrl = `https://wa.me/27820000000?text=${encodeURIComponent(
    `Hi Shoppage Trade Desk, I'm inquiring about this post from ${post.name} (${post.handle}): ${
      post.product ? `${post.product.name} - ${post.product.price}` : post.text
    }`,
  )}`;

  return (
    <div className="post-modal-backdrop" onClick={onClose}>
      <div
        className="post-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Post details"
      >
        {/* Modal Header */}
        <div className="post-modal-head">
          <button
            type="button"
            className="post-modal-back"
            onClick={onClose}
            aria-label="Close post details"
          >
            ✕
          </button>
          <span className="post-modal-title">Trade Post &amp; Discussion</span>
          <button
            type="button"
            className="post-modal-share-btn"
            onClick={shareLink}
            title="Copy post link"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="post-modal-body">
          {/* Author info */}
          <div className="post-modal-author-row">
            <div className="post-modal-author-left">
              <div className={`avatar ${post.av || 'g8'}`}>{post.ini || 'SP'}</div>
              <div>
                <div className="post-modal-author-name">
                  <b>{post.name}</b>
                  {post.verified && (
                    <svg className="vbadge" viewBox="0 0 24 24">
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-10.99 5-3.08-3.08 1.22-1.22 1.86 1.86 5.14-5.14 1.22 1.22L11.26 17z" />
                    </svg>
                  )}
                </div>
                <span className="post-modal-author-handle">
                  {post.handle} · {post.time || 'Today'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={`follow-btn${isFollowing ? ' active' : ''}`}
              onClick={() => {
                setIsFollowing(!isFollowing);
                showToast(isFollowing ? `Unfollowed ${post.name}` : `Following ${post.name}`, 'info');
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Badges */}
          {(post.badge || post.cat) && (
            <div className="chips" style={{ margin: '10px 0' }}>
              {post.badge && (
                <span className={`chip chip-${post.badge.type || 'drop'}`}>
                  {post.badge.label}
                </span>
              )}
              {post.cat && <span className="chip chip-cat">{post.cat}</span>}
            </div>
          )}

          {/* Post full text */}
          <div className="post-modal-text">{post.text}</div>

          {/* Embedded Product Card */}
          {post.product && (
            <div className="post-modal-product-card">
              {post.image && (
                <div className="post-modal-product-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt={post.product.name} />
                </div>
              )}
              <div className="post-modal-product-info">
                <h4>{post.product.name}</h4>
                <div className="post-modal-product-price-row">
                  <span className="post-modal-price">{post.product.price}</span>
                  {post.product.old && (
                    <span className="post-modal-old-price">{post.product.old}</span>
                  )}
                  {post.product.off && (
                    <span className="post-modal-savings">{post.product.off}</span>
                  )}
                </div>
                {post.product.note && (
                  <p className="post-modal-note">{post.product.note}</p>
                )}
                <div className="post-modal-cta-row">
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-modal-whatsapp-btn"
                  >
                    💬 Enquire on WhatsApp
                  </a>
                  {post.product.href && (
                    <Link href={post.product.href} className="post-modal-link-btn">
                      View Stockists ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Engagement Metrics Strip */}
          <div className="post-modal-metrics">
            <span>
              <b>{post.stats.replies + replies.length - 3}</b> Replies
            </span>
            <span>
              <b>{post.stats.reposts + (isReposted ? 1 : 0)}</b> Reposts
            </span>
            <span>
              <b>{post.stats.likes + (isLiked ? 1 : 0)}</b> Likes
            </span>
            <span>
              <b>{post.stats.views || '1.4K'}</b> Impressions
            </span>
          </div>

          {/* Action Row */}
          <div className="post-modal-actions">
            <button
              type="button"
              className={`post-action-btn like${isLiked ? ' active' : ''}`}
              onClick={() => onLike && onLike(post.id)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={isLiked ? '#EF4444' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            <button
              type="button"
              className={`post-action-btn repost${isReposted ? ' active' : ''}`}
              onClick={() => onRepost && onRepost(post.id)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
              <span>{isReposted ? 'Reposted' : 'Repost'}</span>
            </button>

            <button
              type="button"
              className={`post-action-btn bookmark${isBookmarked ? ' active' : ''}`}
              onClick={() => onBookmark && onBookmark(post.id)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={isBookmarked ? 'var(--brand)' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z" />
              </svg>
              <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
            </button>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="post-action-btn whatsapp"
              title="Forward to WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Discussion / Replies stream */}
          <div className="post-modal-thread-section">
            <h4 className="post-modal-thread-title">
              Trader Discussion ({replies.length})
            </h4>

            <form onSubmit={handleAddReply} className="post-modal-reply-form">
              <div className="avatar g8" style={{ width: 34, height: 34, fontSize: 13 }}>
                Y
              </div>
              <input
                type="text"
                placeholder={`Reply to ${post.handle}...`}
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
                className="post-modal-reply-input"
              />
              <button
                type="submit"
                disabled={!newReplyText.trim()}
                className="post-modal-reply-submit"
              >
                Reply
              </button>
            </form>

            <div className="post-modal-replies-list">
              {replies.map((r) => (
                <div key={r.id} className="post-modal-reply-item">
                  <div className={`avatar ${r.avatar}`} style={{ width: 34, height: 34, fontSize: 13 }}>
                    {r.ini}
                  </div>
                  <div className="post-modal-reply-content">
                    <div className="post-modal-reply-header">
                      <b>{r.name}</b>
                      {r.verified && (
                        <svg className="vbadge" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-10.99 5-3.08-3.08 1.22-1.22 1.86 1.86 5.14-5.14 1.22 1.22L11.26 17z" />
                        </svg>
                      )}
                      <span className="post-modal-reply-time">
                        {r.handle} · {r.time}
                      </span>
                    </div>
                    <p className="post-modal-reply-text">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
