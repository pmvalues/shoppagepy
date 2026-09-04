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

// Products: Category Breakdown
const RAIL_PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All Categories', count: '91,713', icon: '📦' },
  { id: 'fmcg', label: 'Wholesale FMCG', count: '76,000+', icon: '🛒' },
  { id: 'hardware', label: 'Building & Tools', count: '5,000+', icon: '🧱' },
  { id: 'packaging', label: 'Packaging & Catering', count: '3,500+', icon: '📦' },
  { id: 'automotive', label: 'Automotive Spares', count: '2,800+', icon: '🚗' },
  { id: 'electronics', label: 'Phones & Tech', count: '2,500+', icon: '📱' },
  { id: 'solar', label: 'Solar & Power', count: '1,200+', icon: '⚡' },
];

const QUICK_PRODUCT_FILTERS = [
  { label: '🔥 Biggest Drop', sort: 'drop' },
  { label: '🏢 Most Stockists', sort: 'sellers' },
  { label: '⚡ Solar & Power', category: 'solar' },
  { label: '🛒 Bulk FMCG', category: 'fmcg' },
  { label: '🧱 Building & Tools', category: 'hardware' },
  { label: '📱 Phones & Tech', category: 'electronics' },
  { label: '🏷️ Price: Low to High', sort: 'price_asc' },
];

const FALLBACK_TOP_PRODUCTS = [
  {
    id: 'prod_deye_5kw',
    title: 'Deye 5kW Hybrid Inverter SG03LP1',
    brand: 'Deye',
    merchant: 'SolarAdvice',
    priceText: 'R 18,499',
    dropPct: 20,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=120&auto=format&fit=crop&q=60',
    url: '/p/prod_deye_5kw',
  },
  {
    id: 'prod_dyness_5kwh',
    title: 'Dyness 5.12kWh Lithium Battery BX51100',
    brand: 'Dyness',
    merchant: 'Inverter Warehouse',
    priceText: 'R 22,999',
    dropPct: 16,
    image: 'https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=120&auto=format&fit=crop&q=60',
    url: '/p/prod_dyness_5kwh',
  },
  {
    id: 'prod_redmi_13c',
    title: 'Xiaomi Redmi 13C 128GB Midnight Black',
    brand: 'Xiaomi',
    merchant: 'Takealot Verified',
    priceText: 'R 2,499',
    dropPct: 22,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&auto=format&fit=crop&q=60',
    url: '/p/prod_redmi_13c',
  },
  {
    id: 'prod_cement_ppc',
    title: 'Pretoria Portland Cement (PPC) Surebuild 50kg',
    brand: 'PPC Cement',
    merchant: 'BUCO Trade Counter',
    priceText: 'R 108',
    dropPct: 14,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&auto=format&fit=crop&q=60',
    url: '/p/prod_cement_ppc',
  },
  {
    id: 'prod_maize_pallet',
    title: 'White Star Super Maize Meal 10kg (Pallet of 100)',
    brand: 'White Star',
    merchant: 'Crown Mines Wholesale FMCG',
    priceText: 'R 4,850',
    dropPct: 10,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=60',
    url: '/p/prod_maize_pallet',
  },
];

// Markets: Trade Corridors / Provinces
// Markets: Community Sectors & Guilds
const RAIL_COMMUNITY_SECTORS = [
  { id: 'all', label: 'All Groups & Hubs', count: '100+', icon: '🇿🇦' },
  { id: 'joined', label: 'Joined Groups', countKey: 'joined', icon: '👥' },
  { id: 'fav', label: 'Favoured Guilds', countKey: 'fav', icon: '⭐' },
  { id: 'solar', label: 'Solar & Inverter Guilds', count: '16', icon: '⚡' },
  { id: 'contractor', label: 'Contractors & Hardware', count: '14', icon: '🧱' },
  { id: 'fmcg', label: 'Spaza & FMCG Bulk', count: '12', icon: '🛒' },
  { id: 'auto', label: 'Auto Parts & Spares', count: '10', icon: '🚗' },
  { id: 'wholesale', label: 'Wholesale Importers', count: '12', icon: '🏢' },
  { id: 'packaging', label: 'Catering & Packaging', count: '8', icon: '📦' },
  { id: 'malls', label: 'Commercial Malls', count: '10', icon: '🏬' },
];

const FEATURED_COMMUNITY_GROUPS = [
  {
    id: 'grp_sandton_buy_sell',
    name: 'Sandton Community Buy & Sell',
    location: 'Sandton, Johannesburg',
    members: '42.5K members',
    dailyPosts: '140 posts/day',
    tag: 'Public Group',
    initials: 'SC',
    avatarClass: 'g1',
    query: 'Sandton',
  },
  {
    id: 'grp_pta_solar',
    name: 'Pretoria Solar & Inverter Guild',
    location: 'Pretoria East & Centurion',
    members: '28.4K members',
    dailyPosts: '95 posts/day',
    tag: 'Solar & Power',
    initials: 'PS',
    avatarClass: 'g2',
    query: 'Solar',
  },
  {
    id: 'grp_crown_mines_importers',
    name: 'Crown Mines Wholesale Importers',
    location: 'Crown Mines & Amalgam, JHB',
    members: '51.2K members',
    dailyPosts: '210 posts/day',
    tag: 'Direct Import Hub',
    initials: 'CM',
    avatarClass: 'g3',
    query: 'Crown Mines',
  },
  {
    id: 'grp_east_rand_contractors',
    name: 'East Rand Contractors Network',
    location: 'Boksburg & Benoni, Gauteng',
    members: '19.8K members',
    dailyPosts: '75 posts/day',
    tag: 'Building & Civils',
    initials: 'ER',
    avatarClass: 'g5',
    query: 'Contractor',
  },
  {
    id: 'grp_durban_fmcg',
    name: 'Durban Coastal FMCG Exchange',
    location: 'Durban Central & Pinetown',
    members: '33.1K members',
    dailyPosts: '120 posts/day',
    tag: 'Wholesale FMCG',
    initials: 'DC',
    avatarClass: 'g6',
    query: 'FMCG',
  },
];

const QUICK_COMMUNITY_FILTERS = [
  { label: '👥 Joined Groups', filter: 'joined' },
  { label: '⭐ Favoured', filter: 'fav' },
  { label: '⚡ Solar Guilds', filter: 'solar' },
  { label: '🧱 Contractors', filter: 'contractor' },
  { label: '🛒 FMCG Spaza', filter: 'fmcg' },
  { label: '🚗 Auto Spares', filter: 'auto' },
  { label: '🏢 Wholesale Importers', filter: 'wholesale' },
  { label: '📦 Packaging', filter: 'packaging' },
  { label: '📍 Gauteng', query: 'Gauteng' },
  { label: '📍 Western Cape', query: 'Western Cape' },
  { label: '📍 KwaZulu-Natal', query: 'KwaZulu-Natal' },
];

export default function CommerceRail() {
  const [searchInput, setSearchInput] = useState('');
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('foryou');
  const [activeRetailer, setActiveRetailer] = useState<string>('all');
  const [activeProdCategory, setActiveProdCategory] = useState<string>('all');
  const [activeMarketRegion, setActiveMarketRegion] = useState<string>('');
  const [activeMarketFilter, setActiveMarketFilter] = useState<string>('all');
  const [joinedCount, setJoinedCount] = useState<number>(0);
  const [favCount, setFavCount] = useState<number>(0);

  const [syncTopDrops, setSyncTopDrops] = useState<any[]>([]);
  const [syncTopProducts, setSyncTopProducts] = useState<any[]>([]);
  const [totalDeals, setTotalDeals] = useState<number>(1176);
  const [totalProducts, setTotalProducts] = useState<number>(91713);
  const [totalMarkets, setTotalMarkets] = useState<number>(3300);

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
  const displayProducts = syncTopProducts.length > 0 ? syncTopProducts : FALLBACK_TOP_PRODUCTS;

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('shoppage_active_tab');
      if (savedTab) setActiveTab(savedTab);

      const savedJoined = localStorage.getItem('shoppage_joined_markets');
      if (savedJoined) {
        const parsed = JSON.parse(savedJoined);
        setJoinedCount(Object.values(parsed).filter(Boolean).length);
      }

      const savedFavs = localStorage.getItem('shoppage_fav_markets');
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        setFavCount(Object.values(parsed).filter(Boolean).length);
      }
    } catch {}

    const handleTabChange = (e: CustomEvent) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      if (e.detail?.retailer) {
        setActiveRetailer(e.detail.retailer);
      }
      if (e.detail?.category) {
        setActiveProdCategory(e.detail.category);
      }
      if (e.detail?.marketFilter) {
        setActiveMarketFilter(e.detail.marketFilter);
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

    const handleProductsSync = (e: CustomEvent) => {
      const { totalProducts: tp, activeCategory: ac, topProducts: tprods } = e.detail || {};
      if (tp) setTotalProducts(tp);
      if (ac) setActiveProdCategory(ac);
      if (Array.isArray(tprods) && tprods.length > 0) {
        setSyncTopProducts(tprods);
      }
    };

    const handleMarketsSync = (e: CustomEvent) => {
      const { totalMarkets: tm, activeFilter: af, joinedCount: jc, favCount: fc } = e.detail || {};
      if (tm) setTotalMarkets(tm);
      if (af) setActiveMarketFilter(af);
      if (typeof jc === 'number') setJoinedCount(jc);
      if (typeof fc === 'number') setFavCount(fc);
    };

    const handleJoinedSync = (e: CustomEvent) => {
      if (e.detail?.joinedMarkets) {
        setJoinedCount(Object.values(e.detail.joinedMarkets).filter(Boolean).length);
      }
    };

    window.addEventListener('shoppage-active-tab' as any, handleTabChange);
    window.addEventListener('shoppage-deals-sync' as any, handleDealsSync);
    window.addEventListener('shoppage-products-sync' as any, handleProductsSync);
    window.addEventListener('shoppage-markets-sync' as any, handleMarketsSync);
    window.addEventListener('shoppage-joined-markets-sync' as any, handleJoinedSync);

    return () => {
      window.removeEventListener('shoppage-active-tab' as any, handleTabChange);
      window.removeEventListener('shoppage-deals-sync' as any, handleDealsSync);
      window.removeEventListener('shoppage-products-sync' as any, handleProductsSync);
      window.removeEventListener('shoppage-markets-sync' as any, handleMarketsSync);
      window.removeEventListener('shoppage-joined-markets-sync' as any, handleJoinedSync);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'deals') {
      window.dispatchEvent(
        new CustomEvent('shoppage-nav', { detail: { type: 'deal-search', query: searchInput } }),
      );
    } else if (activeTab === 'products') {
      window.dispatchEvent(
        new CustomEvent('shoppage-nav', { detail: { type: 'prod-search', query: searchInput } }),
      );
    } else if (activeTab === 'markets') {
      window.dispatchEvent(
        new CustomEvent('shoppage-nav', { detail: { type: 'market-search', query: searchInput } }),
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

  // Deals Handlers
  const handleRetailerClick = (retailerId: string) => {
    setActiveRetailer(retailerId);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'deal-retailer', retailer: retailerId } }),
    );
  };

  const handleDealCategoryClick = (category: string) => {
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'deal-category', category } }),
    );
  };

  // Products Handlers
  const handleProdCategoryClick = (categoryId: string) => {
    setActiveProdCategory(categoryId);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'prod-category', category: categoryId } }),
    );
  };

  // Markets Handlers
  const handleMarketRegionClick = (region: string) => {
    setActiveMarketRegion(region);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'market-search', query: region } }),
    );
  };

  const handleMarketFilterClick = (filter: string) => {
    setActiveMarketFilter(filter);
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'market-filter', mode: filter } }),
    );
  };

  const handleMarketSearchClick = (query: string) => {
    window.dispatchEvent(
      new CustomEvent('shoppage-nav', { detail: { type: 'market-search', query } }),
    );
  };

  const toggleFollow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSearchPlaceholder = () => {
    if (activeTab === 'deals') return 'Search verified specials...';
    if (activeTab === 'products') return 'Search 100,000+ verified products...';
    if (activeTab === 'markets') return 'Search community groups & trading hubs...';
    return 'Search Shoppage';
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
            placeholder={getSearchPlaceholder()}
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
                      handleDealCategoryClick(f.category);
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
      ) : activeTab === 'products' ? (
        /* ── PRODUCTS DEDICATED RIGHT RAIL ────────────────────────────── */
        <>
          {/* Product Categories Breakdown */}
          <div className="rcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>📦 Product Categories</h3>
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>
                {totalProducts.toLocaleString()} items
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RAIL_PRODUCT_CATEGORIES.map((c) => {
                const isActive = activeProdCategory === c.id;
                return (
                  <div
                    key={c.id}
                    className={`rail-retailer-row${isActive ? ' active' : ''}`}
                    onClick={() => handleProdCategoryClick(c.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </span>
                    <span className="rail-retailer-cnt">
                      {c.id === 'all' ? `${totalProducts.toLocaleString()}` : c.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Value / High-Demand Catalog Items */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>⚡ Top Value Catalog</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayProducts.slice(0, 5).map((p) => (
                <Link
                  key={p.id || p.title}
                  href={p.url || `/p/${p.id}`}
                  className="rail-drop-item"
                  title={p.title}
                >
                  <div className="rail-drop-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.title} loading="lazy" />
                  </div>
                  <div className="rail-drop-info">
                    <div className="rail-drop-title">{p.title}</div>
                    <div className="rail-drop-meta">{p.merchant || p.brand}</div>
                    <div className="rail-drop-prices">
                      <span className="rail-drop-price">{p.priceText}</span>
                      {p.dropPct ? (
                        <span className="rail-drop-badge">-{p.dropPct}%</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Product Filters */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>🎯 Quick Filters</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_PRODUCT_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className="quick-discount-chip"
                  onClick={() => {
                    if (f.category) {
                      handleProdCategoryClick(f.category);
                    } else if (f.sort) {
                      window.dispatchEvent(
                        new CustomEvent('shoppage-nav', { detail: { type: 'prod-sort', sort: f.sort } }),
                      );
                    }
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Stockist Guarantee Card */}
          <div className="rcard promo" style={{ background: 'color-mix(in srgb, var(--brand) 8%, var(--card))', border: '1px solid color-mix(in srgb, var(--brand) 30%, var(--border))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Verified Stockist Guarantee
            </h3>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: '6px 0 0', color: 'var(--text2)' }}>
              All 100,000+ catalog products are mapped to CIPC-registered South African suppliers, distributors, and direct trade counters with real stock availability.
            </p>
          </div>
        </>
      ) : activeTab === 'markets' ? (
        /* ── MARKETS DEDICATED RIGHT RAIL (COMMUNITY GUILDS & FACEBOOK GROUPS) ── */
        <>
          {/* Community Sectors & Guilds Breakdown */}
          <div className="rcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>👥 Trading Groups &amp; Guilds</h3>
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>
                {totalMarkets.toLocaleString()}+ hubs
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RAIL_COMMUNITY_SECTORS.map((s) => {
                const isActive = activeMarketFilter === s.id;
                const countDisplay =
                  s.id === 'all'
                    ? `${totalMarkets.toLocaleString()}`
                    : s.countKey === 'joined'
                    ? `${joinedCount}`
                    : s.countKey === 'fav'
                    ? `${favCount}`
                    : s.count;

                return (
                  <div
                    key={s.id}
                    className={`rail-retailer-row${isActive ? ' active' : ''}`}
                    onClick={() => handleMarketFilterClick(s.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                    <span className="rail-retailer-cnt">{countDisplay}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High-Activity Community Trading Groups (Facebook Style) */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>🔥 High-Activity Trading Groups</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FEATURED_COMMUNITY_GROUPS.map((g) => (
                <div
                  key={g.id}
                  className="rail-drop-item"
                  title={g.name}
                  onClick={() => handleMarketSearchClick(g.query)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`avatar ${g.avatarClass}`} style={{ width: '38px', height: '38px', fontSize: '13px', flexShrink: 0, borderRadius: '10px' }}>
                    {g.initials}
                  </div>
                  <div className="rail-drop-info">
                    <div className="rail-drop-title">{g.name}</div>
                    <div className="rail-drop-meta">{g.location}</div>
                    <div className="rail-drop-prices">
                      <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>
                        {g.members} · {g.dailyPosts}
                      </span>
                      <span className="rail-drop-badge" style={{ color: 'var(--blue)', background: 'rgba(59, 130, 246, 0.12)' }}>
                        {g.tag}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Community Topics & Filters */}
          <div className="rcard">
            <h3 style={{ marginBottom: '10px' }}>🎯 Quick Community Topics</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_COMMUNITY_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={`quick-discount-chip${f.filter && activeMarketFilter === f.filter ? ' active' : ''}`}
                  onClick={() => {
                    if (f.filter) {
                      handleMarketFilterClick(f.filter);
                    } else if (f.query) {
                      handleMarketSearchClick(f.query);
                    }
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Community Trade Guarantee Card */}
          <div className="rcard promo" style={{ background: 'color-mix(in srgb, var(--brand) 8%, var(--card))', border: '1px solid color-mix(in srgb, var(--brand) 30%, var(--border))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Verified Community Trade Guarantee
            </h3>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: '6px 0 0', color: 'var(--text2)' }}>
              Community buy &amp; sell groups on Shoppage feature verified trader credentials, WhatsApp catalog sync, and zero middleman commissions for peer-to-peer and trade-counter commerce.
            </p>
            <Link href="/merchant/claim" className="follow" style={{ display: 'inline-block', textAlign: 'center', marginTop: '10px' }}>
              Verify Your Trading Profile ↗
            </Link>
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
