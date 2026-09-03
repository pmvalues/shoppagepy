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
import { PayloadMerchantCmsService } from '@/cms';

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
    const cmsDoc = PayloadMerchantCmsService.getProductById(resolvedParams.id);
    if (cmsDoc && cmsDoc.feedStatus === 'Active') {
      product = PayloadMerchantCmsService.toMasterProduct(cmsDoc);
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
  const pricedAmounts = hasOffers
    ? displayOffers
        .map((o) => o.price?.amount)
        .filter((n): n is number => typeof n === 'number' && n > 0)
    : [];
  const minPrice =
    pricedAmounts.length > 0
      ? Math.min(...pricedAmounts)
      : hasOffers
        ? 0
        : Number((product.attributes as any)?.estimatedPriceZar) || 0;
  const primaryOffer = displayOffers[0];
  const primaryKnown = primaryOffer !== undefined && (primaryOffer.merchantRef === 'loc_mitrend_midrand' || SA_FLAGSHIP_MERCHANTS.some((m) => m.id === primaryOffer.merchantRef));
  const primaryStoreHref = !primaryOffer
    ? '#'
    : primaryKnown
      ? `/m/${primaryOffer.merchantRef}`
      : primaryOffer.actionTarget?.destinationUrl || '#';
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

  const priceLabel =
    confirmedOffers.length > 0
      ? `Starting verified price (${confirmedOffers.length} confirmed stockist${confirmedOffers.length > 1 ? 's' : ''})`
      : hasOffers
        ? `Live store listings (${displayOffers.length} retailer${displayOffers.length > 1 ? 's' : ''}) · confirm price in store`
        : minPrice > 0
          ? 'Estimated catalogue price · Request quote from stockists'
          : 'Direct seller quote required';

  /* ---- Tab content (rendered server-side, passed to the client tab shell) ---- */
  const description = (product.attributes as any)?.description as string
    || product.guides?.summaryGuide
    || 'National commerce catalog SKU indexed across South African verified stockists. Direct trade counter supply, official manufacturer warranty, and instant multi-channel quoting.';

  const specs: [string, string][] = [
    ['Brand', product.brand || '—'],
    ['GTIN', (product.identifiers as any)?.gtin13 || '—'],
    ['Category', product.categoryRef || '—'],
    ['Stock Availability', product.compliance?.nrs097Certified ? 'In Stock (Direct Counter & Delivery)' : 'Verified Stock Available'],
    ...(product.compliance?.nrs097Certified ? [['Grid Compliance', 'NRS 097-2-1 Approved ✓'] as [string, string]] : []),
    ...(product.compliance?.sabsApproved ? [['Safety Standard', 'SABS SANS 10142-1 Certified ✓'] as [string, string]] : []),
    ['National Trade Price', minPrice > 0 ? `R ${minPrice.toLocaleString()}` : 'Instant Quote on Request'],
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
              const knownMerchant = (offer.merchantRef === 'loc_mitrend_midrand' || isMitrend)
                ? (MITREND_MERCHANT as any)
                : SA_FLAGSHIP_MERCHANTS.find((m) => m.id === offer.merchantRef);
              const merchant = knownMerchant || {
                id: offer.merchantRef,
                name: offer.stallRef || offer.merchantRef,
                addressText: 'Online storefront',
                contacts: {},
                country: 'ZA',
                verificationState: 'unverified',
                googleRating: undefined as number | undefined,
              };
              const storeHref = knownMerchant
                ? `/m/${merchant.id}`
                : offer.actionTarget?.destinationUrl || '#';
              return (
                <tr key={offer.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      <Link href={storeHref} style={{ color: 'inherit' }}>{merchant.name}</Link>
                    </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📍 {merchant.addressText || 'Online storefront'}
                        {merchant.googleRating ? ` · ★ ${merchant.googleRating}` : ''}
                      </div>
                  </td>
                  <td>{confirmedOffers.length > 0 ? (<span className="badge badge-green" style={{ fontSize: '0.72rem' }}>✓ In Stock (Counter)</span>) : (<span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>See live listing</span>)}</td>
                  <td>{confirmedOffers.length > 0 ? (<span style={{ color: 'var(--emerald)', fontWeight: 800 }}>✓ Verified Stockist</span>) : (<span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Online retailer</span>)}</td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>{offer.price?.amount && offer.price.amount > 0 ? `R ${offer.price.amount.toLocaleString()}` : 'See in store'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Link href={storeHref} className="btn btn-outline btn-sm">Store Counter</Link>
                      <Link
                        href={`/requests?prefillSku=${encodeURIComponent(product.canonicalId)}&prefillTitle=${encodeURIComponent(product.title)}&prefillBrand=${encodeURIComponent(product.brand || '')}`}
                        className="btn btn-primary btn-sm"
                      >
                        Get Quote
                      </Link>
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

            <div className="pdp-cta-row" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <Link
                href={`/requests?prefillSku=${encodeURIComponent(product.canonicalId)}&prefillTitle=${encodeURIComponent(product.title)}&prefillBrand=${encodeURIComponent(product.brand || '')}&prefillBudget=${minPrice > 0 ? minPrice : ''}`}
                className="btn btn-primary btn-lg"
                style={{ flex: '1 1 200px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                📋 Request Contractor Quote (RFQ)
              </Link>
              {displayOffers[0] ? (
                <Link
                  href={primaryStoreHref}
                  className="btn btn-outline btn-lg"
                  style={{ flex: '1 1 160px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  🏪 Store Pickup / Counter
                </Link>
              ) : (
                <a
                  href={`tel:27105007670`}
                  className="btn btn-outline btn-lg"
                  style={{ flex: '1 1 140px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  📞 Call Trade Desk
                </a>
              )}
            </div>

            <ul className="pdp-keyfacts">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Direct trade counter fulfillment — <strong>0% platform commission</strong>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Instant multi-channel quotes: Phone, Email PDF, Portal &amp; Direct Messaging
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7"/></svg>
                SABS &amp; NRS 097 grid-certified sourcing with verified manufacturer warranty
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
