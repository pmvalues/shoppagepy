'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppageMerchantCentreService,
  GoogleBusinessProfileService,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';

export default function MerchantDashboardPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('loc_sunpower_crownmines');
  const [activeTab, setActiveTab] = useState<'discovered' | 'active_offers' | 'gmc' | 'trust' | 'gbp' | 'qr'>('discovered');
  const [copiedFeed, setCopiedFeed] = useState(false);

  // 1-Click Discovered Stock Confirmation State
  const [discoveredStock, setDiscoveredStock] = useState([
    {
      id: 'disc_deye_5kw',
      title: 'Deye 5kW Hybrid Inverter 48V (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      scrapedPrice: 18500,
      currentPrice: 18500,
      sourceUrl: 'https://sunpower.co.za/deye-5kw',
      status: 'pending', // pending | confirmed | rejected
      warranty: '5 Years',
      inStock: true,
    },
    {
      id: 'disc_dyness_5kwh',
      title: 'Dyness 5.12kWh Lithium Battery BX51100 48V',
      brand: 'Dyness',
      scrapedPrice: 16900,
      currentPrice: 16900,
      sourceUrl: 'https://sunpower.co.za/dyness-bx51100',
      status: 'pending',
      warranty: '10 Years',
      inStock: true,
    },
    {
      id: 'disc_tier1_550w',
      title: 'JA Solar 550W Mono PERC Half-Cell Panel',
      brand: 'JA Solar',
      scrapedPrice: 1750,
      currentPrice: 1750,
      sourceUrl: 'https://sunpower.co.za/ja-solar-550w',
      status: 'pending',
      warranty: '12 Years',
      inStock: true,
    },
  ]);

  const dashboard = ShoppageMerchantCentreService.getUnifiedDashboard(
    selectedMerchantId,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );
  const { merchant, overview, googleMerchantCenter, googleBusinessProfile, qrCodeUrl } = dashboard;

  const handleConfirmStock = (id: string) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'confirmed' } : item))
    );
  };

  const handleRejectStock = (id: string) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentPrice: newPrice } : item))
    );
  };

  const handleCopyFeedUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(googleMerchantCenter.feedUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2500);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-green">⚡ Shoppage Merchant OS</span>
            <span className="badge badge-blue">✓ Live Google Sync</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: 'var(--slate-900)' }}>
            {merchant.name}
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            📍 {merchant.addressText} · <span style={{ color: '#475569', fontWeight: 600 }}>{merchant.stallIdentifier || 'Main Concourse'}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: '#FFFFFF' }}
          >
            {SA_FLAGSHIP_MERCHANTS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Link href={`/m/${merchant.id}`} className="btn btn-primary btn-sm" target="_blank">
            👁️ View Public Store &nearr;
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'discovered', label: `📦 1-Click Discovered Stock (${discoveredStock.filter(s => s.status === 'pending').length} New)`, icon: '✨' },
          { id: 'active_offers', label: '⚡ Confirmed Live Offers', icon: '🛍️' },
          { id: 'trust', label: '🛡️ Trust & Verification', icon: '🏢' },
          { id: 'gmc', label: '🛒 Google Shopping XML Feed', icon: '📡' },
          { id: 'gbp', label: '⭐ Google Business & Reviews', icon: '💬' },
          { id: 'qr', label: '📱 Stall QR & Counter Kit', icon: '🖨️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.65rem 1.15rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#0F172A' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--slate-600)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 1-CLICK DISCOVERED STOCK CONFIRMATION */}
      {activeTab === 'discovered' && (
        <section className="card" style={{ padding: '2rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  Pre-Scraped Website Products (Ready for 1-Click Confirmation)
                </h2>
                <span className="badge badge-purple">AI Entity Sweeper</span>
              </div>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: 0 }}>
                Confirm your prices and in-stock status below. Once confirmed, your products go live instantly on the national search matrix and Google Shopping.
              </p>
            </div>

            <button
              onClick={() => setDiscoveredStock((prev) => prev.map((s) => ({ ...s, status: 'confirmed' })))}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontWeight: 800 }}
            >
              ✓ Confirm All Items (1-Click)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {discoveredStock.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  borderLeft: item.status === 'confirmed' ? '5px solid #10B981' : item.status === 'rejected' ? '5px solid #EF4444' : '5px solid #F59E0B',
                  opacity: item.status === 'rejected' ? 0.6 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-blue">{item.brand}</span>
                    {item.status === 'confirmed' ? (
                      <span className="badge badge-green">✓ Live & Confirmed</span>
                    ) : item.status === 'rejected' ? (
                      <span className="badge badge-red">✕ Discarded</span>
                    ) : (
                      <span className="badge badge-amber">⚡ Awaiting Confirmation</span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Source: {item.sourceUrl}</span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--slate-900)' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    Warranty: <strong>{item.warranty}</strong> · SABS / NRS 097 Certified
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Selling Price (ZAR):
                    </label>
                    <input
                      type="number"
                      value={item.currentPrice}
                      onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                      disabled={item.status === 'rejected'}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        border: '1.5px solid var(--border)',
                        width: '130px',
                        color: 'var(--slate-900)',
                      }}
                    />
                  </div>

                  {item.status !== 'confirmed' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleConfirmStock(item.id)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.55rem 1.15rem' }}
                      >
                        ✓ Confirm Stock
                      </button>
                      <button
                        onClick={() => handleRejectStock(item.id)}
                        className="btn btn-outline btn-sm"
                      >
                        ✕ Discard
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800 }}>✓ Live & Verified</span>
                      <button
                        onClick={() => setDiscoveredStock(prev => prev.map(s => s.id === item.id ? { ...s, status: 'pending' } : s))}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: ACTIVE OFFERS */}
      {activeTab === 'active_offers' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Confirmed Active Offers ({SA_CANONICAL_PRODUCTS.slice(0, 4).length})</h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>Products actively published to buyers searching in your province.</p>
            </div>
            <Link href="/merchant/claim" className="btn btn-primary btn-sm">
              + Add Custom SKU
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {SA_CANONICAL_PRODUCTS.slice(0, 4).map((p) => (
              <div key={p.canonicalId} className="card" style={{ background: '#F8FAFC' }}>
                <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>✓ Store Inquiries Connected</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0' }}>{p.title}</h4>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', margin: '0.5rem 0' }}>
                  R {(p.attributes?.estimatedPriceZar as number || 15000).toLocaleString()}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <Link href={`/p/${p.canonicalId}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    View Live Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRUST & VERIFICATION */}
      {activeTab === 'trust' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-green">Verified Merchant Profile</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>Merchant Trust Score & Badges</h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>
                Maintain responsive customer communication and accurate stock levels to earn top placement in national search results.
              </p>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-display)' }}>
              {overview.trustPassportScore} <small style={{ fontSize: '1rem', color: '#64748B' }}>/ 100</small>
            </div>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Storefront Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0' }}>Verified Stockist</div>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Active Verified</span>
            </div>

            <div className="card" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Catalog In-Stock Ratio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0' }}>100% Confirmed</div>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Live Catalog</span>
            </div>

            <div className="card" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Median Reply Time</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0' }}>~10 Minutes</div>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>⚡ Ultra Fast</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE MERCHANT CENTER */}
      {activeTab === 'gmc' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-blue">Automated XML/RSS Product Feed</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>
                Google Shopping & Local Inventory Ads Feed
              </h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>
                Plug this dynamic XML feed directly into your Google Merchant Center account. Updates auto-sync every 24 hours.
              </p>
            </div>

            <button onClick={handleCopyFeedUrl} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              {copiedFeed ? '✓ Feed URL Copied!' : '📋 Copy Dynamic Feed URL'}
            </button>
          </div>

          <div style={{ background: '#1E293B', color: '#F8FAFC', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', marginBottom: '1.5rem' }}>
            {googleMerchantCenter.feedUrl}
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE BUSINESS & REVIEWS */}
      {activeTab === 'gbp' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-green">Verified Google Business Profile</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>{googleBusinessProfile.businessName}</h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>★ {googleBusinessProfile.averageRating} ({googleBusinessProfile.totalReviewsCount} Google Reviews)</p>
            </div>
            <a href={googleBusinessProfile.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              📍 Open Google Maps &nearr;
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {googleBusinessProfile.recentReviews.map((rev: any) => (
              <div key={rev.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong>{rev.reviewerName}</strong>
                  <span style={{ color: '#F59E0B' }}>{'★'.repeat(rev.rating)}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', margin: '0 0 0.5rem 0' }}>&quot;{rev.reviewText}&quot;</p>
                {rev.replyText && (
                  <div style={{ background: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#047857', border: '1px solid #A7F3D0' }}>
                    <strong>Official Store Reply:</strong> {rev.replyText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: QR CODE KIT */}
      {activeTab === 'qr' && (
        <div className="card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>Stall QR Code & Print Poster</h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Scan to open your live online store & catalog.</p>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <img src={qrCodeUrl} alt="Store QR" style={{ width: 180, height: 180, borderRadius: 12, border: '1px solid var(--border)', padding: '0.5rem', background: '#FFF' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{merchant.name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>📍 {merchant.addressText}</p>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">🖨️ Print Store Poster (A4)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
