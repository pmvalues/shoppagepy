export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MasterProductStore,
  DiscoveredOffersStore,
  SA_FLAGSHIP_MERCHANTS,
  calculateBackupRuntime,
  SA_FLAGSHIP_OFFERS,
  MITREND_MERCHANT,
} from '@shoppage/kernel';
import type { MasterProduct, Offer } from '@shoppage/contracts';
import ProductStudioStage from '@/components/ProductStudioStage';
import { resolveExternalProduct } from '@/lib/external_discovery';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let product = MasterProductStore.getProductById(resolvedParams.id);
  let resolvedExternalOffer: Offer | null = null;

  if (!product) {
    const extMatch = resolveExternalProduct(resolvedParams.id);
    if (extMatch) {
      product = extMatch.product;
      resolvedExternalOffer = extMatch.offer;
    }
  }

  if (!product) {
    notFound();
  }

  const confirmedOffers = SA_FLAGSHIP_OFFERS.filter((o) => o.variantRef === product.canonicalId);
  const discoveredOffers = DiscoveredOffersStore.getDiscoveredOffersByProduct(product.canonicalId);
  const mappedDiscoveredOffers: Offer[] = discoveredOffers.map((d) => ({
    id: d.id,
    variantRef: product.canonicalId,
    merchantRef: d.merchantRef || `mer_ext_${d.sourceWebsite.replace(/\./g, '_')}`,
    stallRef: d.merchantName,
    destinationType: 'retailer_website',
    actionTarget: {
      type: 'url',
      destinationUrl: d.sourceUrl,
    },
    price: {
      amount: d.discoveredPrice.amount,
      currency: d.discoveredPrice.currency,
      sourceTimestamp: d.discoveredAt,
    },
    availabilityState: 'fresh',
    updateType: 'api_feed_update',
    freshness: {
      slaClass: 'fast_moving_24h',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      lastConfirmedAt: d.discoveredAt,
    },
  }));

  const displayOffers: Offer[] = confirmedOffers.length > 0
    ? confirmedOffers
    : mappedDiscoveredOffers.length > 0
    ? mappedDiscoveredOffers
    : resolvedExternalOffer
    ? [resolvedExternalOffer]
    : [];

  const isMitrend = resolvedParams.id.toLowerCase().includes('mitrend');
  const hasOffers = displayOffers.length > 0;
  const minPrice = hasOffers
    ? Math.min(...displayOffers.map((o) => o.price?.amount || 999999))
    : Number((product.attributes as any)?.estimatedPriceZar) || 0;
  const isSolar = product.categoryRef === 'solar_energy' || Boolean(product.compliance?.nrs097Certified);
  const batteryKwh = Number((product.attributes as any)?.batteryCapacityKwh) || 5.12;

  const runtimeEssentials = calculateBackupRuntime(batteryKwh, 450);
  const runtimeHeavy = calculateBackupRuntime(batteryKwh, 1200);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/" style={{ color: 'var(--slate-500)' }}>Home</Link>
        <span>&gt;</span>
        <Link href="/search" style={{ color: 'var(--slate-500)' }}>Catalog</Link>
        <span>&gt;</span>
        <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>{product.title}</span>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }}>
        {/* Left: Studio Stage */}
        <div>
          <ProductStudioStage product={product} variant="detail" />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {product.compliance?.nrs097Certified && (
              <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                ✓ NRS 097 Certified
              </span>
            )}
            {product.compliance?.sabsApproved && (
              <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                ✓ SABS Approved
              </span>
            )}
            {product.compliance?.warrantyYears && (
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                🛡️ {product.compliance.warrantyYears} Year Warranty
              </span>
            )}
          </div>
        </div>

        {/* Right: Commercial Overview & Verified BuyBox */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            {product.brand} · Canonical Master SKU
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--slate-900)', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--slate-900)', fontFamily: 'var(--font-mono)' }}>
              {minPrice > 0 ? `R ${minPrice.toLocaleString()}` : 'Price on request'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              {hasOffers
                ? `Starting verified price (${displayOffers.length} confirmed stockist${displayOffers.length > 1 ? 's' : ''})`
                : minPrice > 0
                ? 'Estimated catalogue price · Request quote from stockists'
                : 'Direct seller quote required'}
            </span>
          </div>

          {/* Interactive Solar Runtime Widget */}
          {isSolar && (
            <div className="card" style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', padding: '1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⚡ Load-Shedding Stage 6 Runtime Calculator ({batteryKwh}kWh)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>450W Home Essentials</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#14532D', fontFamily: 'var(--font-mono)' }}>
                    {runtimeEssentials.formattedRuntime}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Wi-Fi, TV, Lights, Fridge</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>1200W Heavy Load</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#14532D', fontFamily: 'var(--font-mono)' }}>
                    {runtimeHeavy.formattedRuntime}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Microwave, PC, Freezers</div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Omnichannel Seller Inquiries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/requests"
              className="btn btn-primary"
              style={{ padding: '0.9rem', fontSize: '1rem', fontWeight: 800, justifyContent: 'center' }}
            >
              📋 Contact Sellers & Request Direct Quotes (0% Commission)
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/merchants" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                🏪 View Local Stockists
              </Link>
              <Link href="/malls" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                🏬 Find in Nearby Malls
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Physical Store Counters & Stockists Table */}
      {confirmedOffers.length > 0 && (
        <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
            🏬 Verified Local Store Counters ({confirmedOffers.length})
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Official physical retail & wholesale counter merchants with in-person pickup and trade desk quotes.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Merchant / Location</th>
                  <th style={{ padding: '0.75rem' }}>Availability</th>
                  <th style={{ padding: '0.75rem' }}>Price (ZAR)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Direct Action</th>
                </tr>
              </thead>
              <tbody>
                {confirmedOffers.map((offer) => {
                  const merchant = (offer.merchantRef === 'loc_mitrend_midrand' || isMitrend)
                    ? (MITREND_MERCHANT as any)
                    : SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef) || {
                        id: offer.merchantRef,
                        name: 'SunPower Solutions (Crown Mines)',
                        addressText: 'Crown Mines Wholesale Hub, Johannesburg',
                        contacts: { telephone: '+27110001001', website: 'https://sunpower.co.za' },
                        googleRating: 4.9,
                      };

                  return (
                    <tr key={offer.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <Link href={`/m/${merchant.id}`} style={{ fontWeight: 800, color: 'var(--slate-900)', textDecoration: 'none' }}>
                          {merchant.name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                          📍 {merchant.addressText} · ★ {merchant.googleRating || '4.8'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>✓ In Stock (Counter)</span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                        R {(offer.price?.amount || minPrice).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <Link href={`/m/${merchant.id}`} className="btn btn-outline btn-sm">
                            View Store
                          </Link>
                          {merchant.contacts?.telephone && (
                            <a
                              href={`tel:${merchant.contacts.telephone}`}
                              className="btn btn-primary btn-sm"
                              title="Call Seller"
                            >
                              📞 Call
                            </a>
                          )}
                          {merchant.contacts?.website && (
                            <a
                              href={merchant.contacts.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-dark btn-sm"
                              title="Visit Website"
                            >
                              🌐 Web
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Verified Online Retailers & National Feeds (Direct Database URLs) */}
      <section className="card" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
          🛒 Verified Online Retailers & National Feeds ({discoveredOffers.length})
        </h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Real-time catalog pricing and genuine direct store product links from verified South African retailers.
        </p>

        {discoveredOffers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Retailer / Merchant</th>
                  <th style={{ padding: '0.75rem' }}>Stock & Fulfilment</th>
                  <th style={{ padding: '0.75rem' }}>Price (ZAR)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Store Link</th>
                </tr>
              </thead>
              <tbody>
                {discoveredOffers.map((offer) => (
                  <tr key={offer.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--slate-900)' }}>
                        {offer.merchantName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                        🌐 {offer.sourceWebsite} · SKU: {offer.sku}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem', display: 'inline-block', marginBottom: '0.2rem' }}>
                        {offer.availabilityText}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        📍 {offer.locationHint}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {offer.discoveredPrice.rawPriceText}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                      <a
                        href={offer.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        Buy Online ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <p style={{ color: 'var(--slate-600)', marginBottom: '1rem' }}>
              Are you a merchant stocking this product? Claim your listing or submit a verified quote.
            </p>
            <Link href="/merchant/dashboard" className="btn btn-primary btn-sm">
              🏬 Submit Merchant Quote
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
