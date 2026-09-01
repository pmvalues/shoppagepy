'use client';

import { useState, useMemo } from 'react';
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
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [followedMarkets, setFollowedMarkets] = useState<Record<string, boolean>>({
    vmkt_renewable_energy: true,
    vmkt_packaging_hospitality: true,
    vmkt_grp_00001: true,
    vmkt_grp_00002: true,
  });

  const toggleFollow = (marketId: string) => {
    setFollowedMarkets((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  };

  const filteredMarkets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialMarkets.filter((m) => {
      // Type Filter
      if (activeType !== 'all') {
        if (activeType === 'community' && m.marketType !== 'virtual_community_group') return false;
        if (activeType === 'virtual' && (m.marketType === 'virtual_community_group' || !m.marketType.startsWith('virtual_'))) return false;
        if (activeType === 'wholesale' && m.marketType !== 'wholesale_market') return false;
        if (activeType === 'malls' && m.marketType !== 'formal_mega_mall') return false;
        if (activeType === 'informal' && m.marketType !== 'informal_transport_rank' && m.marketType !== 'township_commercial_cluster') return false;
      }

      // Province Filter
      if (selectedProvince !== 'all' && m.province !== selectedProvince) {
        return false;
      }

      // Search Query
      if (q) {
        return (
          m.name.toLowerCase().includes(q) ||
          m.metro.toLowerCase().includes(q) ||
          m.province.toLowerCase().includes(q) ||
          (m.geo?.streetAddress && m.geo.streetAddress.toLowerCase().includes(q)) ||
          (m.virtualMeta?.operationalModel && m.virtualMeta.operationalModel.toLowerCase().includes(q)) ||
          (m.communityGroupMeta?.cityOrTown && m.communityGroupMeta.cityOrTown.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [initialMarkets, activeType, selectedProvince, searchQuery]);

  const totalPages = Math.ceil(filteredMarkets.length / pageSize);
  const paginatedMarkets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMarkets.slice(start, start + pageSize);
  }, [filteredMarkets, page, pageSize]);

  const communityCount = useMemo(() => initialMarkets.filter((m) => m.marketType === 'virtual_community_group').length, [initialMarkets]);
  const virtualExchangeCount = useMemo(() => initialMarkets.filter((m) => m.marketType.startsWith('virtual_') && m.marketType !== 'virtual_community_group').length, [initialMarkets]);
  const physicalCount = useMemo(() => initialMarkets.filter((m) => !m.marketType.startsWith('virtual_')).length, [initialMarkets]);

  const provinces = ['All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];

  return (
    <div>
      {/* Search & Province Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '820px', margin: '0 auto 2rem auto', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search 5,000+ groups, towns (e.g. Sandton, Centurion, Umhlanga), or sectors (Solar, Hardware)..."
          className="form-input"
          style={{
            flex: 1,
            minWidth: '280px',
            padding: '0.85rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.95rem',
            border: '1.5px solid #CBD5E1',
          }}
        />

        <select
          value={selectedProvince}
          onChange={(e) => {
            setSelectedProvince(e.target.value === 'All Provinces' ? 'all' : e.target.value);
            setPage(1);
          }}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '9999px',
            border: '1.5px solid #CBD5E1',
            background: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: '#0F172A',
            cursor: 'pointer',
          }}
        >
          {provinces.map((p) => (
            <option key={p} value={p === 'All Provinces' ? 'all' : p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {[
          { id: 'all', label: `All Hubs & Groups (${initialMarkets.length.toLocaleString()})` },
          { id: 'community', label: `👥 Community Trading Groups (${communityCount.toLocaleString()})` },
          { id: 'virtual', label: `🌐 Virtual B2B Exchanges (${virtualExchangeCount})` },
          { id: 'wholesale', label: '📦 Wholesale Import Hubs' },
          { id: 'malls', label: `🏢 Mega-Malls (${physicalCount})` },
          { id: 'informal', label: '🚐 Transport Ranks & Townships' },
        ].map((tab) => {
          const isSelected = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveType(tab.id);
                setPage(1);
              }}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '9999px', fontSize: '0.825rem', padding: '0.45rem 1rem', cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Showing Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', color: '#64748B', fontSize: '0.85rem' }}>
        <span>Showing <strong>{filteredMarkets.length.toLocaleString()}</strong> active trading markets (Page {page} of {totalPages || 1})</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Search Filter
          </button>
        )}
      </div>

      {/* Markets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {paginatedMarkets.map((market) => {
          const isCommunityGroup = market.marketType === 'virtual_community_group';
          const isVirtual = market.marketType.startsWith('virtual_');
          const isFollowing = Boolean(followedMarkets[market.id]);
          const memberCount = market.communityGroupMeta?.memberCount || market.stallCapacity || 15000;
          const dailyPosts = market.communityGroupMeta?.dailyPostVolume || 80;

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
                border: isCommunityGroup ? '1.5px solid #C7D2FE' : isVirtual ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                background: isCommunityGroup ? 'linear-gradient(180deg, #FFFFFF 0%, #EEF2FF 100%)' : isVirtual ? 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)' : '#FFFFFF',
              }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`badge ${isCommunityGroup ? 'badge-purple' : isVirtual ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                    {isCommunityGroup ? '👥 COMMUNITY TRADING GROUP' : market.marketType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {market.province}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3, color: '#0F172A' }}>
                  <Link href={`/market/${market.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {market.name}
                  </Link>
                </h3>

                {/* Community Metrics Pills */}
                {isCommunityGroup && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                      👥 {memberCount.toLocaleString()} Members
                    </span>
                    <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                      🔥 {dailyPosts} Trades/Day
                    </span>
                  </div>
                )}

                {/* Description / Location */}
                {market.geo && (
                  <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    📍 {market.geo.streetAddress}
                  </p>
                )}

                {market.virtualMeta && (
                  <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    🌐 {market.virtualMeta.operationalModel}
                  </p>
                )}
              </div>

              {/* Action Buttons & Follow Controls */}
              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
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
                    {isFollowing ? '✓ Following' : '+ Follow Group'}
                  </button>

                  <Link
                    href={`/requests?marketId=${market.id}&marketTitle=${encodeURIComponent(market.name)}`}
                    className="btn btn-primary btn-sm"
                    style={{ borderRadius: '8px', fontWeight: 800, textAlign: 'center', justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    + Post RFQ / Stock
                  </Link>
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                  <Link
                    href={`/market/${market.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', fontSize: '0.78rem' }}
                  >
                    Trading Floor &rarr;
                  </Link>

                  {market.communityGroupMeta?.externalCommunityUrl && (
                    <a
                      href={market.communityGroupMeta.externalCommunityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{
                        background: '#1877F2',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.65rem',
                        textDecoration: 'none',
                      }}
                      title="Visit Public Group / Community Link"
                    >
                      📘 FB
                    </a>
                  )}

                  <a
                    href={`https://twitter.com/search?q=${encodeURIComponent(market.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{
                      background: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.55rem',
                      textDecoration: 'none',
                    }}
                    title="View Twitter / X Live Stream"
                  >
                    𝕏
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '4rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '8px', fontWeight: 700, opacity: page === 1 ? 0.5 : 1 }}
          >
            &larr; Previous Page
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700, padding: '0 0.5rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '8px', fontWeight: 700, opacity: page === totalPages ? 0.5 : 1 }}
          >
            Next Page &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
