'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Market } from '@shoppage/contracts';

export default function MarketsExplorerView({
  initialMarkets,
  initialType,
}: {
  initialMarkets: Market[];
  initialType?: string;
}) {
  const [activeType, setActiveType] = useState<string>(initialType || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedMarkets, setFollowedMarkets] = useState<Record<string, boolean>>({
    vmkt_renewable_energy: true,
    vmkt_packaging_hospitality: true,
  });

  const toggleFollow = (marketId: string) => {
    setFollowedMarkets((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  };

  const filteredMarkets = initialMarkets.filter((m) => {
    if (activeType !== 'all') {
      if (activeType === 'physical' && m.marketType.startsWith('virtual_')) return false;
      if (activeType === 'virtual' && !m.marketType.startsWith('virtual_')) return false;
      if (activeType === 'wholesale' && m.marketType !== 'wholesale_market') return false;
      if (activeType === 'malls' && m.marketType !== 'formal_mega_mall') return false;
      if (activeType === 'informal' && m.marketType !== 'informal_transport_rank' && m.marketType !== 'township_commercial_cluster') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.metro.toLowerCase().includes(q) ||
        m.province.toLowerCase().includes(q) ||
        (m.geo?.streetAddress && m.geo.streetAddress.toLowerCase().includes(q)) ||
        (m.virtualMeta?.operationalModel && m.virtualMeta.operationalModel.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const physicalCount = initialMarkets.filter((m) => !m.marketType.startsWith('virtual_')).length;
  const virtualCount = initialMarkets.filter((m) => m.marketType.startsWith('virtual_')).length;

  return (
    <div>
      {/* Search Input Bar */}
      <div style={{ maxWidth: '640px', margin: '0 auto 2rem auto' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by market name, city, province, or industry focus..."
          className="form-input"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1.5px solid #CBD5E1',
          }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {[
          { id: 'all', label: `All Hubs (${initialMarkets.length})` },
          { id: 'virtual', label: `🌐 Virtual B2B Exchanges (${virtualCount})` },
          { id: 'wholesale', label: '📦 Wholesale Import Hubs' },
          { id: 'malls', label: '🏢 Formal Mega-Malls' },
          { id: 'informal', label: '🚐 Transport Ranks & Townships' },
        ].map((tab) => {
          const isSelected = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '9999px', fontSize: '0.85rem', padding: '0.45rem 1rem', cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Markets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {filteredMarkets.map((market) => {
          const isVirtual = market.marketType.startsWith('virtual_');
          const isFollowing = Boolean(followedMarkets[market.id]);
          const merchantCount = market.activeMerchantsCount || market.stallCapacity || 100;
          const followerBase = Math.round(merchantCount * 4.5);

          return (
            <div
              key={market.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                padding: '1.5rem',
                border: isVirtual ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                background: isVirtual ? 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)' : '#FFFFFF',
                boxShadow: isVirtual ? '0 4px 12px rgba(37, 99, 235, 0.06)' : 'none',
              }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`badge ${isVirtual ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>
                    {market.marketType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {market.province}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3, color: '#0F172A' }}>
                  <Link href={`/market/${market.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {market.name}
                  </Link>
                </h3>

                {/* Description */}
                {market.geo && (
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    📍 {market.geo.streetAddress}
                  </p>
                )}

                {market.virtualMeta && (
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    🌐 {market.virtualMeta.operationalModel}
                  </p>
                )}

                {/* Sub-Zones (Markets-in-Markets) */}
                {market.zones && market.zones.length > 0 && (
                  <div style={{ marginTop: '0.75rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      🏢 Markets within Market ({market.zones.length} Sub-Zones)
                    </div>
                    <ul style={{ fontSize: '0.78rem', color: '#334155', paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {market.zones.map((zone) => (
                        <li key={zone.id}>
                          <strong>{zone.name}</strong> {zone.stallCount ? `(${zone.stallCount} stalls)` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons & Follow Controls */}
              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginBottom: '0.85rem' }}>
                  <span><strong>{merchantCount.toLocaleString()}</strong> Verified Stores</span>
                  <span><strong>{(followerBase + (isFollowing ? 1 : 0)).toLocaleString()}</strong> Buyers Following</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleFollow(market.id)}
                    className="btn btn-sm"
                    style={{
                      borderRadius: '8px',
                      fontWeight: 700,
                      background: isFollowing ? '#ECFDF5' : '#FFFFFF',
                      color: isFollowing ? '#059669' : '#0F172A',
                      border: isFollowing ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                    }}
                  >
                    {isFollowing ? '✓ Following' : '+ Follow Floor'}
                  </button>

                  <Link
                    href={`/merchant/claim?marketId=${market.id}&marketName=${encodeURIComponent(market.name)}`}
                    className="btn btn-primary btn-sm"
                    style={{ borderRadius: '8px', fontWeight: 800, textAlign: 'center', justifyContent: 'center' }}
                  >
                    + Join Floor
                  </Link>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <Link
                    href={`/market/${market.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center', borderRadius: '8px', fontSize: '0.78rem' }}
                  >
                    Explore Full Directory &rarr;
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
