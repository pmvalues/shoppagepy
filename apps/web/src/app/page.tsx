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
import LiveSearch from '@/components/LiveSearch';
import ProductCard from '@/components/ProductCard';
import ShortsRail from '@/components/ShortsRail';
import MerchantCard from '@/components/MerchantCard';

export default function HomePage() {
  // Featured Trending Master Products (Solar, Hardware & Mitrend Packaging)
  const masterProducts = [
    ...SA_CANONICAL_PRODUCTS.filter((p) => p.brand !== 'Mitrend Products').slice(0, 4),
    ...SA_CANONICAL_PRODUCTS.filter((p) => p.brand === 'Mitrend Products').slice(0, 8),
  ];
  const flagshipMarkets = SA_FLAGSHIP_MARKETS.slice(0, 6);
  const totalCatalogCount = MasterProductStore.getTotalProductsCount();
  const totalMallsCount = SouthAfricaMallsStore.getTotalCount();
  const totalMerchantsCount = NationwideMerchantStore.getTotalCount();
  const provinceMallCounts = SouthAfricaMallsStore.getProvinceCounts();

  const topMerchants = NationwideMerchantStore.searchMerchants({ limit: 6, offset: 0 }).items;

  return (
    <div>
      {/* 1. HERO CENTERPIECE: INSTITUTIONAL COMMERCE GRID */}
      <section
        style={{
          background: 'radial-gradient(ellipse 1000px 460px at 50% -10%, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.04) 45%, #FFFFFF 100%)',
          borderBottom: '1px solid #E2E8F0',
          padding: '4.5rem 1rem 3.5rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container">
          {/* Institutional Grid Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#065F46',
              letterSpacing: '0.04em',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            ></span>
            <span>NATIONAL COMMERCE GRID · {totalMerchantsCount.toLocaleString()} VERIFIED STORES · 1,000,000+ PRODUCTS</span>
          </div>

          <h1
            style={{
              fontSize: '3.4rem',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.12,
              marginBottom: '1rem',
              color: '#0F172A',
            }}
          >
            The Distributed Commerce Grid<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              for South African Physical Retail & B2B.
            </span>
          </h1>

          <p
            style={{
              color: '#475569',
              fontSize: '1.08rem',
              maxWidth: '660px',
              margin: '0 auto 2.25rem auto',
              lineHeight: 1.6,
            }}
          >
            Search products, compare multi-seller BuyBoxes, and trade directly with verified local stores via WhatsApp, Phone, or In-Store with <strong>0% middleman commission</strong>.
          </p>

          <LiveSearch />

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
            <Link href="/search?q=inverter" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              🔍 Search Catalog
            </Link>
            <Link href="/search?tab=shopping" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              🛍️ Google Shopping Grid
            </Link>
            <Link href="/requests" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              📋 Post Buyer RFQ
            </Link>
            <Link
              href="/merchant/claim"
              className="btn btn-primary"
              style={{ borderRadius: '8px', fontWeight: 800, background: '#059669', borderColor: '#059669' }}
            >
              + List Store (Free)
            </Link>
          </div>

          {/* Popular Search Intent Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '2rem' }}>
            <span style={{ fontSize: '0.775rem', color: '#94A3B8', fontWeight: 700 }}>Popular Searches:</span>
            <Link href="/search?q=Mitrend" className="badge badge-blue" style={{ textDecoration: 'none' }}>
              🏨 Mitrend Products (Midrand)
            </Link>
            <Link href="/search?q=hotel+hanger" className="badge badge-green" style={{ textDecoration: 'none' }}>
              👔 Anti-Theft Hotel Hangers
            </Link>
            <Link href="/search?q=measuring+spoon" className="badge badge-amber" style={{ textDecoration: 'none' }}>
              🥄 Measuring Dosage Spoons
            </Link>
            <Link href="/search?q=silicone+lid" className="badge badge-gray" style={{ textDecoration: 'none' }}>
              🥣 Food Packaging Containers
            </Link>
            <Link href="/search?q=Deye+8kW" className="badge badge-amber" style={{ textDecoration: 'none' }}>
              ⚡ Deye 8kW Hybrid Inverter
            </Link>
            <Link href="/search?q=Dyness+5.12kWh" className="badge badge-blue" style={{ textDecoration: 'none' }}>
              🔋 Dyness 5.12kWh Battery
            </Link>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME NATIONAL GRID TELEMETRY */}
      <section style={{ padding: '2.5rem 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="stat-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px' }}>
              <div className="stat-number" style={{ color: '#2563EB', fontSize: '2.2rem', fontWeight: 900 }}>{totalMerchantsCount.toLocaleString()}</div>
              <div className="stat-label" style={{ fontWeight: 700, color: '#475569' }}>Verified Physical Stores</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.35rem', fontWeight: 600 }}>Active Across 9 Provinces</div>
            </div>

            <div className="stat-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px' }}>
              <div className="stat-number" style={{ color: '#059669', fontSize: '2.2rem', fontWeight: 900 }}>{totalCatalogCount.toLocaleString()}</div>
              <div className="stat-label" style={{ fontWeight: 700, color: '#475569' }}>Canonical Master SKUs</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.35rem', fontWeight: 600 }}>GS1 GTIN-13 Deduplicated</div>
            </div>

            <div className="stat-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px' }}>
              <div className="stat-number" style={{ color: '#D97706', fontSize: '2.2rem', fontWeight: 900 }}>{totalMallsCount.toLocaleString()}</div>
              <div className="stat-label" style={{ fontWeight: 700, color: '#475569' }}>Shopping Centres & Malls</div>
              <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '0.35rem', fontWeight: 600 }}>GPS Geofenced Footprint</div>
            </div>

            <div className="stat-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px' }}>
              <div className="stat-number" style={{ color: '#7C3AED', fontSize: '2.2rem', fontWeight: 900 }}>0.00%</div>
              <div className="stat-label" style={{ fontWeight: 700, color: '#475569' }}>Middleman Take Rate</div>
              <div style={{ fontSize: '0.75rem', color: '#7C3AED', marginTop: '0.35rem', fontWeight: 600 }}>Direct WhatsApp & In-Store Trade</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED FLAGSHIP SPOTLIGHTS (Mitrend & SunPower) */}
      <section style={{ padding: '3.5rem 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.35rem' }}>🏨 Flagship Showrooms</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Verified Manufacturers & Wholesalers</h2>
              <p className="section-desc">Direct factory pricing, SABS compliance certificates, and immediate trade counter collection.</p>
            </div>
            <Link href="/merchants" className="btn btn-outline btn-sm">
              Explore All 74,000+ Stores &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {/* Mitrend Card */}
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.2rem 0' }}>
                      Mitrend Products (Pty) Ltd
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      CIPC: <strong>2018/489102/07</strong> · Halfway Gardens, Midrand
                    </div>
                  </div>
                  <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                    157 Live SKUs
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Commercial food packaging, tamper-evident tubs, measuring spoons, hotel anti-theft hangers, and catering displayware.
                </p>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ SABS Food Grade</span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>⚡ Direct WhatsApp Quotes</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>📍 Midrand Showroom</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <Link
                  href="/m/loc_mitrend_midrand"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', background: '#7F54B3', borderColor: '#7F54B3' }}
                >
                  Enter Digital Flagship &rarr;
                </Link>
                <a
                  href="https://wa.me/27105007670?text=Hi%20Mitrend%2C%20I%20am%20inquiring%20about%20your%20catering%20and%20packaging%20products%20on%20Shoppage."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* SunPower Card */}
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.2rem 0' }}>
                      SunPower Solutions
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Crown Mines Wholesale Hub, Johannesburg
                    </div>
                  </div>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                    Solar Importer
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Authorized master stockist for Deye hybrid inverters, Dyness lithium batteries, and Tier-1 solar panels. SABS NRS 097 grid certified.
                </p>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ NRS 097 Certified</span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>⚡ Stage 6 Ready</span>
                  <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>🛡️ 10 Year Warranty</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <Link
                  href="/m/loc_sunpower_crownmines"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  Enter Digital Flagship &rarr;
                </Link>
                <a
                  href="https://wa.me/27110001001?text=Hi%20SunPower%2C%20I%20am%20inquiring%20about%20Deye%20and%20Dyness%20inverter%20stock%20on%20Shoppage."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MASTER PRODUCT SHOWCASE (GS1 Canonical Products) */}
      <section style={{ padding: '3.5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>✓ GS1 GTIN Standard</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Trending Wholesale & Retail SKUs</h2>
              <p className="section-desc">Multi-seller BuyBox price comparison matrix across verified South African stockists.</p>
            </div>
            <Link href="/search" className="btn btn-outline btn-sm">
              Search all 1,000,000+ items &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
            {masterProducts.map((p) => {
              const productOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === p.canonicalId);
              return <ProductCard key={p.canonicalId} product={p} offers={productOffers} />;
            })}
          </div>
        </div>
      </section>

      {/* 5. PROOF SHORTS & VIDEO COMMERCE */}
      <section style={{ background: '#0F172A', padding: '3.5rem 0', color: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>🎬 Video Commerce</span>
              <h2 className="section-title" style={{ color: '#FFFFFF', fontSize: '1.6rem', fontWeight: 900 }}>Watch Proof Shorts & Product Showcases</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>Real product teardowns, factory inspections, and showroom walkthroughs.</p>
            </div>
            <Link href="/shorts" style={{ color: '#7DD3FC', fontSize: '0.9rem', fontWeight: 700 }}>All Shorts &rarr;</Link>
          </div>
          <ShortsRail />
        </div>
      </section>

      {/* 6. SPATIAL SHOPPING HUBS & MALLS */}
      <section style={{ padding: '3.5rem 0', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>🏬 Spatial Commerce</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Top South African Shopping Centres & Malls</h2>
              <p className="section-desc">Geofenced store rosters and physical tenant directories for 3,296 commercial concourses.</p>
            </div>
            <Link href="/malls" className="btn btn-outline btn-sm">View all 3,296 malls &rarr;</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {flagshipMarkets.map((m) => (
              <div key={m.id} className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                    {m.marketType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
                    {((m as any).totalMerchants || 50)}+ Verified Stores
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.35rem 0', color: '#0F172A' }}>
                  <Link href={`/market/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {m.name}
                  </Link>
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
                  📍 {m.geo?.streetAddress || `${m.metro}, ${m.province}`}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>GLA: {((m as any).glaSquareMeters) ? `${(m as any).glaSquareMeters.toLocaleString()} m²` : 'Regional Hub'}</span>
                  <Link href={`/market/${m.id}`} className="btn btn-outline btn-sm" style={{ padding: '0.35rem 0.75rem' }}>
                    Browse Stores &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
