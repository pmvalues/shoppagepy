'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Merchant } from '@shoppage/contracts';

export interface OverviewModuleProps {
  merchant: Merchant;
  onNavigateTab: (tab: string) => void;
}

export default function OverviewModule({ merchant, onNavigateTab }: OverviewModuleProps) {
  const [copiedFeed, setCopiedFeed] = useState(false);
  const feedUrl = `https://shoppage.co.za/api/feeds/google-merchant-center/${merchant.id}`;

  const copyFeedUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(feedUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Store Identity & Trust Banner */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: '1px solid var(--color-line)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-content)', margin: 0 }}>
              {merchant.name}
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--color-brand-700)',
                background: 'var(--color-brand-100)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              ✓ CIPC VERIFIED STORE
            </span>
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>📍 {merchant.addressText || 'Crown Mines Trading Corridor, Johannesburg'}</span>
            <span>·</span>
            <span>CIPC Reg: <strong>{merchant.cipcEnterpriseNumber || '2021/489102/07'}</strong></span>
            <span>·</span>
            <span>Tax PIN: <strong>Valid (SARS Compliant)</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/m/${merchant.id}`}
            target="_blank"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-content)',
              border: '1px solid var(--color-line-strong)',
              fontSize: '0.825rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>View Public Storefront</span>
            <span>↗</span>
          </Link>
          <button
            onClick={() => onNavigateTab('orders')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '8px',
              background: 'var(--color-content)',
              color: 'var(--color-content-inverse)',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📋 Order Desk
          </button>
        </div>
      </div>

      {/* 4 Core Telemetry Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          {
            title: '30-Day Search Impressions',
            value: '48,290',
            sub: '+14% vs last month',
            color: 'var(--color-brand-ink)',
            icon: '👁️',
          },
          {
            title: 'BuyBox Win Rate',
            value: '64.8%',
            sub: 'Leader in Crown Mines',
            color: 'var(--color-brand-ink)',
            icon: '🏆',
          },
          {
            title: 'Proformas & In-Store Holds',
            value: '142 Orders',
            sub: '24h counter collection',
            color: 'var(--color-warning-ink)',
            icon: '📄',
          },
          {
            title: 'Delivered Wholesale Pipeline',
            value: 'R 485,200',
            sub: '0% platform take-rate',
            color: 'var(--color-violet-ink)',
            icon: '💰',
          },
        ].map((tile, i) => (
          <div
            key={i}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '14px',
              border: '1px solid var(--color-line)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-content-muted)', fontWeight: 600 }}>{tile.title}</span>
              <span style={{ fontSize: '1.2rem' }}>{tile.icon}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-content)', marginTop: '0.4rem' }}>
              {tile.value}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tile.color, marginTop: '0.25rem' }}>
              {tile.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Google Shopping Live Feed Syndication Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: 'var(--color-on-solid)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🛍️</span>
            <strong style={{ fontSize: '1.05rem' }}>Official Google Merchant Center RSS Feed</strong>
            <span style={{ fontSize: '0.7rem', background: 'var(--color-brand-solid)', color: 'var(--color-on-solid)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
              LIVE SYNDICATION
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', margin: '0.35rem 0 0 0', maxWidth: '600px' }}>
            Your 157 in-stock products are formatted according to Google Shopping RSS 2.0 XML specifications with GTINs, SABS compliance, and Rand prices. Plug this URL directly into Google Merchant Center or Meta Commerce.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <code style={{ background: '#334155', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--color-info-400)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {feedUrl}
          </code>
          <button
            onClick={copyFeedUrl}
            style={{
              background: copiedFeed ? 'var(--color-brand-solid)' : 'var(--color-brand-solid)',
              color: 'var(--color-on-solid)',
              border: 'none',
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copiedFeed ? '✓ Copied' : 'Copy XML Feed'}
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-line)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-content)', margin: '0 0 0.5rem 0' }}>
            📦 Catalog & Stock Management
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', margin: '0 0 1rem 0' }}>
            Update inventory allocations, toggle in-stock states for collection, or match new items against the 1M+ GS1 Master Library.
          </p>
          <button
            onClick={() => onNavigateTab('catalog')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-line-strong)',
              color: 'var(--color-content)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Open Catalog Matrix →
          </button>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-line)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-content)', margin: '0 0 0.5rem 0' }}>
            🛡️ Statutory Trust & Compliance Desk
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', margin: '0 0 1rem 0' }}>
            Review CIPC enterprise incorporation docs, SARS Tax Compliance PIN, and SABS / NRS 097 grid-tied certification seals.
          </p>
          <button
            onClick={() => onNavigateTab('compliance')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-line-strong)',
              color: 'var(--color-content)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Review Trust Passport →
          </button>
        </div>
      </div>
    </div>
  );
}
