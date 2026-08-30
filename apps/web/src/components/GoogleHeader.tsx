'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleHeader({ currentQuery = '', currentTab = 'all' }: { currentQuery?: string; currentTab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}&tab=${currentTab}`);
  };

  const clearQuery = () => {
    setQuery('');
  };

  const tabs = [
    { id: 'all', label: 'All', icon: '🔍' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'stores', label: 'Nearby Stores', icon: '📍' },
    { id: 'za_spec', label: 'South African Spec', icon: '🇿🇦' },
    { id: 'shorts', label: 'Proof Shorts', icon: '🎬' },
    { id: 'rfq', label: 'Buyer RFQs', icon: '📋' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'images', label: 'Images', icon: '🖼️' },
  ];

  return (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
      <div className="container">
        {/* Top Search Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {/* Google / Shoppage Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#4285F4', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>S</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#EA4335', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>h</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FBBC05', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>o</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#4285F4', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>p</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#34A853', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>p</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#EA4335', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>a</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FBBC05', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>g</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#4285F4', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>e</span>
          </Link>

          {/* Omnibox Search Input */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '760px', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                borderRadius: '28px',
                border: '1px solid #DFE1E5',
                boxShadow: '0 2px 8px rgba(32, 33, 36, 0.22)',
                padding: '0.65rem 1.35rem',
                gap: '0.75rem',
                transition: 'box-shadow 0.2s',
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, solar, hardware, malls, or stores in South Africa..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.05rem',
                  color: 'var(--slate-900)',
                  background: 'transparent',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.1rem',
                    color: '#70757A',
                    cursor: 'pointer',
                    padding: '0 0.25rem',
                  }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <span style={{ width: '1px', height: '20px', background: '#DFE1E5' }}></span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#4285F4' }}
                title="Voice Search"
              >
                🎙️
              </button>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#4285F4' }}
                title="Google Lens / Product Visual Search"
              >
                📷
              </button>
              <button
                type="submit"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#4285F4' }}
                title="Search"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Quick Header Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <Link href="/merchant/dashboard" className="btn btn-outline btn-sm">
              Merchant OS
            </Link>
            <Link href="/requests" className="btn btn-primary btn-sm">
              + Post RFQ
            </Link>
          </div>
        </div>

        {/* Location Sub-Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#5F6368', paddingBottom: '0.75rem' }}>
          <span>📍</span>
          <strong>President Park AH, Midrand</strong>
          <span>·</span>
          <Link href="/malls?province=Gauteng" style={{ color: '#1A0DAB', textDecoration: 'none' }}>
            Choose area
          </Link>
          <span>⋮</span>
        </div>

        {/* Search Mode Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap', borderTop: '1px solid #F1F5F9' }}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/search?${query ? `q=${encodeURIComponent(query)}&` : ''}tab=${tab.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#1A73E8' : '#5F6368',
                  borderBottom: isActive ? '3px solid #1A73E8' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
