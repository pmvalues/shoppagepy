export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { MasterProductStore, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';
import ProductCard from '@/components/ProductCard';

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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Search Header Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
            <Link href="/" style={{ color: 'var(--slate-500)' }}>Home</Link> &gt; <span>Catalog Search</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
            {query ? `Results for "${query}"` : category ? `${category.replace(/_/g, ' ').toUpperCase()}` : 'National Master Catalog'}
          </h1>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Showing <strong>{searchResults.items.length}</strong> of <strong>{searchResults.total.toLocaleString()}</strong> verified products
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link
          href="/search"
          className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={`btn btn-sm ${category === cat.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Results Grid */}
      {searchResults.items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {searchResults.items.map((variant) => {
            const productOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === variant.canonicalId);
            return <ProductCard key={variant.canonicalId} product={variant} offers={productOffers} />;
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', marginBottom: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            No master products matched &quot;{query}&quot;
          </h3>
          <p style={{ color: 'var(--slate-500)', maxWidth: 500, margin: '0 auto 1.5rem' }}>
            Try searching for a broader term (e.g. Deye, Sunsynk, Inverter, Solar) or browse all categories.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/search" className="btn btn-primary">Browse All Master Products</Link>
            <Link href="/requests" className="btn btn-outline">Post Sourcing Need (RFQ)</Link>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
          {currentPage > 1 && (
            <Link
              href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}${category ? `category=${category}&` : ''}page=${currentPage - 1}`}
              className="btn btn-outline btn-sm"
            >
              &larr; Previous Page
            </Link>
          )}

          <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', fontWeight: 700 }}>
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}${category ? `category=${category}&` : ''}page=${currentPage + 1}`}
              className="btn btn-outline btn-sm"
            >
              Next Page &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
