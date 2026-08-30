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
    <div className="sp-card">
      <Link href={`/p/${product.canonicalId}`} className="sp-card-media">
        <span aria-hidden="true">📦</span>
      </Link>

      <div className="sp-card-body">
        <div className="sp-card-tags">
          {product.brand && <span className="sp-card-brand">{product.brand}</span>}
          {offers.length > 0 ? (
            <span className="sp-pill sp-pill-instock">✓ {offers.length} Confirmed</span>
          ) : (
            <span className="sp-pill sp-pill-check">🌐 Web Discovered</span>
          )}
        </div>

        <Link href={`/p/${product.canonicalId}`} className="sp-card-title">
          {product.title}
        </Link>

        <div className="sp-card-gtin">
          GTIN {product.identifiers.gtin13 || product.identifiers.mpn || 'Universal Master SKU'}
        </div>

        <div className="sp-card-price">
          <span className="sp-card-price-now">{displayPrice}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 1rem' }}>
        <Link href={`/p/${product.canonicalId}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          Compare Sellers
        </Link>
        <Link
          href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
          className="btn btn-whatsapp btn-sm"
          title="List as verified seller"
        >
          + List
        </Link>
      </div>
    </div>
  );
}
