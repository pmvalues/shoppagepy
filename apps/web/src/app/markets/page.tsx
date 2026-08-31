export const dynamic = 'force-dynamic';

import { SA_COMPREHENSIVE_MARKETS } from '@shoppage/kernel';
import MarketsExplorerView from '@/components/MarketsExplorerView';

export default function MarketsExplorerPage({
  searchParams,
}: {
  searchParams: { type?: string; province?: string; q?: string };
}) {
  const physicalCount = SA_COMPREHENSIVE_MARKETS.filter((m) => !m.marketType.startsWith('virtual_')).length;
  const virtualCount = SA_COMPREHENSIVE_MARKETS.filter((m) => m.marketType.startsWith('virtual_')).length;

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#1E40AF',
            marginBottom: '1rem',
          }}
        >
          <span>🌐 NATIONAL COMMERCE GRAPH · {physicalCount} PHYSICAL HUBS & {virtualCount} VIRTUAL TRADING EXCHANGES</span>
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem', color: '#0F172A' }}>
          Physical & Virtual Trading Floors
        </h1>
        <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
          Join high-volume industry guilds, follow live wholesale catalog drops, and discover verified physical suppliers across South Africa.
        </p>
      </div>

      <MarketsExplorerView
        initialMarkets={SA_COMPREHENSIVE_MARKETS}
        initialType={searchParams.type}
      />
    </div>
  );
}
