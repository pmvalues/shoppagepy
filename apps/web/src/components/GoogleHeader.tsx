'use client';

import Link from 'next/link';

export default function GoogleHeader({ currentQuery = '', currentTab = 'all' }: { currentQuery?: string; currentTab?: string }) {
  const tabs = [
    { id: 'all', label: 'All Results', icon: '🔍' },
    { id: 'shopping', label: 'Shopping & Deals', icon: '🛍️' },
    { id: 'stores', label: 'Nearby Malls & Stores', icon: '📍' },
    { id: 'markets', label: 'Local Markets', icon: '🌐' },
    { id: 'za_spec', label: 'SABS Certified', icon: '🇿🇦' },
    { id: 'shorts', label: 'Video Demos', icon: '🎬' },
    { id: 'rfq', label: 'Quotes & Invoices', icon: '📋' },
  ];

  return (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', paddingTop: '0.65rem' }}>
      <div className="container">
        {/* Location Sub-Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#5F6368', paddingBottom: '0.5rem' }}>
          <span>📍</span>
          <strong>President Park AH, Midrand</strong>
          <span>·</span>
          <Link href="/malls?province=Gauteng" style={{ color: '#1A0DAB', textDecoration: 'none' }}>
            Choose area
          </Link>
          <span>⋮</span>
        </div>

        {/* Search Mode Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/search?${currentQuery ? `q=${encodeURIComponent(currentQuery)}&` : ''}tab=${tab.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.25rem',
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
