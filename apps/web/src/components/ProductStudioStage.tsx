'use client';

import React, { useState } from 'react';
import type { MasterProduct } from '@shoppage/contracts';

interface ProductStudioStageProps {
  product: MasterProduct;
  variant?: 'card' | 'detail';
  className?: string;
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
  const stageHeight = isDetail ? '360px' : '180px';
  const rawImageUrl = product.media?.gallery?.[0]?.url || (product as any).image || (product as any).featuredImage;
  const imageUrl = !imgFailed && rawImageUrl ? rawImageUrl : null;

  return (
    <div
      className={`product-studio-stage ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: stageHeight,
        borderRadius: isDetail ? 'var(--radius-xl)' : '10px',
        overflow: 'hidden',
        background: isSolar
          ? 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 60%, #E6F7F0 100%)'
          : isTech
          ? 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 60%, #E0E7FF 100%)'
          : isHardware
          ? 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 60%, #F5F5F4 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 60%, #EDF2F7 100%)',
        border: '1px solid #E2E8F0',
        boxShadow: isDetail
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)'
          : '0 1px 3px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Blueprint Grid (Subtle Light) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: isDetail ? '24px 24px' : '16px 16px',
          opacity: 0.9,
        }}
      />

      {/* Soft Light Spotlight Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          width: isDetail ? '280px' : '140px',
          height: isDetail ? '280px' : '140px',
          borderRadius: '50%',
          background: isSolar
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)'
            : isTech
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          filter: 'blur(24px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Image or Industrial SVG Illustration */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0.5rem' }}>
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
            style={{
              maxHeight: isDetail ? '320px' : '160px',
              maxWidth: '92%',
              objectFit: 'cover',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
            }}
          />
        ) : isSolar && !isBattery ? (
          <svg
            width={isDetail ? 220 : 110}
            height={isDetail ? 180 : 90}
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Inverter White/Silver Industrial Chassis */}
            <rect x="25" y="15" width="150" height="130" rx="12" fill="#FFFFFF" stroke="#059669" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
            <rect x="35" y="25" width="130" height="35" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            {/* Digital Display Screen */}
            <rect x="50" y="32" width="100" height="20" rx="3" fill="#064E3B" stroke="#10B981" strokeWidth="1" />
            <text x="100" y="46" fill="#34D399" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {product.attributes?.ratedPowerWatts ? `${product.attributes.ratedPowerWatts}W HYBRID` : '5000W 48V'}
            </text>
            {/* Status LEDs */}
            <circle cx="45" cy="80" r="4" fill="#10B981" />
            <circle cx="60" cy="80" r="4" fill="#0284C7" />
            <circle cx="75" cy="80" r="4" fill="#F59E0B" />
            <text x="95" y="83" fill="#64748B" fontSize="9" fontWeight="600" fontFamily="sans-serif">NORMAL / GRID / FAULT</text>
            {/* Vents & Wiring Ports */}
            <line x1="45" y1="105" x2="155" y2="105" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="115" x2="155" y2="115" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="125" x2="155" y2="125" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <rect x="55" y="142" width="18" height="6" rx="2" fill="#334155" />
            <rect x="80" y="142" width="18" height="6" rx="2" fill="#DC2626" />
            <rect x="105" y="142" width="18" height="6" rx="2" fill="#0284C7" />
            <rect x="130" y="142" width="18" height="6" rx="2" fill="#334155" />
          </svg>
        ) : isBattery ? (
          <svg
            width={isDetail ? 200 : 100}
            height={isDetail ? 160 : 80}
            viewBox="0 0 180 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Rack / Wall Mount Lithium Battery Enclosure */}
            <rect x="15" y="20" width="150" height="100" rx="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
            {/* BMS Screen & Battery Bar */}
            <rect x="30" y="35" width="60" height="15" rx="3" fill="#0F172A" stroke="#0284C7" strokeWidth="1" />
            <text x="60" y="46" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">51.2V 100Ah</text>
            <rect x="100" y="36" width="50" height="12" rx="2" fill="#0F172A" />
            <rect x="102" y="38" width="40" height="8" rx="1" fill="#10B981" />
            {/* Terminals & Breaker */}
            <circle cx="35" cy="75" r="7" fill="#DC2626" />
            <circle cx="35" cy="75" r="3" fill="#FFFFFF" />
            <circle cx="60" cy="75" r="7" fill="#0F172A" stroke="#475569" />
            <circle cx="60" cy="75" r="3" fill="#FFFFFF" />
            <rect x="85" y="65" width="22" height="20" rx="3" fill="#0F172A" stroke="#64748B" />
            <rect x="91" y="68" width="10" height="14" rx="2" fill="#F59E0B" />
            {/* Handles */}
            <path d="M15 45 H8 V95 H15" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M165 45 H172 V95 H165" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : isTech ? (
          <svg
            width={isDetail ? 160 : 80}
            height={isDetail ? 200 : 100}
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Modern Slim Smartphone Chassis */}
            <rect x="25" y="10" width="70" height="140" rx="14" fill="#0F172A" stroke="#6366F1" strokeWidth="1.5" />
            <rect x="29" y="14" width="62" height="132" rx="10" fill="#1E1B4B" />
            {/* Camera Punchole & Display Wallpaper Glow */}
            <circle cx="60" cy="22" r="3" fill="#000000" />
            <circle cx="60" cy="80" r="24" fill="url(#techGlow)" fillOpacity="0.4" />
            <defs>
              <radialGradient id="techGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
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
          >
            {/* Hardware Cement Sack / Industrial Supply */}
            <path d="M40 25 C50 20, 110 20, 120 25 L130 115 C120 125, 40 125, 30 115 Z" fill="#D97706" stroke="#92400E" strokeWidth="2" />
            <rect x="50" y="45" width="60" height="45" rx="4" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
            <text x="80" y="65" fill="#92400E" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">SABS 42.5N</text>
            <text x="80" y="78" fill="#78350F" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">50KG NET</text>
          </svg>
        ) : (
          <div style={{ fontSize: isDetail ? '4rem' : '2rem' }}>📦</div>
        )}
      </div>

      {/* GS1 Standard Watermark Badge (Subtle Technical Accent) */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '10px',
          fontSize: '0.65rem',
          fontWeight: 800,
          color: '#94A3B8',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          zIndex: 3,
        }}
      >
        GS1 {product.identifiers?.mpn || 'CANONICAL'}
      </div>
    </div>
  );
}
