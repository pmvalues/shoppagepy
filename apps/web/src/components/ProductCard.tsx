'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductVariant, Offer } from '@shoppage/contracts';
import { formatDistance } from '@/lib/geo';

export interface ProductCardProps {
  product: ProductVariant;
  offers?: Offer[];
  isSponsored?: boolean;
  onOpenBuyBox?: (product: ProductVariant, offers: Offer[]) => void;
}

/** Inline icon set — replaces the emoji glyphs used previously, which rendered
 *  inconsistently across platforms and could not inherit colour or size. */
function Icon({ name, className }: { name: 'pin' | 'check' | 'arrow' | 'box'; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    pin: (
      <>
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="M20 6L9 17l-5-5" />,
    arrow: <path d="M7 17L17 7M9 7h8v8" />,
    box: (
      <>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

export default function ProductCard({
  product,
  offers = [],
  isSponsored = false,
  onOpenBuyBox,
}: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  // Best price from offers, falling back to the product's own estimate.
  const minPrice = offers.length
    ? Math.min(...offers.map((o) => (typeof o.price?.amount === 'number' ? o.price.amount : Infinity)))
    : (product.attributes?.estimatedPriceZar as number | undefined);

  const originalPrice = product.attributes?.originalPriceZar as number | undefined;
  const hasDiscount = originalPrice && minPrice && originalPrice > minPrice;
  const discountPct = hasDiscount ? Math.round(((originalPrice - minPrice) / originalPrice) * 100) : null;

  const primaryImage = product.media?.gallery?.[0]?.url || (product as any).primary_image?.url;
  const hasPrice = typeof minPrice === 'number' && minPrice !== Infinity;

  return (
    <article
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-xl bg-surface',
        'border transition duration-300 ease-out-expo',
        'hover:-translate-y-0.5 hover:shadow-md',
        isSponsored
          ? 'border-warning-500/60 hover:border-warning-500'
          : 'border-line hover:border-brand-400',
      ].join(' ')}
    >
      {/* Sponsored marker */}
      {isSponsored && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded bg-warning-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-accent">
          Sponsored
        </span>
      )}

      {/* Savings marker — lime is reserved for savings and live signals. */}
      {discountPct && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-signal-400 px-2 py-0.5 text-xs font-bold text-signal-ink">
          −{discountPct}%
        </span>
      )}

      <Link
        href={`/p/${product.canonicalId}`}
        className="relative block aspect-square overflow-hidden bg-surface-inset p-4"
        aria-label={product.title}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt=""
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={[
              'h-full w-full object-contain transition duration-500 ease-out-expo',
              'group-hover:scale-105',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-content-muted">
            <Icon name="box" className="h-10 w-10" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {/* Provenance row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
          <span className="rounded bg-surface-subtle px-1.5 py-0.5 font-semibold text-content-secondary">
            {product.brand}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-content-secondary">
            <Icon name="pin" className="h-3 w-3" />
            {formatDistance(4.2)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-ink">
            <Icon name="check" className="h-3 w-3" />
            In stock
          </span>
        </div>

        <Link href={`/p/${product.canonicalId}`}>
          <h3 className="line-clamp-2 min-h-[2.7em] text-sm font-semibold leading-snug text-content transition-colors group-hover:text-brand-ink">
            {product.title}
          </h3>
        </Link>

        {/* Compliance / identifiers */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.identifiers?.gtin13 && (
            <span className="rounded border border-line bg-surface-inset px-1 py-0.5 font-mono text-[10px] text-content-muted">
              GTIN {product.identifiers.gtin13}
            </span>
          )}
          {product.compliance?.nrs097Certified && (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
              NRS 097
            </span>
          )}
          {product.compliance?.sabsApproved && (
            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold text-content-secondary">
              SABS
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto border-t border-line-subtle pt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums tracking-tight text-content">
              {hasPrice ? `R ${minPrice.toLocaleString('en-ZA')}` : 'Quote required'}
            </span>
            {hasDiscount && (
              <span className="text-sm text-content-muted line-through">
                R {originalPrice.toLocaleString('en-ZA')}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-brand-ink">
            {offers.length > 0
              ? `${offers.length} local stockists · compare`
              : '1 verified stockist nearby'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 px-3.5 pb-3.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onOpenBuyBox?.(product, offers);
          }}
          className="flex h-9 flex-1 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white transition duration-200 ease-out-expo hover:bg-brand-solid-hover active:scale-[0.98]"
        >
          Compare {offers.length || 1} stores
        </button>

        <Link
          href={`/p/${product.canonicalId}`}
          title="Full specs and compliance"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-content-secondary transition duration-200 ease-out-expo hover:border-brand-400 hover:text-brand-ink"
        >
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
