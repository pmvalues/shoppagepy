import Link from 'next/link';
import type { Merchant } from '@shoppage/contracts';

export default function MerchantCard({ merchant }: { merchant: Merchant }) {
  const wa = merchant.contacts?.whatsapp;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        height: '100%',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="badge badge-purple">{merchant.category || 'Retail'}</span>
          {typeof merchant.googleRating === 'number' && (
            <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>★ {merchant.googleRating.toFixed(1)}</span>
          )}
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0', color: '#0F172A' }}>{merchant.name}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📍 {merchant.addressText}</p>
        {typeof merchant.googleReviewsCount === 'number' && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{merchant.googleReviewsCount.toLocaleString()} Google reviews</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
        <Link href="/merchants" className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}>
          View Store
        </Link>
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
          >
            💬
          </a>
        )}
      </div>
    </div>
  );
}
