'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPlatformStats, getCommerceTrends, getRecommendedCompanies } from '@/lib/feed';
import { SHOWS } from '@/lib/media';
import { showToast } from '@/lib/toast';

function compactStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function CommerceRail() {
  const stats = getPlatformStats();
  const trends = getCommerceTrends();
  const companies = getRecommendedCompanies();
  const featuredShow = SHOWS[0];

  const [followedIds, setFollowedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('shoppage_followed_companies');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) setFollowedIds(list);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFollow = (companyId: string, companyName: string) => {
    const isFollowed = followedIds.includes(companyId);
    const next = isFollowed
      ? followedIds.filter((id) => id !== companyId)
      : [...followedIds, companyId];
    setFollowedIds(next);
    try {
      localStorage.setItem('shoppage_followed_companies', JSON.stringify(next));
      showToast(
        !isFollowed ? `Now following ${companyName}` : `Unfollowed ${companyName}`,
        'info',
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* 1. TWITTER/X TRENDS FOR YOU */}
      <div className="aside-card">
        <div className="aside-head">
          <span className="aside-title">Trends for you</span>
          <span className="aside-pill">
            <span className="live-dot" /> LIVE
          </span>
        </div>
        <div className="aside-body">
          {trends.map((t, i) => (
            <Link
              key={t.tag}
              href={`/search?q=${encodeURIComponent(t.query)}`}
              className="trend-row"
            >
              <span className="trend-rank">{i + 1}</span>
              <span className="trend-main">
                <span className="trend-meta-sub">
                  Trending in {t.label}
                  {t.isHot && <span className="trend-hot-tag">HOT</span>}
                </span>
                <span className="trend-tag-name">{t.tag}</span>
                <span className="trend-meta">{t.postsCount}</span>
              </span>
              <span className="trend-chevron">›</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. VERIFIED COMPANIES TO FOLLOW */}
      <div className="aside-card">
        <div className="aside-head">
          <span className="aside-title">Verified Companies</span>
          <Link href="/merchants" className="aside-more">
            View all
          </Link>
        </div>
        <div className="aside-body">
          {companies.map((comp) => {
            const isFollowing = followedIds.includes(comp.id);
            return (
              <div key={comp.id} className="follow-row">
                <Link href={comp.href} className="follow-avatar">
                  {comp.initials}
                </Link>
                <div className="follow-info">
                  <Link href={comp.href} className="follow-name">
                    <span>{comp.name}</span>
                    <span className="post-verified" title="CIPC Verified">
                      ✓
                    </span>
                  </Link>
                  <span className="follow-handle">{comp.handle}</span>
                  <span className="follow-cat">{comp.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFollow(comp.id, comp.name)}
                  className={`follow-btn${isFollowing ? ' is-following' : ''}`}
                  aria-label={isFollowing ? `Unfollow ${comp.name}` : `Follow ${comp.name}`}
                >
                  {isFollowing ? 'Following' : '+ Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LIVE SHOW SPOTLIGHT */}
      {featuredShow && (
        <div className="aside-card">
          <div className="aside-head">
            <span className="aside-title">Featured Show</span>
            <span className="show-badge-live">HD</span>
          </div>
          <div className="aside-show-preview">
            <div className="asp-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredShow.thumbnailUrl}
                alt={featuredShow.title}
                className="asp-thumb"
              />
              <span className="asp-duration">{featuredShow.duration}</span>
              <Link href="/shows" className="asp-play-overlay" aria-label="Watch show">
                <span>▶</span>
              </Link>
            </div>
            <div className="asp-details">
              <span className="asp-series">{featuredShow.series}</span>
              <h4 className="asp-title">{featuredShow.title}</h4>
              <Link href="/shows" className="btn btn-signal btn-sm btn-block">
                Watch Full Episode →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. THE NATIONAL COMMERCE GRID */}
      <div className="aside-card">
        <div className="aside-head">
          <span className="aside-title">The National Grid</span>
        </div>
        <div className="stat-strip">
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.products)}+</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.merchants)}+</div>
            <div className="stat-label">Merchants</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.markets)}+</div>
            <div className="stat-label">Malls & Hubs</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">0%</div>
            <div className="stat-label">Take rate</div>
          </div>
        </div>
      </div>

      {/* 5. 0% COMMISSION PROMISE & STORE CLAIM */}
      <div className="aside-card" style={{ padding: '1.1rem' }}>
        <div className="aside-title" style={{ marginBottom: '0.4rem' }}>
          Sell on the grid
        </div>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: '0.9rem',
          }}
        >
          List your store free. Keep 100% of every customer transaction — Shoppage charges 0% commission on trade.
        </p>
        <Link href="/merchant/claim" className="btn btn-signal btn-block">
          Claim my store (Free)
        </Link>
      </div>
    </>
  );
}

