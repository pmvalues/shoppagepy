'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { MasterProduct } from '@shoppage/contracts';
import ProductStudioStage from './ProductStudioStage';

function getStoreName(product: MasterProduct, idx: number): string {
  const cat = (product.categoryRef || '').toLowerCase();
  const title = (product.title || '').toLowerCase();

  if (title.includes('cement') || cat.includes('hardware') || cat.includes('building')) {
    const hwStores = ['Builders Warehouse', 'Leroy Merlin', 'Cashbuild', 'Takealot.com', 'Makro'];
    return hwStores[idx % hwStores.length];
  }
  if (cat.includes('solar') || title.includes('solar') || title.includes('inverter') || title.includes('battery')) {
    const solarStores = ['SunPower Solutions', 'SolarBros Sandton', 'Takealot.com', 'SolarAdvice SA', 'Inverter Warehouse'];
    return solarStores[idx % solarStores.length];
  }
  if (cat.includes('smartphones') || title.includes('phone') || title.includes('samsung') || title.includes('iphone')) {
    const techStores = ['TechHub Oriental', 'Takealot.com', 'Incredible Connection', 'Makro Commercial'];
    return techStores[idx % techStores.length];
  }
  if (title.includes('mitrend') || cat.includes('catering') || cat.includes('packaging')) {
    return 'Mitrend Products (Midrand DC)';
  }
  const generalStores = ['Takealot.com', 'Makro Commercial', 'Builders Warehouse', 'Checkers Sixty60'];
  return generalStores[idx % generalStores.length];
}

const arrowBtn =
  'flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-content-secondary transition duration-200 ease-out-expo hover:border-brand-400 hover:text-brand-ink';

export default function SponsoredCarousel({ products }: { products: MasterProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  const sponsoredList = products.slice(0, 8);

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-content">Sponsored products</h2>
          <span
            className="cursor-help text-content-muted"
            title="Paid placements from verified South African retailers"
            aria-label="About sponsored products"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
          </span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => scroll(-300)} aria-label="Scroll left" className={arrowBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => scroll(300)} aria-label="Scroll right" className={arrowBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]"
      >
        {sponsoredList.map((product, idx) => {
          const storeName = getStoreName(product, idx);
          const price = (product.attributes?.estimatedPriceZar as number) || 115;

          return (
            <div
              key={product.canonicalId}
              className="group flex w-[190px] shrink-0 flex-col justify-between rounded-lg border border-line bg-surface p-3 transition duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
            >
              <div>
                <ProductStudioStage product={product} variant="card" className="sponsored-thumb" />
                <h4 className="mb-1.5 mt-2.5 line-clamp-2 min-h-[2.7em] text-sm font-semibold leading-snug">
                  <Link
                    href={`/p/${product.canonicalId}`}
                    className="text-content transition-colors group-hover:text-brand-ink"
                  >
                    {product.title}
                  </Link>
                </h4>
              </div>

              <div>
                <div className="my-1 text-base font-bold tabular-nums text-content">
                  R {price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-content-muted">
                  <span>{storeName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
