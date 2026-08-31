export default function SearchLoading() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '3rem' }}>
          <div>
            <div style={{ height: '18px', width: '40%', background: '#E2E8F0', borderRadius: '6px', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card" style={{ height: '96px', background: '#F8FAFC', border: '1px solid #E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </div>
          <div style={{ height: '320px', background: '#F1F5F9', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
        </div>
      </div>
      <style>{`@keyframes pulse {0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
    </div>
  );
}
