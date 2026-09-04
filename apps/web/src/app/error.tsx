'use client';
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', marginBottom: '0.5rem' }}>Something went wrong</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: '1.5rem' }}>Shoppage encountered an unexpected error. Our team has been notified.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={() => reset()} className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>Try again</button>
          <a href="/" className="btn btn-outline" style={{ padding: '8px 18px', borderRadius: '8px', textDecoration: 'none' }}>Back home</a>
        </div>
        {error?.digest && <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text2)', fontFamily: 'monospace' }}>ref: {error.digest.slice(0, 8)}</p>}
      </div>
    </div>
  );
}
