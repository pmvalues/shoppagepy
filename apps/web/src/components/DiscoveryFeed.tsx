'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import FeedPostCard, { type PostItem } from './FeedPost';
import { getShorts, type ShortItem } from '@/lib/feed';

type TabType = 'foryou' | 'deals' | 'new' | 'shorts';
type ViewType = 'home' | 'bookmarks';

const CIRC = 62.83;

export default function DiscoveryFeed({ posts: initialPosts }: { posts: PostItem[] }) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [tab, setTab] = useState<TabType>('foryou');
  const [view, setView] = useState<ViewType>('home');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  // Reaction states
  const [liked, setLiked] = useState<Record<string | number, boolean>>({});
  const [reposted, setReposted] = useState<Record<string | number, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string | number, boolean>>({});
  const [playingShortId, setPlayingShortId] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shorts = useMemo(() => getShorts(), []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastOn(false);
    }, 2600);
  };

  // Sync with window events for cart, search, bookmarks from navbar
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      const { type, query } = e.detail || {};
      if (type === 'tab') {
        setTab(query);
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'bookmarks') {
        setView('bookmarks');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'search') {
        setSearch(query || '');
      } else if (type === 'focus-composer') {
        textareaRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('shoppage-nav' as any, handleCustomEvent);
    return () => window.removeEventListener('shoppage-nav' as any, handleCustomEvent);
  }, []);

  // Textarea resizing
  const handleComposerInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComposerText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Character counter ring calculation
  const charLen = composerText.length;
  const isOver = charLen > 280;
  const isNear = 280 - charLen <= 20;
  const ringUsed = Math.min(charLen, 280);
  const ringOffset = CIRC * (1 - ringUsed / 280);
  const ringColor = isOver ? 'var(--red)' : isNear ? 'var(--gold)' : 'var(--blue)';

  const handlePostSubmit = () => {
    const trimmed = composerText.trim();
    if (!trimmed || trimmed.length > 280) return;

    const fullText = replyTo ? `Replying to ${replyTo}\n${trimmed}` : trimmed;
    const newPost: PostItem = {
      id: Date.now(),
      name: 'You',
      handle: '@you_za',
      av: 'g8',
      ini: 'Y',
      verified: false,
      time: 'now',
      tabs: ['foryou'],
      text: fullText,
      stats: { replies: 0, reposts: 0, likes: 0, views: '1' },
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setView('home');
    setTab('foryou');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Your post was sent');
  };

  // Post Actions
  const handleLike = (id: number | string) => {
    setLiked((prev) => {
      const next = !prev[id];
      return { ...prev, [id]: next };
    });
  };

  const handleRepost = (id: number | string) => {
    setReposted((prev) => {
      const next = !prev[id];
      toast(next ? 'Reposted to your followers' : 'Repost removed');
      return { ...prev, [id]: next };
    });
  };

  const handleBookmark = (id: number | string) => {
    setBookmarked((prev) => {
      const next = !prev[id];
      toast(next ? 'Added to your Bookmarks' : 'Removed from Bookmarks');
      return { ...prev, [id]: next };
    });
  };

  const handleShare = (id: number | string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://shoppage.co.za/post/${id}`).catch(() => {});
    }
    toast('Link copied to clipboard');
  };

  const handleReply = (handle: string) => {
    setReplyTo(handle);
    textareaRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetDeal = (post: PostItem) => {
    // Dispatch cart addition event for AppNavbar
    window.dispatchEvent(new CustomEvent('shoppage-cart', { detail: { action: 'add', item: post } }));
    toast(`🛒 ${post.product?.name || 'Deal'} — price locked for 24h`);
  };

  // Filtering
  const q = search.trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    if (view === 'bookmarks') {
      return posts.filter((p) => {
        if (!bookmarked[p.id]) return false;
        if (!q) return true;
        return (p.text + p.name + p.handle).toLowerCase().includes(q);
      });
    }

    return posts.filter((p) => {
      if (tab === 'deals' && !p.badge) return false;
      if (tab === 'new' && !p.tabs.includes('new')) return false;
      if (!q) return true;
      const haystack = (
        p.text +
        ' ' +
        p.name +
        ' ' +
        p.handle +
        ' ' +
        (p.product?.name || '') +
        ' ' +
        (p.cat || '')
      ).toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, tab, view, bookmarked, q]);

  const filteredShorts = useMemo(() => {
    if (!q) return shorts;
    return shorts.filter((s) => s.title.toLowerCase().includes(q));
  }, [shorts, q]);

  return (
    <>
      {/* ── TOPBAR ────────────────────────────────────────────────────────── */}
      <div className="topbar">
        {/* Mobile brand header row */}
        <div className="row1">
          <svg viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231z" />
          </svg>
          <div className="avatar g8" style={{ width: 32, height: 32, fontSize: 13 }}>
            Y
          </div>
        </div>

        {/* Bookmarks view title */}
        <div className={`viewtitle${view === 'bookmarks' ? ' on' : ''}`}>
          <h2>Bookmarks</h2>
          <p>Deals you saved for later</p>
        </div>

        {/* Timeline Tabs */}
        {view === 'home' && (
          <div className="tabs" role="tablist">
            <button
              type="button"
              className={`tab${tab === 'foryou' ? ' on' : ''}`}
              onClick={() => {
                setTab('foryou');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              For You
            </button>
            <button
              type="button"
              className={`tab${tab === 'deals' ? ' on' : ''}`}
              onClick={() => {
                setTab('deals');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Deals
            </button>
            <button
              type="button"
              className={`tab${tab === 'new' ? ' on' : ''}`}
              onClick={() => {
                setTab('new');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              New &amp; Restocked
            </button>
            <button
              type="button"
              className={`tab${tab === 'shorts' ? ' on' : ''}`}
              onClick={() => {
                setTab('shorts');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Shorts
            </button>
          </div>
        )}
      </div>

      {/* ── COMPOSER (Home view only) ─────────────────────────────────────── */}
      {view === 'home' && tab !== 'shorts' && (
        <div className="composer">
          <div className="avatar g8">Y</div>
          <div className="cbody">
            {replyTo && (
              <div className="replyto on">
                <span>Replying to {replyTo}</span>
                <button type="button" onClick={() => setReplyTo(null)}>
                  ✕ Cancel
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="What's the deal?!"
              value={composerText}
              onChange={handleComposerInput}
            />
            <div className="ctools">
              <button
                type="button"
                className="tool"
                title="Media"
                onClick={() => toast('Attach media proof coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13zM5.5 5c-.28 0-.5.22-.5.5v9.58l4.65-4.65a1 1 0 0 1 1.4 0L15 14.35l2.15-2.15a1 1 0 0 1 1.4 0L20 13.6V5.5c0-.28-.22-.5-.5-.5h-14zM19 16.44l-2.55-2.55-2.15 2.15a1 1 0 0 1-1.4 0L9 12.14l-4 4v2.36c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-2.06zM8.75 7a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="tool"
                title="Poll"
                onClick={() => toast('Poll composer coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21v-5.5h2V21H4z" />
                </svg>
              </button>
              <button
                type="button"
                className="tool"
                title="Emoji"
                onClick={() => toast('Emoji picker coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM8.5 8A1.5 1.5 0 1 0 10 9.5 1.5 1.5 0 0 0 8.5 8zm7 0A1.5 1.5 0 1 0 17 9.5 1.5 1.5 0 0 0 15.5 8zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="tool"
                title="Location"
                onClick={() => toast('Trade counter geotag coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" />
                </svg>
              </button>

              <div className="cright">
                <div className={`ring${charLen > 0 ? ' on' : ''}`}>
                  <svg width="26" height="26">
                    <circle className="bgc" cx="13" cy="13" r="10" />
                    <circle
                      className="fgc"
                      cx="13"
                      cy="13"
                      r="10"
                      strokeDasharray="62.83"
                      strokeDashoffset={ringOffset}
                      stroke={ringColor}
                    />
                  </svg>
                  <span className="num" style={{ color: isOver ? 'var(--red)' : 'var(--text2)' }}>
                    {isOver ? charLen - 280 : isNear ? 280 - charLen : ''}
                  </span>
                </div>

                <button
                  type="button"
                  className="send"
                  disabled={charLen === 0 || isOver}
                  onClick={handlePostSubmit}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED OR SHORTS ────────────────────────────────────────────────── */}
      <div id="feed">
        {tab === 'shorts' && view === 'home' ? (
          filteredShorts.length > 0 ? (
            <div className="shorts">
              {filteredShorts.map((s) => {
                const isPlaying = playingShortId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`short${isPlaying ? ' playing' : ''}`}
                    style={{ backgroundImage: `url('${s.img}')` }}
                    onClick={() => setPlayingShortId(isPlaying ? null : s.id)}
                  >
                    <span className="play">
                      <svg className="p" viewBox="0 0 24 24">
                        <path d={isPlaying ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' : 'M8 5v14l11-7z'} />
                      </svg>
                    </span>
                    <span className="dur">{s.dur}</span>
                    <span className="smeta">
                      <h4>{s.title}</h4>
                      <span>{s.views}</span>
                    </span>
                    <span className="prog" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <h3>No Shorts found</h3>
              <p>Try a different search query.</p>
            </div>
          )
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              isLiked={liked[post.id]}
              isReposted={reposted[post.id]}
              isBookmarked={bookmarked[post.id]}
              onLike={handleLike}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onReply={handleReply}
              onGetDeal={handleGetDeal}
            />
          ))
        ) : (
          <div className="empty">
            {view === 'bookmarks' ? (
              <>
                <h3>Save deals for later</h3>
                <p>Tap the bookmark icon on any post and it will land here.</p>
              </>
            ) : (
              <>
                <h3>Nothing here yet</h3>
                <p>
                  No posts match &quot;{search}&quot; in this stream. Try the For You timeline.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      <div className={`toast${toastOn ? ' on' : ''}`}>{toastMsg}</div>
    </>
  );
}
