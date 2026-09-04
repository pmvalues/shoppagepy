'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AIAssistant from './AIAssistant';
import TradeCartDrawer from './TradeCartDrawer';

const THEMES = ['light', 'dark', 'dim'];
const THEME_NAMES: Record<string, string> = {
  light: 'Clean Paper (Light)',
  dark: 'Obsidian Night (Dark)',
  dim: 'Highveld Slate (Dim)',
};

function ShoppageLogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ flexShrink: 0, borderRadius: '8px' }}>
      <defs>
        <linearGradient id="sp-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="sp-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#sp-brand-grad)" />
      {/* Shopping Tote Body */}
      <path
        d="M8.5 12C8.5 10.8954 9.39543 10 10.5 10H21.5C22.6046 10 23.5 10.8954 23.5 12L24.5 24C24.5 25.1046 23.6046 26 22.5 26H9.5C8.39543 26 7.5 25.1046 7.5 24L8.5 12Z"
        fill="#FFFFFF"
      />
      {/* Bag Handle */}
      <path
        d="M12 10V7.5C12 5.567 13.567 4 15.5 4H16.5C18.433 4 20 5.567 20 7.5V10"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Golden Lightning Bolt */}
      <path
        d="M17 12L12 18H16L15 24L20 17H16.2L17 12Z"
        fill="url(#sp-bolt-grad)"
      />
    </svg>
  );
}

export default function AppNavbar({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(3);

  // Initialize theme, nav collapse and cart count from localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('shoppage_theme') || 'light';
      const idx = THEMES.indexOf(storedTheme);
      if (idx !== -1) {
        setThemeIdx(idx);
        document.body.setAttribute('data-theme', storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.body.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const storedNav = localStorage.getItem('shoppage_nav_collapsed');
      if (storedNav === 'true') {
        setCollapsed(true);
      }

      const storedCart = localStorage.getItem('shoppage_cart_items');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        const count = Array.isArray(parsed) ? parsed.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 0;
        setCartCount(count);
      }
    } catch {
      /* ignore */
    }

    // Listen to cart events
    const onCartEvent = (e: CustomEvent) => {
      if (e.detail?.action === 'add') {
        setCartCount((c) => c + 1);
      }
    };
    const onCartSync = (e: CustomEvent) => {
      if (typeof e.detail?.count === 'number') {
        setCartCount(e.detail.count);
      }
    };

    window.addEventListener('shoppage-cart' as any, onCartEvent);
    window.addEventListener('shoppage-cart-sync' as any, onCartSync);
    return () => {
      window.removeEventListener('shoppage-cart' as any, onCartEvent);
      window.removeEventListener('shoppage-cart-sync' as any, onCartSync);
    };
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('shoppage_nav_collapsed', String(next));
    } catch {
      /* ignore */
    }
  };

  const cycleTheme = () => {
    const nextIdx = (themeIdx + 1) % THEMES.length;
    const nextTheme = THEMES[nextIdx];
    setThemeIdx(nextIdx);
    document.body.setAttribute('data-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('shoppage_theme', nextTheme);
    } catch {
      /* ignore */
    }
  };

  const dispatchNav = (type: string, query?: string) => {
    window.dispatchEvent(new CustomEvent('shoppage-nav', { detail: { type, query } }));
  };

  const isMerchantOS = pathname?.startsWith('/merchant') || pathname?.startsWith('/admin');

  if (isMerchantOS) {
    return (
      <>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <AIAssistant />
      </>
    );
  }

  return (
    <>
      <div className={`shell${collapsed ? ' is-nav-collapsed' : ''}`}>
        {/* ── LEFT RAIL WITH COLLAPSING ───────────────────────────────── */}
        <aside className={`left${collapsed ? ' is-collapsed' : ''}`}>
          <div className="rail-head">
            <Link href="/" className="logo" title="Shoppage South Africa">
              <ShoppageLogoMark size={32} />
              {!collapsed && <span className="wordmark">Shoppage</span>}
            </Link>

            <button
              type="button"
              className="collapse-btn"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
              </svg>
            </button>
          </div>

          <nav className="nav" aria-label="Primary navigation">
            {/* 1. Feed / Home */}
            <button
              type="button"
              className={`nav-item${pathname === '/' ? ' active' : ''}`}
              onClick={() => {
                dispatchNav('tab', 'foryou');
                setNotifOpen(false);
              }}
              title={collapsed ? 'Home' : undefined}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 1.7 1.6 8.8l1.1 1.7 1.3-.6V21a1 1 0 0 0 1 1h5v-8h4v8h5a1 1 0 0 0 1-1V9.9l1.3.6 1.1-1.7L12 1.7z" />
              </svg>
              <span>Home</span>
            </button>

            {/* 2. Search / Explore */}
            <Link
              href="/search"
              className={`nav-item${pathname === '/search' ? ' active' : ''}`}
              title={collapsed ? 'Explore & Search' : undefined}
            >
              <svg viewBox="0 0 24 24">
                <path d="M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-8 6a8 8 0 1 1 14.9 4.45l4.42 4.42-1.42 1.42-4.42-4.42A8 8 0 0 1 2.25 10.25z" />
              </svg>
              <span>Explore</span>
            </Link>

            {/* 3. Shorts / Video Proof */}
            <button
              type="button"
              className="nav-item"
              onClick={() => dispatchNav('tab', 'shorts')}
              title={collapsed ? 'Shorts' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="18" rx="3" />
                <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
              </svg>
              <span>Shorts</span>
            </button>

            {/* 4. Shows / Original Series */}
            <Link
              href="/shows"
              className={`nav-item${pathname === '/shows' ? ' active' : ''}`}
              title={collapsed ? 'Shows' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
              <span>Shows</span>
            </Link>

            {/* 5. Wholesale Markets */}
            <Link
              href="/markets"
              className={`nav-item${pathname === '/markets' ? ' active' : ''}`}
              title={collapsed ? 'Markets' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l1.5-5h15L21 9" />
                <path d="M4 9v11h16V9" />
                <path d="M9 20v-6h6v6" />
              </svg>
              <span>Markets</span>
            </Link>

            {/* 6. Malls */}
            <Link
              href="/malls"
              className={`nav-item${pathname === '/malls' ? ' active' : ''}`}
              title={collapsed ? 'Malls' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21V8l9-5 9 5v13" />
                <path d="M9 21v-6h6v6" />
              </svg>
              <span>Malls</span>
            </Link>

            {/* 7. Stores / Merchants */}
            <Link
              href="/merchants"
              className={`nav-item${pathname === '/merchants' ? ' active' : ''}`}
              title={collapsed ? 'Stores' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21H4a1 1 0 0 1-1-1V8l2-4h14l2 4v12a1 1 0 0 1-1 1z" />
                <path d="M8 21v-6h8v6" />
              </svg>
              <span>Stores</span>
            </Link>

            {/* 8. RFQ Desk */}
            <Link
              href="/requests"
              className={`nav-item${pathname === '/requests' ? ' active' : ''}`}
              title={collapsed ? 'RFQ Desk' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h4" />
              </svg>
              <span>RFQ Desk</span>
            </Link>

            {/* 9. Shoppage Time (LIVE) */}
            <Link
              href="/time"
              className={`nav-item${pathname === '/time' ? ' active' : ''}`}
              title={collapsed ? 'Shoppage Time (LIVE)' : undefined}
            >
              <svg viewBox="0 0 24 24">
                <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
              </svg>
              <span>Time</span>
              <span className="live-badge">LIVE</span>
            </Link>

            {/* 10. Notifications */}
            <button
              type="button"
              className="nav-item"
              onClick={() => setNotifOpen(!notifOpen)}
              title={collapsed ? 'Notifications' : undefined}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19.99 9.04c0-4.16-3.27-7.54-7.99-7.54S4.01 4.88 4.01 9.04c0 4.1-1.16 6.2-2.14 7.43-.54.68-.04 1.78.85 1.78h18.56c.89 0 1.39-1.1.85-1.78-.98-1.23-2.14-3.33-2.14-7.43zM12 22.5c1.93 0 3.5-1.57 3.5-3.5h-7c0 1.93 1.57 3.5 3.5 3.5z" />
              </svg>
              <span>Notifications</span>
              {unreadNotifs > 0 && <em className="nbadge">{unreadNotifs}</em>}
            </button>

            {/* 11. Cart */}
            <button
              type="button"
              className="nav-item"
              onClick={() => setIsCartOpen(true)}
              title={collapsed ? 'Cart' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l2.6 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.6 8H6" strokeLinejoin="round" />
                <circle cx="9.5" cy="20" r="1.7" />
                <circle cx="17.5" cy="20" r="1.7" />
              </svg>
              <span>Cart</span>
              {cartCount > 0 && <em className="nbadge">{cartCount}</em>}
            </button>

            {/* 12. Bookmarks */}
            <button
              type="button"
              className="nav-item"
              onClick={() => dispatchNav('bookmarks')}
              title={collapsed ? 'Bookmarks' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinejoin="round"
                  d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"
                />
              </svg>
              <span>Bookmarks</span>
            </button>

            {/* 13. Profile */}
            <Link
              href="/merchant/claim"
              className={`nav-item${pathname === '/merchant/claim' ? ' active' : ''}`}
              title={collapsed ? 'Profile' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a4.25 4.25 0 1 0 0 8.5A4.25 4.25 0 0 0 12 3zM4 20.1c.6-3.6 3.9-5.6 8-5.6s7.4 2 8 5.6v1.4H4v-1.4z" />
              </svg>
              <span>Profile</span>
            </Link>

            {/* 14. More / Theme */}
            <button
              type="button"
              className="nav-item"
              onClick={cycleTheme}
              title={`Switch theme (currently ${THEME_NAMES[THEMES[themeIdx]]})`}
            >
              <svg viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
              <span>More</span>
            </button>
          </nav>

          {/* Post Action Button */}
          <button
            type="button"
            className="post-btn"
            onClick={() => dispatchNav('focus-composer')}
            title={collapsed ? 'New Post' : undefined}
          >
            <span className="txt">Post</span>
            <svg className="ic" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M16.9 3.1a2.62 2.62 0 0 1 3.7 3.7l-11.1 11.1-4.4 1 1-4.4 11.1-11.1z" />
            </svg>
          </button>

          {/* User Card */}
          <div className="me" onClick={cycleTheme} title={`Theme: ${THEME_NAMES[THEMES[themeIdx]]}`}>
            <div className="avatar g8">Y</div>
            <div className="meta">
              <b>You</b>
              <span>@you_za</span>
            </div>
            <span className="dots">···</span>
          </div>
        </aside>

        {/* ── MOBILE APP HEADER (Sticky top on screens <= 700px) ───── */}
        <header className="mobile-header">
          <Link href="/" className="mobile-header-logo" title="Shoppage South Africa">
            <ShoppageLogoMark size={28} />
            <span className="mobile-wordmark">Shoppage</span>
          </Link>
          <div className="mobile-header-actions">
            <button
              type="button"
              className="mobile-header-btn"
              onClick={cycleTheme}
              title={`Current theme: ${THEME_NAMES[THEMES[themeIdx]]} (tap to cycle)`}
              aria-label="Toggle theme"
            >
              <span>{THEMES[themeIdx] === 'dark' ? '🌙' : THEMES[themeIdx] === 'dim' ? '🌔' : '☀️'}</span>
            </button>
            <button
              type="button"
              className="mobile-header-btn"
              onClick={() => setIsCartOpen(true)}
              title="Trade Cart"
              aria-label="Open Trade Cart"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l2.6 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.6 8H6" />
                <circle cx="9.5" cy="20" r="1.7" />
                <circle cx="17.5" cy="20" r="1.7" />
              </svg>
              {cartCount > 0 && <span className="mobile-header-badge">{cartCount}</span>}
            </button>
          </div>
        </header>

        {/* ── CENTER (Timeline) ────────────────────────────────────────── */}
        <main className="center">{children}</main>

        {/* ── RIGHT (Intelligence Rail) ────────────────────────────────── */}
        <aside className="right">{aside}</aside>
      </div>

      {/* ── NOTIFICATIONS POPUP ─────────────────────────────────────────── */}
      <div className={`notif${notifOpen ? ' on' : ''}`}>
        <header>
          Notifications{' '}
          <button
            type="button"
            onClick={() => {
              setUnreadNotifs(0);
            }}
          >
            Mark all read
          </button>
        </header>
        <div className="nitem" onClick={() => setNotifOpen(false)}>
          <div className="avatar g1">SP</div>
          <div>
            <p>
              <b>SunPower Solutions</b> dropped a price on your watchlist:{' '}
              <b>Deye 5kW Hybrid Inverter</b> now R 14 999 ⚡
            </p>
            <span>34m</span>
          </div>
          {unreadNotifs > 0 && <div className="dot" />}
        </div>
        <div className="nitem" onClick={() => setNotifOpen(false)}>
          <div className="avatar g3">DC</div>
          <div>
            <p>
              <b>Dragon City Wholesale Mall</b> restocked an item you follow:{' '}
              <b>Redmi 13 128GB</b>
            </p>
            <span>1h</span>
          </div>
          {unreadNotifs > 1 && <div className="dot" />}
        </div>
        <div className="nitem" onClick={() => setNotifOpen(false)}>
          <div className="avatar g8">Y</div>
          <div>
            <p>
              Your post earned <b>128 new likes</b> and 2 300 views 🎉
            </p>
            <span>3h</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ──────────────────────────────────────────── */}
      <nav className="bottombar" aria-label="Mobile navigation">
        <button
          type="button"
          className={pathname === '/' ? 'active' : undefined}
          onClick={() => {
            dispatchNav('tab', 'foryou');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 1.7 1.6 8.8l1.1 1.7 1.3-.6V21a1 1 0 0 0 1 1h5v-8h4v8h5a1 1 0 0 0 1-1V9.9l1.3.6 1.1-1.7L12 1.7z" />
          </svg>
        </button>
        <Link href="/search" className={pathname === '/search' ? 'active' : undefined}>
          <svg viewBox="0 0 24 24">
            <path d="M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-8 6a8 8 0 1 1 14.9 4.45l4.42 4.42-1.42 1.42-4.42-4.42A8 8 0 0 1 2.25 10.25z" />
          </svg>
        </Link>
        <button type="button" onClick={() => setNotifOpen(!notifOpen)}>
          <svg viewBox="0 0 24 24">
            <path d="M19.99 9.04c0-4.16-3.27-7.54-7.99-7.54S4.01 4.88 4.01 9.04c0 4.1-1.16 6.2-2.14 7.43-.54.68-.04 1.78.85 1.78h18.56c.89 0 1.39-1.1.85-1.78-.98-1.23-2.14-3.33-2.14-7.43zM12 22.5c1.93 0 3.5-1.57 3.5-3.5h-7c0 1.93 1.57 3.5 3.5 3.5z" />
          </svg>
          {unreadNotifs > 0 && <em className="nbadge">{unreadNotifs}</em>}
        </button>
        <button type="button" onClick={() => dispatchNav('bookmarks')}>
          <svg viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label="Open Cart"
          title="Trade Cart"
        >
          <svg viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              d="M3 3h2l2.6 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.6 8H6"
            />
            <circle cx="9.5" cy="20" r="1.7" />
            <circle cx="17.5" cy="20" r="1.7" />
          </svg>
          {cartCount > 0 && <em className="nbadge">{cartCount}</em>}
        </button>
      </nav>

      {/* ── MOBILE FAB ─────────────────────────────────────────────────── */}
      <button
        type="button"
        className="fab"
        onClick={() => dispatchNav('focus-composer')}
        aria-label="New post"
      >
        <svg viewBox="0 0 24 24">
          <path d="M16.9 3.1a2.62 2.62 0 0 1 3.7 3.7l-11.1 11.1-4.4 1 1-4.4 11.1-11.1z" />
        </svg>
      </button>

      <AIAssistant />
      <TradeCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
