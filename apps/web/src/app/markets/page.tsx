export const dynamic = 'force-dynamic';

import { SA_COMPREHENSIVE_MARKETS, SA_COMMUNITY_GROUPS_DATASET } from '@shoppage/kernel';
import MarketsExplorerView from '@/components/MarketsExplorerView';

export default async function MarketsExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; province?: string; q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const allMarkets = [...SA_COMPREHENSIVE_MARKETS, ...SA_COMMUNITY_GROUPS_DATASET];
  const physicalCount = allMarkets.filter((m) => !m.marketType.startsWith('virtual_')).length;
  const communityCount = allMarkets.filter((m) => m.marketType === 'virtual_community_group').length;
  const virtualExchangeCount = allMarkets.filter((m) => m.marketType.startsWith('virtual_') && m.marketType !== 'virtual_community_group').length;

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
          <span>🌐 NATIONAL COMMERCE GRAPH · {allMarkets.length.toLocaleString()} HUBS, GUILDS & COMMUNITY TRADING GROUPS</span>
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem', color: '#0F172A' }}>
          Physical Malls & Community Trading Groups
        </h1>
        <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: '740px', margin: '0 auto', lineHeight: 1.6 }}>
          Discover <strong>5,000+ local public buy/sell groups</strong>, regional contractor guilds, and wholesale commodity trading circles across South Africa.
        </p>
      </div>

      <MarketsExplorerView
        initialMarkets={allMarkets}
        initialType={resolvedSearchParams.type}
      />
    </div>
  );
}
