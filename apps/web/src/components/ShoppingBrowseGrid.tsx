'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MasterProduct } from '@shoppage/contracts';
import ProductStudioStage from './ProductStudioStage';

export default function ShoppingBrowseGrid({ products }: { products: MasterProduct[] }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const filterChips = [
    { id: 'inverters', label: '⚡ Power Inverters' },
    { id: 'lights', label: '☀️ Solar Lights' },
    { id: 'batteries', label: '🔋 Household Batteries' },
    { id: 'sale', label: '🏷️ On sale' },
    { id: 'generators', label: '🔌 Generators' },
    { id: 'geysers', label: '♨️ Water Heaters' },
    { id: 'security', label: '📹 Security Cameras' },
  ];

  return (
    <div>
      {/* Top Filter Chips Ribbon */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <button
          style={{
            borderRadius: '20px',
            border: '1px solid #DADCE0',
            background: '#F1F3F4',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ⚙️ Filters
        </button>
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSelectedCategory(chip.id)}
            style={{
              borderRadius: '20px',
              border: selectedCategory === chip.id ? '1px solid #1A73E8' : '1px solid #DADCE0',
              background: selectedCategory === chip.id ? '#E8F0FE' : '#FFFFFF',
              color: selectedCategory === chip.id ? '#1A73E8' : '#3C4043',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 2-Column Layout: Left Refine Sidebar + Right 4-5 Column Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Refine Results Sidebar */}
        <aside style={{ borderRight: '1px solid #E2E8F0', paddingRight: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#202124', marginBottom: '1rem' }}>
            Refine results
          </h3>

          {/* On Sale / Condition */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#3C4043' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <input type="checkbox" id="sale_cb" />
              <label htmlFor="sale_cb">🏷️ On sale</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <input type="checkbox" id="new_cb" defaultChecked />
              <label htmlFor="new_cb">New</label>
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', marginBottom: '0.5rem' }}>
              Price (ZAR)
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="R Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                style={{ width: '70px', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid #DADCE0', borderRadius: '4px' }}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="R Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                style={{ width: '70px', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid #DADCE0', borderRadius: '4px' }}
              />
              <button style={{ padding: '0.35rem 0.55rem', background: '#F1F3F4', border: '1px solid #DADCE0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                Go
              </button>
            </div>
          </div>

          {/* Brand Checklist */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', marginBottom: '0.5rem' }}>
              Brand
            </div>
            {['Deye', 'Dyness', 'JA Solar', 'Canadian Solar', 'Victron energy'].map((brand) => (
              <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.825rem', color: '#3C4043' }}>
                <input type="checkbox" id={brand} />
                <label htmlFor={brand}>{brand}</label>
              </div>
            ))}
          </div>

          {/* Stores Checklist */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', marginBottom: '0.5rem' }}>
              Shops
            </div>
            {['takealot.com', 'Builders Warehouse', 'Leroy Merlin', 'Makro', 'SunPower SA'].map((shop) => (
              <div key={shop} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.825rem', color: '#3C4043' }}>
                <input type="checkbox" id={shop} />
                <label htmlFor={shop}>{shop}</label>
              </div>
            ))}
          </div>
        </aside>

        {/* Right 4-5 Column Product Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: 0 }}>
              Browse products
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#5F6368' }}>
              Sort by: <strong>Relevance</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {products.map((product, idx) => {
              const price = (product.attributes?.estimatedPriceZar as number) || (idx === 0 ? 1590 : idx === 1 ? 1151.95 : idx === 2 ? 1386 : 28499);
              return (
                <div
                  key={product.canonicalId}
                  style={{
                    border: '1px solid #DADCE0',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <ProductStudioStage product={product} variant="card" />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A0DAB', marginTop: '0.65rem', marginBottom: '0.35rem', lineHeight: 1.35, height: '2.7em', overflow: 'hidden' }}>
                      <Link href={`/p/${product.canonicalId}`} style={{ color: '#1A0DAB', textDecoration: 'none' }}>
                        {product.title}
                      </Link>
                    </h4>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#202124', margin: '0.35rem 0 0.2rem 0' }}>
                      R {price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700, marginBottom: '0.2rem' }}>
                      ⚡ SunPower SA & 4 more
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#5F6368' }}>
                      Nearby, 14 km · 30-day returns
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700, marginTop: '0.2rem' }}>
                      ★ 4,7 (16 reviews)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
