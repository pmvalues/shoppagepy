export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  MasterProductStore,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
  SA_COMPREHENSIVE_MARKETS,
  SA_FLAGSHIP_MARKETS,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';
import LiveSearch from '@/components/LiveSearch';
import ProductCard from '@/components/ProductCard';
import ShortsRail from '@/components/ShortsRail';

export default function HomePage() {
  // Featured Trending Master Products (Solar, Hardware & Mitrend Packaging)
  const masterProducts = [
    ...SA_CANONICAL_PRODUCTS.filter((p) => p.brand !== 'Mitrend Products').slice(0, 4),
    ...SA_CANONICAL_PRODUCTS.filter((p) => p.brand === 'Mitrend Products').slice(0, 8),
  ];
  const flagshipMarkets = SA_FLAGSHIP_MARKETS.slice(0, 6);
  const virtualMarkets = SA_COMPREHENSIVE_MARKETS.filter((m) => m.marketType.startsWith('virtual_')).slice(0, 4);
  const totalCatalogCount = MasterProductStore.getTotalProductsCount();
  const totalMallsCount = SouthAfricaMallsStore.getTotalCount();
  const totalMerchantsCount = NationwideMerchantStore.getTotalCount();

  const categories = [
    {
      id: 'solar',
      name: 'Solar & Load-Shedding',
      icon: '⚡',
      skus: '48,000+ SKUs',
      href: '/search?q=inverter',
      bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      color: '#1E40AF',
      tag: 'NRS 097 Certified',
    },
    {
      id: 'packaging',
      name: 'Packaging & Catering',
      icon: '🍽️',
      skus: '157 Mitrend SKUs',
      href: '/search?q=Mitrend',
      bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
      color: '#6B21A8',
      tag: 'SABS Food Grade',
    },
    {
      id: 'hardware',
      name: 'Building & Hardware',
      icon: '🧱',
      skus: '120,000+ SKUs',
      href: '/search?q=cement',
      bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      color: '#92400E',
      tag: 'SABS 42.5N Quality',
    },
    {
      id: 'phones',
      name: 'Smartphones & Tech',
      icon: '📱',
      skus: '85,000+ SKUs',
      href: '/search?q=samsung',
      bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      color: '#065F46',
      tag: 'ICASA Approved',
    },
    {
      id: 'auto',
      name: 'Automotive & Spares',
      icon: '🚗',
      skus: '95,000+ SKUs',
      href: '/search?q=battery',
      bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
      color: '#9F1239',
      tag: 'Direct Spares Importers',
    },
    {
      id: 'fmcg',
      name: 'Wholesale FMCG & Spaza',
      icon: '🛒',
      skus: '310,000+ SKUs',
      href: '/search?q=wholesale',
      bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      color: '#166534',
      tag: 'Bulk Case Pricing',
    },
  ];

  return (
    <div>
      {/* 1. HERO CENTERPIECE: SHOPPAGE TIME & REAL-TIME COMMERCE TIMELINE */}
      <section
        style={{
          background: 'radial-gradient(ellipse 1000px 480px at 50% -10%, rgba(37, 99, 235, 0.14) 0%, rgba(16, 185, 129, 0.06) 45%, #FFFFFF 100%)',
          borderBottom: '1px solid #E2E8F0',
          padding: '4rem 1rem 3rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container">
          {/* Live Shoppage Time Badge */}
          <Link
            href="/time"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              padding: '0.4rem 1.15rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#1E40AF',
              letterSpacing: '0.03em',
              marginBottom: '1.5rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 8px #EF4444',
                animation: 'pulse 1.5s infinite',
              }}
            ></span>
            <span>⚡ SHOPPAGE TIME · REAL-TIME COMMERCIAL WIRE & TRADE PULSE (LIVE)</span>
          </Link>

          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.12,
              marginBottom: '1rem',
              color: '#0F172A',
            }}
          >
            Shoppage Time<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Real-Time Commercial Timeline for South Africa.
            </span>
          </h1>

          <p
            style={{
              color: '#475569',
              fontSize: '1.08rem',
              maxWidth: '720px',
              margin: '0 auto 2.25rem auto',
              lineHeight: 1.6,
            }}
          >
            Stream live price drops, swept Facebook group clearance deals, Twitter / X trade alerts, and contractor sourcing RFQs across <strong>74,000+ verified local stores</strong> with <strong>0% middleman commission</strong>.
          </p>

          <LiveSearch />

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
            <Link
              href="/time"
              className="btn btn-primary"
              style={{ borderRadius: '8px', fontWeight: 800, background: '#2563EB', borderColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>⚡</span> Open Shoppage Time Wire
            </Link>
            <Link href="/search?q=inverter" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              🔍 Search Catalog
            </Link>
            <Link href="/markets" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              👥 5,200+ Virtual Markets & Groups
            </Link>
            <Link href="/shorts" className="btn btn-outline" style={{ borderRadius: '8px', fontWeight: 700 }}>
              📱 Proof Shorts
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
            <span style={{ fontSize: '0.775rem', color: '#94A3B8', fontWeight: 700 }}>Popular on Shoppage Time:</span>
            <Link href="/search?q=Mitrend" className="badge badge-purple" style={{ textDecoration: 'none' }}>
              🏨 Mitrend Products (Midrand Factory)
            </Link>
            <Link href="/search?q=Deye+8kW" className="badge badge-amber" style={{ textDecoration: 'none' }}>
              ⚡ Deye 8kW Hybrid Inverters
            </Link>
            <Link href="/search?q=Dyness+5.12kWh" className="badge badge-blue" style={{ textDecoration: 'none' }}>
              🔋 Dyness 5.12kWh Lithium Batteries
            </Link>
            <Link href="/search?q=cement" className="badge badge-gray" style={{ textDecoration: 'none' }}>
              🧱 SABS 42.5N Cement Wholesale
            </Link>
            <Link href="/search?q=hotel+hanger" className="badge badge-green" style={{ textDecoration: 'none' }}>
              👔 Anti-Theft Hotel Hangers
            </Link>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME SHOPPAGE TIME TICKER & LIVE SOCIAL WIRE */}
      <section style={{ padding: '2.5rem 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                  Live on Shoppage Time
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Sweeping 5,200+ Facebook Groups, Twitter / X streams, and 74,000+ Trade Counters
                </div>
              </div>
            </div>

            <Link
              href="/time"
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 800, color: '#2563EB', borderColor: '#BFDBFE', background: '#EFF6FF', borderRadius: '8px' }}
            >
              Explore Full Shoppage Time Wire &rarr;
            </Link>
          </div>

          {/* 4 Live Ticker Cards (Twitter/X Style Real-Time Drops) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Card 1 */}
            <div
              className="card card-interactive"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: '#2563EB' }}>🛍️ SunPower Crown Mines</span>
                  <span>1m ago</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', lineHeight: 1.35 }}>
                  Deye 5kW Hybrid Inverter (SUN-5K-SG03)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  NRS 097 grid certified. 14 units left for same-day counter collection.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>R 14,850</span>
                <Link href="/search?q=Deye+5kW" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  BuyBox &rarr;
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="card card-interactive"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: '#1877F2' }}>📘 Sandton FB Group (142k)</span>
                  <span>4m ago</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', lineHeight: 1.35 }}>
                  Dyness 5.12kWh LiFePO4 Lithium Battery
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  12 crates sealed stock from commercial over-order. Invoicing ready.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>R 16,900</span>
                <Link href="/search?q=Dyness" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  BuyBox &rarr;
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className="card card-interactive"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: '#000000' }}>𝕏 @MitrendPackaging</span>
                  <span>9m ago</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', lineHeight: 1.35 }}>
                  500ml Tamper-Evident Food Tubs (Box 250)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  Food-grade polypropylene certified direct from Midrand factory floor.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>R 185 /box</span>
                <Link href="/search?q=Mitrend" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  BuyBox &rarr;
                </Link>
              </div>
            </div>

            {/* Card 4 */}
            <div
              className="card card-interactive"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: '#D97706' }}>📋 Western Cape RFQ</span>
                  <span>16m ago</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', lineHeight: 1.35 }}>
                  80x 550W Tier-1 Mono Solar Panels
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  Commercial contractor seeking stock in Cape Town for Monday pickup.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#2563EB' }}>R 1,750 /ea</span>
                <Link href="/requests" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  Quote RFQ &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE CATEGORY DISCOVERY RAIL */}
      <section style={{ padding: '3.5rem 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>🗂️ Strategic Industry Rails</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Explore South Africa&apos;s Core Sectors</h2>
              <p className="section-desc">Direct factory trade counters, SABS approved manufacturers, and local stockists.</p>
            </div>
            <Link href="/search" className="btn btn-outline btn-sm">
              Explore All Categories &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="card card-interactive"
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: c.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                    {c.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {c.skus}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: c.color, textTransform: 'uppercase' }}>
                    {c.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED FLAGSHIP SPOTLIGHTS (Mitrend & SunPower) */}
      <section style={{ padding: '3.5rem 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.35rem' }}>🏨 Flagship Showrooms</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Verified Manufacturers & Master Stockists</h2>
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
                  Commercial food packaging, tamper-evident tubs, measuring dosage spoons, hotel anti-theft hangers, and catering displayware.
                </p>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ SABS Food Grade</span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>⚡ Direct Inquiries & RFQs</span>
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
                <Link
                  href="/m/loc_mitrend_midrand?tab=rfq"
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  ✉️ Direct RFQ
                </Link>
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
                <Link
                  href="/m/loc_sunpower_crownmines?tab=rfq"
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  ✉️ Direct RFQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VIRTUAL B2B TRADING EXCHANGES & GUILDS */}
      <section style={{ padding: '3.5rem 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.35rem' }}>🌐 High-Volume B2B Floors</span>
              <h2 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Massive Virtual Trading Floors & Industry Guilds</h2>
              <p className="section-desc">Join trading floors as a verified merchant or follow catalog drops as a contractor or corporate buyer.</p>
            </div>
            <Link href="/markets" className="btn btn-outline btn-sm">
              Explore All Virtual Markets &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {virtualMarkets.map((vm) => (
              <div
                key={vm.id}
                className="card card-interactive"
                style={{
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1.5px solid #BFDBFE',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                      B2B TRADING EXCHANGE
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>
                      {((vm as any).activeMerchantsCount || 1000).toLocaleString()}+ Suppliers
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0 0.5rem 0' }}>
                    <Link href={`/market/${vm.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {vm.name}
                    </Link>
                  </h3>

                  <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {(vm as any).virtualMeta?.operationalModel || 'Direct B2B wholesale clearinghouse and direct supplier network.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #DBEAFE' }}>
                  <Link
                    href={`/market/${vm.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center', borderRadius: '6px', fontSize: '0.8rem' }}
                  >
                    Explore Floor
                  </Link>
                  <Link
                    href={`/merchant/claim?marketId=${vm.id}&marketName=${encodeURIComponent(vm.name)}`}
                    className="btn btn-primary btn-sm"
                    style={{ justifyContent: 'center', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}
                  >
                    + Join Floor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. MASTER PRODUCT SHOWCASE (GS1 Canonical Products) */}
      <section style={{ padding: '3.5rem 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
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

      {/* 7. THE 0% TAKE-RATE MOAT BENTO */}
      <section style={{ padding: '4rem 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
              🛡️ The Zero-Commission Advantage
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Why Buyers & Physical Merchants Choose Shoppage
            </h2>
            <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
              Counter-positioning against high marketplace fees to enable frictionless direct commerce.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💸</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                0% Middleman Markups
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                Legacy marketplaces charge merchants 15%–25% commissions. On Shoppage, prices are direct from warehouse counters with zero toll-booth fees.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📞</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                Omnichannel Direct Trade
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                Connect directly via Phone, Official Email RFQ, In-Store Showroom Visit, or Direct Message to negotiate volume discounts and confirm stock in real time.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏬</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                Immediate Counter Collection
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                Locate confirmed stock in 3,296 geofenced shopping centres and wholesale markets for same-day walk-in pickup.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏛️</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                CIPC & SABS Verification
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                Every merchant is verified against CIPC business registration data, ensuring high-trust transactions with legitimate businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PROOF SHORTS & VIDEO COMMERCE */}
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

      {/* 9. SPATIAL SHOPPING HUBS & MALLS */}
      <section style={{ padding: '3.5rem 0', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
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
              <div key={m.id} className="card" style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
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
