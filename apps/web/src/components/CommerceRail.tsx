'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getCommerceTrends, getRecommendedCompanies } from '@/lib/feed';

const VSVG = (
  <svg className="vbadge" viewBox="0 0 24 24" style={{ width: 15, height: 15, verticalAlign: 'middle' }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-10.99 5-3.08-3.08 1.22-1.22 1.86 1.86 5.14-5.14 1.22 1.22L11.26 17z" />
  </svg>
);

const GRADIENTS = ['g1', 'g2', 'g3', 'g5', 'g6', 'g7'];

export default function CommerceRail() {
  const [searchInput, setSearchInput] = useState('');
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const trends = getCommerceTrends();
  const companies = getRecommendedCompanies();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'search', query: searchInput } }),
    );
  };

  const handleTrendClick = (query: string) => {
    setSearchInput(query);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'search', query } }),
    );
  };

  const toggleFollow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* ── SEARCH BOX ─────────────────────────────────────────────────── */}
      <div className="searchwrap">
        <form onSubmit={handleSearchSubmit} className="searchbox">
          <svg viewBox="0 0 24 24">
            <path d="M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-8 6a8 8 0 1 1 14.9 4.45l4.42 4.42-1.42 1.42-4.42-4.42A8 8 0 0 1 2.25 10.25z" />
          </svg>
          <input
            type="search"
            placeholder="Search Shoppage"
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              window.dispatchEvent(
                new CustomEvent('shoppage-nav', { detail: { type: 'search', query: val } }),
              );
            }}
          />
        </form>
      </div>

      {/* ── PROMO CARD: SHOPPAGE VERIFIED ──────────────────────────────── */}
      <div className="rcard promo">
        <h3>Shoppage Verified</h3>
        <p>
          Subscribe to unlock direct supplier messaging, instant price sweep alerts and verified trade badges.
        </p>
        <Link href="/merchant/claim" className="follow" style={{ display: 'inline-block', textAlign: 'center' }}>
          Subscribe
        </Link>
      </div>

      {/* ── TRENDS CARD ─────────────────────────────────────────────────── */}
      <div className="rcard">
        <h3>What&apos;s happening</h3>
        {trends.map((t) => (
          <div
            key={t.tag}
            className="rsub trend"
            onClick={() => handleTrendClick(t.query)}
          >
            <div className="t">
              <div className="cat">{t.category}</div>
              <div className="term">{t.tag}</div>
              <div className="cnt">{t.postsCount}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── VERIFIED COUNTERS TO FOLLOW ─────────────────────────────────── */}
      <div className="rcard">
        <h3>Verified counters to follow</h3>
        {companies.map((c, i) => {
          const isF = following[c.id];
          return (
            <div key={c.id} className="rsub">
              <div className={`avatar ${GRADIENTS[i % GRADIENTS.length]}`}>{c.initials}</div>
              <div className="t">
                <b>
                  {c.name} {c.verified && VSVG}
                </b>
                <span>{c.handle}</span>
              </div>
              <button
                type="button"
                className={`follow${isF ? ' on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(c.id);
                }}
              >
                {isF ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── MZANSI FOOTER ───────────────────────────────────────────────── */}
      <div className="rfoot">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/search">Explore Malls</Link>
        <Link href="/merchant/claim">List Store</Link>
        <div>© 2026 Shoppage (Pty) Ltd · Made in Mzansi 🇿🇦</div>
      </div>
    </>
  );
}
