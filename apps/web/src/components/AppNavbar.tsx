'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AIAssistant from './AIAssistant';

const THEMES = ['dark', 'dim', 'light'];
const THEME_NAMES: Record<string, string> = {
  dark: 'Default (dark)',
  dim: 'Dim',
  light: 'Lights on',
};

export default function AppNavbar({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [themeIdx, setThemeIdx] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(3);
  const [cartCount, setCartCount] = useState(0);

  // Initialize theme from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shoppage_theme');
      if (stored && THEMES.includes(stored)) {
        const idx = THEMES.indexOf(stored);
        setThemeIdx(idx);
        document.body.setAttribute('data-theme', stored);
        document.documentElement.setAttribute('data-theme', stored);
      } else {
        document.body.setAttribute('data-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
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
    window.addEventListener('shoppage-cart' as any, onCartEvent);
    return () => window.removeEventListener('shoppage-cart' as any, onCartEvent);
  }, []);

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
      <div className="shell">
        {/* ── LEFT RAIL (Twitter/X Architecture) ────────────────────────── */}
        <aside className="left">
          <Link href="/" className="logo" title="Shoppage">
            <svg viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
            </svg>
            <span className="wordmark">Shoppage</span>
          </Link>

          <nav className="nav" aria-label="Primary navigation">
            <button
              type="button"
              className={`nav-item${pathname === '/' ? ' active' : ''}`}
              onClick={() => {
                dispatchNav('tab', 'foryou');
                setNotifOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 1.7 1.6 8.8l1.1 1.7 1.3-.6V21a1 1 0 0 0 1 1h5v-8h4v8h5a1 1 0 0 0 1-1V9.9l1.3.6 1.1-1.7L12 1.7z" />
              </svg>
              <span>Home</span>
            </button>

            <Link href="/search" className="nav-item">
              <svg viewBox="0 0 24 24">
                <path d="M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-8 6a8 8 0 1 1 14.9 4.45l4.42 4.42-1.42 1.42-4.42-4.42A8 8 0 0 1 2.25 10.25z" />
              </svg>
              <span>Explore</span>
            </Link>

            <button
              type="button"
              className="nav-item"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19.99 9.04c0-4.16-3.27-7.54-7.99-7.54S4.01 4.88 4.01 9.04c0 4.1-1.16 6.2-2.14 7.43-.54.68-.04 1.78.85 1.78h18.56c.89 0 1.39-1.1.85-1.78-.98-1.23-2.14-3.33-2.14-7.43zM12 22.5c1.93 0 3.5-1.57 3.5-3.5h-7c0 1.93 1.57 3.5 3.5 3.5z" />
              </svg>
              <span>Notifications</span>
              {unreadNotifs > 0 && <em className="nbadge">{unreadNotifs}</em>}
            </button>

            <Link href="/requests" className="nav-item">
              <svg viewBox="0 0 24 24">
                <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" />
              </svg>
              <span>Messages</span>
            </Link>

            <button
              type="button"
              className="nav-item"
              onClick={() => {
                alert(
                  cartCount > 0
                    ? `🛒 ${cartCount} trade deal${cartCount > 1 ? 's' : ''} locked in cart!`
                    : 'Your cart is empty. Click "Get deal" on any post to lock trade pricing.',
                );
              }}
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
              <span>Cart</span>
              {cartCount > 0 && <em className="nbadge">{cartCount}</em>}
            </button>

            <button
              type="button"
              className="nav-item"
              onClick={() => dispatchNav('bookmarks')}
            >
              <svg viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"
                />
              </svg>
              <span>Bookmarks</span>
            </button>

            <Link href="/merchant/claim" className="nav-item">
              <svg viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M12 3a4.25 4.25 0 1 0 0 8.5A4.25 4.25 0 0 0 12 3zM4 20.1c.6-3.6 3.9-5.6 8-5.6s7.4 2 8 5.6v1.4H4v-1.4z"
                />
              </svg>
              <span>Profile</span>
            </Link>

            <button type="button" className="nav-item" onClick={cycleTheme} title="Switch theme">
              <svg viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
              <span>More</span>
            </button>
          </nav>

          <button
            type="button"
            className="post-btn"
            onClick={() => dispatchNav('focus-composer')}
          >
            <span className="txt">Post</span>
            <svg className="ic" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M16.9 3.1a2.62 2.62 0 0 1 3.7 3.7l-11.1 11.1-4.4 1 1-4.4 11.1-11.1z" />
            </svg>
          </button>

          <div className="me" onClick={cycleTheme} title={`Theme: ${THEME_NAMES[THEMES[themeIdx]]}`}>
            <div className="avatar g8">Y</div>
            <div className="meta">
              <b>You</b>
              <span>@you_za</span>
            </div>
            <span className="dots">···</span>
          </div>
        </aside>

        {/* ── CENTER (Timeline & Content) ───────────────────────────────── */}
        <main className="center">{children}</main>

        {/* ── RIGHT (Commerce Intelligence & Trends) ────────────────────── */}
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
          onClick={() => {
            dispatchNav('tab', 'foryou');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 1.7 1.6 8.8l1.1 1.7 1.3-.6V21a1 1 0 0 0 1 1h5v-8h4v8h5a1 1 0 0 0 1-1V9.9l1.3.6 1.1-1.7L12 1.7z" />
          </svg>
        </button>
        <Link href="/search">
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
          onClick={() => {
            alert(
              cartCount > 0
                ? `🛒 ${cartCount} trade deal${cartCount > 1 ? 's' : ''} in cart`
                : 'Cart is empty',
            );
          }}
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
    </>
  );
}
