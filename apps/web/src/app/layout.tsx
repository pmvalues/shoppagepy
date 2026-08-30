import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import LiveSearch from '@/components/LiveSearch';
import AIAssistant from '@/components/AIAssistant';

export const metadata: Metadata = {
  title: 'Shoppage South Africa · 1M+ Products, 3.1M Stores, 3,296 Malls',
  description:
    'The South African Commercial Grid. 1-click price discovery, verified SABS & NRS 097 grid compliance, and direct multi-channel merchant inquiries (Phone, Web, In-Store, Chat) with 0% middleman take rates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const quickCategories = [
    { label: '☀️ Solar & Inverters', href: '/search?category=solar_energy' },
    { label: '🔋 LiFePO4 Batteries', href: '/search?q=5.12kwh+battery' },
    { label: '📱 Phones & Tech', href: '/search?category=smartphones' },
    { label: '🧱 Building & Hardware', href: '/search?category=hardware' },
    { label: '🛒 Food & Groceries', href: '/search?category=groceries' },
    { label: '💊 Health & Pharmacy', href: '/search?category=pharmacy' },
    { label: '🚗 Auto & Spares', href: '/search?category=automotive' },
    { label: '🏬 All 3,296 Malls', href: '/malls' },
    { label: '🏪 3.1M Stores Directory', href: '/merchants' },
  ];

  return (
    <html lang="en">
      <body>
        {/* Top Radar Ticker: Live National Grid Status */}
        <div style={{ background: '#090D16', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.45rem 1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
              <strong style={{ color: '#F1F5F9', letterSpacing: '0.04em' }}>LIVE NATIONAL COMMERCE GRID</strong>
              <span style={{ color: '#475569' }}>|</span>
              <span>3,296 Malls · 3.1M Stores · Direct Multi-Channel Inquiries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94A3B8' }}>
              <span>0% Middleman Take Rate</span>
              <span>•</span>
              <Link href="/requests" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>
                📋 Post Buyer RFQ
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Frosted Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', height: '68px' }}>
            {/* Brand Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
                }}
              >
                S
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--slate-950)' }}>
                  Shoppage<span style={{ color: '#059669' }}>.</span>
                </span>
              </div>
            </Link>

            {/* Omnibox Live Search Trigger */}
            <div style={{ flex: 1, maxWidth: '580px' }}>
              <LiveSearch />
            </div>

            {/* Navigation Right Actions */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/search" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Catalog
              </Link>
              <Link href="/malls" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Malls (3,296)
              </Link>
              <Link href="/merchants" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Stores
              </Link>
              <Link href="/requests" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Buyer RFQs
              </Link>
              <Link href="/shorts" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                Proof Shorts
              </Link>

              <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.25rem' }}></div>

              <Link href="/agency/field-marshal" className="btn btn-outline btn-sm" style={{ background: '#FAF5FF', borderColor: '#E9D5FF', color: '#6D28D9' }}>
                📍 Field Marshal
              </Link>
              <Link href="/merchant/dashboard" className="btn btn-dark btn-sm">
                Merchant OS
              </Link>
              <Link href="/merchant/claim" className="btn btn-primary btn-sm">
                + List Store
              </Link>
            </nav>
          </div>

          {/* Quick Category Ribbon */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              background: '#FFFFFF',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              padding: '0.4rem 0',
            }}
          >
            <div className="container" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
                EXPLORE:
              </span>
              {quickCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  href={cat.href}
                  className="badge badge-gray"
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#F1F5F9',
                    color: 'var(--slate-700)',
                    fontWeight: 600,
                  }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Application Body */}
        <main>{children}</main>

        {/* Global Autonomous AI Shopping Copilot Widget */}
        <AIAssistant />

        {/* Modern Pro Deep Slate Footer */}
        <footer style={{ background: '#0B0F19', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '4rem', paddingBottom: '3rem', marginTop: '6rem' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                  Shoppage<span style={{ color: '#10B981' }}>.</span>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748B' }}>
                  South Africa&apos;s National Commercial Grid. 3,296 shopping centres, 3.1M verified merchants, and direct omnichannel inquiries with zero middleman take rates.
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Commercial Grid
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <Link href="/search" style={{ color: '#94A3B8' }}>Master Product Matrix</Link>
                  <Link href="/malls" style={{ color: '#94A3B8' }}>3,296 Shopping Centres</Link>
                  <Link href="/merchants" style={{ color: '#94A3B8' }}>3.1M Verified Stores</Link>
                  <Link href="/requests" style={{ color: '#94A3B8' }}>Buyer RFQ Desk</Link>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Merchant & Field Ops
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <Link href="/merchant/claim" style={{ color: '#94A3B8' }}>1-Click Claim Store</Link>
                  <Link href="/merchant/dashboard" style={{ color: '#94A3B8' }}>Merchant Centre Dashboard</Link>
                  <Link href="/agency/field-marshal" style={{ color: '#94A3B8' }}>Field Marshal Ground Portal</Link>
                  <Link href="/agency" style={{ color: '#94A3B8' }}>Agency Multi-Client Hub</Link>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Compliance & Standards
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#64748B' }}>
                  <span>✓ SABS & NRS 097 Certified Inverters</span>
                  <span>✓ CIPC Statutory Entity Validation</span>
                  <span>✓ Direct Multi-Channel Inquiries</span>
                  <span>✓ 0% Middleman Take Rate</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: '#475569' }}>
              <div>© 2026 Shoppage Platform Ltd. All rights reserved.</div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <Link href="/privacy" style={{ color: '#64748B' }}>Privacy Policy</Link>
                <Link href="/terms" style={{ color: '#64748B' }}>Terms of Service</Link>
                <Link href="/security" style={{ color: '#64748B' }}>Security & Trust</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
