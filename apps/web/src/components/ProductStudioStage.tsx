'use client';

import React, { useState } from 'react';
import type { MasterProduct } from '@shoppage/contracts';

interface ProductStudioStageProps {
  product: MasterProduct;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * Illustration palette.
 *
 * These are NOT theme tokens. They are the literal colours of the category
 * artwork — a lithium battery is navy, a cement sack is amber, an inverter
 * chassis is white. They are hoisted out of the JSX so the drawing reads as
 * structure rather than a wall of hex, and they are intentionally identical
 * in every theme because they are painted on the fixed-light studio stage
 * (see `--color-stage-*` in theme.css). Do not convert these to surface or
 * content tokens: there is no thematic meaning to "the red terminal cap".
 */
const ART = {
  white: '#FFFFFF',
  black: '#000000',
  ink900: '#0F172A',
  ink800: '#1E293B',
  indigo950: '#1E1B4B',
  indigo900: '#312E81',
  indigo500: '#6366F1',
  indigo400: '#818CF8',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate50: '#F8FAFC',
  sky600: '#0284C7',
  sky400: '#38BDF8',
  emerald900: '#064E3B',
  emerald600: '#059669',
  emerald500: '#10B981',
  emerald400: '#34D399',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  red600: '#DC2626',
  orange900: '#78350F',
  orange800: '#92400E',
  orange700: '#B45309',
  orange600: '#D97706',
} as const;

type StageTone = 'solar' | 'tech' | 'hardware' | 'neutral';

/** Placeholder shown when a product has no image and matches no category. */
function BoxIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ART.slate500}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
      <path d="M3 8.5 12 14l9-5.5" />
      <path d="M12 14v7" />
    </svg>
  );
}

export default function ProductStudioStage({
  product,
  variant = 'card',
  className = '',
}: ProductStudioStageProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const cat = product.categoryRef || 'general';
  const isSolar = cat === 'solar_energy' || /inverter|solar|panel|battery|hybrid|lifepo4|ups/i.test(product.title);
  const isBattery = /battery|lifepo4|lithium|kwh|5.12|10kwh/i.test(product.title);
  const isTech = cat === 'smartphones' || /phone|samsung|galaxy|iphone|laptop|tablet|screen|tech/i.test(product.title);
  const isHardware = cat === 'hardware' || /cement|drill|tool|grinder|building|brick|paint/i.test(product.title);

  const isDetail = variant === 'detail';
  const rawImageUrl = product.media?.gallery?.[0]?.url || (product as any).image || (product as any).featuredImage;
  const imageUrl = !imgFailed && rawImageUrl ? rawImageUrl : null;

  // Stage tone and glow tint are decided on `isSolar`, not on the illustration
  // branch below: a lithium battery is classified `isSolar` and therefore gets
  // the solar gradient and glow while drawing the battery artwork. Preserved
  // from the original implementation.
  const stageTone: StageTone = isSolar ? 'solar' : isTech ? 'tech' : isHardware ? 'hardware' : 'neutral';
  const glowTone = isSolar ? 'solar' : isTech ? 'tech' : 'amber';

  return (
    <div
      className={[
        'product-studio-stage studio-stage',
        `studio-stage--${stageTone}`,
        isDetail ? 'h-[360px] rounded-xl' : 'h-[180px] rounded-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Background blueprint grid */}
      <div
        className={`studio-stage__grid ${isDetail ? 'studio-stage__grid--detail' : ''}`}
        aria-hidden="true"
      />

      {/* Ambient spotlight */}
      <div
        className={`studio-stage__glow studio-stage__glow--${glowTone} ${
          isDetail ? 'studio-stage__glow--detail' : ''
        }`}
        aria-hidden="true"
      />

      {/* Main image or category illustration */}
      <div className="studio-stage__subject">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.title}
            loading="lazy"
            decoding="async"
            fetchPriority={isDetail ? 'high' : 'low'}
            onError={() => setImgFailed(true)}
            sizes={isDetail ? '(max-width: 768px) 90vw, 360px' : '(max-width: 640px) 90vw, 230px'}
            className={`max-w-[92%] rounded-lg object-cover ${isDetail ? 'max-h-[320px]' : 'max-h-[160px]'}`}
          />
        ) : isSolar && !isBattery ? (
          <svg
            width={isDetail ? 220 : 110}
            height={isDetail ? 180 : 90}
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Hybrid inverter illustration"
          >
            {/* Inverter white/silver industrial chassis */}
            <rect
              x="25"
              y="15"
              width="150"
              height="130"
              rx="12"
              fill={ART.white}
              stroke={ART.emerald600}
              strokeWidth="2"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
            />
            <rect x="35" y="25" width="130" height="35" rx="6" fill={ART.slate50} stroke={ART.slate300} strokeWidth="1.5" />
            {/* Digital display screen */}
            <rect x="50" y="32" width="100" height="20" rx="3" fill={ART.emerald900} stroke={ART.emerald500} strokeWidth="1" />
            <text x="100" y="46" fill={ART.emerald400} fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {product.attributes?.ratedPowerWatts ? `${product.attributes.ratedPowerWatts}W HYBRID` : '5000W 48V'}
            </text>
            {/* Status LEDs */}
            <circle cx="45" cy="80" r="4" fill={ART.emerald500} />
            <circle cx="60" cy="80" r="4" fill={ART.sky600} />
            <circle cx="75" cy="80" r="4" fill={ART.amber500} />
            <text x="95" y="83" fill={ART.slate500} fontSize="9" fontWeight="600" fontFamily="sans-serif">NORMAL / GRID / FAULT</text>
            {/* Vents & wiring ports */}
            <line x1="45" y1="105" x2="155" y2="105" stroke={ART.slate200} strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="115" x2="155" y2="115" stroke={ART.slate200} strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="125" x2="155" y2="125" stroke={ART.slate200} strokeWidth="3" strokeLinecap="round" />
            <rect x="55" y="142" width="18" height="6" rx="2" fill={ART.slate700} />
            <rect x="80" y="142" width="18" height="6" rx="2" fill={ART.red600} />
            <rect x="105" y="142" width="18" height="6" rx="2" fill={ART.sky600} />
            <rect x="130" y="142" width="18" height="6" rx="2" fill={ART.slate700} />
          </svg>
        ) : isBattery ? (
          <svg
            width={isDetail ? 200 : 100}
            height={isDetail ? 160 : 80}
            viewBox="0 0 180 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Lithium battery illustration"
          >
            {/* Rack / wall-mount lithium battery enclosure */}
            <rect x="15" y="20" width="150" height="100" rx="8" fill={ART.ink800} stroke={ART.sky400} strokeWidth="1.5" />
            {/* BMS screen & battery bar */}
            <rect x="30" y="35" width="60" height="15" rx="3" fill={ART.ink900} stroke={ART.sky600} strokeWidth="1" />
            <text x="60" y="46" fill={ART.sky400} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">51.2V 100Ah</text>
            <rect x="100" y="36" width="50" height="12" rx="2" fill={ART.ink900} />
            <rect x="102" y="38" width="40" height="8" rx="1" fill={ART.emerald500} />
            {/* Terminals & breaker */}
            <circle cx="35" cy="75" r="7" fill={ART.red600} />
            <circle cx="35" cy="75" r="3" fill={ART.white} />
            <circle cx="60" cy="75" r="7" fill={ART.ink900} stroke={ART.slate600} />
            <circle cx="60" cy="75" r="3" fill={ART.white} />
            <rect x="85" y="65" width="22" height="20" rx="3" fill={ART.ink900} stroke={ART.slate500} />
            <rect x="91" y="68" width="10" height="14" rx="2" fill={ART.amber500} />
            {/* Handles */}
            <path d="M15 45 H8 V95 H15" stroke={ART.slate500} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M165 45 H172 V95 H165" stroke={ART.slate500} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : isTech ? (
          <svg
            width={isDetail ? 160 : 80}
            height={isDetail ? 200 : 100}
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Smartphone illustration"
          >
            {/* Modern slim smartphone chassis */}
            <rect x="25" y="10" width="70" height="140" rx="14" fill={ART.ink900} stroke={ART.indigo500} strokeWidth="1.5" />
            <rect x="29" y="14" width="62" height="132" rx="10" fill={ART.indigo950} />
            {/* Camera punch-hole & display wallpaper glow */}
            <circle cx="60" cy="22" r="3" fill={ART.black} />
            <circle cx="60" cy="80" r="24" fill="url(#techGlow)" fillOpacity="0.4" />
            <defs>
              <radialGradient id="techGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={ART.indigo400} />
                <stop offset="100%" stopColor={ART.indigo900} stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        ) : isHardware ? (
          <svg
            width={isDetail ? 180 : 90}
            height={isDetail ? 160 : 80}
            viewBox="0 0 160 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Cement sack illustration"
          >
            {/* Hardware cement sack / industrial supply */}
            <path
              d="M40 25 C50 20, 110 20, 120 25 L130 115 C120 125, 40 125, 30 115 Z"
              fill={ART.orange600}
              stroke={ART.orange800}
              strokeWidth="2"
            />
            <rect x="50" y="45" width="60" height="45" rx="4" fill={ART.amber100} stroke={ART.orange700} strokeWidth="1" />
            <text x="80" y="65" fill={ART.orange800} fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">SABS 42.5N</text>
            <text x="80" y="78" fill={ART.orange900} fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">50KG NET</text>
          </svg>
        ) : (
          <BoxIcon size={isDetail ? 64 : 32} />
        )}
      </div>

      {/* GS1 standard watermark badge */}
      <div className="studio-stage__watermark max-w-[80%] truncate text-xs">
        GS1 {product.identifiers?.mpn || 'CANONICAL'}
      </div>
    </div>
  );
}
