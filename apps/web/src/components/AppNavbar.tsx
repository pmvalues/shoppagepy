'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LiveSearch from './LiveSearch';
import AIAssistant from './AIAssistant';

export default function AppNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isMerchantOS = pathname.startsWith('/merchant/dashboard');

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
      {/* Top Radar Ticker: Live National Grid Status */}
      <div
        style={{
          background: '#090D16',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0.45rem 1rem',
          fontSize: '0.75rem',
          color: '#94A3B8',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            ></span>
            <strong style={{ color: '#F1F5F9', letterSpacing: '0.04em' }}>LIVE NATIONAL COMMERCE GRID</strong>
            <span style={{ color: '#475569' }}>|</span>
            <span>3,296 Malls · 3.1M Stores · Direct Multi-Channel Inquiries</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94A3B8' }}>
            <span>Verified Stockists Network</span>
            <span>•</span>
            <Link href="/requests" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>
              📋 Post Buyer RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Frosted Header with Omnibox for Discovery */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.95)',
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
            gap: '1.5rem',
            height: '74px',
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

          {/* Prominent Search Bar */}
          <div style={{ flex: 1, maxWidth: '780px' }}>
            <LiveSearch />
          </div>

          {/* Header Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
            <Link
              href="/admin"
              className="btn btn-outline btn-sm"
              style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 700 }}
              title="Merchant & Platform Admin Login"
            >
              🔐 Admin Login
            </Link>
            <Link
              href="/merchant/dashboard"
              className="btn btn-dark btn-sm"
              style={{ padding: '0.45rem 1rem', borderRadius: '8px' }}
            >
              Merchant OS
            </Link>
            <Link
              href="/merchant/claim"
              className="btn btn-primary btn-sm"
              style={{ padding: '0.45rem 1rem', borderRadius: '8px' }}
            >
              + List Store
            </Link>
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
                <Link href="/search" style={{ color: '#94A3B8' }}>
                  Master Product Matrix
                </Link>
                <Link href="/markets" style={{ color: '#94A3B8' }}>
                  Virtual B2B Markets & Exchanges
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
