'use client';

import Link from 'next/link';

export default function GooglePagination({ currentPage = 1, query = '' }: { currentPage?: number; query?: string }) {
  const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid #E2E8F0' }}>
      {/* Colorful Logo Header */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1px', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
        <span style={{ color: '#4285F4' }}>S</span>
        <span style={{ color: '#EA4335' }}>h</span>
        <span style={{ color: '#FBBC05' }}>o</span>
        <span style={{ color: '#4285F4' }}>o</span>
        <span style={{ color: '#34A853' }}>o</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#FBBC05' }}>o</span>
        <span style={{ color: '#4285F4' }}>p</span>
        <span style={{ color: '#34A853' }}>p</span>
        <span style={{ color: '#EA4335' }}>a</span>
        <span style={{ color: '#FBBC05' }}>g</span>
        <span style={{ color: '#4285F4' }}>e</span>
        <span style={{ color: '#4285F4', fontSize: '1.75rem', marginLeft: '0.5rem' }}>›</span>
      </div>

      {/* Numbered Page List */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', fontSize: '0.95rem' }}>
        {pages.map((p) => {
          const isCurr = p === currentPage;
          return (
            <Link
              key={p}
              href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${p}`}
              style={{
                color: isCurr ? '#202124' : '#1A0DAB',
                fontWeight: isCurr ? 800 : 500,
                textDecoration: isCurr ? 'none' : 'underline',
                padding: '0.2rem 0.4rem',
              }}
            >
              {p}
            </Link>
          );
        })}
        <Link
          href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${currentPage + 1}`}
          style={{ color: '#1A0DAB', fontWeight: 700, marginLeft: '0.75rem', textDecoration: 'none' }}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
