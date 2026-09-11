'use client';

import React, { useState } from 'react';
import { SA_FLAGSHIP_MERCHANTS } from '@shoppage/kernel';
import type { Merchant } from '@shoppage/contracts';
import AiStoreCrewModule from '../dashboard/modules/AiStoreCrewModule';

export default function MerchantAgentsStandalonePage() {
  const [selectedId, setSelectedId] = useState('loc_mitrend_midrand');
  const merchant: Merchant =
    SA_FLAGSHIP_MERCHANTS.find((m) => m.id === selectedId) || SA_FLAGSHIP_MERCHANTS[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-subtle)' }}>
      {/* Top Banner Store Selector Bar */}
      <div
        style={{
          background: 'var(--color-content)',
          color: 'var(--color-content-inverse)',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--color-info-ink-inverse)' }}>⚡ SHOPPAGE MERCHANT OS</span>
          <span style={{ color: 'var(--color-content-muted-inverse)' }}>|</span>
          <span style={{ color: 'var(--color-content-muted-inverse)' }}>Autonomous Store Crew Command</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-content-muted-inverse)', fontWeight: 600 }}>Active Merchant:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              background: 'var(--color-content)',
              color: 'var(--color-content-inverse)',
              border: '1px solid var(--color-content-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            {SA_FLAGSHIP_MERCHANTS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AiStoreCrewModule merchant={merchant} />
    </div>
  );
}
