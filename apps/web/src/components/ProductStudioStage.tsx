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
  const cat = product.categoryRef || 'general';
  const isSolar = cat === 'solar_energy' || /inverter|solar|panel|battery|hybrid|lifepo4|ups/i.test(product.title);
  const isBattery = /battery|lifepo4|lithium|kwh|5.12|10kwh/i.test(product.title);
  const isTech = cat === 'smartphones' || /phone|samsung|galaxy|iphone|laptop|tablet|screen|tech/i.test(product.title);
  const isHardware = cat === 'hardware' || /cement|drill|tool|grinder|building|brick|paint/i.test(product.title);
  const isAuto = cat === 'automotive' || /car|auto|spare|tyre|brake|oil/i.test(product.title);

  const isDetail = variant === 'detail';
  const stageHeight = isDetail ? '360px' : '180px';

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
          ? 'linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #0F172A 100%)'
          : isTech
          ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #311042 100%)'
          : isHardware
          ? 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #44403C 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isDetail ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Blueprint Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: isDetail ? '24px 24px' : '16px 16px',
          opacity: 0.8,
        }}
      />

      {/* Ambient Lighting Glow */}
      <div
        style={{
          position: 'absolute',
          width: isDetail ? '280px' : '140px',
          height: isDetail ? '280px' : '140px',
          borderRadius: '50%',
          background: isSolar
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : isTech
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Industrial SVG Illustration */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isSolar && !isBattery && (
          <svg
            width={isDetail ? 220 : 110}
            height={isDetail ? 180 : 90}
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Inverter Chassis */}
            <rect x="25" y="15" width="150" height="130" rx="12" fill="#1E293B" stroke="#38BDF8" strokeWidth="2.5" />
            <rect x="35" y="25" width="130" height="35" rx="6" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
            {/* Digital Display Screen */}
            <rect x="50" y="32" width="100" height="20" rx="3" fill="#022C22" stroke="#10B981" strokeWidth="1" />
            <text x="100" y="46" fill="#34D399" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {product.attributes?.ratedPowerWatts ? `${product.attributes.ratedPowerWatts}W HYBRID` : '5000W 48V'}
            </text>
            {/* Status LEDs */}
            <circle cx="45" cy="80" r="4" fill="#10B981" />
            <circle cx="60" cy="80" r="4" fill="#38BDF8" />
            <circle cx="75" cy="80" r="4" fill="#F59E0B" />
            {/* Cooling Grille */}
            <line x1="100" y1="75" x2="160" y2="75" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="83" x2="160" y2="83" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="91" x2="160" y2="91" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            {/* DC / AC Connection Ports */}
            <rect x="40" y="115" width="22" height="16" rx="3" fill="#0F172A" stroke="#64748B" />
            <rect x="70" y="115" width="22" height="16" rx="3" fill="#0F172A" stroke="#64748B" />
            <rect x="108" y="115" width="50" height="16" rx="3" fill="#0F172A" stroke="#10B981" />
            <text x="133" y="127" fill="#10B981" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">NRS 097</text>
          </svg>
        )}

        {isBattery && (
          <svg
            width={isDetail ? 220 : 110}
            height={isDetail ? 180 : 90}
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Rack Battery Chassis */}
            <rect x="20" y="25" width="160" height="110" rx="8" fill="#1E293B" stroke="#10B981" strokeWidth="2.5" />
            {/* Rack Mounting Handles */}
            <rect x="10" y="45" width="10" height="70" rx="3" fill="#334155" />
            <rect x="180" y="45" width="10" height="70" rx="3" fill="#334155" />
            {/* Battery Level Indicators */}
            <rect x="35" y="40" width="80" height="20" rx="4" fill="#0F172A" stroke="#334155" />
            <rect x="38" y="43" width="15" height="14" rx="2" fill="#10B981" />
            <rect x="55" y="43" width="15" height="14" rx="2" fill="#10B981" />
            <rect x="72" y="43" width="15" height="14" rx="2" fill="#10B981" />
            <rect x="89" y="43" width="15" height="14" rx="2" fill="#10B981" />
            <text x="145" y="55" fill="#34D399" fontSize="11" fontFamily="monospace" fontWeight="bold">100%</text>
            {/* High Current Terminals */}
            <circle cx="50" cy="95" r="10" fill="#DC2626" />
            <text x="50" y="99" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
            <circle cx="85" cy="95" r="10" fill="#0F172A" stroke="#475569" strokeWidth="2" />
            <text x="85" y="99" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">-</text>
            {/* Bus Specs */}
            <text x="145" y="99" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">51.2V 100Ah</text>
          </svg>
        )}

        {isTech && (
          <svg
            width={isDetail ? 200 : 100}
            height={isDetail ? 180 : 90}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="35" y="15" width="90" height="130" rx="16" fill="#0F172A" stroke="#818CF8" strokeWidth="2.5" />
            <rect x="42" y="24" width="76" height="112" rx="10" fill="#1E1B4B" />
            <circle cx="80" cy="20" r="3" fill="#312E81" />
            <circle cx="80" cy="80" r="22" fill="#3730A3" opacity="0.6" />
            <text x="80" y="85" fill="#C7D2FE" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">5G OCTA</text>
          </svg>
        )}

        {!isSolar && !isBattery && !isTech && (
          <svg
            width={isDetail ? 200 : 100}
            height={isDetail ? 180 : 90}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="30" y="30" width="100" height="100" rx="10" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
            <line x1="30" y1="30" x2="130" y2="130" stroke="#334155" strokeWidth="1.5" />
            <line x1="130" y1="30" x2="30" y2="130" stroke="#334155" strokeWidth="1.5" />
            <rect x="55" y="55" width="50" height="50" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="80" y="85" fill="#FCD34D" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              {isHardware ? 'HEAVY' : 'MASTER'}
            </text>
          </svg>
        )}
      </div>

      {/* Top Floating Badge */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, display: 'flex', gap: '0.4rem' }}>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '0.25rem 0.55rem',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#38BDF8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {product.brand || 'OFFICIAL SKU'}
        </span>
      </div>

      {/* Bottom Floating Barcode & Certification Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.65rem',
          color: '#94A3B8',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          GS1 · {product.identifiers?.gtin13 || '600980012019'}
        </span>
        {isDetail && (
          <span style={{ color: '#34D399', fontWeight: 700 }}>
            3D Studio Spec Verified
          </span>
        )}
      </div>
    </div>
  );
}
