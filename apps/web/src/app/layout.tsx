import './globals.css';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant';

export const metadata = {
  title: 'Shoppage — National Commerce Intelligence Grid',
  description: 'Search 1M+ Master Products, compare 3.1M verified local merchants across 3,296 shopping centres, and connect directly on WhatsApp with zero transaction fees.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Global Main Header (Frosted Glass) */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', height: '68px', gap: '1.25rem', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <span style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.15rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.28)'
              }}>⚡</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--slate-900)',
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.05
              }}>
                Shoppage
                <small style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary-600)' }}>
                  National Grid
                </small>
              </span>
            </Link>

            {/* Header Omnibox Search */}
            <form action="/search" method="GET" style={{ flex: 1, maxWidth: 540, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, fontSize: '0.95rem', color: 'var(--slate-400)', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                name="q"
                placeholder="Search 1M+ products, inverters, brands or Sandton malls…"
                style={{
                  width: '100%',
                  padding: '0.65rem 5.5rem 0.65rem 2.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '0.875rem',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ position: 'absolute', right: 5, borderRadius: 'var(--radius-full)', padding: '0.35rem 0.9rem' }}
              >
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link href="/merchant/claim" className="btn btn-whatsapp btn-sm" style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1.15rem' }}>
                + List Shop Free
              </Link>
              <Link href="/merchant/dashboard" className="btn btn-outline btn-sm" style={{ borderRadius: 'var(--radius-full)' }}>
                Merchant OS
              </Link>
            </div>
          </div>

          {/* Subnav Ribbon */}
          <div style={{ background: 'rgba(255, 255, 255, 0.7)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="container" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '0 1.5rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Link href="/search" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary-600)', padding: '0.7rem 0.2rem', borderBottom: '2px solid var(--primary-600)' }}>🔍 All Catalog</Link>
              <Link href="/search?category=solar_energy" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>☀️ Solar & Inverters</Link>
              <Link href="/malls" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>🗺️ 3,296 Malls</Link>
              <Link href="/merchants" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>🏪 3.1M Stores</Link>
              <Link href="/shorts" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>🎬 Proof Shorts</Link>
              <Link href="/requests" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>📋 Buyer RFQs</Link>
              <Link href="/agency" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-600)', padding: '0.7rem 0.2rem' }}>🏢 Agency OS</Link>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main style={{ minHeight: 'calc(100vh - 360px)' }}>
          {children}
        </main>

        {/* Global Deep Slate Pro Footer */}
        <footer style={{ background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)', color: '#94a3b8', borderTop: '1px solid #1e293b', padding: '4.5rem 0 2.5rem 0', marginTop: '4rem', fontSize: '0.875rem' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.85rem', fontFamily: 'var(--font-display)' }}>
                  ⚡ Shoppage
                </div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#94a3b8', marginBottom: '1.25rem' }}>
                  The National Commerce Intelligence Grid for South Africa. Connecting buyers directly with verified local merchants on WhatsApp — 0% middleman fees.
                </p>
                <div style={{ fontSize: '0.825rem', color: '#34D399', fontWeight: 700 }}>
                  ✓ SABS & NRS 097 Grid Certified
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: 700, marginBottom: '1.25rem' }}>Primary Sectors</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <Link href="/search?category=solar_energy" style={{ color: '#94a3b8' }}>Solar & Backup Power</Link>
                  <Link href="/search?category=smartphones" style={{ color: '#94a3b8' }}>Smartphones & Tablets</Link>
                  <Link href="/search?category=hardware" style={{ color: '#94a3b8' }}>Building & Hardware</Link>
                  <Link href="/search?category=groceries" style={{ color: '#94a3b8' }}>Wholesale FMCG</Link>
                  <Link href="/search?category=pharmacy" style={{ color: '#94a3b8' }}>Pharmacy & Health</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: 700, marginBottom: '1.25rem' }}>Spatial Commerce</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <Link href="/malls?province=Gauteng" style={{ color: '#94a3b8' }}>Gauteng Malls (1,184)</Link>
                  <Link href="/malls?province=Western%20Cape" style={{ color: '#94a3b8' }}>Western Cape Malls (612)</Link>
                  <Link href="/malls?province=KwaZulu-Natal" style={{ color: '#94a3b8' }}>KZN Shopping Hubs (548)</Link>
                  <Link href="/malls" style={{ color: '#94a3b8' }}>All 3,296 Malls & Ranks</Link>
                  <Link href="/merchants" style={{ color: '#94a3b8' }}>3.1M Verified Stores</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: 700, marginBottom: '1.25rem' }}>Merchants & Admin</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <Link href="/merchant/claim" style={{ color: '#34D399', fontWeight: 700 }}>Claim Store Profile</Link>
                  <Link href="/merchant/dashboard" style={{ color: '#94a3b8' }}>Merchant Dashboard</Link>
                  <Link href="/requests" style={{ color: '#94a3b8' }}>Buyer RFQ Desk</Link>
                  <Link href="/shorts" style={{ color: '#94a3b8' }}>Proof Shorts Feed</Link>
                  <Link href="/agency" style={{ color: '#94a3b8' }}>Agency & Franchise</Link>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
              <div>
                &copy; {new Date().getFullYear()} Shoppage Group (Pty) Ltd. Built on National Commercial Intelligence Grid.
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <span>🔒 CIPC & SARS Verified Standard</span>
                <span>🛡️ POPIA Protected</span>
                <span>⚡ Real-Time Engine</span>
              </div>
            </div>
          </div>
        </footer>

        <AIAssistant />
      </body>
    </html>
  );
}
