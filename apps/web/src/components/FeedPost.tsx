'use client';

import { useState } from 'react';
import type { PostItem } from '@/lib/feed';
import { showToast } from '@/lib/toast';

const VSVG = (
  <svg className="vbadge" viewBox="0 0 24 24">
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-10.99 5-3.08-3.08 1.22-1.22 1.86 1.86 5.14-5.14 1.22 1.22L11.26 17z" />
  </svg>
);

function chipClass(t?: string) {
  switch (t) {
    case 'drop':
      return 'chip-drop';
    case 'sweep':
      return 'chip-sweep';
    case 'restock':
      return 'chip-restock';
    case 'bulk':
      return 'chip-bulk';
    default:
      return 'chip-cat';
  }
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export default function FeedPostCard({
  post,
  onLike,
  onRepost,
  onBookmark,
  onReply,
  onGetDeal,
  onOpenDetail,
  isLiked = false,
  isReposted = false,
  isBookmarked = false,
}: {
  post: PostItem;
  onLike?: (id: number | string) => void;
  onRepost?: (id: number | string) => void;
  onBookmark?: (id: number | string) => void;
  onReply?: (handle: string) => void;
  onGetDeal?: (post: PostItem) => void;
  onOpenDetail?: (post: PostItem) => void;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  index?: number;
  onOpenInquiry?: (p: any) => void;
  onOpenRepost?: (p: any) => void;
}) {
  const [localPoll, setLocalPoll] = useState(post.poll);

  const handleVote = (optIdx: number) => {
    if (!localPoll || localPoll.voted !== null) return;
    const nextOpts = localPoll.options.map((opt, i) =>
      i === optIdx ? { ...opt, v: opt.v + 1 } : opt,
    );
    setLocalPoll({ options: nextOpts, voted: optIdx });
    showToast('Thanks — your vote was counted', 'info');
  };

  const totalVotes = localPoll
    ? localPoll.options.reduce((sum, o) => sum + o.v, 0)
    : 0;

  return (
    <article className="post" data-id={post.id}>
      <div className={`avatar ${post.av || 'g8'}`}>{post.ini || 'SP'}</div>
      <div className="pbody">
        <div className="phead">
          <b>{post.name}</b>
          {post.verified && VSVG}
          <span className="h">
            {post.handle}
            {post.time ? ` · ${post.time}` : ''}
          </span>
          <button
            type="button"
            className="more"
            aria-label="Post options"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(`https://shoppage.co.za/post/${post.id}`).catch(() => {});
                showToast('Link copied to clipboard', 'info');
              }
            }}
          >
            ···
          </button>
        </div>

        {(post.badge || post.cat) && (
          <div className="chips">
            {post.badge && (
              <span className={`chip ${chipClass(post.badge.type)}`}>
                {post.badge.label}
              </span>
            )}
            {post.cat && <span className="chip chip-cat">{post.cat}</span>}
          </div>
        )}

        <div
          className="ptext"
          onClick={() => onOpenDetail && onOpenDetail(post)}
          style={{ cursor: onOpenDetail ? 'pointer' : 'default' }}
        >
          {post.text}
        </div>

        {/* Product Embed */}
        {post.product && (
          <div className="product">
            {post.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image} alt={post.product.name} loading="lazy" />
            )}
            <div className="pinfo">
              <div className="pname">{post.product.name}</div>
              <div className="prow">
                <span className="price">{post.product.price}</span>
                {post.product.old && <span className="old">{post.product.old}</span>}
                {post.product.off && <span className="off">{post.product.off}</span>}
              </div>
              {post.product.note && <div className="pnote">{post.product.note}</div>}
              <button
                type="button"
                className="getdeal"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGetDeal) onGetDeal(post);
                }}
              >
                Get deal
              </button>
            </div>
          </div>
        )}

        {/* Poll Embed */}
        {localPoll && (
          <>
            <div
              className={`poll${localPoll.voted !== null ? ' voted' : ''}`}
              data-poll={post.id}
            >
              {localPoll.options.map((opt, i) => {
                const voted = localPoll.voted !== null;
                const isMine = localPoll.voted === i;
                const pct = totalVotes > 0 ? Math.round((opt.v / totalVotes) * 100) : 0;

                if (!voted) {
                  return (
                    <button
                      key={opt.l}
                      type="button"
                      className="opt"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(i);
                      }}
                    >
                      {opt.l}
                    </button>
                  );
                }

                return (
                  <div
                    key={opt.l}
                    className={`opt${isMine ? ' mine' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <div className="bar" style={{ width: `${pct}%` }} />
                    <span className="lbl">
                      <span>
                        {isMine ? '✓ ' : ''}
                        {opt.l}
                      </span>
                      <b>{pct}%</b>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="polltotal">
              {localPoll.voted !== null
                ? `${fmt(totalVotes)} votes · Final results`
                : `${fmt(totalVotes)} votes · 18h left`}
            </div>
          </>
        )}

        {/* Action Bar */}
        <div className="abar">
          <button
            type="button"
            className="ab reply"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDetail) {
                onOpenDetail(post);
              } else if (onReply) {
                onReply(post.handle);
              }
            }}
            aria-label={`Reply (${post.stats.replies})`}
          >
            <span className="icn">
              <svg viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.49 0 8.13 3.64 8.13 8.13 0 2.96-1.61 5.68-4.2 7.11l-8.05 4.46v-3.69h-.07c-4.49.1-8.18-3.51-8.18-8.01z"
                />
              </svg>
            </span>
            {post.stats.replies > 0 ? <span className="cnt">{fmt(post.stats.replies)}</span> : null}
          </button>

          <button
            type="button"
            className={`ab repost${isReposted ? ' on' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onRepost) onRepost(post.id);
            }}
            aria-label={`Repost (${post.stats.reposts + (isReposted ? 1 : 0)})`}
          >
            <span className="icn">
              <svg viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"
                />
              </svg>
            </span>
            {post.stats.reposts + (isReposted ? 1 : 0) > 0 ? (
              <span className="cnt">{fmt(post.stats.reposts + (isReposted ? 1 : 0))}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`ab like${isLiked ? ' on' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onLike) onLike(post.id);
            }}
            aria-label={`Like (${post.stats.likes + (isLiked ? 1 : 0)})`}
          >
            <span className="icn">
              <svg viewBox="0 0 24 24">
                <path
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
            </span>
            {post.stats.likes + (isLiked ? 1 : 0) > 0 ? (
              <span className="cnt">{fmt(post.stats.likes + (isLiked ? 1 : 0))}</span>
            ) : null}
          </button>

          <span style={{ display: 'flex' }}>
            <button
              type="button"
              className={`ab bm${isBookmarked ? ' on' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onBookmark) onBookmark(post.id);
              }}
              aria-label="Bookmark"
            >
              <span className="icn">
                <svg viewBox="0 0 24 24">
                  <path
                    fill={isBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"
                  />
                </svg>
              </span>
            </button>

            <button
              type="button"
              className="ab sh"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(`https://shoppage.co.za/post/${post.id}`).catch(() => {});
                  showToast('Link copied to clipboard', 'info');
                }
              }}
              aria-label="Share"
            >
              <span className="icn">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.6l6 6-1.4 1.4-3.6-3.6V16h-2V6.4L7.4 10 6 8.6l6-6zM21 15v3.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5V15h2v3.5c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5V15h2z" />
                </svg>
              </span>
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
