export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  SA_COMPREHENSIVE_MARKETS,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
} from '@shoppage/kernel';

function synthesizeFallbackMarket(id: string) {
  const clean = id.replace(/^(?:mkt_|mall_|vmkt_)/, '').replace(/_/g, ' ');
  const name = clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    id,
    name: `${name} Trading Floor`,
    marketType: 'virtual_b2b_network',
    metro: 'Nationwide Commercial Grid',
    province: 'National / Cloud',
    geo: {
      streetAddress: 'National Commercial Exchange',
      latitude: -26.1076,
      longitude: 28.0567,
    },
    operatingHours: '24/7 Digital Exchange & Direct Trade Floor',
    zones: [
      { id: 'zone_1', name: 'Tier-1 Importers & Manufacturers', zoneCode: 'IMPORTERS', stallCount: 45, categoryFocus: 'wholesale' },
      { id: 'zone_2', name: 'Certified Distributors & Installers', zoneCode: 'INSTALLERS', stallCount: 60, categoryFocus: 'commercial' },
    ],
  };
}

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  const market =
    SA_COMPREHENSIVE_MARKETS.find((m) => m.id === params.id) ||
    SouthAfricaMallsStore.getMallById(params.id) ||
    synthesizeFallbackMarket(params.id);

  const { items: merchantsInMarket } = NationwideMerchantStore.getMerchantsByMarket(market.id, 24);
  const displayMerchants = merchantsInMarket.length > 0 ? merchantsInMarket : NationwideMerchantStore.getAllMerchants().slice(0, 6);
  const isVirtual = market.marketType.startsWith('virtual_');

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
        <span>&gt;</span>
        <Link href="/markets" style={{ color: '#64748B', textDecoration: 'none' }}>Markets & Exchanges</Link>
        <span>&gt;</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{market.name}</span>
      </div>

      {/* Market Hero Header */}
      <div
        className="card"
        style={{
          marginBottom: '2.5rem',
          padding: '2.5rem',
          background: isVirtual ? 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)' : '#FFFFFF',
          borderRadius: '16px',
          border: isVirtual ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`badge ${isVirtual ? 'badge-blue' : 'badge-green'}`} style={{ fontWeight: 800 }}>
                {isVirtual ? '🌐 VIRTUAL B2B TRADING EXCHANGE' : `🏬 ${market.marketType.replace(/_/g, ' ').toUpperCase()}`}
              </span>
              <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                {market.province}
              </span>
            </div>

            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem', color: '#0F172A' }}>
              {market.name}
            </h1>

            {market.geo && (
              <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                📍 {market.geo.streetAddress}
              </p>
            )}

            {(market as any).virtualMeta && (
              <p style={{ color: '#334155', fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                🌐 {(market as any).virtualMeta.operationalModel}
              </p>
            )}

            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
              ⏰ {market.operatingHours || '24/7 Digital Exchange & Direct Trade Floor'} · 0% Take-Rate Direct Trade
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '220px' }}>
            <Link
              href={`/merchant/claim?marketId=${market.id}&marketName=${encodeURIComponent(market.name)}`}
              className="btn btn-primary"
              style={{ fontWeight: 800, justifyContent: 'center', padding: '0.75rem', borderRadius: '8px' }}
            >
              + Join Trading Floor (Free)
            </Link>
            <Link
              href={`/requests?marketId=${market.id}`}
              className="btn btn-outline"
              style={{ justifyContent: 'center', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 700 }}
            >
              📋 Post Buyer Sourcing RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* Active Sub-Zones or Trading Aisles */}
      {market.zones && market.zones.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
            🏢 Sub-Zones & Trading Aisles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {market.zones.map((zone) => (
              <div key={zone.id} className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {zone.categoryFocus?.replace(/_/g, ' ') || 'Commercial Sector'}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                  {zone.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Capacity: <strong>{zone.stallCount || 30} verified vendors</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Merchants in this Market */}
      <section className="card" style={{ padding: '2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              🏪 Verified Merchants & Suppliers ({displayMerchants.length})
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Direct omnichannel communication: Call, Inquire, Visit Showroom, or Message.
            </p>
          </div>
          <Link
            href={`/merchant/claim?marketId=${market.id}`}
            className="btn btn-outline btn-sm"
            style={{ fontWeight: 700, borderRadius: '6px' }}
          >
            + Register Your Store Here
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {displayMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className="card card-interactive"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      <Link href={`/m/${merchant.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {merchant.name}
                      </Link>
                    </h3>
                    <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      📍 {merchant.stallIdentifier || merchant.addressText || 'Main Trade Concourse'}
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Verified</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#475569', margin: '0.5rem 0 1rem 0', lineHeight: 1.4 }}>
                  Category: <strong>{merchant.category || 'General Wholesale'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <Link href={`/m/${merchant.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}>
                  Enter Store
                </Link>
                {merchant.contacts?.telephone && (
                  <a
                    href={`tel:${merchant.contacts.telephone}`}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 700, padding: '0.35rem 0.65rem' }}
                    title="Direct Phone Call"
                  >
                    📞 Call
                  </a>
                )}
                {merchant.contacts?.email && (
                  <a
                    href={`mailto:${merchant.contacts.email}?subject=Inquiry via Shoppage`}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 700, padding: '0.35rem 0.65rem' }}
                    title="Direct Email RFQ"
                  >
                    ✉️ RFQ
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
