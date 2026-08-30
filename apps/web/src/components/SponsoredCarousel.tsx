'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { MasterProduct } from '@shoppage/contracts';
import ProductStudioStage from './ProductStudioStage';

export default function SponsoredCarousel({ products }: { products: MasterProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const sponsoredList = products.slice(0, 8);

  const stores = ['takealot.com', 'Amazon.co.za', 'Freshtec Energy', 'Lekkervolt', 'Bigfisch Projects', 'Builders', 'Leroy Merlin', 'Makro'];

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', fontWeight: 700, color: '#202124' }}>
          <span>Sponsored Products</span>
          <span style={{ fontSize: '0.75rem', color: '#70757A', cursor: 'pointer' }}>ⓘ</span>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => scroll(-300)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #DADCE0',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll(300)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #DADCE0',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {sponsoredList.map((product, idx) => {
          const storeName = stores[idx % stores.length];
          const price = (product.attributes?.estimatedPriceZar as number) || (idx === 0 ? 1999 : idx === 1 ? 46403 : idx === 2 ? 24200 : 153200);

          return (
            <div
              key={product.canonicalId}
              style={{
                minWidth: '190px',
                maxWidth: '190px',
                border: '1px solid #DADCE0',
                borderRadius: '8px',
                padding: '0.75rem',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div>
                <ProductStudioStage product={product} variant="card" className="sponsored-thumb" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1A0DAB', marginTop: '0.6rem', marginBottom: '0.35rem', lineHeight: 1.35, height: '2.7em', overflow: 'hidden' }}>
                  <Link href={`/p/${product.canonicalId}`} style={{ color: '#1A0DAB', textDecoration: 'none' }}>
                    {product.title}
                  </Link>
                </h4>
              </div>

              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#202124', margin: '0.25rem 0' }}>
                  R {price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5F6368', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
