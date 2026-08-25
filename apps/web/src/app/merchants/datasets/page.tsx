import Link from 'next/link';
import { PUBLIC_MERCHANT_SOURCES, PublicMerchantDatasetManager } from '@shoppage/kernel';

export default function MerchantDatasetsDirectoryPage() {
  const totalRecords = PublicMerchantDatasetManager.getTotalEstimatedMerchantRecords();

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link> &gt; <Link href="/merchants">Stores</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>Public Registries</span>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
          🏛️ Open Data & Statutory Enterprise Registries · South Africa
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Public & Statutory Merchant Databases
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto' }}>
          Complete catalog of open government data, POI datasets, and professional contractor registers available for streaming ingestion into Shoppage ({totalRecords.toLocaleString()}+ potential merchant profiles).
        </p>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '4rem' }}>
        {PUBLIC_MERCHANT_SOURCES.map((source) => (
          <div
            key={source.id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-green">{source.licenseType.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {source.recordCountEstimate}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                {source.name}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                🏛️ Authority: <strong>{source.sourceAuthority}</strong>
              </p>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                {source.description}
              </p>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Extracted Data Fields:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {source.dataFields.map((f, i) => (
                    <span key={i} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              {source.downloadUrl && (
                <a
                  href={source.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.85rem', textAlign: 'center' }}
                >
                  🔗 Official Registry Portal
                </a>
              )}
              <Link
                href="/merchants"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Browse Ingested Stores →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
