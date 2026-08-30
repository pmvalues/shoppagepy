import Link from 'next/link';
import type { Merchant } from '@shoppage/contracts';

export default function MerchantCard({ merchant }: { merchant: Merchant }) {
  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '1.25rem',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
            {merchant.category?.replace(/_/g, ' ').toUpperCase() || 'RETAIL MERCHANT'}
          </span>
          {typeof merchant.googleRating === 'number' && (
            <span style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 800, background: '#FEF3C7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
              ★ {merchant.googleRating.toFixed(1)} ({merchant.googleReviewsCount || 10}+)
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.25rem 0 0.35rem 0', color: 'var(--slate-900)' }}>
          <Link href={`/m/${merchant.id}`}>
            {merchant.name}
          </Link>
        </h3>

        <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
          📍 {merchant.addressText}
        </p>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>✓ Verified Store</span>
          <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>⚡ Direct Inquiries</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <Link href={`/m/${merchant.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          View Store
        </Link>
        {merchant.contacts?.telephone ? (
          <a
            href={`tel:${merchant.contacts.telephone.replace(/[^0-9+]/g, '')}`}
            className="btn btn-primary btn-sm"
            title="Call Store Directly"
          >
            📞 Call
          </a>
        ) : merchant.contacts?.website ? (
          <a
            href={merchant.contacts.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            title="Visit Merchant Website"
          >
            🌐 Web
          </a>
        ) : merchant.contacts?.whatsapp ? (
          <a
            href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${merchant.name}, I found your shop on Shoppage. Do you have stock available?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            title="Message Merchant"
          >
            💬 Contact
          </a>
        ) : (
          <Link href={`/m/${merchant.id}`} className="btn btn-primary btn-sm">
            Contact
          </Link>
        )}
      </div>
    </div>
  );
}
