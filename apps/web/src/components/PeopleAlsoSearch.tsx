'use client';

import Link from 'next/link';

export default function PeopleAlsoSearch({ query = 'solar' }: { query?: string }) {
  const suggestions = [
    { label: `${query} energy`, bold: 'energy' },
    { label: `${query} panel prices`, bold: 'panel prices' },
    { label: `${query} rent-to-own`, bold: 'rent-to-own' },
    { label: `${query} suppliers`, bold: 'suppliers' },
    { label: `${query} Warehouse`, bold: 'Warehouse' },
    { label: `${query} Panel prices at Cashbuild`, bold: 'Panel prices at Cashbuild' },
    { label: `${query} geyser`, bold: 'geyser' },
    { label: `${query} Panel prices makro`, bold: 'Panel prices makro' },
  ];

  return (
    <section style={{ marginBottom: '3.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', marginBottom: '1rem' }}>
        People also search for
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {suggestions.map((item, idx) => (
          <Link
            key={idx}
            href={`/search?q=${encodeURIComponent(item.label)}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F1F3F4',
              borderRadius: '24px',
              padding: '0.85rem 1.25rem',
              textDecoration: 'none',
              color: '#202124',
              fontSize: '0.925rem',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
          >
            <span>{item.label}</span>
            <span style={{ color: '#70757A', fontSize: '0.9rem' }}>🔍</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
