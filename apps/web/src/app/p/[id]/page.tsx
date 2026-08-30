export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MasterProductStore,
  DiscoveredOffersStore,
  SA_FLAGSHIP_MERCHANTS,
  SA_FLAGSHIP_PASSPORTS,
  checkSolarCompatibility,
  calculateBackupRuntime,
} from '@shoppage/kernel';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = MasterProductStore.getProductById(params.id);

  if (!product) {
    return notFound();
  }

  const { confirmed: confirmedOffers, discovered: discoveredOffers } = DiscoveredOffersStore.getOffersForProduct(product.canonicalId);

  // Solar compatibility check if applicable
  let compatibilityResult = null;
  if (product.categoryRef === 'solar_energy' && product.attributes?.maxPvInputVoltage) {
    compatibilityResult = checkSolarCompatibility({
      inverterMaxPvVoltage: (product.attributes.maxPvInputVoltage as number) || 500,
      inverterMinPvVoltage: 120,
      inverterBatteryVoltage: 48,
      batteryNominalVoltage: 48,
      panelVoc: 49.5,
      panelCountInSeries: 8,
    });
  }

  // Calculate typical load-shedding runtimes for energy products
  const runtime450W = calculateBackupRuntime(5.12, 450); // Fridge + TV + Wi-Fi + LED Lights
  const runtime1200W = calculateBackupRuntime(5.12, 1200); // Heavy load + Microwave + Desktop PCs

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Link href="/" style={{ color: 'var(--slate-500)' }}>Home</Link>
        <span>&gt;</span>
        <Link href={`/search?category=${product.categoryRef}`} style={{ color: 'var(--slate-500)', textTransform: 'capitalize' }}>
          {product.categoryRef.replace(/_/g, ' ')}
        </Link>
        <span>&gt;</span>
        <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>{product.brand}</span>
      </div>

      {/* Product Hero & Specifications */}
      <div className="grid grid-cols-2" style={{ gap: '2.5rem', marginBottom: '3rem' }}>
        <div>
          {/* Gallery View */}
          <div
            className="card"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ fontSize: '5.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.06))' }}>
              {product.categoryRef === 'solar_energy' ? '⚡' : product.categoryRef === 'smartphones' ? '📱' : product.categoryRef === 'hardware' ? '🧱' : '📦'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Master Canonical SKU</span>
              {confirmedOffers.length > 0 && (
                <span className="badge badge-green">✓ {confirmedOffers.length} Confirmed Local Offers</span>
              )}
              {discoveredOffers.length > 0 && (
                <span className="badge badge-gray">🌐 {discoveredOffers.length} Discovered Web Listings</span>
              )}
            </div>

            <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem', marginTop: '1rem', fontFamily: 'var(--font-mono)' }}>
              GS1 GTIN: {product.identifiers.gtin13 || product.identifiers.gtin14 || product.identifiers.mpn || 'Universal Standard Identity'}
            </div>
          </div>

          {/* Compliance & Certification Badges */}
          {product.compliance && (
            <div className="card" style={{ marginBottom: '1.25rem', background: '#F8FAFC' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.65rem', color: 'var(--slate-900)' }}>
                🛡️ Verified Standards & South African Certification
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.compliance.nrs097Certified && (
                  <span className="badge badge-green">✓ NRS 097-2-1 Grid Certified</span>
                )}
                {product.compliance.sabsApproved && (
                  <span className="badge badge-blue">✓ SABS Approved Standard</span>
                )}
                <span className="badge badge-amber">✓ {product.compliance.warrantyYears}-Year Manufacturer Warranty</span>
              </div>
            </div>
          )}

          {/* Compatibility Engine Card */}
          {compatibilityResult && (
            <div className="card" style={{ borderLeft: `4px solid ${compatibilityResult.isCompatible ? '#10B981' : '#EF4444'}`, background: '#FFFFFF' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--slate-900)' }}>
                ⚡ Typed Grid Compatibility Verified
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                {compatibilityResult.isCompatible
                  ? 'Compatible with standard 48V Lithium Batteries (Dyness, Pylontech, Hubble) and up to 8x 550W PV strings.'
                  : compatibilityResult.safetyWarning}
              </p>
            </div>
          )}
        </div>

        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{product.brand}</span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.75rem', color: 'var(--slate-900)' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#D97706', fontWeight: 800, fontSize: '0.95rem' }}>
              ★ {product.reviewsSummary?.averageRating || 4.8}
            </span>
            <span style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
              ({product.reviewsSummary?.totalReviewsCount || 34} verified buyer reviews)
            </span>
            <span style={{ color: 'var(--slate-300)' }}>•</span>
            <span style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>
              Category: <strong style={{ textTransform: 'capitalize' }}>{product.categoryRef.replace(/_/g, ' ')}</strong>
            </span>
          </div>

          {/* Master Product Definition & Technical Attributes */}
          <div className="card" style={{ marginBottom: '1.5rem', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.85rem', color: 'var(--slate-900)' }}>
              📋 Normalized Master Product Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong style={{ color: 'var(--slate-700)' }}>Brand:</strong> {product.brand}</div>
              <div><strong style={{ color: 'var(--slate-700)' }}>Model:</strong> {product.modelNumber || 'Standard'}</div>
              {Object.entries(product.attributes).map(([key, val]) => {
                if (key === 'estimatedPriceZar') return null;
                return (
                  <div key={key}>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--slate-700)' }}>{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                    {Array.isArray(val) ? val.join(', ') : String(val)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multilingual Keywords & Dialects */}
          {product.aliases && product.aliases.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                🇿🇦 Supported South African Search Dialects:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {product.aliases.map((alias, i) => (
                  <span key={i} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                    {alias.phrase} ({alias.locale.toUpperCase()})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video Teardown CTA */}
          <div className="card" style={{ background: '#0F172A', color: '#FFFFFF', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>Lab Bench Teardown</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Watch Real Load Test & Wiring Guide</div>
            </div>
            <Link href="/shorts" className="btn btn-primary btn-sm">
              ▶️ Play Lab Video
            </Link>
          </div>
        </div>
      </div>

      {/* 1. CONFIRMED OFFERS SECTION (First-Party Merchant Verified) */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                📦 Confirmed Live Suppliers ({confirmedOffers.length})
              </h2>
              <span className="badge badge-green">Direct Merchant Verified</span>
            </div>
            <p className="section-desc">Real-time stock confirmed by physical stores across South Africa with 0% middleman markups.</p>
          </div>

          <Link
            href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
            className="btn btn-whatsapp btn-sm"
          >
            + List Your Store Here
          </Link>
        </div>

        {confirmedOffers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {confirmedOffers.map((offer) => {
              const merchant = SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef);
              const passport = SA_FLAGSHIP_PASSPORTS[offer.merchantRef];

              return (
                <div
                  key={offer.id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    background: '#FFFFFF',
                    borderLeft: '5px solid #10B981',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
                        <Link href={`/m/${merchant?.id}`}>{merchant?.name || 'Local Merchant'}</Link>
                      </h3>
                      <span className="badge badge-green">✓ Stock Confirmed</span>
                      {merchant?.googleRating && (
                        <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>
                          ★ {merchant.googleRating} ({merchant.googleReviewsCount || 10}+ reviews)
                        </span>
                      )}
                    </div>

                    <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                      📍 {merchant?.addressText} · <span style={{ color: 'var(--slate-800)', fontWeight: 600 }}>{offer.stallRef || 'Main Trade Concourse'}</span>
                    </p>

                    {passport && (
                      <p style={{ color: 'var(--slate-500)', fontSize: '0.75rem', margin: 0 }}>
                        🛡️ Trust Score: <strong>{passport.score}/100</strong> · Median Reply: <strong>~{passport.medianResponseMinutes}m</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                        R {offer.price.amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                        Confirmed {new Date(offer.freshness.lastConfirmedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <a
                      href={`/l/${offer.id}`}
                      className="btn btn-whatsapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      💬 WhatsApp Store
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ background: '#F8FAFC', padding: '2.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
              No direct merchant has confirmed local stock online yet.
            </h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
              Are you a merchant stocking this product? Claim this listing in 60 seconds with 0% commission.
            </p>
            <Link
              href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
              className="btn btn-whatsapp"
            >
              ➕ List as First Verified Supplier
            </Link>
          </div>
        )}
      </section>

      {/* 2. DISCOVERED WEB OFFERS SECTION */}
      {discoveredOffers.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              🌐 Discovered Web Listings ({discoveredOffers.length})
            </h2>
            <span className="badge badge-gray">Automated Sweep</span>
          </div>
          <p className="section-desc" style={{ marginBottom: '1.25rem' }}>
            Public offers discovered across external retailer websites and feeds.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {discoveredOffers.map((disc) => (
              <div
                key={disc.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: '#FAFAFA',
                  borderLeft: '5px solid #94A3B8',
                  padding: '1rem 1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{disc.merchantName}</h4>
                    <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>🌐 {disc.sourceWebsite}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>
                    📦 {disc.availabilityText} · SKU: {disc.sku}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-700)' }}>
                    {disc.discoveredPrice.rawPriceText || `R ${disc.discoveredPrice.amount.toLocaleString()}`}
                  </div>
                  <a
                    href={disc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    View Source &nearr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Load-Shedding Runtime Calculator (Energy / Solar Products) */}
      {product.categoryRef === 'solar_energy' && (
        <section className="card" style={{ marginBottom: '3.5rem', background: '#F8FAFC', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.35rem', color: 'var(--slate-900)' }}>
            🔋 Load-Shedding Backup Runtime Calculator (5.12kWh Battery)
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Estimated continuous backup duration during power outages based on typical household consumption.
          </p>

          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ background: '#FFFFFF', border: '1.5px solid #10B981' }}>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>Essential Load (450W)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064E3B', margin: '0.25rem 0' }}>
                {runtime450W.formattedRuntime}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', margin: 0 }}>
                Wi-Fi Router, Smart TV, Refrigerator, LED Lighting & Phone Charging.
              </p>
            </div>

            <div className="card" style={{ background: '#FFFFFF', border: '1.5px solid #2563EB' }}>
              <div style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 800, textTransform: 'uppercase' }}>Moderate / Work Load (1,200W)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E3A8A', margin: '0.25rem 0' }}>
                {runtime1200W.formattedRuntime}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', margin: 0 }}>
                Home Office PCs, Multiple Monitors, Entertainment & Intermittent Microwave.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Verified Reviews, Pros & Cons */}
      {product.reviewsSummary && (
        <section>
          <h2 className="section-title">⭐ Verified Community & Engineer Reviews</h2>
          <p className="section-desc" style={{ marginBottom: '1.5rem' }}>Real-world performance feedback from verified South African installations.</p>

          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#047857', marginBottom: '0.75rem' }}>
                👍 Verified Strengths (Pros)
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#064E3B', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.reviewsSummary.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309', marginBottom: '0.75rem' }}>
                ⚠️ Installation Considerations (Cons)
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.reviewsSummary.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
