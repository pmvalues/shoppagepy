export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  NationwideMerchantStore,
  SA_COMPREHENSIVE_MARKETS,
  SA_FLAGSHIP_OFFERS,
} from '@shoppage/kernel';

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function MerchantsDirectoryPage({
  searchParams,
}: {
  searchParams: { category?: string; marketId?: string; province?: string; q?: string; page?: string };
}) {
  const categoryFilter = searchParams.category;
  const marketIdFilter = searchParams.marketId;
  const provinceFilter = searchParams.province;
  const query = searchParams.q?.toLowerCase() || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const pageSize = 24;
  const offset = (currentPage - 1) * pageSize;

  const searchResult = NationwideMerchantStore.searchMerchants({
    category: categoryFilter,
    province: provinceFilter,
    query,
    limit: pageSize,
    offset,
  });

  const provinceCounts = NationwideMerchantStore.getProvinceCounts();
  const totalNationwideCount = NationwideMerchantStore.getTotalCount();
  const totalPages = Math.ceil(searchResult.total / pageSize);

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-green" style={{ marginBottom: '0.75rem' }}>
          📍 Multi-Source Nationwide Directory · {totalNationwideCount.toLocaleString()}+ Verified Companies
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          All South African Stores & Suppliers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto' }}>
          Swept from Google Maps, OpenStreetMap, Bing Places, and CIPC. Direct WhatsApp and phone contacts across all 9 provinces.
        </p>
      </div>

      {/* 9-Provinces Navigation Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', textAlign: 'center' }}>
          🇿🇦 Filter by Province (All 9 Provinces Covered)
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          <Link
            href={`/merchants${categoryFilter ? `?category=${categoryFilter}` : ''}`}
            className={`btn ${!provinceFilter ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            All SA ({totalNationwideCount.toLocaleString()})
          </Link>
          {PROVINCES.map((prov) => {
            const count = provinceCounts[prov] || 0;
            const isSelected = provinceFilter === prov;
            const queryParams = new URLSearchParams();
            queryParams.set('province', prov);
            if (categoryFilter) queryParams.set('category', categoryFilter);

            return (
              <Link
                key={prov}
                href={`/merchants?${queryParams.toString()}`}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                {prov} {count > 0 ? `(${count.toLocaleString()})` : ''}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <Link
          href={`/merchants${provinceFilter ? `?province=${provinceFilter}` : ''}`}
          className={`btn ${!categoryFilter ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          All Sectors
        </Link>
        <Link
          href={`/merchants?category=solar_energy${provinceFilter ? `&province=${provinceFilter}` : ''}`}
          className={`btn ${categoryFilter === 'solar_energy' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          ☀️ Solar & Inverters
        </Link>
        <Link
          href={`/merchants?category=smartphones${provinceFilter ? `&province=${provinceFilter}` : ''}`}
          className={`btn ${categoryFilter === 'smartphones' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          📱 Tech & Smartphones
        </Link>
        <Link
          href={`/merchants?category=building_materials${provinceFilter ? `&province=${provinceFilter}` : ''}`}
          className={`btn ${categoryFilter === 'building_materials' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          🧱 Hardware & Building
        </Link>
        <Link
          href={`/merchants?category=wholesale_trade${provinceFilter ? `&province=${provinceFilter}` : ''}`}
          className={`btn ${categoryFilter === 'wholesale_trade' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          📦 Wholesale Importers
        </Link>
        <Link
          href="/markets"
          className="btn btn-outline"
          style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
        >
          🏬 Physical Trade Hubs →
        </Link>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {provinceFilter ? `${provinceFilter} Stores` : 'All South African Stores'} ({searchResult.total.toLocaleString()} Found)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing page {currentPage} of {totalPages.toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/merchants/datasets" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            🏛️ Public Registries (5.1M+)
          </Link>
          <Link href="/merchant/claim" className="btn btn-whatsapp" style={{ fontSize: '0.85rem' }}>
            ➕ List Your Store Here
          </Link>
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '3rem' }}>
        {searchResult.items.map((merchant) => {
          const market = SA_COMPREHENSIVE_MARKETS.find((m) => m.id === merchant.marketId);
          const offersCount = SA_FLAGSHIP_OFFERS.filter((o) => o.merchantRef === merchant.id).length;

          return (
            <div
              key={merchant.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue">
                    {merchant.category?.replace(/_/g, ' ').toUpperCase() || 'RETAIL MERCHANT'}
                  </span>
                  {merchant.googleRating && (
                    <a
                      href={merchant.googleReviewsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.name + ' ' + merchant.addressText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706', textDecoration: 'none' }}
                    >
                      ★ {merchant.googleRating} ({merchant.googleReviewsCount || 20}+ reviews) &nearr;
                    </a>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', lineHeight: 1.3 }}>
                  <Link href={`/m/${merchant.id}`}>{merchant.name}</Link>
                </h3>

                {market ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    🏢 Located in <Link href={`/markets/${market.id}`}>{market.name}</Link>
                  </p>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    📍 {merchant.sourceRef?.replace(/_/g, ' ').toUpperCase() || 'VERIFIED POI'}
                  </p>
                )}

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  <a
                    href={merchant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.name + ' ' + merchant.addressText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {merchant.addressText} &nearr;
                  </a>
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Link href={`/m/${merchant.id}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>
                  {offersCount > 0 ? `Stock (${offersCount})` : 'Profile'}
                </Link>

                <a
                  href={merchant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.name + ' ' + merchant.addressText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                >
                  📍 Maps &nearr;
                </a>

                {merchant.contacts.whatsapp && (
                  <a
                    href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${merchant.name}, I found your shop on Shoppage. Do you have stock available?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', marginBottom: '4rem' }}>
          {currentPage > 1 && (
            <Link
              href={`/merchants?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([k]) => k !== 'page')), page: (currentPage - 1).toString() }).toString()}`}
              className="btn btn-outline"
            >
              ← Previous
            </Link>
          )}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages.toLocaleString()}</strong>
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/merchants?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([k]) => k !== 'page')), page: (currentPage + 1).toString() }).toString()}`}
              className="btn btn-outline"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
