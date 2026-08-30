import Link from 'next/link';
import type { ProductVariant, Offer } from '@shoppage/contracts';
import ProductStudioStage from './ProductStudioStage';

export default function ProductCard({
  product,
  offers = [],
}: {
  product: ProductVariant;
  offers?: Offer[];
}) {
  const minPrice = offers.length
    ? Math.min(...offers.map((o) => (typeof o.price?.amount === 'number' ? o.price.amount : Infinity)))
    : (product.attributes?.estimatedPriceZar as number | undefined);

  const priceText = typeof minPrice === 'number' && minPrice !== Infinity
    ? `R ${minPrice.toLocaleString()}`
    : 'Price on request';

  const firstOffer = offers[0];

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '1.25rem',
      }}
    >
      <div>
        {/* Full-Bleed Studio Stage Placeholder */}
        <div style={{ marginBottom: '1rem' }}>
          <ProductStudioStage product={product} variant="card" />
        </div>

        {/* Product Title */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.4rem 0', lineHeight: 1.35, color: 'var(--slate-900)' }}>
          <Link href={`/p/${product.canonicalId}`} style={{ color: 'inherit' }}>
            {product.title}
          </Link>
        </h3>

        {/* Technical attribute highlights */}
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {product.compliance?.nrs097Certified && (
            <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>NRS 097</span>
          )}
          {product.compliance?.sabsApproved && (
            <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>SABS</span>
          )}
          {product.compliance?.warrantyYears && (
            <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{product.compliance.warrantyYears}yr Warranty</span>
          )}
        </div>
      </div>

      <div>
        {/* Price & Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Starting From</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
              {priceText}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <Link href={`/p/${product.canonicalId}`} className="btn btn-outline btn-sm" style={{ padding: '0.35rem 0.65rem' }}>
              Compare
            </Link>
            {firstOffer ? (
              <a
                href={`/l/${firstOffer.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.35rem 0.65rem' }}
                title="Direct Store Inquiries & Quotes"
              >
                Inquire
              </a>
            ) : (
              <Link
                href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.35rem 0.65rem', background: '#F8FAFC' }}
                title="List your store for this product"
              >
                + List
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
