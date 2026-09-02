'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LiveSearch from './LiveSearch';
import AIAssistant from './AIAssistant';

/* ── Icons ─────────────────────────────────────────────────────────────── */

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function FeedIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function ShortsIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="3" width="20" height="18" rx="3" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ShowsIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  );
}
function MarketsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
function MallsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
function StoresIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21H4a1 1 0 0 1-1-1V8l2-4h14l2 4v12a1 1 0 0 1-1 1z" />
      <path d="M8 21v-6h8v6" />
    </svg>
  );
}
function RfqIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

/* ── Nav model ─────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { href: '/', label: 'Feed', Icon: FeedIcon, exact: true },
  { href: '/search', label: 'Search', Icon: SearchIcon },
  { href: '/shorts', label: 'Shorts', Icon: ShortsIcon },
  { href: '/shows', label: 'Shows', Icon: ShowsIcon },
  { href: '/markets', label: 'Markets', Icon: MarketsIcon },
  { href: '/malls', label: 'Malls', Icon: MallsIcon },
  { href: '/merchants', label: 'Stores', Icon: StoresIcon },
  { href: '/requests', label: 'RFQ Desk', Icon: RfqIcon },
  { href: '/time', label: 'Shoppage Time', Icon: BoltIcon, live: true },
];

const MOBILE_TABS = [
  { href: '/', label: 'Feed', Icon: FeedIcon, exact: true },
  { href: '/search', label: 'Search', Icon: SearchIcon },
  { href: '/shorts', label: 'Shorts', Icon: ShortsIcon },
  { href: '/requests', label: 'RFQ', Icon: RfqIcon },
  { href: '/time', label: 'Time', Icon: BoltIcon },
];

/* ── Shell ─────────────────────────────────────────────────────────────── */

export default function AppNavbar({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const isMerchantOS = pathname.startsWith('/merchant/dashboard');
  const isAdminOS = pathname.startsWith('/admin');
  const [isLoggedInMerchant, setIsLoggedInMerchant] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark' | null>(null);
  const [navCollapsed, setNavCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('shoppage_merchant_session');
      const hasCookie = document.cookie.includes('merchant_session=true');
      if (stored === 'true' || hasCookie || pathname.startsWith('/merchant/')) {
        setIsLoggedInMerchant(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, [pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') setTheme(current);
    else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.removeItem('shoppage_rail_collapsed');
      const stored = localStorage.getItem('shoppage_nav_collapsed');
      if (stored === 'true') setNavCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('shoppage_theme', next);
    } catch {
      /* ignore */
    }
  };

  const toggleNav = () => {
    const next = !navCollapsed;
    setNavCollapsed(next);
    try {
      localStorage.setItem('shoppage_nav_collapsed', String(next));
    } catch {
      /* ignore */
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Merchant OS keeps its own full-bleed chrome.
  if (isMerchantOS || isAdminOS) {
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
      <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
        <div className="topbar-inner">
          <button
            type="button"
            className="icon-btn nav-toggle-btn"
            onClick={toggleNav}
            aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar to left'}
            title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar to left'}
          >
            <svg {...iconProps} width={18} height={18} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 3v18" />
              {navCollapsed ? (
                <path d="M13 12l4-3v6z" fill="currentColor" stroke="none" />
              ) : (
                <path d="M16 12l-4-3v6z" fill="currentColor" stroke="none" />
              )}
            </svg>
          </button>

          <Link href="/" className="brand" aria-label="Shoppage home">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span className="brand-word">
              Shoppage<span className="dot">.</span>
            </span>
          </Link>

          <div className="topbar-search">
            <LiveSearch />
          </div>

          <div className="topbar-actions">


            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link
              href="/time"
              className="btn btn-sm hide-sm"
              style={{
                background: 'var(--slate-900)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                gap: '0.35rem',
              }}
              title="Shoppage Time · Real-time commercial timeline"
            >
              <BoltIcon />
              <span>Time</span>
              <span
                style={{
                  background: 'var(--live)',
                  color: '#FFF',
                  fontSize: '0.6rem',
                  padding: '0.08rem 0.32rem',
                  borderRadius: '4px',
                  fontWeight: 900,
                }}
              >
                LIVE
              </span>
            </Link>

            {!isLoggedInMerchant && (
              <Link
                href="/merchant/claim"
                className="btn btn-signal btn-sm"
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                + List Store
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={`app-shell${navCollapsed ? ' is-nav-collapsed' : ''}`}>
        <nav
          className={`rail-nav${navCollapsed ? ' is-collapsed' : ''}`}
          aria-label="Primary"
        >
          <div className="rail-nav-head">
            {!navCollapsed && <span className="rail-nav-heading">Menu</span>}
            <button
              type="button"
              className="rail-collapse-btn"
              onClick={toggleNav}
              aria-label={navCollapsed ? 'Expand sidebar' : 'Close sidebar (indent to left)'}
              title={navCollapsed ? 'Expand sidebar' : 'Close sidebar (indent to left)'}
            >
              <svg {...iconProps} width={16} height={16} viewBox="0 0 24 24">
                {navCollapsed ? (
                  <path d="M9 18l6-6-6-6" />
                ) : (
                  <path d="M15 18l-6-6 6-6" />
                )}
              </svg>
              {!navCollapsed && <span className="collapse-text">Close</span>}
            </button>
          </div>

          {NAV_ITEMS.map(({ href, label, Icon, exact, live }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive(href, exact) ? ' is-active' : ''}`}
              aria-current={isActive(href, exact) ? 'page' : undefined}
              title={navCollapsed ? (live ? `${label} (LIVE)` : label) : undefined}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              <span className="nav-label">{label}</span>
              {live && (
                <span className="nav-badge">
                  {navCollapsed ? '' : 'LIVE'}
                </span>
              )}
            </Link>
          ))}

          <Link
            href="/merchant/claim"
            className="nav-post-btn"
            title={navCollapsed ? 'List my store (0% take-rate)' : undefined}
          >
            {navCollapsed ? '+' : 'List my store'}
          </Link>

          {!navCollapsed && (
            <div className="rail-foot">
              0% take-rate. Direct trade, always.
            </div>
          )}
        </nav>

        <div className="feed-column">{children}</div>

        {aside ? <aside className="rail-aside" aria-label="Commerce intelligence">{aside}</aside> : null}
      </div>

      <nav className="mobile-tabbar" aria-label="Primary mobile">
        {MOBILE_TABS.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`mobile-tab${isActive(href, exact) ? ' is-active' : ''}`}
            aria-current={isActive(href, exact) ? 'page' : undefined}
          >
            <span className="mt-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <AIAssistant />

      <footer
        style={{
          background: 'var(--slate-900)',
          color: 'var(--slate-500)',
          borderTop: '1px solid var(--border)',
          padding: '2.5rem 0 3rem',
          marginTop: '2rem',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8rem',
            }}
          >
            <div>
              © 2026 Shoppage Platform Ltd. South Africa&apos;s commercial grid at 0% commission.
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link href="/privacy" className="hover-underline">Privacy</Link>
              <Link href="/terms" className="hover-underline">Terms</Link>
              <Link href="/security" className="hover-underline">Security</Link>
              <Link href="/merchants" className="hover-underline">Stores</Link>
              <Link href="/shows" className="hover-underline">Shows</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
