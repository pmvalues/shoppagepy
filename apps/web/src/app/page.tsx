export const dynamic = 'force-dynamic';

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
import ProductCard from '@/components/ProductCard';
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

  const topMerchants = NationwideMerchantStore.searchMerchants({ limit: 8, offset: 0 }).items;

  return (
    <div>
      {/* 1. HERO CENTERPIECE WITH AMBIENT MESH GLOW */}
      <section style={{
        background: 'radial-gradient(ellipse 900px 420px at 50% -10%, rgba(37, 99, 235, 0.12) 0%, rgba(16, 185, 129, 0.05) 45%, #F8FAFC 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '4.5rem 1rem 3.5rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'var(--emerald-50)',
            border: '1px solid var(--emerald-200)',
            padding: '0.4rem 0.95rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.775rem',
            fontWeight: 800,
            color: 'var(--emerald-800)',
            letterSpacing: '0.03em',
            marginBottom: '1.25rem'
          }}>
            <span className="pulse-dot"></span> LIVE NATIONAL COMMERCE GRID · {totalMerchantsCount.toLocaleString()} VERIFIED STORES · {totalCatalogCount.toLocaleString()} PRODUCTS
          </div>

          <h1 style={{
            fontSize: '3.25rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: '0.85rem',
            color: 'var(--slate-900)'
          }}>
            Search. Shop. Direct Trade.<br />
            <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              0% Middleman Take Rate.
            </span>
          </h1>

          <p style={{
            color: 'var(--slate-600)',
            fontSize: '1.05rem',
            maxWidth: '620px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.6
          }}>
            South Africa&apos;s National Commerce Intelligence Grid.<br />
            Connect directly with verified local stores (Phone, Web, In-Store, Messaging) with zero transaction fees.
          </p>

          <LiveSearch />

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link href="/search?q=inverter" className="btn btn-outline">🔍 Shoppage Search</Link>
            <Link href="/search" className="btn btn-outline">🛍️ Price Matrix</Link>
            <Link href="/requests" className="btn btn-outline">📋 Post Buyer RFQ</Link>
            <Link href="/merchant/claim" className="btn btn-outline" style={{ color: '#059669', fontWeight: 800 }}>🏪 List Store — Free</Link>
          </div>

          {/* Popular Search Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.75rem' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--slate-400)', fontWeight: 700 }}>Popular:</span>
            <Link href="/search?q=Deye+8kW" className="badge badge-amber">⚡ Deye 8kW Inverter</Link>
            <Link href="/search?q=Dyness+5.12kWh" className="badge badge-blue">🔋 Dyness 5.12kWh</Link>
            <Link href="/search?q=Tier+1+Solar+Panels" className="badge badge-green">☀️ Solar Panels</Link>
            <Link href="/search?q=PPC+Surebuild+Cement" className="badge badge-gray">🧱 PPC Cement 50kg</Link>
            <Link href="/malls?province=Gauteng" className="badge badge-blue">🏬 Mall of Africa</Link>
          </div>
        </div>
      </section>

      {/* 2. 5-PILLAR COMMERCE ECOSYSTEM BENTO */}
      <section style={{ padding: '3.5rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.35rem' }}>🌐 5-Pillar Commerce Engine</span>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--slate-900)' }}>Google Suite & Shopify Parity Infrastructure</h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Authoritative data · 0% transaction commission</span>
          </div>

          <div className="ecosystem-grid">
            <Link href="/search?q=solar" className="ecosystem-card">
              <div>
                <div className="ecosystem-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>🔍</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.4rem 0' }}>Search SERP</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.55, margin: '0 0 0.85rem 0' }}>
                  Universal SERP with AI Overview, Knowledge Graph brand panels, and verified stockists.
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 800 }}>Explore Search Engine &rarr;</div>
            </Link>

            <Link href="/search" className="ecosystem-card">
              <div>
                <div className="ecosystem-icon" style={{ background: '#ECFDF5', color: '#059669' }}>🛍️</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.4rem 0' }}>Shopping Matrix</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.55, margin: '0 0 0.85rem 0' }}>
                  Side-by-side Buy-Box price matrix, 30-day price trends, and NRS 097 grid certified technical specs.
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>Compare Store Prices &rarr;</div>
            </Link>

            <Link href="/merchants" className="ecosystem-card">
              <div>
                <div className="ecosystem-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>📍</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.4rem 0' }}>My Business Stores</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.55, margin: '0 0 0.85rem 0' }}>
                  Verified physical storefronts with real-time hours, Leaflet GPS directions, reviews, and WhatsApp direct.
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 800 }}>Browse Local Stores &rarr;</div>
            </Link>

            <Link href="/merchant/dashboard" className="ecosystem-card">
              <div>
                <div className="ecosystem-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>🏬</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.4rem 0' }}>Merchant Centre OS</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.55, margin: '0 0 0.85rem 0' }}>
                  Real-time catalog OS, instant price edits, stock toggles, and live Google Shopping feed syndication.
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7C3AED', fontWeight: 800 }}>Open Merchant OS &rarr;</div>
            </Link>

            <Link href="/shorts" className="ecosystem-card">
              <div>
                <div className="ecosystem-icon" style={{ background: '#FFF1F2', color: '#E11D48' }}>🎬</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.4rem 0' }}>Proof Shorts</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.55, margin: '0 0 0.85rem 0' }}>
                  Video commerce proof feed: unboxings, factory inspections, install guides, and creator affiliate tags.
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#E11D48', fontWeight: 800 }}>Watch Shorts &rarr;</div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. REAL-TIME NATIONAL STATS */}
      <section style={{ padding: '1rem 0 2.5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#2563EB' }}>{totalMerchantsCount.toLocaleString()}</div>
              <div className="stat-label">Verified Physical Stores</div>
            </div>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#059669' }}>{totalCatalogCount.toLocaleString()}</div>
              <div className="stat-label">Catalog Products & SKUs</div>
            </div>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#D97706' }}>{totalMallsCount.toLocaleString()}</div>
              <div className="stat-label">Shopping Centres & Malls</div>
            </div>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#7C3AED' }}>0%</div>
              <div className="stat-label">Commission On Direct Trade</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MASTER PRODUCT SHOWCASE */}
      <section style={{ padding: '2rem 0 3.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>✓ GS1 GTIN Standard</span>
              <h2 className="section-title">Trending Wholesale & Retail SKUs</h2>
              <p className="section-desc">Compare Confirmed Local Offers against external Discovered Web Offers.</p>
            </div>
            <Link href="/search" className="btn btn-outline btn-sm">
              Search all 1,000,000+ items &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {masterProducts.map((p) => {
              const productOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === p.canonicalId);
              return <ProductCard key={p.canonicalId} product={p} offers={productOffers} />;
            })}
          </div>
        </div>
      </section>

      {/* 5. PROOF SHORTS RAIL */}
      <section style={{ background: '#0F172A', padding: '3.5rem 0', color: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>🎬 Video Commerce</span>
              <h2 className="section-title" style={{ color: '#FFFFFF' }}>Watch Proof Shorts & Teardowns</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>Unboxings and mall walks tethered to live local stockists.</p>
            </div>
            <Link href="/shorts" style={{ color: '#7DD3FC', fontSize: '0.9rem', fontWeight: 700 }}>All Shorts &rarr;</Link>
          </div>
          <ShortsRail />
        </div>
      </section>

      {/* 6. SPATIAL MALLS SPOTLIGHT */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>🏬 Spatial Commerce</span>
              <h2 className="section-title">South Africa&apos;s Top Shopping Hubs</h2>
              <p className="section-desc">Store rosters and tenant directories for major retail concourses.</p>
            </div>
            <Link href="/malls" className="btn btn-outline btn-sm">View all 3,296 malls &rarr;</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {flagshipMarkets.map((m) => (
              <div key={m.id} className="card card-hover" style={{ borderLeft: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue">{m.province}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{m.metro}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--slate-900)' }}>
                  <Link href={`/markets/${m.id}`}>{m.name}</Link>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
                  📍 {m.landmarks?.join(', ') || 'Major South African Retail Concourse'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Verified Tenant Roster</span>
                  <Link href={`/markets/${m.id}`} className="btn btn-outline btn-sm">View Stores &rarr;</Link>
                </div>
              </div>
            ))}
          </div>

          {/* 9-Province Distribution */}
          <div className="card" style={{ background: '#F8FAFC', padding: '1.5rem' }}>
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
        </div>
      </section>

      {/* 7. DIRECT COMMERCE GUARANTEE */}
      <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', padding: '4.5rem 0', borderTop: '1px solid #334155' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.75rem' }}>0% Middleman Take Rate</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
                Direct WhatsApp Commerce.<br />Real Stores, Real Stock.
              </h2>
              <p style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                Unlike marketplaces that charge 15-25% commission and hold payouts, Shoppage connects buyers directly to verified physical shop counters across South Africa on WhatsApp with 0% middleman fees.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/merchant/claim" className="btn btn-whatsapp" style={{ fontSize: '0.925rem', padding: '0.7rem 1.6rem', borderRadius: 'var(--radius-full)' }}>
                  + Claim Store Profile Free
                </Link>
                <Link href="/search" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)', borderRadius: 'var(--radius-full)' }}>
                  Compare Best Prices
                </Link>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '2rem', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Verified Merchant Trust Passport
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏢</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Official Storefront Verification</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Legitimate registered physical entities only.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>NRS 097 Grid Compliance</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Certified solar inverters and battery equipment.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>💬</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Direct Counter Messaging</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Instantly confirm stock and negotiate volume pricing.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
