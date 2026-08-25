import Link from 'next/link';
import { SA_COMPREHENSIVE_MARKETS } from '@shoppage/kernel';

export default function MarketsExplorerPage({
  searchParams,
}: {
  searchParams: { type?: string; province?: string; q?: string };
}) {
  const typeFilter = searchParams.type;
  const provinceFilter = searchParams.province;
  const searchQuery = searchParams.q?.toLowerCase() || '';

  const filteredMarkets = SA_COMPREHENSIVE_MARKETS.filter((m) => {
    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'physical' && m.marketType.startsWith('virtual_')) return false;
      if (typeFilter === 'virtual' && !m.marketType.startsWith('virtual_')) return false;
      if (typeFilter === 'wholesale' && m.marketType !== 'wholesale_market') return false;
      if (typeFilter === 'malls' && m.marketType !== 'formal_mega_mall') return false;
      if (typeFilter === 'informal' && m.marketType !== 'informal_transport_rank' && m.marketType !== 'township_commercial_cluster') return false;
    }
    if (provinceFilter && m.province !== provinceFilter) return false;
    if (searchQuery) {
      return (
        m.name.toLowerCase().includes(searchQuery) ||
        m.metro.toLowerCase().includes(searchQuery) ||
        m.province.toLowerCase().includes(searchQuery) ||
        m.geo?.streetAddress.toLowerCase().includes(searchQuery)
      );
    }
    return true;
  });

  const physicalCount = SA_COMPREHENSIVE_MARKETS.filter((m) => !m.marketType.startsWith('virtual_')).length;
  const virtualCount = SA_COMPREHENSIVE_MARKETS.filter((m) => m.marketType.startsWith('virtual_')).length;

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
          🗺️ South Africa Market Graph · {physicalCount} Physical Trade Hubs & {virtualCount} Virtual Networks
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Explore Physical & Virtual Markets
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
          Discover physical mega-malls, wholesale container precincts, taxi rank economies, and digital B2B trade platforms across South Africa.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <Link
          href="/markets"
          className={`btn ${!typeFilter || typeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          All Markets ({SA_COMPREHENSIVE_MARKETS.length})
        </Link>
        <Link
          href="/markets?type=wholesale"
          className={`btn ${typeFilter === 'wholesale' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          📦 Wholesale Import Hubs
        </Link>
        <Link
          href="/markets?type=malls"
          className={`btn ${typeFilter === 'malls' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          🏢 Formal Mega-Malls
        </Link>
        <Link
          href="/markets?type=informal"
          className={`btn ${typeFilter === 'informal' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          🚐 Transport Ranks & Townships
        </Link>
        <Link
          href="/markets?type=virtual"
          className={`btn ${typeFilter === 'virtual' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          🌐 Virtual Marketplaces & B2B ({virtualCount})
        </Link>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '4rem' }}>
        {filteredMarkets.map((market) => {
          const isVirtual = market.marketType.startsWith('virtual_');

          return (
            <div
              key={market.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`badge ${isVirtual ? 'badge-blue' : 'badge-green'}`}>
                    {market.marketType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {market.province}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.25 }}>
                  <Link href={`/market/${market.id}`}>{market.name}</Link>
                </h3>

                {/* Physical Location vs Virtual Meta */}
                {market.geo && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    📍 {market.geo.streetAddress}
                  </p>
                )}

                {market.virtualMeta && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    🌐 {market.virtualMeta.operationalModel}
                  </p>
                )}

                {/* Sub-Zones (Markets-in-Markets) */}
                {market.zones && market.zones.length > 0 && (
                  <div style={{ marginTop: '0.75rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      🏢 Markets in Market ({market.zones.length} Sub-Zones)
                    </div>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-primary)', paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {market.zones.map((zone) => (
                        <li key={zone.id}>
                          <strong>{zone.name}</strong> {zone.stallCount ? `(${zone.stallCount} stalls)` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons & Google Maps Integration */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <span>Merchants: <strong>{market.activeMerchantsCount || market.stallCapacity || '100+'}</strong></span>
                  <span>{market.operatingHours?.split('|')[0] || 'Open Daily'}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/market/${market.id}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }}>
                    Explore Hub
                  </Link>

                  {market.geo?.googleMapsUrl && (
                    <a
                      href={market.geo.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      📍 Maps
                    </a>
                  )}

                  {market.virtualMeta?.platformUrl && (
                    <a
                      href={market.virtualMeta.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      🌐 Visit
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
