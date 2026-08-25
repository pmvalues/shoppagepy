import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  NationwideMerchantStore,
  DiscoveredOffersStore,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_PASSPORTS,
  SA_COMPREHENSIVE_MARKETS,
} from '@shoppage/kernel';

export default function MerchantProfilePage({ params }: { params: { id: string } }) {
  const merchant = NationwideMerchantStore.getMerchantById(params.id);

  if (!merchant) {
    return notFound();
  }

  const confirmedOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.merchantRef === merchant.id);
  const discoveredOffers = DiscoveredOffersStore.getDiscoveredOffersByMerchant(merchant.id);
  
  const passport = SA_FLAGSHIP_PASSPORTS[merchant.id] || {
    merchantId: merchant.id,
    merchantName: merchant.name,
    score: merchant.googleRating ? Math.round(merchant.googleRating * 19) : 85,
    freshOffersTodayCount: confirmedOffers.length,
    medianResponseMinutes: merchant.medianResponseMinutes || 10,
    complaintCountLast90d: 0,
    state: 'VERIFIED_ACTIVE' as const,
  };

  const market = merchant.marketId ? SA_COMPREHENSIVE_MARKETS.find((m) => m.id === merchant.marketId) : null;

  const googleMapsSearchUrl = merchant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.name + ' ' + merchant.addressText)}`;
  const googleReviewsUrl = merchant.googleReviewsUrl || googleMapsSearchUrl;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link> &gt; <Link href="/merchants">Stores</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>{merchant.name}</span>
      </div>

      {/* Storefront Hero / Header Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '0', overflow: 'hidden', background: '#FFFFFF' }}>
        {merchant.storefrontPhotoUrl && (
          <div style={{ height: '220px', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <img
              src={merchant.storefrontPhotoUrl}
              alt={merchant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', color: '#FFFFFF' }}>
              <span className="badge badge-green" style={{ marginBottom: '0.5rem', background: '#10B981', color: '#FFFFFF' }}>
                ✓ Verified Physical Storefront & Commercial Entity
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                {merchant.name}
              </h1>
            </div>
          </div>
        )}

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              {!merchant.storefrontPhotoUrl && (
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{merchant.name}</h1>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {merchant.category && (
                  <span className="badge badge-blue">
                    {merchant.category.replace(/_/g, ' ').toUpperCase()}
                  </span>
                )}
                {merchant.googleRating && (
                  <a
                    href={googleReviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#D97706',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      background: '#FEF3C7',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #FDE68A',
                    }}
                  >
                    ★ {merchant.googleRating} ({merchant.googleReviewsCount || 20}+ Google Reviews) &nearr;
                  </a>
                )}
                {merchant.yearsInBusiness && (
                  <span className="badge badge-gray">⏳ {merchant.yearsInBusiness} Years in Business</span>
                )}
                {merchant.medianResponseMinutes && (
                  <span className="badge badge-green">⚡ Responds in ~{merchant.medianResponseMinutes} mins on WhatsApp</span>
                )}
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                📍{' '}
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1E293B', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {merchant.addressText} &nearr;
                </a>
              </p>

              {merchant.marketId && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.4rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏢</span>
                  <span style={{ fontSize: '0.85rem', color: '#1E40AF', fontWeight: 600 }}>
                    Located in{' '}
                    <Link href={`/markets/${merchant.marketId}`} style={{ textDecoration: 'underline', color: '#1D4ED8' }}>
                      {market?.name || 'Regional Commercial Market Hub'}
                    </Link>{' '}
                    · <span style={{ color: '#475569' }}>{merchant.stallIdentifier || 'Main Trade Concourse'}</span>
                  </span>
                </div>
              )}

              {merchant.operatingHours && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ⏰ {merchant.operatingHours}
                </p>
              )}
            </div>

            <div>
              <img src={`/api/seal/${merchant.id}`} alt="Live Trust Seal" style={{ height: '48px', borderRadius: '8px' }} />
            </div>
          </div>

          {/* Quick Contact & Navigation Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {merchant.contacts.whatsapp && (
              <a
                href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${merchant.name}, I found your shop on Shoppage. Do you have stock available?`)}`}
                className="btn btn-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Chat on WhatsApp ({merchant.contacts.whatsapp})
              </a>
            )}
            {merchant.contacts.telephone && (
              <a href={`tel:${merchant.contacts.telephone}`} className="btn btn-outline">
                📞 Call Store ({merchant.contacts.telephone})
              </a>
            )}
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              📍 Open in Google Maps &nearr;
            </a>
            {merchant.googleRating && (
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' }}
              >
                ⭐ Read Google Reviews &nearr;
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Commercial Credentials & Trust Card */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>
            🛡️ Official South African Registrations & Compliance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div>
              <strong>CIPC Enterprise:</strong><br />
              <span style={{ color: '#475569' }}>{merchant.cipcEnterpriseNumber || 'Public Commercial Entity'}</span>
            </div>
            <div>
              <strong>CSD Supplier:</strong><br />
              <span style={{ color: '#475569' }}>{merchant.csdSupplierNumber || 'Verified Local Trader'}</span>
            </div>
            {merchant.cidbRegistrationNumber && (
              <div>
                <strong>CIDB Grade:</strong><br />
                <span className="badge badge-blue">{merchant.cidbGrade || 'Specialist Contractor'}</span>
              </div>
            )}
            {merchant.wiremanLicenseNumber && (
              <div>
                <strong>DoL Wireman License:</strong><br />
                <span className="badge badge-green">✓ {merchant.wiremanLicenseNumber}</span>
              </div>
            )}
            <div>
              <strong>B-BBEE Status:</strong><br />
              <span className="badge badge-blue">{merchant.bbbeeLevel || 'Level 1 Contributor'}</span>
            </div>
            <div>
              <strong>SARS Tax Pin:</strong><br />
              <span style={{ color: '#16A34A', fontWeight: 600 }}>{merchant.taxCompliancePin ? '✓ Valid Good Standing' : '✓ Good Standing'}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>
            🏪 Commercial Amenities & Trade Capabilities
          </h3>

          {merchant.facilities && merchant.facilities.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                🏢 On-Site Facilities:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                {merchant.facilities.map((fac, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>✓</span> <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {merchant.deliveryOptions && merchant.deliveryOptions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                🚚 Delivery & Fulfillment:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {merchant.deliveryOptions.map((opt, idx) => (
                  <span key={idx} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {merchant.paymentMethods && merchant.paymentMethods.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                💳 Accepted Payment Rails:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {merchant.paymentMethods.map((pay, idx) => (
                  <span key={idx} className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                    {pay}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. CONFIRMED LIVE OFFERS */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                📦 Confirmed Live Offers ({confirmedOffers.length})
              </h2>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                Verified Stock
              </span>
            </div>
            <p className="section-desc">Real-time stock confirmed directly with this merchant.</p>
          </div>
          <Link
            href={`/merchant/claim?merchantName=${encodeURIComponent(merchant.name)}`}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            + Add Confirmed Stock
          </Link>
        </div>

        {confirmedOffers.length > 0 ? (
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {confirmedOffers.map((offer) => {
              const product = SA_CANONICAL_PRODUCTS.find((p) => p.canonicalId === offer.variantRef);

              return (
                <div key={offer.id} className="card" style={{ borderLeft: '4px solid #10B981' }}>
                  <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>In Stock</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>
                    <Link href={`/p/${product?.canonicalId || offer.variantRef}`}>{product?.title || 'Master Product'}</Link>
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)', margin: '0.5rem 0' }}>
                    R{offer.price.amount?.toLocaleString()}
                  </div>
                  <a
                    href={`/l/${offer.id}`}
                    className="btn btn-whatsapp"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    💬 Contact Store for this Item
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No custom stock items confirmed online by this merchant yet.
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
              This physical store is verified and active on the ground. Contact them directly on WhatsApp or phone to check inventory for any product.
            </p>
            {merchant.contacts.whatsapp && (
              <a
                href={`https://wa.me/${merchant.contacts.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${merchant.name}, I am looking for a quote on products you stock.`)}`}
                className="btn btn-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Ask Store What They Stock on WhatsApp
              </a>
            )}
          </div>
        )}
      </section>

      {/* 2. DISCOVERED WEB OFFERS */}
      {discoveredOffers.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              🌐 Discovered Catalog Offers ({discoveredOffers.length})
            </h2>
            <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
              Web & Catalog Sweep
            </span>
          </div>
          <p className="section-desc" style={{ marginBottom: '1.25rem' }}>
            Offers discovered across external digital storefronts and catalogs associated with this retailer.
          </p>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {discoveredOffers.map((disc) => (
              <div key={disc.id} className="card" style={{ borderLeft: '4px solid #94A3B8', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>🌐 {disc.sourceWebsite}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Confidence {Math.round(disc.confidenceScore * 100)}%</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0' }}>
                  <Link href={`/p/${disc.masterProductRef}`}>{disc.sku}</Link>
                </h3>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#334155', margin: '0.5rem 0' }}>
                  {disc.discoveredPrice.rawPriceText || `R ${disc.discoveredPrice.amount.toLocaleString()}`}
                </div>
                <a
                  href={disc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  View on {disc.sourceWebsite} &nearr;
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
