import Link from 'next/link';
import { SA_MAJOR_PRODUCT_RETAILERS } from '@shoppage/kernel';

export default function ProductsSweepBlueprintPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link> &gt; <Link href="/p/sun_inv_5kwh_01">Products</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>National Sweeper Blueprint</span>
      </div>

      {/* Hero Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-green">🇿🇦 Master Product Intelligence</span>
          <span className="badge badge-blue">GS1 South Africa (Prefix 600 / 601)</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          How We Sweep All Products in South Africa
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '780px', lineHeight: 1.6 }}>
          A unified, multi-tiered crawling and canonicalization pipeline designed to ingest, normalize, and match every SKU sold across retail supermarkets, wholesale cash & carries, solar distributors, hardware yards, and online marketplaces in South Africa.
        </p>
      </div>

      {/* Architecture Flow Diagram (CSS Grid) */}
      <div className="card" style={{ marginBottom: '3rem', background: '#0F172A', color: '#F8FAFC', padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginBottom: '1.5rem' }}>
          ⚙️ 4-Stage South African Product Ingestion Architecture
        </h2>

        <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>1️⃣</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.4rem' }}>
              GS1 National Barcodes
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Scan the <strong>6000000000000 – 6019999999999</strong> country namespace for South African registered manufactured products and packaged goods.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>2️⃣</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.4rem' }}>
              Multi-Retailer Sweepers
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Headless JSON adapters crawling sitemaps, public product endpoints, and B2B trade feeds across Takealot, Checkers, Makro, Builders, and Solar distros.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>3️⃣</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.4rem' }}>
              English Canonicalizer
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Sanitizes promotional junk, decodes HTML entities, extracts pack sizes (kg/kWh), and maps to the 5,000+ Google Product Taxonomy.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>4️⃣</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.4rem' }}>
              3.1M Store Matcher
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Connects physical merchants from the 3,109,299 store database to master product SKUs via barcode scanning or one-click zero-offer onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Major Data Feeds & Retail Sources */}
      <section style={{ marginBottom: '3.5rem' }}>
        <h2 className="section-title">📦 Major South African Product Feeds & Sources</h2>
        <p className="section-desc">Key retail, wholesale, and technical distributors swept by the engine.</p>

        <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
          {SA_MAJOR_PRODUCT_RETAILERS.map((source) => (
            <div key={source.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{source.sector}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{source.coverageEstimate}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.4rem 0' }}>{source.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Protocol:</strong> {source.dataAccessProtocol}
                </p>
              </div>

              <div style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '6px', color: 'var(--text-muted)' }}>
                🏷️ <strong>GS1 Range / Standard:</strong> {source.gs1Prefix}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sector Deep-Dives */}
      <section style={{ marginBottom: '3.5rem' }}>
        <h2 className="section-title">🛍️ Category-by-Category Sweeping Strategy</h2>
        <p className="section-desc">How specialized product sectors are discovered and canonicalized in South Africa.</p>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Solar & Energy */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Solar & Load-Shedding Power Systems
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Extracted directly from technical distributor registries (Rubicon, Herholdt’s, SolarAdvice, Mustek) and cross-referenced with the <strong>NRS 097 City of Cape Town / Eskom Grid Approved Inverter List</strong>.
            </p>
            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Hybrid Inverters: Sunsynk (5kW, 8kW, 12kW), Deye, Luxpower, Victron.</li>
              <li>LiFePO4 Batteries: Hubble AM-2 (5.5kWh), Dyness BX51100, Freedom Won Lite.</li>
              <li>Tier-1 Solar PV Panels: Canadian Solar HiKu6 550W/650W, JA Solar, Longi.</li>
            </ul>
          </div>

          {/* FMCG & Groceries */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🥑 FMCG, Food & Packaged Groceries
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Extracted via GS1 SA barcode registers (600 / 601) and digital retail storefronts (Shoprite Sixty60, Pick n Pay ASAP, Woolworths, Makro).
            </p>
            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Staples: White Star Maize Meal, Huletts Sugar, Clover Milk, Tastic Rice.</li>
              <li>Canned & Condiments: Koo Baked Beans, Lucky Star Pilchards, Mrs Ball’s Chutney, All Gold.</li>
              <li>Vernacular terms preserved in aliases: <em>Biltong, Boerewors, Chakalaka, Rusks</em>.</li>
            </ul>
          </div>

          {/* Building & Hardware */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏗️ Building Materials & DIY Hardware
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Extracted from trade supplier catalogs (Builders Warehouse, Cashbuild, Build It, Leroy Merlin) with SABS compliance indicators.
            </p>
            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Cement: AfriSam All Purpose 42.5N, PPC Surebuild 42.5N, Sephaku 32.5R.</li>
              <li>Steel & Roofing: 0.47mm IBR Galvanized Corrugated Sheets, SABS Structural Pine.</li>
              <li>Electrical & Plumbing: Surfix 2.5mm² Cable, SABS Copper & Polycop piping.</li>
            </ul>
          </div>

          {/* Consumer Tech & Smartphones */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📱 Smartphones & Consumer Electronics
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Extracted from Takealot, ICASA-approved cellular equipment databases, and network operator device portfolios (Vodacom, MTN, Telkom).
            </p>
            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Apple iPhone: 15 Pro Max, 14, 13, 11 (Storage & Dual-SIM models).</li>
              <li>Samsung Galaxy: S24 Ultra, A55 5G, A35, A15.</li>
              <li>Xiaomi, Huawei, Hisense Smart TVs & Laptops.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', background: '#F8FAFC' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Explore the 1,000,000+ Master Product Catalog
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
          All swept products are indexed with sub-5ms search speeds and connected to physical stores nationwide.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/p/sun_inv_5kwh_01" className="btn btn-primary">
            ⚡ View Enriched Solar Master SKU
          </Link>
          <Link href="/merchants" className="btn btn-outline">
            🏪 Browse 3.1M Verified Stores
          </Link>
        </div>
      </div>
    </div>
  );
}
