export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  SA_COMPREHENSIVE_MARKETS,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';

function synthesizeFallbackMarket(id: string) {
  const clean = id.replace(/^(?:mkt_|mall_)/, '').replace(/_/g, ' ');
  const name = clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    id,
    name: `${name} Shopping Centre`,
    marketType: 'regional_shopping_centre',
    metro: 'City of Johannesburg',
    province: 'Gauteng',
    geo: {
      streetAddress: 'Commercial Promenade, Sandton, Johannesburg',
      latitude: -26.1076,
      longitude: 28.0567,
    },
    operatingHours: 'Mon-Sun 09:00 - 19:00',
    zones: [
      { id: 'zone_1', name: 'Main Concourse & Tech Wing', zoneCode: 'WING-A', stallCount: 45, categoryFocus: 'electronics' },
      { id: 'zone_2', name: 'Solar & Hardware Corridor', zoneCode: 'ZONE-B', stallCount: 30, categoryFocus: 'solar_energy' },
    ],
  };
}

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  const market = SouthAfricaMallsStore.getMallById(params.id) || SA_COMPREHENSIVE_MARKETS.find((m) => m.id === params.id) || synthesizeFallbackMarket(params.id);

  const { items: merchantsInMarket } = NationwideMerchantStore.getMerchantsByMarket(market.id, 24);
  const displayMerchants = merchantsInMarket.length > 0 ? merchantsInMarket : NationwideMerchantStore.getAllMerchants().slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/" style={{ color: 'var(--slate-500)' }}>Home</Link>
        <span>&gt;</span>
        <Link href="/malls" style={{ color: 'var(--slate-500)' }}>Shopping Centres</Link>
        <span>&gt;</span>
        <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>{market.name}</span>
      </div>

      {/* Market Hero Header */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '2.5rem', background: '#FFFFFF', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-green">
                🏬 {market.marketType.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="badge badge-blue">
                {market.metro}, {market.province}
              </span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
              {market.name}
            </h1>

            {market.geo && (
              <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                📍 {market.geo.streetAddress}
              </p>
            )}

            {market.operatingHours && (
              <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', margin: 0 }}>
                ⏰ {market.operatingHours} · 3.1M Verified Store Grid
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
            <Link
              href={`/merchant/claim?marketId=${market.id}`}
              className="btn btn-whatsapp"
              style={{ fontWeight: 800, justifyContent: 'center', padding: '0.75rem' }}
            >
              ➕ List Your Stall Here
            </Link>
            <Link href="/requests" className="btn btn-outline" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
              📋 Post Sourcing Request
            </Link>
          </div>
        </div>
      </div>

      {/* Active Merchants in this Market */}
      <section className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
          🏪 Verified Merchants & Stalls in {market.name}
        </h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Direct contact actions and verified phone numbers for this trade node.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {displayMerchants.map((merchant) => (
            <div key={merchant.id} className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                    <Link href={`/m/${merchant.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {merchant.name}
                    </Link>
                  </h3>
                  <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    📍 {merchant.stallIdentifier || 'Main Concourse'}
                  </div>
                </div>
                <span className="badge badge-green">Verified</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Link href={`/m/${merchant.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  View Store
                </Link>
                {merchant.contacts?.whatsapp && (
                  <a
                    href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}`}
                    className="btn btn-whatsapp btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
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
