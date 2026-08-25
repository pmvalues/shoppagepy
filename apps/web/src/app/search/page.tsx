import Link from 'next/link';
import { MasterProductStore, SA_FLAGSHIP_OFFERS, SA_CANONICAL_PRODUCTS } from '@shoppage/kernel';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; brand?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const category = searchParams.category;
  const brand = searchParams.brand;
  const currentPage = parseInt(searchParams.page || '1', 10);
  const pageSize = 24;
  const offset = (currentPage - 1) * pageSize;

  const searchResults = MasterProductStore.searchProducts({
    query: query || category || brand || '',
    category,
    brand,
    limit: pageSize,
    offset,
  });

  const totalPages = Math.ceil(searchResults.total / pageSize);

  const categories = [
    { id: 'solar_energy', label: '☀️ Solar & Inverters' },
    { id: 'smartphones', label: '📱 Smartphones & Tech' },
    { id: 'hardware', label: '🧱 Building & Hardware' },
    { id: 'groceries', label: '🛒 Food & Groceries' },
    { id: 'pharmacy', label: '💊 Health & Pharmacy' },
    { id: 'automotive', label: '🚗 Auto & Spares' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          <Link href="/">Home</Link> &gt; <span>Master Product Search</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
          {query ? `Search Results for "${query}"` : category ? `Category: ${category.replace(/_/g, ' ').toUpperCase()}` : 'National Master Product Catalogue'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Showing <strong>{searchResults.items.length}</strong> of <strong>{searchResults.total.toLocaleString()}</strong> normalized master products across South Africa.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <Link
          href="/search"
          className={`btn ${!category ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={`btn ${category === cat.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Results Grid */}
      {searchResults.items.length > 0 ? (
        <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '3rem' }}>
          {searchResults.items.map((variant) => {
            const productOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === variant.canonicalId);
            const lowestPrice = productOffers.length > 0 ? Math.min(...productOffers.map((o) => o.price.amount || 999999)) : null;

            return (
              <div
                key={variant.canonicalId}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-blue">{variant.brand}</span>
                    {productOffers.length > 0 ? (
                      <span className="badge badge-green">✓ {productOffers.length} Confirmed</span>
                    ) : (
                      <span className="badge badge-gray">🌐 Web Discovered</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.5rem 0', lineHeight: 1.35, color: '#0F172A' }}>
                    <Link href={`/p/${variant.canonicalId}`}>{variant.title}</Link>
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    GTIN: {variant.identifiers.gtin13 || variant.identifiers.gtin14 || variant.identifiers.mpn || 'Universal Master SKU'}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: lowestPrice && lowestPrice < 999999 ? 'var(--accent-green)' : '#334155', margin: '0.5rem 0' }}>
                    {lowestPrice && lowestPrice < 999999
                      ? `R ${lowestPrice.toLocaleString()}`
                      : `R ${(variant.attributes?.estimatedPriceZar as number || 1500).toLocaleString()}`}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Link href={`/p/${variant.canonicalId}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}>
                      {productOffers.length > 0 ? 'Compare Sellers' : 'View Specs'}
                    </Link>
                    <Link
                      href={`/merchant/claim?variantId=${variant.canonicalId}&title=${encodeURIComponent(variant.title)}`}
                      className="btn btn-whatsapp"
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}
                    >
                      + List Yours
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#FFFFFF', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No master products directly matched &quot;{query}&quot;
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Try searching for a broader term, brand name (e.g. Deye, Sunsynk, Dyness), or browse by category.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/search" className="btn btn-primary">Browse All Master Products</Link>
            <Link href="/requests" className="btn btn-outline">Post Sourcing Request (RFQ)</Link>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
          {currentPage > 1 && (
            <Link
              href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}${category ? `category=${category}&` : ''}page=${currentPage - 1}`}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem' }}
            >
              &larr; Previous Page
            </Link>
          )}

          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}${category ? `category=${category}&` : ''}page=${currentPage + 1}`}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem' }}
            >
              Next Page &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
