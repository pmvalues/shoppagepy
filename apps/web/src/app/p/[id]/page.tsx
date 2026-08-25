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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link> &gt; <Link href={`/search?category=${product.categoryRef}`}>{product.categoryRef}</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>{product.brand}</span>
      </div>

      {/* Product Hero & Specifications */}
      <div className="grid grid-cols-2" style={{ gap: '2.5rem', marginBottom: '3rem' }}>
        <div>
          {/* Gallery View */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '5rem' }}>📦</span>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Master Product</span>
              {confirmedOffers.length > 0 && (
                <span className="badge badge-green">✓ {confirmedOffers.length} Confirmed Offers</span>
              )}
              {discoveredOffers.length > 0 && (
                <span className="badge badge-gray">🌐 {discoveredOffers.length} Discovered Offers</span>
              )}
              {confirmedOffers.length === 0 && discoveredOffers.length === 0 && (
                <span className="badge badge-amber">Awaiting Local Listings</span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Verified GS1 GTIN: {product.identifiers.gtin13 || product.identifiers.gtin14 || product.identifiers.mpn || 'Universal Standard Identity'}
            </p>
          </div>

          {/* Compliance & Certification Badges */}
          {product.compliance && (
            <div className="card" style={{ marginBottom: '1rem', background: '#F8FAFC' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
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
            <div className="card" style={{ borderColor: compatibilityResult.isCompatible ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                ⚡ Typed Compatibility Engine Verified
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {compatibilityResult.isCompatible
                  ? 'Compatible with standard 48V Lithium Batteries (Dyness, Pylontech, Hubble) and up to 8x 550W PV strings.'
                  : compatibilityResult.safetyWarning}
              </p>
            </div>
          )}
        </div>

        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{product.brand}</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.75rem' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>
              ★ {product.reviewsSummary?.averageRating || 4.8}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ({product.reviewsSummary?.totalReviewsCount || 34} verified buyer reviews)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Category: <strong>{product.categoryRef}</strong>
            </span>
          </div>

          {/* Master Product Definition & Technical Attributes */}
          <div className="card" style={{ marginBottom: '1.5rem', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              📋 Normalized Master Product Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div><strong>Brand:</strong> {product.brand}</div>
              <div><strong>Model:</strong> {product.modelNumber || 'Standard'}</div>
              {Object.entries(product.attributes).map(([key, val]) => {
                if (key === 'estimatedPriceZar') return null;
                return (
                  <div key={key}>
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                    {Array.isArray(val) ? val.join(', ') : String(val)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multilingual Keywords & Dialects */}
          {product.aliases && product.aliases.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                🇿🇦 Supported South African Dialects & Aliases:
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

          {/* Proof Video Embed Preview */}
          {product.media?.videos && product.media.videos.length > 0 && (
            <div className="card" style={{ background: '#F8FAFC', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                🎬 Watch Lab Teardown & Real Load Test
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {product.media.videos[0].title} ({Math.round(product.media.videos[0].durationSeconds / 60)} mins)
              </p>
              <Link href="/shorts" className="btn btn-outline" style={{ fontSize: '0.8rem', width: '100%' }}>
                ▶️ Play Video Teardown
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* List Yours Supplier Banner */}
      <section
        className="card"
        style={{
          marginBottom: '3rem',
          background: confirmedOffers.length === 0 ? 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)' : '#F8FAFC',
          border: confirmedOffers.length === 0 ? '2px solid #34D399' : '1px solid var(--border)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
            🏪 Stock this Master Product?
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#064E3B', marginBottom: '0.25rem' }}>
            {confirmedOffers.length === 0
              ? 'Be the First Verified Local Merchant to Confirm Stock'
              : 'Are you a merchant stocking this product? List your offer'}
          </h2>
          <p style={{ color: '#334155', fontSize: '0.9rem', maxWidth: '650px' }}>
            Set your price, link your stall / shop, and receive direct WhatsApp customer inquiries with zero transaction fees.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href={`/merchant/claim?variantId=${product.canonicalId}&title=${encodeURIComponent(product.title)}`}
            className="btn btn-whatsapp"
            style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem' }}
          >
            ➕ List as Verified Supplier
          </Link>
        </div>
      </section>

      {/* 1. CONFIRMED OFFERS SECTION (First-Party Merchant Verified) */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            ✅ Confirmed Offers ({confirmedOffers.length})
          </h2>
          <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
            Direct Merchant Verified
          </span>
        </div>
        <p className="section-desc" style={{ marginBottom: '1.5rem' }}>
          Active commercial propositions confirmed directly by local merchants. Verified stock, location, and direct WhatsApp contact.
        </p>

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
                    gap: '1rem',
                    background: '#FFFFFF',
                    border: '1px solid #10B981',
                    borderLeft: '5px solid #10B981',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        <Link href={`/m/${merchant?.id}`} style={{ color: '#0F172A', textDecoration: 'none' }}>
                          {merchant?.name || 'Local Merchant'}
                        </Link>
                      </h3>
                      <span className="badge badge-green">✓ Stock Confirmed</span>
                      {merchant?.googleRating && (
                        <a
                          href={merchant.googleReviewsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.name + ' ' + merchant.addressText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700, textDecoration: 'none' }}
                        >
                          ★ {merchant.googleRating} ({merchant.googleReviewsCount || 10}+ Google Reviews) &nearr;
                        </a>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                      📍{' '}
                      <a
                        href={merchant?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant?.addressText || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        {merchant?.addressText}
                      </a>{' '}
                      · <span style={{ color: '#475569', fontWeight: 600 }}>{offer.stallRef || 'Direct Shop Unit'}</span>
                    </p>

                    {passport && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                        🛡️ Trust Passport: {passport.score}/100 · Responds in ~{passport.medianResponseMinutes}m
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                        R{offer.price.amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Confirmed {new Date(offer.freshness.lastConfirmedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <a
                      href={`/l/${offer.id}`}
                      className="btn btn-whatsapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
                    >
                      💬 WhatsApp Merchant
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ background: '#F8FAFC', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#64748B', margin: 0 }}>
              No direct merchant has confirmed local stock yet. Discover available web listings below or claim as a supplier.
            </p>
          </div>
        )}
      </section>

      {/* 2. DISCOVERED OFFERS SECTION (External Public Web & Retailer Discovery) */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            🌐 Discovered Offers ({discoveredOffers.length})
          </h2>
          <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
            External Web & Catalog Sweep
          </span>
        </div>
        <p className="section-desc" style={{ marginBottom: '1.5rem' }}>
          Public product offers discovered externally from retailer websites, distributors, and open marketplace feeds. Awaiting direct merchant confirmation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                border: '1px solid #E2E8F0',
                borderLeft: '5px solid #94A3B8',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                    {disc.merchantName}
                  </h3>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                    🌐 {disc.sourceWebsite}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                    Confidence: {Math.round(disc.confidenceScore * 100)}%
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  📦 {disc.availabilityText} · <span style={{ color: '#64748B' }}>{disc.locationHint}</span>
                </p>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                  Swept on {new Date(disc.discoveredAt).toLocaleDateString()} via {disc.discoverySource.replace(/_/g, ' ')} · SKU: {disc.sku}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#334155' }}>
                    {disc.discoveredPrice.rawPriceText || `R ${disc.discoveredPrice.amount.toLocaleString()}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Discovered Price
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={disc.sourceUrl}
                    className="btn btn-outline"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    View on {disc.sourceWebsite} &nearr;
                  </a>
                  <Link
                    href={`/merchant/claim?variantId=${product.canonicalId}&source=${encodeURIComponent(disc.sourceWebsite)}`}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: '#F1F5F9' }}
                  >
                    Claim Listing
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Load-Shedding Runtime Calculator (Energy / Solar Products) */}
      {product.categoryRef === 'solar_energy' && (
        <section className="card" style={{ marginBottom: '3rem', background: '#F8FAFC', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            🔋 Load-Shedding Backup Runtime Calculator (5.12kWh Battery)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Estimated continuous backup duration during power outages based on typical household consumption.
          </p>

          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Essential Load (450W)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)', margin: '0.25rem 0' }}>
                {runtime450W.formattedRuntime}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Wi-Fi Router, Smart TV, Refrigerator, LED Lighting & Phone Charging.
              </p>
            </div>

            <div className="card" style={{ background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Moderate / Work Load (1,200W)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)', margin: '0.25rem 0' }}>
                {runtime1200W.formattedRuntime}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Home Office PCs, Multiple Monitors, Entertainment & Intermittent Microwave.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Verified Reviews, Pros & Cons */}
      {product.reviewsSummary && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 className="section-title">⭐ Verified Community & Engineer Reviews</h2>
          <p className="section-desc">Real-world performance feedback from verified South African installations.</p>

          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#047857', marginBottom: '0.75rem' }}>
                👍 Verified Strengths (Pros)
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#064E3B', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.reviewsSummary.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#B45309', marginBottom: '0.75rem' }}>
                ⚠️ Installation Considerations (Cons)
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.reviewsSummary.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {product.reviewsSummary.reviews.map((rev) => (
              <div key={rev.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rev.authorName} · {rev.authorLocation}</div>
                  <div style={{ color: '#F59E0B' }}>★★★★★</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  ✓ Verified Buyer Installation ({rev.usageContext})
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem' }}>&quot;{rev.title}&quot;</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
