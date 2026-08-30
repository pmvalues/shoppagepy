export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { semanticSearch } from '@/lib/intelligence';
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

  const searchResults = semanticSearch(query || category || brand || 'solar inverter', {
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const categories = [
    { id: 'solar_energy', label: '☀️ Solar & Inverters' },
    { id: 'smartphones', label: '📱 Smartphones & Tech' },
    { id: 'hardware', label: '🧱 Building & Hardware' },
    { id: 'groceries', label: '🛒 Food & Groceries' },
    { id: 'pharmacy', label: '💊 Health & Pharmacy' },
    { id: 'automotive', label: '🚗 Auto & Spares' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Search Header Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
            <Link href="/" style={{ color: 'var(--slate-500)' }}>Home</Link> &gt; <span>Catalog & Live Grid Search</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--slate-900)', margin: 0 }}>
            {query ? `Results for "${query}"` : category ? `${category.replace(/_/g, ' ').toUpperCase()}` : 'National Master Catalog'}
          </h1>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-green">✓ 100% Coverage</span>
          <span>Showing <strong>{searchResults.products.length}</strong> verified items</span>
        </div>
      </div>

      {/* AI Overview & External Live Web Complement Banner */}
      {searchResults.overview && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)', border: '1.5px solid #BFDBFE', marginBottom: '1.75rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ AI Intelligence & Live Sweep Grid
            </span>
            {searchResults.externalComplemented && (
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                🌐 Complemented with Live Retailer Feeds (Takealot / Makro / Builders)
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.5 }}>
            {searchResults.overview}
          </p>
        </div>
      )}

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {searchResults.products.map((variant) => {
          const productOffers = searchResults.offersByProduct[variant.canonicalId] || [];
          return <ProductCard key={variant.canonicalId} product={variant} offers={productOffers} />;
        })}
      </div>

      {/* Merchant Spotlight for this query */}
      {searchResults.merchants.length > 0 && (
        <section className="card" style={{ background: '#F8FAFC', padding: '1.75rem', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--slate-900)' }}>
            🏪 Verified Physical Suppliers Stocking In This Category
          </h3>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Direct store contact (Phone, Web, In-Store) with zero middleman markups.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {searchResults.merchants.slice(0, 3).map((merchant) => (
              <div key={merchant.id} className="card" style={{ background: '#FFFFFF' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)' }}>{merchant.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: '0.2rem 0 0.75rem 0' }}>📍 {merchant.addressText}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/m/${merchant.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>View Store</Link>
                  {merchant.contacts?.telephone ? (
                    <a
                      href={`tel:${merchant.contacts.telephone}`}
                      className="btn btn-primary btn-sm"
                    >
                      📞 Call
                    </a>
                  ) : merchant.contacts?.website ? (
                    <a
                      href={merchant.contacts.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-dark btn-sm"
                    >
                      🌐 Web
                    </a>
                  ) : (
                    <Link href={`/m/${merchant.id}`} className="btn btn-primary btn-sm">
                      Contact
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sourcing Callout */}
      <div className="card" style={{ background: '#0F172A', color: '#FFFFFF', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className="badge badge-green" style={{ marginBottom: '0.4rem' }}>Need Bulk or Wholesale Pricing?</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0', color: '#FFFFFF' }}>
            Broadcast your exact specifications to 3.1M verified suppliers
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Post a free sourcing RFQ and receive direct quotes with 0% commission.
          </p>
        </div>
        <Link href="/requests" className="btn btn-primary" style={{ fontWeight: 800, padding: '0.75rem 1.5rem' }}>
          📋 Post Free Buyer RFQ
        </Link>
      </div>
    </div>
  );
}
