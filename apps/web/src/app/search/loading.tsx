export default function SearchLoading() {
  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '3rem' }}>
          <div>
            <div style={{ height: '18px', width: '40%', background: 'var(--color-surface-subtle)', borderRadius: '6px', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card" style={{ height: '96px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-line)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </div>
          <div style={{ height: '320px', background: 'var(--color-surface-subtle)', borderRadius: '12px', border: '1px solid var(--color-line)' }} />
        </div>
      </div>
      <style>{`@keyframes pulse {0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
    </div>
  );
}
