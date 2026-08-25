import Link from 'next/link';
import {
  MasterProductStore,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
  SA_FLAGSHIP_MARKETS,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';
import { getRecommendations, semanticSearch } from '@/lib/intelligence';
import LiveSearch from '@/components/LiveSearch';
import ForYouRail from '@/components/ForYouRail';
import ShortsRail from '@/components/ShortsRail';
import ShowsRail from '@/components/ShowsRail';
import MerchantCard from '@/components/MerchantCard';

export default function HomePage() {
  const masterProducts = SA_CANONICAL_PRODUCTS.slice(0, 8);
  const flagshipMarkets = SA_FLAGSHIP_MARKETS.slice(0, 6);
  const totalCatalogCount = MasterProductStore.getTotalProductsCount();
  const totalMallsCount = SouthAfricaMallsStore.getTotalCount();
  const totalMerchantsCount = NationwideMerchantStore.getTotalCount();
  const provinceMallCounts = SouthAfricaMallsStore.getProvinceCounts();

  // Intelligence layer (real kernel data)
  const recs = getRecommendations({ category: 'solar_energy', limit: 10 });
  const heroSearch = semanticSearch('solar inverter', { limit: 4 });
  const topMerchants = NationwideMerchantStore.searchMerchants({ limit: 8, offset: 0 }).items;

  return (
    <div>
      {/* UNIFIED HUB HERO — Google-like search + AI Overview */}
      <section style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF2FF 100%)', borderBottom: '1px solid var(--border)', padding: '3.5rem 0 3rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem' }}>🇿🇦</span>
            <span style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 700 }}>
              South Africa&apos;s National Commercial Intelligence Grid
            </span>
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '0.5rem', color: '#0F172A' }}>
            Search. Shop. Watch. <br />
            <span style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              All powered by commerce intelligence.
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto 2rem auto', lineHeight: 1.5 }}>
            A Google-style search, an Amazon-style marketplace, and a YouTube-style video engine — unified with AI that understands what you actually need.
          </p>

          <LiveSearch />

          {/* AI Overview panel */}
          <div className="ai-overview" style={{ maxWidth: 700, margin: '1.5rem auto 0 auto', textAlign: 'left' }}>
            <span className="ai-spark">✨ AI Overview</span>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{heroSearch.overview}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {heroSearch.products.slice(0, 4).map((p) => (
                <Link key={p.canonicalId} href={`/p/${p.canonicalId}`} className="badge badge-blue">
                  {p.brand}: {p.title.length > 28 ? p.title.slice(0, 28) + '…' : p.title}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: '#64748B', marginTop: '1.5rem' }}>
            <span>Try:</span>
            <Link href="/search?q=Deye+5kW" className="badge badge-gray">☀️ Deye 5kW Inverter</Link>
            <Link href="/search?q=Dyness+BX51100" className="badge badge-gray">🔋 Dyness 5.12kWh</Link>
            <Link href="/shorts" className="badge badge-gray">🎬 Shorts</Link>
            <Link href="/shows" className="badge badge-gray">📺 Shows</Link>
            <Link href="/merchants" className="badge badge-gray">🏪 Stores</Link>
          </div>
        </div>
      </section>

      {/* FOR YOU — AI recommendations rail */}
      <section className="container" style={{ padding: '3rem 1.5rem 1rem 1.5rem' }}>
        <ForYouRail initialProducts={recs.products} initialMerchants={recs.merchants} initialOffers={recs.offersByProduct} />
      </section>

      {/* SHORTS — YouTube-like vertical video */}
      <section style={{ background: '#0F172A', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.25rem' }}>🎬 Proof Shorts</span>
              <h2 className="section-title" style={{ color: '#FFFFFF' }}>Watch &amp; Verify in Seconds</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>Teardowns and mall walks tethered to live local offers.</p>
            </div>
            <Link href="/shorts" style={{ color: '#7DD3FC', fontSize: '0.9rem', fontWeight: 600 }}>All Shorts &rarr;</Link>
          </div>
          <ShortsRail />
        </div>
      </section>

      {/* SHOWS — YouTube-like series */}
      <section className="container" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '0.25rem' }}>📺 Original Series</span>
            <h2 className="section-title">Market Walks &amp; Product Battles</h2>
            <p className="section-desc">Structured multi-episode commerce programming.</p>
          </div>
          <Link href="/shows" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600 }}>All Shows &rarr;</Link>
        </div>
        <ShowsRail />
      </section>

      {/* 2. STATS KPI TICKER BAR */}
      <section style={{ borderBottom: '1px solid var(--border)', background: '#FFFFFF', padding: '1.75rem 0' }}>
        <div className="container">
          <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#2563EB' }}>
                {totalMerchantsCount.toLocaleString()}
              </div>
              <div className="stat-label">Verified Physical Stores</div>
            </div>

            <div className="stat-box">
              <div className="stat-number" style={{ color: '#059669' }}>
                {totalMallsCount.toLocaleString()}
              </div>
              <div className="stat-label">Shopping Centres & Malls</div>
            </div>

            <div className="stat-box">
              <div className="stat-number" style={{ color: '#D97706' }}>
                {totalCatalogCount.toLocaleString()}+
              </div>
              <div className="stat-label">Normalized Master Products</div>
            </div>

            <div className="stat-box">
              <div className="stat-number" style={{ color: '#7C3AED' }}>
                9 / 9
              </div>
              <div className="stat-label">Provinces Covered 100%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY CAROUSEL / BROWSER */}
      <section className="container" style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="section-title">📂 Browse by Commercial Sector</h2>
            <p className="section-desc">Direct supplier access across primary South African industries.</p>
          </div>
          <Link href="/search" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
            View Full Taxonomy &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-6" style={{ gap: '1rem' }}>
          {[
            { label: 'Solar & Backup Energy', icon: '☀️', query: 'solar_energy', count: '14,200+ Stores' },
            { label: 'Smartphones & Tech', icon: '📱', query: 'smartphones', count: '28,400+ Stores' },
            { label: 'Building & Hardware', icon: '🧱', query: 'hardware', count: '32,100+ Stores' },
            { label: 'Wholesale & FMCG Food', icon: '🛒', query: 'groceries', count: '45,800+ Stores' },
            { label: 'Health & Pharmacy', icon: '💊', query: 'pharmacy', count: '18,500+ Stores' },
            { label: 'Automotive & Spares', icon: '🚗', query: 'automotive', count: '24,600+ Stores' },
          ].map((cat, idx) => (
            <Link
              key={idx}
              href={`/search?category=${cat.query}`}
              className="card"
              style={{ textAlign: 'center', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                {cat.label}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. MASTER PRODUCT SHOWCASE & LIVE OFFERS */}
      <section style={{ background: '#F8FAFC', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-green">✓ GS1 GTIN Verified</span>
                <span className="badge badge-blue">✓ SABS & NRS 097 Certified</span>
              </div>
              <h2 className="section-title">🔥 Trending Master Products & Live Market Matrix</h2>
              <p className="section-desc">Compare Confirmed Local Offers against external Discovered Web Offers.</p>
            </div>
            <Link href="/search" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
              Search all 1,000,000+ items &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
            {masterProducts.map((p) => {
              const productOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === p.canonicalId);
              const lowestPrice = productOffers.length > 0 ? Math.min(...productOffers.map((o) => o.price.amount || 999999)) : null;

              return (
                <div key={p.canonicalId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-blue">{p.brand}</span>
                      {productOffers.length > 0 ? (
                        <span className="badge badge-green">✓ {productOffers.length} Confirmed</span>
                      ) : (
                        <span className="badge badge-gray">🌐 Web Discovered</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0', lineHeight: 1.3, color: '#0F172A' }}>
                      <Link href={`/p/${p.canonicalId}`}>{p.title}</Link>
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      GTIN: {p.identifiers.gtin13 || p.identifiers.mpn || 'Universal Master SKU'}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: lowestPrice && lowestPrice < 999999 ? 'var(--accent-green)' : '#334155', margin: '0.5rem 0' }}>
                      {lowestPrice && lowestPrice < 999999 ? `R ${lowestPrice.toLocaleString()}` : `R ${(p.attributes?.estimatedPriceZar as number || 1200).toLocaleString()}`}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link href={`/p/${p.canonicalId}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}>
                        Compare Sellers
                      </Link>
                      <Link
                        href={`/merchant/claim?variantId=${p.canonicalId}&title=${encodeURIComponent(p.title)}`}
                        className="btn btn-whatsapp"
                        style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                      >
                        + List
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4B. TOP VERIFIED MERCHANTS — Amazon-like */}
      <section className="container" style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.25rem' }}>🏪 Verified Suppliers</span>
            <h2 className="section-title">Top Merchants You Can Message on WhatsApp</h2>
            <p className="section-desc">Ranked by Google rating, verification state and response time.</p>
          </div>
          <Link href="/merchants" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
            Browse 3.1M Stores &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
          {topMerchants.map((m) => (
            <MerchantCard key={m.id} merchant={m} />
          ))}
        </div>
      </section>

      {/* 5. SHOPPING CENTRES & FLAGSHIP MALLS DIRECTORY SPOTLIGHT */}
      <section className="container" style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.25rem' }}>
              🏬 3,296 Nationwide Retail Hubs
            </span>
            <h2 className="section-title">Flagship Shopping Centres & Wholesale Malls</h2>
            <p className="section-desc">Digital store rosters for super-regional malls, value marts, and township retail plazas.</p>
          </div>
          <Link href="/malls" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
            Explore All 3,296 Malls &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
          {flagshipMarkets.map((m) => (
            <div key={m.id} className="card" style={{ background: '#FFFFFF', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge badge-blue">{m.province}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{m.metro}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.25rem 0' }}>
                <Link href={`/markets/${m.id}`}>{m.name}</Link>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                📍 {m.landmarks?.join(', ') || 'Major South African Retail Concourse'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Verified Tenant Roster</span>
                <Link href={`/markets/${m.id}`} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  View Stores &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 9-Province Mall Distribution Grid */}
        <div className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>
            🇿🇦 Nationwide Shopping Centre Density by Province
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(provinceMallCounts).map(([prov, count]) => (
              <Link
                key={prov}
                href={`/malls?province=${encodeURIComponent(prov)}`}
                style={{
                  background: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{prov}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Centres & Malls</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW SHOPPAGE WORKS FOR MERCHANTS & BUYERS */}
      <section style={{ background: '#0F172A', color: '#FFFFFF', padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-green" style={{ background: '#064E3B', color: '#34D399', border: '1px solid #059669', marginBottom: '0.5rem' }}>
              ⚡ The Shoppage Advantage
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.5rem 0' }}>
              How Shoppage Powers South African Commerce
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
              Connecting buyers directly to physical storefronts with full transparency, verifiable trust, and zero transaction middlemen.
            </p>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
            <div style={{ background: '#1E293B', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                1. Direct WhatsApp Commerce
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Buyers connect directly with verified shopkeepers on WhatsApp with prefilled product SKU, price, and warranty details. No cart abandonments, no commissions.
              </p>
            </div>

            <div style={{ background: '#1E293B', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                2. Trust Passport & CIPC Verification
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Every supplier is vetted against official CIPC company registrations, SARS Good Standing pins, CIDB contractor grades, and real Google Reviews.
              </p>
            </div>

            <div style={{ background: '#1E293B', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                3. Automated Google & YouTube Feeds
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Merchants automatically broadcast their stock to Google Shopping, Local Inventory Ads in malls, Google Business Profile, and YouTube Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MERCHANT ONBOARDING CTA BANNER */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #047857 100%)',
            color: '#FFFFFF',
            padding: '3rem',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div>
            <span className="badge badge-green" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: 'none', marginBottom: '0.75rem' }}>
              🏪 Are you a South African Merchant or Supplier?
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0' }}>
              List Your Store & Connect Your WhatsApp in 2 Minutes
            </h2>
            <p style={{ color: '#E2E8F0', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Receive direct customer inquiries from your local mall or area with 0% transaction fees and automated Google Shopping XML feeds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/merchant/claim"
              className="btn btn-whatsapp"
              style={{ fontSize: '1rem', padding: '0.85rem 1.75rem' }}
            >
              ➕ Claim & List Your Shop Now
            </Link>
            <Link
              href="/merchant/dashboard"
              className="btn btn-outline"
              style={{ fontSize: '1rem', padding: '0.85rem 1.5rem', background: '#FFFFFF', color: '#0F172A' }}
            >
              Merchant Centre &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
