import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  SA_COMPREHENSIVE_MARKETS,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
  SA_FLAGSHIP_MERCHANTS,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  const market = SouthAfricaMallsStore.getMallById(params.id) || SA_COMPREHENSIVE_MARKETS.find((m) => m.id === params.id);

  if (!market) {
    return notFound();
  }

  const { items: merchantsInMarket, total: totalMerchants } = NationwideMerchantStore.getMerchantsByMarket(market.id, 24);
  const isVirtual = market.marketType.startsWith('virtual_');

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link> &gt; <Link href="/markets">Markets</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>{market.name}</span>
      </div>

      {/* Market Hero Header */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '2.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className={`badge ${isVirtual ? 'badge-blue' : 'badge-green'}`}>
                {market.marketType.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="badge badge-blue">
                {market.metro}, {market.province}
              </span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              {market.name}
            </h1>

            {market.geo && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>
                📍 {market.geo.streetAddress} (GPS: {market.geo.latitude}, {market.geo.longitude})
              </p>
            )}

            {market.operatingHours && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ⏰ Operating Hours: {market.operatingHours}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {market.geo?.googleMapsUrl && (
              <a
                href={market.geo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textAlign: 'center' }}
              >
                📍 Open in Google Maps
              </a>
            )}
            {market.virtualMeta?.platformUrl && (
              <a
                href={market.virtualMeta.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textAlign: 'center' }}
              >
                🌐 Visit Platform Portal
              </a>
            )}
            <Link
              href={`/merchant/claim?marketId=${market.id}`}
              className="btn btn-whatsapp"
              style={{ textAlign: 'center' }}
            >
              ➕ List Your Stall Here
            </Link>
          </div>
        </div>

        {/* Safety & Logistics Notices */}
        {market.safetyNotices && market.safetyNotices.length > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>🛡️ Local Commercial Notices:</strong>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {market.safetyNotices.map((notice, idx) => (
                <li key={idx}>{notice}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Markets-in-Markets Sub-Zones Hierarchy */}
      {market.zones && market.zones.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 className="section-title">🏢 Markets in Market (Sub-Zones & Precincts)</h2>
          <p className="section-desc">Internal trading sections, specialized corridors, and dedicated wholesale buildings.</p>

          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            {market.zones.map((zone) => (
              <div key={zone.id} className="card" style={{ background: '#F8FAFC' }}>
                <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>
                  {zone.zoneCode || 'ZONE'}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {zone.name}
                </h3>
                {zone.categoryFocus && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Focus: {zone.categoryFocus.replace(/_/g, ' ')}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {zone.description || `Specialized trade zone hosting active retail & wholesale stalls.`}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Stall Capacity: <strong>{zone.stallCount || 30} stalls</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Virtual Market Operating Infrastructure */}
      {market.virtualMeta && (
        <section className="card" style={{ marginBottom: '3rem', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
            🌐 Virtual Platform Infrastructure & Integration
          </h2>
          <p style={{ color: '#14532D', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {market.virtualMeta.operationalModel}
          </p>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="card" style={{ background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Integration Mode</div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {market.virtualMeta.apiIntegrationType?.replace(/_/g, ' ').toUpperCase() || 'REST API / WEBHOOK'}
              </strong>
            </div>
            <div className="card" style={{ background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Portal Classification</div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {market.virtualMeta.portalType.replace(/_/g, ' ').toUpperCase()}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* Active Merchants in this Market */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="section-title">🏪 Verified Merchants & Stalls ({merchantsInMarket.length})</h2>
            <p className="section-desc">Direct contact actions and verified phone numbers for this trade node.</p>
          </div>
          <Link
            href={`/merchant/claim?marketId=${market.id}`}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            + Register Your Stall
          </Link>
        </div>

        {merchantsInMarket.length > 0 ? (
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {merchantsInMarket.map((merchant) => {
              const merchantOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.merchantRef === merchant.id);

              return (
                <div key={merchant.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        <Link href={`/m/${merchant.id}`}>{merchant.name}</Link>
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        📍 {merchant.stallIdentifier || 'Main Concourse'}
                      </p>
                    </div>
                    <span className="badge badge-green">Verified Active</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Active In-Stock Offers: <strong>{merchantOffers.length} items</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/m/${merchant.id}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }}>
                      View Stall & Stock
                    </Link>
                    {merchant.contacts.whatsapp && (
                      <a
                        href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}`}
                        className="btn btn-whatsapp"
                        style={{ fontSize: '0.8rem' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No merchants have claimed stalls in this market yet.
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you a trader or store owner operating in {market.name}? List your stall in 60 seconds.
            </p>
            <Link href={`/merchant/claim?marketId=${market.id}`} className="btn btn-primary">
              🚀 Be the First Merchant to List Your Stall
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
