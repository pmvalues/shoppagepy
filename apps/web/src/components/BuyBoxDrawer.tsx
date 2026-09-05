'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductVariant, Offer, Merchant } from '@shoppage/contracts';
import { formatDistance, calculateHaversineDistanceKm, DEFAULT_USER_LOCATION } from '@/lib/geo';

export interface BuyBoxDrawerProps {
  product: ProductVariant | null;
  offers: Offer[];
  merchants?: Merchant[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: any) => void;
  onGenerateProforma?: (item: any) => void;
}

export default function BuyBoxDrawer({
  product,
  offers,
  merchants = [],
  isOpen,
  onClose,
  onAddToCart,
  onGenerateProforma,
}: BuyBoxDrawerProps) {
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'trust'>('price');
  const [selectedFulfillment, setSelectedFulfillment] = useState<'all' | 'collection' | 'delivery'>('all');

  if (!isOpen || !product) return null;

  // Enrich offers with merchant geolocal data
  const enrichedOffers = offers.map((offer) => {
    const merchant = merchants.find((m) => m.id === offer.merchantRef);
    const coords = merchant?.coordinates;
    const distanceKm = coords
      ? calculateHaversineDistanceKm(DEFAULT_USER_LOCATION, coords)
      : 12.5; // Default Highveld metro distance estimate

    return {
      offer,
      merchant,
      distanceKm,
      price: offer.price.amount || 0,
      isVerified: merchant?.verificationState === 'fully_verified',
      merchantName: merchant?.name || offer.merchantRef.replace(/^loc_/, '').replace(/_/g, ' '),
      suburb: merchant?.addressText || 'Gauteng Trade Corridor',
    };
  });

  // Sort offers
  enrichedOffers.sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
    if (sortBy === 'trust') return (b.merchant?.googleRating || 4.5) - (a.merchant?.googleRating || 4.5);
    return 0;
  });

  const bestOffer = enrichedOffers[0];
  const lowestPrice = bestOffer ? bestOffer.price : (product.attributes?.estimatedPriceZar as number) || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#FFFFFF',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.2)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A73E8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              National BuyBox Matrix · South Africa
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
              Compare Verified Stockists
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Product Summary Header Card */}
        <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.35rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.media?.gallery?.[0]?.url ? (
              <img src={product.media.gallery[0].url} alt={product.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '1.75rem' }}>📦</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              {product.brand} {product.identifiers?.gtin13 ? `· GTIN ${product.identifiers.gtin13}` : ''}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0.15rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                From R {lowestPrice.toLocaleString('en-ZA')}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                · {enrichedOffers.length || 1} live offer{enrichedOffers.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* Sort Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Sort by:</span>
            {[
              { id: 'price', label: 'Lowest Price' },
              { id: 'distance', label: '📍 Closest' },
              { id: 'trust', label: '★ Trust' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSortBy(btn.id as any)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '16px',
                  border: sortBy === btn.id ? '1px solid #1A73E8' : '1px solid #CBD5E1',
                  background: sortBy === btn.id ? '#E8F0FE' : '#FFFFFF',
                  color: sortBy === btn.id ? '#1A73E8' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: sortBy === btn.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* User Location Context Pill */}
          <div style={{ fontSize: '0.72rem', color: '#64748B', background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>
            📍 Near <strong>President Park AH, Midrand</strong>
          </div>
        </div>

        {/* Offers Comparison List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {enrichedOffers.length > 0 ? (
            enrichedOffers.map((item, idx) => {
              const isBest = idx === 0 && sortBy === 'price';
              return (
                <div
                  key={item.offer.id}
                  style={{
                    borderRadius: '14px',
                    border: isBest ? '2px solid #059669' : '1px solid #E2E8F0',
                    background: isBest ? '#F0FDF4' : '#FFFFFF',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                          {item.merchantName}
                        </span>
                        {item.isVerified && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            ✓ Verified Trade
                          </span>
                        )}
                        {isBest && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FFFFFF', background: '#059669', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            BEST BUYBOX
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>📍 {item.suburb}</span>
                        <span>·</span>
                        <strong style={{ color: '#0F172A' }}>{formatDistance(item.distanceKm)}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                        R {item.price.toLocaleString('en-ZA')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                        🟢 Ready for Collection
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                    {onAddToCart && (
                      <button
                        onClick={() => {
                          onAddToCart({
                            id: item.offer.id,
                            name: product.title,
                            price: item.price,
                            merchantId: item.offer.merchantRef,
                            merchantName: item.merchantName,
                            brand: product.brand,
                            image: product.media?.gallery?.[0]?.url,
                            stockistLocation: `${item.merchantName} (${item.suburb})`,
                          });
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Reserve for In-Store Pickup
                      </button>
                    )}

                    {onGenerateProforma && (
                      <button
                        onClick={() => {
                          onGenerateProforma({
                            product,
                            offer: item.offer,
                            merchant: item.merchant,
                            price: item.price,
                          });
                          onClose();
                        }}
                        style={{
                          padding: '0.55rem 0.85rem',
                          background: '#F1F5F9',
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Generate SARS-compliant B2B Proforma Tax Invoice"
                      >
                        📄 Proforma
                      </button>
                    )}

                    {item.offer.actionTarget?.destinationUrl && (
                      <a
                        href={item.offer.actionTarget.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.55rem 0.85rem',
                          background: '#E8F0FE',
                          color: '#1A73E8',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        Store Site ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏬</div>
              <h4 style={{ color: '#0F172A', margin: 0 }}>Direct In-Store Counter Verification</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                This product is listed in the National GS1 Master Library. Check nearby trade distributors in Midrand and Crown Mines for live allocation.
              </p>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🛡️ 0% Platform Take-Rate · Direct Merchant Billing</span>
          <span>SABS / NRS 097 South African Standards</span>
        </div>
      </div>
    </div>
  );
}
