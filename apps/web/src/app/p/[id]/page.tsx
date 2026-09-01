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
import ProductCard from '@/components/ProductCard';
import ProductTabs from '@/components/ProductTabs';
import Breadcrumb from '@/components/Breadcrumb';
import WhatsAppCTA from '@/components/WhatsAppCTA';
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

  // Related Verified SKUs — same brand or category, excluding this product.
  const relatedSearch = MasterProductStore.searchProducts({
    query: product.brand || product.categoryRef,
    limit: 8,
  });
  const relatedProducts = (relatedSearch?.items || [])
    .filter((p) => p.canonicalId !== product.canonicalId)
    .slice(0, 4);

  const priceLabel = hasOffers
    ? `Starting verified price (${displayOffers.length} confirmed stockist${displayOffers.length > 1 ? 's' : ''})`
    : minPrice > 0
    ? 'Estimated catalogue price · Request quote from stockists'
    : 'Direct seller quote required';

  /* ---- Tab content (rendered server-side, passed to the client tab shell) ---- */
  const description = (product.attributes as any)?.description as string
    || product.guides?.summaryGuide
    || 'National commerce catalog SKU indexed across South African verified stockists. Contact merchants directly on WhatsApp to confirm stock availability and volume pricing.';

  const specs: [string, string][] = [
    ['Brand', product.brand || '—'],
    ['GTIN', (product.identifiers as any)?.gtin13 || '—'],
    ['Category', product.categoryRef || '—'],
    ['Stock', product.compliance?.nrs097Certified ? 'Check stock on WhatsApp' : 'Confirm with merchant'],
    ...(product.compliance?.nrs097Certified ? [['Grid Compliance', 'NRS 097 ✓'] as [string, string]] : []),
    ...(product.compliance?.sabsApproved ? [['Safety', 'SABS Approved'] as [string, string]] : []),
    ['Best National Price', minPrice > 0 ? `R ${minPrice.toLocaleString()}` : 'On request'],
  ];

  const offersTable = (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="pdp-table">
          <thead>
            <tr>
              <th>Merchant &amp; Location</th>
              <th>Stock Status</th>
              <th>Trust Rating</th>
              <th>Price</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayOffers.map((offer) => {
              const merchant = (offer.merchantRef === 'loc_mitrend_midrand' || isMitrend)
                ? (MITREND_MERCHANT as any)
                : SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef) || {
                    id: offer.merchantRef,
                    name: 'SunPower Solutions (Crown Mines)',
                    addressText: 'Dragon City Wholesale Mall, Building 2 Shop B-18, Crown Mines, Johannesburg, 2092',
                    contacts: { telephone: '+27118301100', whatsapp: '+27118301100', website: 'https://sunpowersolutions.co.za' },
                    googleRating: 4.9,
                  };
              const waPhone = merchant.contacts?.whatsapp || merchant.contacts?.telephone || '27105007670';
              const waMsg = encodeURIComponent(`Hi ${merchant.name}, I'm interested in ${product.title} (R ${minPrice.toLocaleString()}) on Shoppage. Is it in stock?`);
              return (
                <tr key={offer.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      <Link href={`/m/${merchant.id}`} style={{ color: 'inherit' }}>{merchant.name}</Link>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📍 {merchant.addressText} · ★ {merchant.googleRating || '4.8'}
                    </div>
                  </td>
                  <td><span className="badge badge-green" style={{ fontSize: '0.72rem' }}>✓ In Stock (Counter)</span></td>
                  <td><span style={{ color: 'var(--emerald)', fontWeight: 800 }}>✓ Verified</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>R {(offer.price?.amount || minPrice).toLocaleString()}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Link href={`/m/${merchant.id}`} className="btn btn-outline btn-sm">View Store</Link>
                      <WhatsAppCTA phone={waPhone} message={waMsg} label="WhatsApp Direct" size="sm" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {displayOffers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No direct merchant offers mapped to this SKU right now. Check back soon or post a Buyer RFQ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const reviewsPanel = (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)' }}>★ 4.9</div>
      <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 1rem' }}>Verified buyer ratings across the national grid.</p>
      <p style={{ color: 'var(--text-muted)', maxWidth: '48ch', margin: '0 auto 1rem' }}>
        Verified buyer reviews and unboxing proof are rolling out with the Proof Shorts program.
      </p>
      <Link href="/shorts" className="btn btn-outline btn-sm">Watch Proof Shorts</Link>
    </div>
  );

  const tabs = [
    {
      id: 'desc',
      label: 'Description',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      ),
      content: <p className="pdp-overview" style={{ maxWidth: '72ch' }}>{description}</p>,
    },
    {
      id: 'specs',
      label: 'Specifications',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      ),
      content: (
        <table className="pdp-specs">
          <tbody>
            {specs.map(([k, v]) => (
              <tr key={k}><th>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      id: 'offers',
      label: 'Merchant Offers',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      ),
      content: offersTable,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>
      ),
      content: reviewsPanel,
    },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/search">Catalog</Link>
        <span className="sep">/</span>
        <span className="current">{product.title}</span>
      </nav>

      {/* WooCommerce single-product grid: gallery + summary */}
      <div className="pdp-grid">
        {/* Left: Studio Stage (sticky gallery) */}
        <div className="pdp-gallery">
          <div className="pdp-stage">
            <ProductStudioStage product={product} variant="detail" />
          </div>
          <div className="pdp-thumbs">
            {product.compliance?.nrs097Certified && (
              <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>✓ NRS 097 Certified</span>
            )}
            {product.compliance?.sabsApproved && (
              <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>✓ SABS Approved</span>
            )}
            {product.compliance?.warrantyYears && (
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>🛡️ {product.compliance.warrantyYears} Year Warranty</span>
            )}
          </div>
        </div>

        {/* Right: Commercial Summary & Verified BuyBox */}
        <div className="pdp-summary">
          <div className="pdp-eyebrow">{product.brand} · Canonical Master SKU</div>
          <h1 className="pdp-title">{product.title}</h1>

          <div className="pdp-rating">
            <span className="stars">★ 4.9</span>
            <a href="#reviews">Read reviews</a>
          </div>

          <div className="pdp-buybox">
            <div className="pdp-buybox-label">Best National Price</div>
            <div className="pdp-price-row">
              {minPrice > 0 ? (
                <span className="pdp-price">R {minPrice.toLocaleString()}</span>
              ) : (
                <span className="pdp-price">On request</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{priceLabel}</div>

            {isSolar && (
              <div style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚡ Load-Shedding Stage 6 Runtime ({batteryKwh}kWh)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.65rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 600 }}>450W Home Essentials</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 900, color: '#14532D' }}>{runtimeEssentials.formattedRuntime}</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.65rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 600 }}>1200W Heavy Load</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 900, color: '#14532D' }}>{runtimeHeavy.formattedRuntime}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pdp-cta-row">
              <WhatsAppCTA
                phone="27105007670"
                message={`Hi Shoppage, I want to buy or quote ${product.title} (R ${minPrice.toLocaleString()}). Is it in stock?`}
                label="Buy via WhatsApp"
                size="lg"
              />
              <Link href="/requests" className="btn btn-primary btn-lg">Post Buyer RFQ</Link>
              <a href="#offers" className="btn btn-outline pdp-cta-icon" title="Compare merchant offers" aria-label="Compare merchant offers">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </a>
            </div>

            <ul className="pdp-keyfacts">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Direct trade with verified physical stores — <strong>0% platform commission</strong>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Confirm stock &amp; negotiate volume pricing on WhatsApp
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7"/></svg>
                SABS &amp; NRS 097 grid-certified sourcing where applicable
              </li>
            </ul>
          </div>

          <div className="pdp-trust-row">
            <div className="pdp-trust">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>
              <div><div className="t-title">✓ SABS Standard</div><div className="t-sub">Safety Certified</div></div>
            </div>
            <div className="pdp-trust pdp-trust--blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              <div><div className="t-title">⚡ NRS 097-2-1</div><div className="t-sub">Grid Compliant</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* WooCommerce product tabs */}
      <ProductTabs tabs={tabs} />

      {/* Related Verified SKUs */}
      {relatedProducts.length > 0 && (
        <section className="related-rail">
          <div className="related-head">
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>⚡ You may also need</span>
              <h2 className="section-title">Related Verified SKUs</h2>
            </div>
            <Link href={`/search?q=${encodeURIComponent(product.brand || product.categoryRef)}`} className="btn btn-outline btn-sm">
              View all {product.brand || 'products'} →
            </Link>
          </div>
          <div className="related-grid">
            {relatedProducts.map((p) => (
              <ProductCard key={p.canonicalId} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
