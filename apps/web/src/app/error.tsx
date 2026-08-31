'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '520px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛠️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>Shoppage encountered an unexpected error. Our team has been notified.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => reset()} className="btn btn-primary">Try again</button>
            <a href="/" className="btn btn-outline">Back home</a>
          </div>
          {error?.digest && <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>ref: {error.digest.slice(0, 8)}</p>}
        </div>
      </body>
    </html>
  );
}
