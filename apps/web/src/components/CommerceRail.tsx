import Link from 'next/link';
import { getPlatformStats, getTrending } from '@/lib/feed';

function compactStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function CommerceRail() {
  const stats = getPlatformStats();
  const trending = getTrending(6);

  return (
    <>
      <div className="aside-card">
        <div className="aside-head">
          <span className="aside-title">Live price watch</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            <span className="live-dot" />
            NOW
          </span>
        </div>
        <div className="aside-body">
          {trending.length === 0 ? (
            <div style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No multi-seller price movements yet.
            </div>
          ) : (
            trending.map((t, i) => (
              <Link key={t.id} href={t.href} className="trend-row">
                <span className="trend-rank">{i + 1}</span>
                <span className="trend-main">
                  <span className="trend-name">{t.name}</span>
                  <span className="trend-meta">{t.meta}</span>
                </span>
                <span
                  className={`trend-delta ${t.direction === 'down' ? 'is-down' : 'is-up'}`}
                >
                  {t.delta}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="aside-card">
        <div className="aside-head">
          <span className="aside-title">The grid</span>
        </div>
        <div className="stat-strip">
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.products)}+</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.merchants)}+</div>
            <div className="stat-label">Merchants</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">{compactStat(stats.markets)}+</div>
            <div className="stat-label">Malls</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value">0%</div>
            <div className="stat-label">Take rate</div>
          </div>
        </div>
      </div>

      <div className="aside-card" style={{ padding: '1.1rem' }}>
        <div className="aside-title" style={{ marginBottom: '0.4rem' }}>
          Sell on the grid
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.9rem' }}>
          List your store free. Keep 100% of every sale — Shoppage takes no commission on trade.
        </p>
        <Link href="/merchant/claim" className="btn btn-signal btn-block">
          Claim my store
        </Link>
      </div>
    </>
  );
}
