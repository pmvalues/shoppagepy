import Link from 'next/link';
import type { ProductVariant, Offer } from '@shoppage/contracts';

function lowestPrice(offers?: Offer[]): number | null {
  if (!offers || offers.length === 0) return null;
  const nums = offers.map((o) => o.price.amount).filter((n): n is number => typeof n === 'number');
  return nums.length ? Math.min(...nums) : null;
}

export default function ProductCard({
  product,
  offers = [],
}: {
  product: ProductVariant;
  offers?: Offer[];
}) {
  const price = lowestPrice(offers);
  const est = (product.attributes as Record<string, unknown>)?.estimatedPriceZar;
  const displayPrice =
    price !== null && price < 999999
      ? `R ${price.toLocaleString()}`
      : typeof est === 'number'
      ? `R ${est.toLocaleString()}`
      : 'Price on request';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        height: '100%',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="badge badge-blue">{product.brand}</span>
          {offers.length > 0 ? (
            <span className="badge badge-green">✓ {offers.length} Confirmed</span>
          ) : (
            <span className="badge badge-gray">🌐 Web Discovered</span>
          )}
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0', lineHeight: 1.3, color: '#0F172A' }}>
          <Link href={`/p/${product.canonicalId}`}>{product.title}</Link>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          GTIN: {product.identifiers.gtin13 || product.identifiers.mpn || 'Universal Master SKU'}
        </p>
      </div>
      <div>
        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: price !== null && price < 999999 ? 'var(--accent-green)' : '#334155',
            margin: '0.5rem 0',
          }}
        >
          {displayPrice}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <Link href={`/p/${product.canonicalId}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}>
            Compare Sellers
          </Link>
          <Link
            href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
            className="btn btn-whatsapp"
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
          >
            + List
          </Link>
        </div>
      </div>
    </div>
  );
}
