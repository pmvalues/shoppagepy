'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCommerceTrends, getRecommendedCompanies, formatZar } from '@/lib/feed';
import { SA_MAJOR_RETAILER_DEALS } from '@shoppage/kernel';

const VSVG = (
  <svg className="vbadge" viewBox="0 0 24 24" style={{ width: 15, height: 15, verticalAlign: 'middle' }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-10.99 5-3.08-3.08 1.22-1.22 1.86 1.86 5.14-5.14 1.22 1.22L11.26 17z" />
  </svg>
);

const GRADIENTS = ['g1', 'g2', 'g3', 'g5', 'g6', 'g7'];

const RAIL_RETAILERS = [
  { id: 'all', label: 'All Retailers', count: 1176, icon: '🏢' },
  { id: 'buco', label: 'BUCO Hardware', count: 558, icon: '🟡' },
  { id: 'spar', label: 'SPAR Supermarkets', count: 141, icon: '🟢' },
  { id: 'game', label: 'Game Stores', count: 93, icon: '🔵' },
  { id: 'builders', label: 'Builders Warehouse', count: 69, icon: '🟠' },
  { id: 'bradlows', label: 'Bradlows Furniture', count: 59, icon: '🟤' },
  { id: 'russells', label: 'Russells Home', count: 55, icon: '🔴' },
  { id: 'leroy', label: 'Leroy Merlin', count: 40, icon: '🟢' },
  { id: 'expert', label: 'Expert Stores', count: 31, icon: '🔵' },
  { id: 'makro', label: 'Makro SA', count: 24, icon: '🔴' },
  { id: 'takealot', label: 'Takealot Deals', count: 18, icon: '🔵' },
];

const QUICK_SAVINGS_FILTERS = [
  { label: '🔥 40%+ Off', sort: 'discount' },
  { label: '⚡ Solar & Power', category: 'solar_energy' },
  { label: '🧱 Building & Tools', category: 'hardware' },
  { label: '🍳 Appliances', category: 'appliances' },
  { label: '📱 Tech Deals', category: 'electronics' },
  { label: '🛒 Groceries', category: 'groceries' },
];

export default function CommerceRail() {
  const [searchInput, setSearchInput] = useState('');
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('foryou');
  const [activeRetailer, setActiveRetailer] = useState<string>('all');
  const [syncTopDrops, setSyncTopDrops] = useState<any[]>([]);
  const [totalDeals, setTotalDeals] = useState<number>(1176);

  const trends = getCommerceTrends();
  const companies = getRecommendedCompanies();

  // Top price drops fallback from kernel dataset
  const fallbackTopDrops = useMemo(() => {
    return SA_MAJOR_RETAILER_DEALS
      .filter((d) => typeof d.discountPct === 'number' && d.discountPct > 0)
      .sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0))
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        title: d.title,
        merchant: d.merchantName,
        priceText: formatZar(d.dealPriceZar),
        oldPriceZar: d.oldPriceZar,
        dropPct: d.discountPct,
        image: d.imageUrl,
        url: d.directProductUrl,
      }));
  }, []);

  const displayDrops = syncTopDrops.length > 0 ? syncTopDrops : fallbackTopDrops;

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('shoppage_active_tab');
      if (savedTab) setActiveTab(savedTab);
    } catch {}

    const handleTabChange = (e: CustomEvent) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      if (e.detail?.retailer) {
        setActiveRetailer(e.detail.retailer);
      }
    };

    const handleDealsSync = (e: CustomEvent) => {
      const { totalDeals: td, activeRetailer: ar, topDrops: tdrops } = e.detail || {};
      if (td) setTotalDeals(td);
      if (ar) setActiveRetailer(ar);
      if (Array.isArray(tdrops) && tdrops.length > 0) {
        setSyncTopDrops(tdrops);
      }
    };

    window.addEventListener('shoppage-active-tab' as any, handleTabChange);
    window.addEventListener('shoppage-deals-sync' as any, handleDealsSync);

    return () => {
      window.removeEventListener('shoppage-active-tab' as any, handleTabChange);
      window.removeEventListener('shoppage-deals-sync' as any, handleDealsSync);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'deals') {
      window.dispatchEvent(
        new CustomEvent('shoppage-nav', { detail: { type: 'deal-search', query: searchInput } }),
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('shoppage-nav', { detail: { type: 'search', query: searchInput } }),
      );
    }
  };

  const handleTrendClick = (query: string) => {
    setSearchInput(query);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'search', query } }),
    );
  };

  const handleRetailerClick = (retailerId: string) => {
    setActiveRetailer(retailerId);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'deal-retailer', retailer: retailerId } }),
    );
  };

  const handleCategoryClick = (category: string) => {
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'deal-category', category } }),
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
            placeholder={activeTab === 'deals' ? 'Search verified specials...' : 'Search Shoppage'}
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (activeTab === 'deals') {
                window.dispatchEvent(
                  new CustomEvent('shoppage-nav', { detail: { type: 'deal-search', query: val } }),
                );
              } else {
                window.dispatchEvent(
                  new CustomEvent('shoppage-nav', { detail: { type: 'search', query: val } }),
                );
              }
            }}
          />
        </form>
      </div>

      {activeTab === 'deals' ? (
        /* ── DEALS DEDICATED RIGHT RAIL ───────────────────────────────── */
        <>
          {/* Top Retailer Circular Hotspots */}
          <div className="rcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>🔥 Retailer Specials</h3>
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>
                {totalDeals.toLocaleString()} live
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RAIL_RETAILERS.map((r) => {
                const isActive = activeRetailer === r.id;
                return (
                  <div
                    key={r.id}
                    className={`rail-retailer-row${isActive ? ' active' : ''}`}
                    onClick={() => handleRetailerClick(r.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </span>
                    <span className="rail-retailer-cnt">
                      {r.id === 'all' ? `${totalDeals}` : r.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Deepest Price Drops Leaderboard */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>⚡ Deepest Price Drops</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayDrops.slice(0, 5).map((d) => (
                <a
                  key={d.id || d.title}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rail-drop-item"
                  title={d.title}
                >
                  <div className="rail-drop-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt={d.title} loading="lazy" />
                  </div>
                  <div className="rail-drop-info">
                    <div className="rail-drop-title">{d.title}</div>
                    <div className="rail-drop-meta">{d.merchant.split(' ')[0]}</div>
                    <div className="rail-drop-prices">
                      <span className="rail-drop-price">{d.priceText}</span>
                      {d.dropPct ? (
                        <span className="rail-drop-badge">-{d.dropPct}%</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Savings Filters */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>💰 Quick Categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_SAVINGS_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className="quick-discount-chip"
                  onClick={() => {
                    if (f.category) {
                      handleCategoryClick(f.category);
                    } else if (f.sort) {
                      window.dispatchEvent(
                        new CustomEvent('shoppage-nav', { detail: { type: 'deal-sort', sort: f.sort } }),
                      );
                    }
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Product URL Guarantee Card */}
          <div className="rcard promo" style={{ background: 'color-mix(in srgb, var(--brand) 8%, var(--card))', border: '1px solid color-mix(in srgb, var(--brand) 30%, var(--border))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Verified Direct Checkout
            </h3>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: '6px 0 0', color: 'var(--text2)' }}>
              Unlike flyer-only aggregators, all specials on Shoppage link directly to official retailer transactional web pages for immediate purchase.
            </p>
          </div>
        </>
      ) : (
        /* ── STANDARD COMMERCE RAIL (FEED, MARKETS, PRODUCTS, SHORTS) ── */
        <>
          {/* Promo Card: Shoppage Merchant OS */}
          <div className="rcard promo">
            <h3>Shoppage Merchant OS</h3>
            <p>
              0% take-rate. Claim your verified CIPC trade counter, list wholesale stock, and trade directly on WhatsApp.
            </p>
            <Link href="/merchant/claim" className="follow" style={{ display: 'inline-block', textAlign: 'center' }}>
              Claim your store
            </Link>
          </div>

          {/* Trends Card */}
          <div className="rcard">
            <h3>South Africa Trade Trends</h3>
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

          {/* Verified counters to follow */}
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
        </>
      )}

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
