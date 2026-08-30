import './globals.css';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant';

export const metadata = {
  title: 'Shoppage South Africa · 1M+ Products, 3.1M Stores, 3,296 Malls',
  description:
    'The South African Commercial Grid. 1-click price discovery, verified SABS & NRS 097 grid compliance, and direct WhatsApp RFQ counter routing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Sticky Frosted Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 80,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Top announcement bar */}
          <div
            style={{
              background: '#0F172A',
              color: '#94A3B8',
              fontSize: '0.75rem',
              padding: '0.35rem 1rem',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <span>🇿🇦 <strong>South Africa Commercial Grid</strong> · 3,296 Malls & 3.1M Verified Stores</span>
            <span style={{ color: '#334155' }}>|</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>⚡ 0% Middleman Take Rate</span>
          </div>

          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}
              >
                S
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A' }}>
                  Shoppage<span style={{ color: '#2563EB' }}>.za</span>
                </span>
              </div>
            </Link>

            {/* Primary Nav Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/search" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                🔍 Search Grid
              </Link>
              <Link href="/malls" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                🏬 3,296 Malls
              </Link>
              <Link href="/merchants" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                🏪 3.1M Stores
              </Link>
              <Link href="/requests" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                📋 Buyer RFQ
              </Link>
              <Link href="/shorts" className="btn btn-outline btn-sm" style={{ border: 'none' }}>
                🎬 Shorts
              </Link>
            </nav>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link href="/agency/field-marshal" className="btn btn-outline btn-sm" style={{ background: '#FAF5FF', borderColor: '#E9D5FF', color: '#6D28D9' }}>
                🎖️ Field Marshal
              </Link>
              <Link href="/merchant/dashboard" className="btn btn-dark btn-sm">
                ⚙️ Merchant OS
              </Link>
              <Link href="/merchant/claim" className="btn btn-whatsapp btn-sm">
                + List Store
              </Link>
            </div>
          </div>

          {/* Quick Category Ribbon */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', background: '#FAFAFA' }}>
            <div className="container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.4rem 1.5rem', scrollbarWidth: 'none' }}>
              {[
                { label: '☀️ Solar & Inverters', href: '/search?category=solar_energy' },
                { label: '📱 Tech & Phones', href: '/search?category=smartphones' },
                { label: '🧱 Building & Hardware', href: '/search?category=hardware' },
                { label: '🛒 Wholesale FMCG', href: '/search?category=groceries' },
                { label: '💊 Health & Pharmacy', href: '/search?category=pharmacy' },
                { label: '🚗 Automotive Spares', href: '/search?category=automotive' },
                { label: '🏢 Sandton City', href: '/markets/mkt_sandton_city' },
                { label: '🏬 Menlyn Park', href: '/markets/mkt_menlyn_park' },
                { label: '🌊 V&A Waterfront', href: '/markets/mkt_v_and_a_waterfront' },
              ].map((pill, idx) => (
                <Link
                  key={idx}
                  href={pill.href}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--slate-600)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main>{children}</main>

        {/* Global Agentic Shopping Copilot */}
        <AIAssistant />

        {/* Modern Footer */}
        <footer style={{ background: '#0F172A', color: '#94A3B8', borderTop: '1px solid #1E293B', padding: '4rem 0 2rem 0' }}>
          <div className="container">
            <div className="grid grid-cols-4" style={{ gap: '2.5rem', marginBottom: '3rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                  Shoppage<span style={{ color: '#3B82F6' }}>.za</span>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748B' }}>
                  South Africa&apos;s National Commercial Grid. 3,296 shopping centres, 3.1M verified merchants, and direct WhatsApp RFQ routing with zero middleman take rates.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Commerce Grid</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/search" style={{ color: '#94A3B8' }}>Master Product Matrix</Link>
                  <Link href="/malls" style={{ color: '#94A3B8' }}>3,296 Shopping Centres</Link>
                  <Link href="/merchants" style={{ color: '#94A3B8' }}>3.1M Verified Stores</Link>
                  <Link href="/requests" style={{ color: '#94A3B8' }}>Buyer RFQ Desk</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Merchant OS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/merchant/claim" style={{ color: '#94A3B8' }}>1-Click Claim Store</Link>
                  <Link href="/merchant/dashboard" style={{ color: '#94A3B8' }}>Merchant Centre Dashboard</Link>
                  <Link href="/agency/field-marshal" style={{ color: '#94A3B8' }}>Field Marshal Ground Portal</Link>
                  <Link href="/agency" style={{ color: '#94A3B8' }}>Agency Multi-Client Hub</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Trust & Compliance</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span>✓ CIPC Statutory Verification</span>
                  <span>✓ SABS & NRS 097-2-1 Compliance</span>
                  <span>✓ 0% Commission Guarantee</span>
                  <span>✓ Direct WhatsApp Counter Quotes</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
              <div>© 2026 Shoppage South Africa. Built for the modern sovereign commerce ecosystem.</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>Johannesburg</span>
                <span>•</span>
                <span>Cape Town</span>
                <span>•</span>
                <span>Durban</span>
                <span>•</span>
                <span>Pretoria</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
