'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MarketItem, GroupRecentPost } from '@/lib/feed';
import { showToast } from '@/lib/toast';

export default function MarketDetailModal({
  market,
  onClose,
  isJoined = false,
  isFav = false,
  onToggleJoin,
  onToggleFav,
}: {
  market: MarketItem | null;
  onClose: () => void;
  isJoined?: boolean;
  isFav?: boolean;
  onToggleJoin?: (id: string, name: string) => void;
  onToggleFav?: (id: string, name: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'feed' | 'about'>('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [localPosts, setLocalPosts] = useState<GroupRecentPost[]>([]);

  useEffect(() => {
    if (market?.recentPosts) {
      setLocalPosts(market.recentPosts);
    }
  }, [market]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!market) return null;

  const mapsUrl =
    market.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${market.name} ${market.location}`,
    )}`;

  const shareGroup = () => {
    const url = `${window.location.origin}${market.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
      showToast('Group invite link copied to clipboard', 'info');
    }
  };

  const handleGroupPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newListing: GroupRecentPost = {
      id: `usr_grp_${Date.now()}`,
      author: 'You (Verified Trader)',
      time: 'Just now',
      text: newPostContent.trim(),
      verified: true,
    };

    setLocalPosts((prev) => [newListing, ...prev]);
    setNewPostContent('');
    showToast('Listing broadcast to group feed!', 'info');
  };

  const memberCount = market.memberCount || 24500;
  const formattedMembers =
    memberCount >= 1000
      ? `${(memberCount / 1000).toFixed(1)}k`
      : `${memberCount}`;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-modal-title"
    >
      <div
        className="modal-sheet fb-group-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Facebook-style Cover Banner */}
        <div
          className="fb-group-cover-banner"
          style={{ background: market.coverGradient }}
        >
          <div className="fb-cover-badge">
            <span className="dot" />
            {(market.typeLabel || 'COMMUNITY GROUP').toUpperCase()} · {(market.province || 'SOUTH AFRICA').toUpperCase()}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close group modal"
          >
            ✕
          </button>
        </div>

        {/* Group Header Profile */}
        <div className="fb-group-header-block">
          <div className="fb-group-identity">
            <div className={`avatar ${market.avatarClass} fb-group-avatar`}>
              {market.initials}
            </div>
            <div className="fb-group-title-col">
              <div className="fb-group-title-row">
                <h2 id="group-modal-title">{market.name}</h2>
                <span className="vbadge-pill">✓ Verified Group</span>
              </div>
              <div className="fb-group-meta-row">
                <span className="privacy-pill">🌐 Public Group</span>
                <span className="bullet">·</span>
                <span className="meta-text">👥 <b>{formattedMembers}</b> members</span>
                <span className="bullet">·</span>
                <span className="meta-text">💬 <b>{market.dailyPostVolume || 95}</b> posts / day</span>
              </div>
            </div>
          </div>

          {/* Group Action Buttons Bar */}
          <div className="fb-group-actions-bar">
            {onToggleJoin && (
              <button
                type="button"
                className={`fb-btn-join${isJoined ? ' joined' : ''}`}
                onClick={() => onToggleJoin(market.id, market.name)}
              >
                {isJoined ? '✓ Joined Group' : '+ Join Group'}
              </button>
            )}

            {onToggleFav && (
              <button
                type="button"
                className={`fb-btn-fav${isFav ? ' active' : ''}`}
                onClick={() => onToggleFav(market.id, market.name)}
                title={isFav ? 'Remove from favourites' : 'Add to favourites'}
              >
                {isFav ? '★ Favoured' : '☆ Favourite'}
              </button>
            )}

            <button
              type="button"
              className="fb-btn-share"
              onClick={shareGroup}
              title="Share Group Invite"
            >
              📋 Share
            </button>

            {market.externalCommunityUrl && (
              <a
                href={market.externalCommunityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fb-btn-external"
                title="View on Facebook Groups"
              >
                Facebook Group ↗
              </a>
            )}
          </div>
        </div>

        {/* Group Navigation Tabs */}
        <div className="fb-group-nav-tabs">
          <button
            type="button"
            className={`fb-tab-item${activeTab === 'feed' ? ' active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            💬 Group Feed &amp; Listings ({localPosts.length})
          </button>
          <button
            type="button"
            className={`fb-tab-item${activeTab === 'about' ? ' active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            ℹ️ About &amp; Guidelines
          </button>
        </div>

        {/* Tab 1: Group Discussion & Trade Feed */}
        {activeTab === 'feed' && (
          <div className="fb-group-feed-view">
            {/* Quick Composer inside Group */}
            <form className="fb-group-composer" onSubmit={handleGroupPost}>
              <div className="avatar g8 fb-composer-avatar">Y</div>
              <input
                type="text"
                placeholder={`Post an offer or trade request in ${market.name}...`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <button
                type="submit"
                className="fb-composer-submit"
                disabled={!newPostContent.trim()}
              >
                Post
              </button>
            </form>

            {/* List of Community Group Posts */}
            <div className="fb-posts-stream">
              {localPosts.map((post) => (
                <div key={post.id} className="fb-post-item">
                  <div className="fb-post-author-row">
                    <div className="avatar g3 fb-post-author-avatar">
                      {post.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="fb-post-author-details">
                      <div className="fb-author-name-row">
                        <b>{post.author}</b>
                        {post.verified && <span className="vbadge-pill">✓ Member</span>}
                      </div>
                      <span className="fb-post-time">{post.time} · 🌐 Public Listing</span>
                    </div>
                  </div>

                  <p className="fb-post-text">{post.text}</p>

                  {post.price ? (
                    <div className="fb-post-price-badge">
                      🏷️ Listed Price: <b>R {post.price.toLocaleString('en-ZA')}</b>
                    </div>
                  ) : null}

                  <div className="fb-post-actions-row">
                    <a
                      href={`https://wa.me/${post.phone?.replace(/[^0-9]/g, '') || market.whatsapp || '27820000000'}?text=${encodeURIComponent(
                        `Hi ${post.author}, I saw your listing in ${market.name}: "${post.text.slice(0, 70)}..."`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fb-post-btn-contact"
                    >
                      💬 Inquire on WhatsApp
                    </a>
                    <button
                      type="button"
                      className="fb-post-btn-share"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}${market.href}`).catch(() => {});
                          showToast('Listing link copied', 'info');
                        }
                      }}
                    >
                      Share Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: About Group & Guidelines */}
        {activeTab === 'about' && (
          <div className="fb-group-about-view">
            <div className="fb-about-section">
              <h4>About This Trade Community</h4>
              <p>{market.description}</p>
            </div>

            <div className="fb-about-grid">
              <div className="fb-about-card">
                <b>👥 Group Privacy</b>
                <p>Public. Anyone can see who is in the group and what they post.</p>
              </div>
              <div className="fb-about-card">
                <b>🛡️ Moderation</b>
                <p>
                  {market.moderationType === 'cipc_verified_merchants'
                    ? 'CIPC Verified. High-value transactions require proof of registration.'
                    : market.moderationType === 'vetted_trade_only'
                    ? 'Vetted Trade Only. Trade counter credentials required.'
                    : 'Open Public. Instant trade broadcasting enabled.'}
                </p>
              </div>
              <div className="fb-about-card">
                <b>📍 Trade Node</b>
                <p>{market.location}</p>
              </div>
              <div className="fb-about-card">
                <b>🕒 Trading Activity</b>
                <p>{market.operatingHours || '24/7 Live Community Trading Exchange'}</p>
              </div>
            </div>

            {market.zones && market.zones.length > 0 && (
              <div className="fb-about-section" style={{ marginTop: '16px' }}>
                <h4>Specialized Sectors &amp; Zones ({market.zones.length})</h4>
                <div className="zones-list">
                  {market.zones.map((z, i) => (
                    <div key={i} className="zone-chip-item">
                      <span className="zone-name">{z.name}</span>
                      {z.stallCount && <span className="zone-stalls">{z.stallCount} active</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fb-about-section" style={{ marginTop: '16px' }}>
              <h4>Directions &amp; Logistics</h4>
              <div className="location-box">
                <div>
                  <p className="loc-street">🏢 {market.location}</p>
                  {market.landmarks && market.landmarks.length > 0 && (
                    <p className="loc-landmarks">Landmarks: {market.landmarks.join(' · ')}</p>
                  )}
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-map"
                >
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="fb-group-footer">
          <Link
            href={market.href}
            className="btn-browse-stalls"
            onClick={onClose}
          >
            Visit Full Group Hub 🏢
          </Link>
          <a
            href={`https://wa.me/${market.whatsapp || '27820000000'}?text=${encodeURIComponent(
              `Hi Shoppage Admin, I'm inquiring about trading or posting bulk inventory in ${market.name}.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-desk"
          >
            Contact Group Admin 💬
          </a>
        </div>
      </div>
    </div>
  );
}
