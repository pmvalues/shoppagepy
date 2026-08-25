import './globals.css';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant';

export const metadata = {
  title: 'Shoppage — South Africa Commercial Intelligence & Merchant Network',
  description: 'Search 1M+ Master Products, compare 3.1M verified local merchants across 3,296 shopping centres, and connect directly on WhatsApp with zero transaction fees.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top Status & Currency Bar */}
        <div className="top-bar">
          <div className="container top-bar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>🇿🇦 South Africa Commercial Grid (ZAR)</span>
              <span style={{ color: '#475569' }}>|</span>
              <span style={{ color: '#10B981' }}>⚡ 3,109,299 Merchants Synced</span>
              <span style={{ color: '#475569' }}>|</span>
              <span>🏢 3,296 Malls & Shopping Centres</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <Link href="/requests" style={{ color: '#94A3B8' }}>Buyer RFQ Desk</Link>
              <Link href="/merchant/dashboard" style={{ color: '#38BDF8', fontWeight: 600 }}>Merchant Centre Login &rarr;</Link>
            </div>
          </div>
        </div>

        {/* Global Main Header */}
        <header className="header">
          <div className="container nav-wrapper">
            <Link href="/" className="logo">
              <span>⚡ Shoppage</span>
            </Link>

            <form action="/search" method="GET" className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                name="q"
                placeholder="Search products, brands, model numbers, malls, or suburbs..."
                className="search-input"
              />
            </form>

            <nav className="nav-links">
              <Link href="/search?category=solar_energy">☀️ Solar & Power</Link>
              <Link href="/malls">🏢 Malls & Centres</Link>
              <Link href="/merchants">🏪 Stores (3.1M)</Link>
              <Link href="/search">📦 Master Products</Link>
              <Link href="/requests">📋 Post a Need</Link>
              <Link href="/shorts">🎬 Shorts</Link>
            </nav>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <Link href="/merchant/claim" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                ➕ List Store
              </Link>
              <Link href="/merchant/dashboard" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
                Merchant Centre
              </Link>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main style={{ minHeight: 'calc(100vh - 280px)' }}>
          {children}
        </main>

        {/* Global Comprehensive Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', background: '#FFFFFF', padding: '3.5rem 0 2rem 0' }}>
          <div className="container">
            <div className="footer-grid" style={{ marginBottom: '2.5rem' }}>
              <div>
                <div className="logo" style={{ marginBottom: '0.75rem' }}>⚡ Shoppage</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  The unified Commercial Intelligence Layer connecting South Africa&apos;s Master Products, verified merchants across 3,296 shopping centres, Google Shopping feeds, and direct WhatsApp commerce.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-green">✓ SABS & CIPC Integrated</span>
                  <span className="badge badge-blue">✓ Zero Commission</span>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Product Discovery
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Link href="/search?category=solar_energy">Solar Inverters & Batteries</Link>
                  <Link href="/search?category=smartphones">Phones & Electronics</Link>
                  <Link href="/search?category=hardware">Hardware & Building Tools</Link>
                  <Link href="/search?category=groceries">Wholesale Food & Groceries</Link>
                  <Link href="/requests">Post a Sourcing Need (RFQ)</Link>
                  <Link href="/shorts">Video Proof Shorts</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Flagship Hubs & Malls
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Link href="/markets/mkt_sandton_city">Sandton City (Gauteng)</Link>
                  <Link href="/markets/mkt_mall_of_africa">Mall of Africa (Midrand)</Link>
                  <Link href="/markets/mkt_gateway_durban">Gateway Theatre (KZN)</Link>
                  <Link href="/markets/mkt_va_waterfront">V&A Waterfront (Cape Town)</Link>
                  <Link href="/markets/mkt_dragon_city">Dragon City Wholesale</Link>
                  <Link href="/malls">All 3,296 Shopping Centres &rarr;</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Merchant Tools
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Link href="/merchant/dashboard">Merchant Centre Dashboard</Link>
                  <Link href="/merchant/claim">Claim / List Your Store</Link>
                  <Link href="/api/feeds/google-merchant-center/loc_sunpower_crownmines" target="_blank">Google Merchant Center Feed (XML)</Link>
                  <Link href="/merchants">All 3.1M Stores Directory</Link>
                  <Link href="/agency">Agency & Integrator Hub</Link>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Provinces
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Link href="/merchants?province=Gauteng">Gauteng Stores (1.1M)</Link>
                  <Link href="/merchants?province=Western+Cape">Western Cape Stores (620k)</Link>
                  <Link href="/merchants?province=KwaZulu-Natal">KwaZulu-Natal Stores (580k)</Link>
                  <Link href="/merchants?province=Eastern+Cape">Eastern Cape Stores (280k)</Link>
                  <Link href="/merchants?province=Limpopo">Limpopo Stores (190k)</Link>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>
                © {new Date().getFullYear()} Shoppage (Pty) Ltd. Built for the Republic of South Africa.
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <span>🔒 CIPC Verified Commercial Graph</span>
                <span>🛡️ Protection of Personal Information (POPIA)</span>
                <span>⚡ Real-Time SQLite Engine</span>
              </div>
            </div>
          </div>
        </footer>

      <AIAssistant />

      </body>
    </html>
  );
}
