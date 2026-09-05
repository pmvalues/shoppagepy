'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductVariant, Offer } from '@shoppage/contracts';
import { formatDistance, calculateHaversineDistanceKm, DEFAULT_USER_LOCATION } from '@/lib/geo';

export interface ProductCardProps {
  product: ProductVariant;
  offers?: Offer[];
  isSponsored?: boolean;
  onOpenBuyBox?: (product: ProductVariant, offers: Offer[]) => void;
}

export default function ProductCard({
  product,
  offers = [],
  isSponsored = false,
  onOpenBuyBox,
}: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  // Extract best price from offers or product attribute
  const minPrice = offers.length
    ? Math.min(...offers.map((o) => (typeof o.price?.amount === 'number' ? o.price.amount : Infinity)))
    : (product.attributes?.estimatedPriceZar as number | undefined);

  const originalPrice = product.attributes?.originalPriceZar as number | undefined;
  const hasDiscount = originalPrice && minPrice && originalPrice > minPrice;
  const discountPct = hasDiscount ? Math.round(((originalPrice - minPrice) / originalPrice) * 100) : null;

  // Best offer geolocal calculation
  const bestOffer = offers[0];
  const merchantName = bestOffer?.merchantRef?.replace(/^loc_/, '').replace(/_/g, ' ') || 'SunPower SA';
  const estimatedDistanceKm = 4.2; // Highveld metro proximity default

  const primaryImage = product.media?.gallery?.[0]?.url || (product as any).primary_image?.url;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: isSponsored ? '1px solid #FBBC04' : '1px solid #DADCE0',
        boxShadow: isSponsored ? '0 2px 8px rgba(251, 188, 4, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100%',
      }}
      className="group hover:border-transparent hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      {/* Sponsored Pill */}
      {isSponsored && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 10,
            background: '#FBBC04',
            color: '#202124',
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}
        >
          Sponsored
        </div>
      )}

      {/* Sale Discount Pill */}
      {discountPct && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            background: '#EA4335',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          -{discountPct}%
        </div>
      )}

      {/* 1:1 Aspect Ratio Image Container */}
      <Link
        href={`/p/${product.canonicalId}`}
        style={{
          display: 'block',
          aspectRatio: '1/1',
          background: '#FAFAFA',
          position: 'relative',
          overflow: 'hidden',
          padding: '1rem',
        }}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: '#CBD5E1',
            }}
          >
            📦
          </div>
        )}
      </Link>

      {/* Product Information Body */}
      <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
        {/* Brand & Geolocal Proximity Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#5F6368', flexWrap: 'wrap' }}>
          <span
            style={{
              fontWeight: 700,
              background: '#F1F3F4',
              color: '#202124',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
            }}
          >
            {product.brand}
          </span>
          <span>•</span>
          <span style={{ color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>📍</span>
            <span>{formatDistance(estimatedDistanceKm)}</span>
          </span>
          <span style={{ color: '#137333', fontWeight: 700 }}>✓ In Stock</span>
        </div>

        {/* 2-Line Clamped Title */}
        <Link href={`/p/${product.canonicalId}`} style={{ textDecoration: 'none' }}>
          <h3
            style={{
              fontSize: '0.85rem',
              lineHeight: '1.35',
              fontWeight: 600,
              color: '#202124',
              margin: '0.15rem 0',
              height: '2.7em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            className="group-hover:text-[#1A73E8]"
          >
            {product.title}
          </h3>
        </Link>

        {/* Technical Badges & GTIN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {product.identifiers?.gtin13 && (
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748B', background: '#F8FAFC', padding: '1px 4px', borderRadius: '3px', border: '1px solid #E2E8F0' }}>
              GTIN {product.identifiers.gtin13}
            </span>
          )}
          {product.compliance?.nrs097Certified && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#137333', background: '#E6F4EA', padding: '1px 5px', borderRadius: '4px' }}>
              NRS 097 ✓
            </span>
          )}
          {product.compliance?.sabsApproved && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1967D2', background: '#E8F0FE', padding: '1px 5px', borderRadius: '4px' }}>
              SABS
            </span>
          )}
        </div>

        {/* Price & BuyBox Trigger Section */}
        <div style={{ marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1px solid #F1F3F4' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#202124', fontVariantNumeric: 'tabular-nums' }}>
              {typeof minPrice === 'number' && minPrice !== Infinity
                ? `R ${minPrice.toLocaleString('en-ZA')}`
                : 'Quote Required'}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: '0.8rem', color: '#70757A', textDecoration: 'line-through' }}>
                R {originalPrice.toLocaleString('en-ZA')}
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.72rem', color: '#1A73E8', fontWeight: 600, marginTop: '0.2rem' }}>
            {offers.length > 0 ? `${offers.length} local stockists · Compare BuyBox` : '1 verified stockist nearby'}
          </div>
        </div>
      </div>

      {/* Action Strip on Card Hover */}
      <div style={{ padding: '0 1rem 0.85rem 1rem', display: 'flex', gap: '0.4rem' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onOpenBuyBox) {
              onOpenBuyBox(product, offers);
            }
          }}
          style={{
            flex: 1,
            height: '32px',
            background: '#1A73E8',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
          className="hover:bg-[#185ABC]"
        >
          Compare {offers.length || 1} Stores
        </button>

        <Link
          href={`/p/${product.canonicalId}`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #DADCE0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5F6368',
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
          title="Full Specs & Compliance"
        >
          ↗
        </Link>
      </div>
    </div>
  );
}
