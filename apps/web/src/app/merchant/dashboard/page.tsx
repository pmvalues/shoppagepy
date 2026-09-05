'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SA_FLAGSHIP_MERCHANTS } from '@shoppage/kernel';
import type { Merchant } from '@shoppage/contracts';
import OverviewModule from './modules/OverviewModule';
import OrdersModule from './modules/OrdersModule';
import CatalogModule from './modules/CatalogModule';
import FeedsModule from './modules/FeedsModule';
import ComplianceModule from './modules/ComplianceModule';

export default function MerchantDashboardPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('loc_sunpower_crownmines');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'catalog' | 'feeds' | 'compliance'>('overview');

  const merchant: Merchant =
    SA_FLAGSHIP_MERCHANTS.find((m) => m.id === selectedMerchantId) || SA_FLAGSHIP_MERCHANTS[0];

  const tabs = [
    { id: 'overview', label: 'Overview & Velocity', icon: '📊' },
    { id: 'orders', label: 'Proforma Orders Desk', icon: '📋' },
    { id: 'catalog', label: 'Master Catalog Matrix', icon: '📦' },
    { id: 'feeds', label: 'Google Shopping Feeds', icon: '🛍️' },
    { id: 'compliance', label: 'CIPC Trust & Compliance', icon: '🛡️' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex' }}>
      {/* Left Navigation Sidebar */}
      <aside
        style={{
          width: '260px',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid #1E293B',
        }}
      >
        {/* Brand Header */}
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #1E293B', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.02em', color: '#F8FAFC' }}>
                SHOPPAGE OS
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                Merchant Centre · South Africa
              </div>
            </div>
          </div>

          {/* Store Switcher Selector */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>
              Active Store Branch
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              style={{
                width: '100%',
                marginTop: '0.25rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1E293B',
                color: '#F8FAFC',
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

        {/* Tab Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#1E293B' : 'transparent',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            href="/search"
            style={{
              fontSize: '0.78rem',
              color: '#94A3B8',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>🔍 Back to National Search</span>
          </Link>
          <div style={{ fontSize: '0.68rem', color: '#475569' }}>
            Shoppage OS v9.1 Polyglot Baseline
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {activeTab === 'overview' && (
            <OverviewModule merchant={merchant} onNavigateTab={(tab) => setActiveTab(tab as any)} />
          )}
          {activeTab === 'orders' && <OrdersModule merchant={merchant} />}
          {activeTab === 'catalog' && <CatalogModule merchant={merchant} />}
          {activeTab === 'feeds' && <FeedsModule merchant={merchant} />}
          {activeTab === 'compliance' && <ComplianceModule merchant={merchant} />}
        </div>
      </main>
    </div>
  );
}
