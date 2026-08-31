'use client';

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '560px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem' }}>Search temporarily unavailable</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Shoppage intelligence is warming up. This is usually resolved in seconds. Your query was not lost.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={() => reset()} className="btn btn-primary">Retry search</button>
          <a href="/search" className="btn btn-outline">Back to search</a>
        </div>
        {error?.digest && <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>ref: {error.digest.slice(0, 8)}</p>}
      </div>
    </div>
  );
}
