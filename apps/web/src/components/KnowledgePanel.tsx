'use client';

import Link from 'next/link';

export default function KnowledgePanel({ query = 'Solar power' }: { query?: string }) {
  return (
    <div
      style={{
        border: '1px solid #DADCE0',
        borderRadius: '12px',
        background: '#FFFFFF',
        padding: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top Media Gallery */}
      <div
        style={{
          width: '100%',
          height: '140px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0284C7 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '3rem',
          marginBottom: '1rem',
        }}
      >
        ☀️⚡
      </div>

      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202124', marginBottom: '0.5rem' }}>
        {query ? query.charAt(0).toUpperCase() + query.slice(1) : 'Solar energy'}
      </h3>

      <p style={{ fontSize: '0.85rem', color: '#4D5156', lineHeight: 1.55, marginBottom: '0.75rem' }}>
        Solar power, also known as solar electricity, is the conversion of energy from sunlight into electricity, either directly using photovoltaics or indirectly using concentrated solar power. Solar panels use the photovoltaic effect to convert light into an electric current.
      </p>

      <div style={{ fontSize: '0.78rem', color: '#70757A', marginBottom: '1.25rem' }}>
        Source: <a href="https://en.wikipedia.org/wiki/Solar_power" target="_blank" rel="noopener noreferrer" style={{ color: '#1A0DAB' }}>Wikipedia</a>
      </div>

      {/* People Also Search For Grid */}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', marginBottom: '0.75rem' }}>
          People also search for
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          {[
            { label: 'Solar energy', icon: '☀️' },
            { label: 'Renewable energy', icon: '🌱' },
            { label: 'Photovoltaic station', icon: '⚡' },
          ].map((item, i) => (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(item.label)}`}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.6rem 0.35rem',
                textDecoration: 'none',
                background: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.7rem', color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
