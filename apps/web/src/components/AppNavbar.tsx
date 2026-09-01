'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LiveSearch from './LiveSearch';
import AIAssistant from './AIAssistant';

export default function AppNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isMerchantOS = pathname.startsWith('/merchant/dashboard');
  const [isLoggedInMerchant, setIsLoggedInMerchant] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('shoppage_merchant_session');
      const hasCookie = document.cookie.includes('merchant_session=true');
      if (stored === 'true' || hasCookie || pathname.startsWith('/merchant/')) {
        setIsLoggedInMerchant(true);
      }
    } catch {
      // Fallback
    }
  }, [pathname]);

  // When inside Merchant OS, suppress public search bar, consumer ticker, and consumer footer
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
      {/* Sticky Frosted Header: Single Row Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            height: '70px',
          }}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.35rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
              }}
            >
              S
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: 'var(--slate-950)',
                }}
              >
                Shoppage<span style={{ color: '#059669' }}>.</span>
              </span>
            </div>
          </Link>

          {/* Prominent Expanded Search Bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <LiveSearch />
          </div>

          {/* Header Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
            <Link
              href="/time"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.825rem',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
              }}
              title="Shoppage Time · Real-Time Commercial Timeline"
            >
              <span>⚡</span>
              <span>Shoppage Time</span>
              <span style={{ background: '#EF4444', color: '#FFF', fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 900 }}>LIVE</span>
            </Link>

            {!isLoggedInMerchant && (
              <Link
                href="/merchant/claim"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.45rem 1rem', borderRadius: '8px' }}
              >
                + List Store
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Application Body */}
      <main>{children}</main>

      {/* Global Autonomous AI Shopping Copilot Widget */}
      <AIAssistant />

      {/* Modern Pro Deep Slate Footer */}
      <footer
        style={{
          background: '#0B0F19',
          color: '#94A3B8',
          borderTop: '1px solid #1E293B',
          paddingTop: '4rem',
          paddingBottom: '3rem',
          marginTop: '6rem',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2.5rem',
              marginBottom: '3.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                Shoppage<span style={{ color: '#10B981' }}>.</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748B' }}>
                South Africa&apos;s National Commercial Grid. 3,296 shopping centres, 3.1M verified merchants, and direct omnichannel inquiries.
              </p>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                Commercial Grid
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <Link href="/time" style={{ color: '#38BDF8', fontWeight: 700 }}>
                  ⚡ Shoppage Time Wire (Live)
                </Link>
                <Link href="/search" style={{ color: '#94A3B8' }}>
                  Master Product Matrix
                </Link>
                <Link href="/markets" style={{ color: '#94A3B8' }}>
                  Virtual B2B Markets & Groups (5,200+)
                </Link>
                <Link href="/malls" style={{ color: '#94A3B8' }}>
                  3,296 Shopping Centres
                </Link>
                <Link href="/merchants" style={{ color: '#94A3B8' }}>
                  74,000+ Verified Stores
                </Link>
                <Link href="/requests" style={{ color: '#94A3B8' }}>
                  Buyer RFQ Desk
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                Merchant & Field Ops
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <Link href="/merchant/claim" style={{ color: '#94A3B8' }}>
                  1-Click Claim Store
                </Link>
                <Link href="/merchant/dashboard" style={{ color: '#94A3B8' }}>
                  Merchant Centre Dashboard
                </Link>
                <Link href="/agency/field-marshal" style={{ color: '#94A3B8' }}>
                  Field Marshal Ground Portal
                </Link>
                <Link href="/agency" style={{ color: '#94A3B8' }}>
                  Agency Multi-Client Hub
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                Media & Video Commerce
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <Link href="/shorts" style={{ color: '#94A3B8' }}>
                  🎬 Video Proof Shorts Feed
                </Link>
                <Link href="/shows" style={{ color: '#94A3B8' }}>
                  📺 Market Walk Shows Series
                </Link>
                <Link href="/shorts" style={{ color: '#94A3B8' }}>
                  + Submit Merchant Video
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                Compliance & Standards
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#64748B' }}>
                <span>✓ SABS & NRS 097 Certified Inverters</span>
                <span>✓ Verified Business Stockists</span>
                <span>✓ Direct Omnichannel Trade (0% Take Rate)</span>
                <span>✓ Verified Merchant Standards</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #1E293B',
              paddingTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#475569',
            }}
          >
            <div>© 2026 Shoppage Platform Ltd. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Link href="/privacy" style={{ color: '#64748B' }}>
                Privacy Policy
              </Link>
              <Link href="/terms" style={{ color: '#64748B' }}>
                Terms of Service
              </Link>
              <Link href="/security" style={{ color: '#64748B' }}>
                Security & Trust
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
