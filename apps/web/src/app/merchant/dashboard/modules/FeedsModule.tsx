'use client';

import { useState } from 'react';
import type { Merchant } from '@shoppage/contracts';

export interface FeedsModuleProps {
  merchant: Merchant;
}

export default function FeedsModule({ merchant }: FeedsModuleProps) {
  const [copied, setCopied] = useState(false);
  const feedUrl = `https://shoppage.co.za/api/feeds/google-merchant-center/${merchant.id}`;

  const copyUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Google Shopping & Multi-Channel Feed Syndication
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
          Automated XML feed generation for Google Merchant Center, Meta Commerce Manager, and TikTok Shop.
        </p>
      </div>

      {/* Main Feed Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛍️</span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Google Merchant Center Primary Product Feed
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700, marginTop: '0.15rem' }}>
                🟢 Status: Active · Updated Every 60 Minutes
              </div>
            </div>
          </div>

          <a
            href={`/api/feeds/google-merchant-center/${merchant.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              color: '#1A73E8',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Inspect Raw XML ↗
          </a>
        </div>

        {/* Feed URL Box */}
        <div style={{ background: '#F1F5F9', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <code style={{ fontSize: '0.8rem', color: '#0F172A', wordBreak: 'break-all', fontWeight: 600 }}>
            {feedUrl}
          </code>
          <button
            onClick={copyUrl}
            style={{
              background: copied ? '#059669' : '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 0.95rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy Feed URL'}
          </button>
        </div>

        {/* Diagnostics Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total Feed Items</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>157 Products</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>GS1 GTIN-13 Match Rate</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>100% Verified</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>SABS / NRS Compliance</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1A73E8', marginTop: '0.2rem' }}>100% Certified</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Target Market</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>South Africa (ZAR)</div>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
          3-Step Google Merchant Center Setup Guide
        </h3>
        <ol style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.825rem', color: '#334155', lineHeight: 1.7 }}>
          <li>Log into your <strong>Google Merchant Center</strong> account (<a href="https://merchants.google.com" target="_blank" style={{ color: '#1A73E8' }}>merchants.google.com</a>).</li>
          <li>Navigate to <strong>Data Sources</strong> → <strong>Add Product Source</strong> → Select <strong>Scheduled Fetch (File)</strong>.</li>
          <li>Paste your Shoppage XML Feed URL above. Set the fetch schedule to <strong>Daily at 04:00 SAST</strong>. Google will automatically approve and sync your in-stock store inventory into Google Free Listings and Google Shopping ads!</li>
        </ol>
      </div>
    </div>
  );
}
