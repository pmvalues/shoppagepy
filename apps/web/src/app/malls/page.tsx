export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { SouthAfricaMallsStore } from '@shoppage/kernel';

export default async function AllMallsExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ province?: string; type?: string; q?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const province = resolvedSearchParams.province || '';
  const marketType = resolvedSearchParams.type || '';
  const query = resolvedSearchParams.q || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const { items: malls, total } = SouthAfricaMallsStore.searchMalls({
    province,
    marketType,
    query,
    limit,
    offset,
  });

  const totalMallsInCountry = SouthAfricaMallsStore.getTotalCount();
  const provinceCounts = SouthAfricaMallsStore.getProvinceCounts();
  const totalPages = Math.ceil(total / limit);

  const provinces = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'Free State',
    'North West',
    'Northern Cape',
  ];

  const types = [
    { key: '', label: 'All Formats' },
    { key: 'formal_mega_mall', label: 'Super-Regional Mega Malls (80k+ m²)' },
    { key: 'regional_shopping_centre', label: 'Regional Shopping Centres' },
    { key: 'community_shopping_centre', label: 'Community Centres' },
    { key: 'neighborhood_convenience_centre', label: 'Neighborhood & Convenience' },
    { key: 'lifestyle_centre', label: 'Lifestyle & Promenade Plazas' },
    { key: 'township_retail_plaza', label: 'Township Commercial Plazas' },
    { key: 'value_mart', label: 'Value & Building Marts' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
          🏬 South African Shopping Centre Registry · {totalMallsInCountry.toLocaleString()} Malls & Commercial Hubs
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          All South African Malls & Shopping Centres
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto' }}>
          Explore super-regional mega-malls, neighborhood convenience centres, township retail plazas, and commercial trading hubs across all 9 provinces.
        </p>
      </div>

      {/* Live Search Bar */}
      <div style={{ maxWidth: '640px', margin: '0 auto 2rem auto' }}>
        <form method="GET" action="/malls" style={{ display: 'flex', gap: '0.5rem' }}>
          {province && <input type="hidden" name="province" value={province} />}
          {marketType && <input type="hidden" name="type" value={marketType} />}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by Mall name, suburb, metro, or anchor tenant (e.g. Woolworths, Sandton, Soweto)..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
            Search
          </button>
        </form>
      </div>

      {/* Province Filter Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Link
          href={`/malls?type=${encodeURIComponent(marketType)}&q=${encodeURIComponent(query)}`}
          className={`btn ${!province ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          All Provinces ({totalMallsInCountry.toLocaleString()})
        </Link>
        {provinces.map((prov) => (
          <Link
            key={prov}
            href={`/malls?province=${encodeURIComponent(prov)}&type=${encodeURIComponent(marketType)}&q=${encodeURIComponent(query)}`}
            className={`btn ${province === prov ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            {prov} ({provinceCounts[prov] || 0})
          </Link>
        ))}
      </div>

      {/* Format Type Dropdown / Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2.5rem' }}>
        {types.map((t) => (
          <Link
            key={t.key}
            href={`/malls?province=${encodeURIComponent(province)}&type=${encodeURIComponent(t.key)}&q=${encodeURIComponent(query)}`}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              textDecoration: 'none',
              background: marketType === t.key ? '#1E293B' : '#F1F5F9',
              color: marketType === t.key ? '#FFFFFF' : '#475569',
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search Stats Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{malls.length}</strong> of <strong>{total.toLocaleString()}</strong> shopping centres
          {province && <> in <strong>{province}</strong></>}
          {query && <> matching &quot;<strong>{query}</strong>&quot;</>}
        </div>
      </div>

      {/* Malls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {malls.map((mall) => (
          <div
            key={mall.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.5rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {mall.marketType.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  {mall.geo?.suburb}, {mall.province}
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem', color: '#0F172A' }}>
                <Link href={`/markets/${mall.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {mall.name}
                </Link>
              </h2>

              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                📍 {mall.geo?.streetAddress}
              </p>

              {/* Anchors & Features */}
              <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
                <strong>Key Anchors:</strong> {mall.landmarks?.slice(0, 3).join(', ')}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                  🏬 {mall.stallCapacity} Stores
                </span>
                <span style={{ fontSize: '0.75rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#065F46' }}>
                  ⚡ Solar & Lithium Backup
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                ⏰ {mall.operatingHours?.split('|')[0] || 'Open Daily'}
              </span>
              <Link href={`/markets/${mall.id}`} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                View Stores &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          {page > 1 && (
            <Link
              href={`/malls?province=${encodeURIComponent(province)}&type=${encodeURIComponent(marketType)}&q=${encodeURIComponent(query)}&page=${page - 1}`}
              className="btn btn-outline"
            >
              &larr; Previous
            </Link>
          )}
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.9rem', color: '#475569' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/malls?province=${encodeURIComponent(province)}&type=${encodeURIComponent(marketType)}&q=${encodeURIComponent(query)}&page=${page + 1}`}
              className="btn btn-outline"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
