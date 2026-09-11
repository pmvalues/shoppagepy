'use client';

import Link from 'next/link';

export default function GooglePagination({ currentPage = 1, query = '' }: { currentPage?: number; query?: string }) {
  const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const WORDMARK = 'Shoppagetime';

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid var(--color-line)' }}>
      {/* Wordmark.
          This previously spelled "Shoppagetime" letter by letter in Google's
          four logo colours (#4285F4 blue, #EA4335 red, #FBBC05 yellow,
          #34A853 green) — i.e. Google's brand identity applied to Shoppage's
          own name. The v5.0 brand decision retired the competing identity in
          favour of an emerald base, so the wordmark is now a duotone drawn
          from the emerald ramp. The alternating rhythm is kept, but both
          shades clear 4.5:1 on the light page, which the old yellow and green
          never did. */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1px', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
        {WORDMARK.split('').map((ch, i) => (
          <span key={i} style={{ color: i % 2 === 0 ? 'var(--color-brand-ink)' : 'var(--color-brand-800)' }}>
            {ch}
          </span>
        ))}
        <span style={{ color: 'var(--color-brand-ink)', fontSize: '1.75rem', marginLeft: '0.5rem' }}>›</span>
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
                color: isCurr ? 'var(--color-content)' : 'var(--color-brand-700)',
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
          style={{ color: 'var(--color-brand-700)', fontWeight: 700, marginLeft: '0.75rem', textDecoration: 'none' }}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
