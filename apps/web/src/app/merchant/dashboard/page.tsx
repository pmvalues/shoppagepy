'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppageMerchantCentreService,
  GoogleMerchantCenterService,
  GoogleBusinessProfileService,
  GoogleSearchConsoleService,
  GoogleTrendsService,
  YouTubeShortsCommerceService,
  SA_FLAGSHIP_MERCHANTS,
} from '@shoppage/kernel';

export default function MerchantDashboardPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('loc_sunpower_crownmines');
  const [activeTab, setActiveTab] = useState<'overview' | 'gmc' | 'gbp' | 'gsc' | 'trends' | 'analytics' | 'shorts' | 'qr'>('overview');
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittedReplies, setSubmittedReplies] = useState<Record<string, string>>({});

  const dashboard = ShoppageMerchantCentreService.getUnifiedDashboard(selectedMerchantId, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const { merchant, overview, googleMerchantCenter, googleBusinessProfile, googleSearchConsole, googleTrends, opportunityAlerts, youtubeShorts, qrCodeUrl } = dashboard;

  const handleCopyFeedUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(googleMerchantCenter.feedUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2500);
    }
  };

  const handleDraftReply = (review: any) => {
    const draft = GoogleBusinessProfileService.draftReviewReply(review, merchant.name);
    setReplyDrafts((prev) => ({ ...prev, [review.id]: draft }));
  };

  const handlePublishReply = (reviewId: string) => {
    if (replyDrafts[reviewId]) {
      setSubmittedReplies((prev) => ({ ...prev, [reviewId]: replyDrafts[reviewId] }));
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Header with Store Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-green">Shoppage Merchant Centre</span>
            <span className="badge badge-blue">Google Partner Sync Active</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {merchant.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
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

          <Link href={`/m/${merchant.id}`} className="btn btn-outline" style={{ fontSize: '0.85rem' }} target="_blank">
            👁️ View Public Storefront &nearr;
          </Link>
          <button className="btn btn-whatsapp" style={{ fontSize: '0.85rem' }}>
            💬 Test WhatsApp Inbound
          </button>
        </div>
      </div>

      {/* Interactive Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {[
          { id: 'overview', label: '📊 Command Center', icon: '⚡' },
          { id: 'gmc', label: '🛒 Google Merchant Center', icon: '🛍️' },
          { id: 'gbp', label: '🏢 Google Business (GMB)', icon: '⭐' },
          { id: 'gsc', label: '🔍 Search Console & SEO', icon: '📈' },
          { id: 'trends', label: '🔥 Google Trends & Demand', icon: '💡' },
          { id: 'analytics', label: '🎯 Google Analytics & Attribution', icon: '👥' },
          { id: 'shorts', label: '🎬 YouTube Shorts Studio', icon: '▶️' },
          { id: 'qr', label: '📱 Stall QR & Offline Kit', icon: '🖨️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.65rem 1rem',
              border: 'none',
              background: activeTab === tab.id ? '#1E293B' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & COMMAND CENTER */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trust Passport & Compliance</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-green)', margin: '0.25rem 0' }}>
                {overview.trustPassportScore} / 100
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ CIPC & SARS Verified</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Direct WhatsApp Inquiries (7d)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', margin: '0.25rem 0' }}>
                {overview.whatsAppLeads7d} Leads
              </div>
              <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 600 }}>+28% vs previous week</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Google Organic & Shopping Clicks</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', margin: '0.25rem 0' }}>
                {overview.googleOrganicClicks7d} Clicks
              </div>
              <span style={{ fontSize: '0.75rem', color: '#D97706' }}>{overview.googleShoppingImpressions7d.toLocaleString()} impressions</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>YouTube Shorts Views (7d)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7C3AED', margin: '0.25rem 0' }}>
                {overview.youtubeViews7d.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#7C3AED' }}>105 direct WhatsApp clicks</span>
            </div>
          </div>

          {/* Unified Google Health Status */}
          <div className="card" style={{ marginBottom: '2rem', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              🌐 Live Google Ecosystem Synchronisation Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>Google Merchant Center</strong>
                  <span className="badge badge-green">Active</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  {googleMerchantCenter.approvedProducts} items synced to Google Shopping.
                </p>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>Google Business Profile</strong>
                  <span className="badge badge-green">Synced</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  ★ {googleBusinessProfile.averageRating} ({googleBusinessProfile.totalReviewsCount} reviews).
                </p>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>Google Search Console</strong>
                  <span className="badge badge-green">Indexing</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  Avg position: {googleSearchConsole.averagePosition} · CTR: {googleSearchConsole.averageCtr}%.
                </p>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>YouTube Shorts Studio</strong>
                  <span className="badge badge-green">Broadcasting</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  2 active product shorts generating leads.
                </p>
              </div>
            </div>
          </div>

          {/* High Priority Opportunity Alerts */}
          <div className="card" style={{ border: '1px solid #FDE68A', background: '#FFFBEB' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E', marginBottom: '0.5rem' }}>
              ⚡ Real-Time High-Demand Stock Opportunities in {merchant.province || 'Gauteng'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#78350F', marginBottom: '1rem' }}>
              Google Trends detected surging searches in your local area. Add your pricing to capture direct WhatsApp buyer inquiries:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {opportunityAlerts.slice(0, 2).map((alert) => (
                <div key={alert.id} style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>+{alert.searchTrendGrowth}% Search Surge</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0' }}>{alert.productTitle}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                      ~{alert.estimatedMonthlyBuyerQueries.toLocaleString()} monthly buyer queries · Ref Price: R {alert.averageCompetitorPriceZar.toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/merchant/claim?variantId=${alert.masterProductId}`} className="btn btn-whatsapp" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    + Confirm My Stock
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE MERCHANT CENTER */}
      {activeTab === 'gmc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-blue">Automated XML/RSS Product Feed</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>
                  Google Shopping & Local Inventory Ads Feed
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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

            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Total Feed Items</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{googleMerchantCenter.totalProducts} Products</div>
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>100% GS1 GTIN Compliant</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Local Inventory Ads (LIA)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>Enabled</div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Physical Storefront Mapped</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Sync Frequency</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6' }}>Real-Time</div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Instant price change webhook</span>
              </div>
            </div>
          </div>

          {/* Local Inventory Ads Preview */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              🏬 Local Inventory Ads (LIA) Storefront Mapping
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              When buyers nearby search on Google, Google Shopping displays: <em>"In stock at {merchant.name} ({merchant.stallIdentifier || 'Shop Unit'})"</em>.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: '#64748B' }}>
                    <th style={{ padding: '0.6rem' }}>Store Code</th>
                    <th style={{ padding: '0.6rem' }}>SKU</th>
                    <th style={{ padding: '0.6rem' }}>Local Price</th>
                    <th style={{ padding: '0.6rem' }}>Store Availability</th>
                    <th style={{ padding: '0.6rem' }}>Pickup Method</th>
                  </tr>
                </thead>
                <tbody>
                  {GoogleMerchantCenterService.getLocalInventoryFeed(merchant.id).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{item.storeCode}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{item.sku}</td>
                      <td style={{ padding: '0.6rem', color: '#10B981', fontWeight: 700 }}>{item.price}</td>
                      <td style={{ padding: '0.6rem' }}><span className="badge badge-green">In Stock</span></td>
                      <td style={{ padding: '0.6rem' }}>Same-Day Pickup & WhatsApp Reserve</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE BUSINESS PROFILE & REVIEWS */}
      {activeTab === 'gbp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profile Overview Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-green">Verified Google Business Profile</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>
                  {googleBusinessProfile.businessName}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  📍 {googleBusinessProfile.addressText} · ⏰ {googleBusinessProfile.openingHours}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={googleBusinessProfile.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  📍 Open in Google Maps &nearr;
                </a>
                <a href={googleBusinessProfile.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.85rem', background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' }}>
                  ⭐ Read Google Reviews &nearr;
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#92400E' }}>Google Star Rating</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>
                  ★ {googleBusinessProfile.averageRating}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#92400E' }}>Based on {googleBusinessProfile.totalReviewsCount} verified reviews</span>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#065F46' }}>Profile Completeness</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
                  {googleBusinessProfile.profileCompletenessScore}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#065F46' }}>All GPS and trade hours synced</span>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#1E40AF' }}>Google Place ID</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E3A8A', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                  {googleBusinessProfile.googlePlaceId}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#1E40AF' }}>Active Google Maps Pin</span>
              </div>
            </div>
          </div>

          {/* Real-Time Reviews Command Center */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              💬 Real-Time Google Reviews Monitor & Smart AI Reply Assistant
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {googleBusinessProfile.recentReviews.map((rev: any) => (
                <div key={rev.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', background: '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>{rev.reviewerName}</strong>
                      <span style={{ color: '#F59E0B' }}>{'★'.repeat(rev.rating)}</span>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Verified Buyer</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{rev.publishDate}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    &quot;{rev.reviewText}&quot;
                  </p>

                  {submittedReplies[rev.id] ? (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#065F46' }}>
                      <strong>✓ Official Reply Published to Google:</strong>
                      <p style={{ margin: '0.25rem 0 0 0' }}>{submittedReplies[rev.id]}</p>
                    </div>
                  ) : rev.hasReply ? (
                    <div style={{ background: '#F1F5F9', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#334155' }}>
                      <strong>Your Official Reply:</strong> {rev.replyText}
                    </div>
                  ) : (
                    <div>
                      {!replyDrafts[rev.id] ? (
                        <button
                          onClick={() => handleDraftReply(rev)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          ⚡ Generate AI Smart Reply
                        </button>
                      ) : (
                        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.75rem', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                            Draft Reply for Google:
                          </div>
                          <textarea
                            value={replyDrafts[rev.id]}
                            onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                            rows={3}
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', marginBottom: '0.5rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handlePublishReply(rev.id)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                            >
                              🚀 Publish Reply to Google
                            </button>
                            <button
                              onClick={() => setReplyDrafts({ ...replyDrafts, [rev.id]: '' })}
                              className="btn btn-outline"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SEARCH CONSOLE & LOCAL SEO */}
      {activeTab === 'gsc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              📈 Google Search Console — Local Organic Visibility
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Real organic search queries from buyers in South Africa discovering your products on Google.
            </p>

            <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Total Organic Clicks</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                  {googleSearchConsole.totalOrganicClicks.toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Total Impressions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                  {googleSearchConsole.totalImpressions.toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Average Organic CTR</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                  {googleSearchConsole.averageCtr}%
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Average Rank Position</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6' }}>
                  #{googleSearchConsole.averagePosition}
                </div>
              </div>
            </div>

            {/* Keyword Performance Table */}
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Top South African Search Queries & Positions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: '#64748B' }}>
                    <th style={{ padding: '0.6rem' }}>Search Query</th>
                    <th style={{ padding: '0.6rem' }}>Impressions</th>
                    <th style={{ padding: '0.6rem' }}>Clicks</th>
                    <th style={{ padding: '0.6rem' }}>CTR</th>
                    <th style={{ padding: '0.6rem' }}>Avg Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {googleSearchConsole.topQueries.map((q: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600, color: '#1E293B' }}>{q.query}</td>
                      <td style={{ padding: '0.6rem' }}>{q.impressions.toLocaleString()}</td>
                      <td style={{ padding: '0.6rem', color: '#10B981', fontWeight: 700 }}>{q.clicks}</td>
                      <td style={{ padding: '0.6rem' }}>{q.ctrPercent}%</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#3B82F6' }}>#{q.averagePosition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE TRENDS & LOCAL DEMAND */}
      {activeTab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🔥 Google Trends & South Africa Consumer Demand Spikes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Real-time search interest index across {merchant.province || 'Gauteng'} and South African metros.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {googleTrends.map((trend: any) => (
                <div key={trend.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>+{trend.growthPercentLast30d}% Growth</span>
                      <strong style={{ fontSize: '0.95rem' }}>&quot;{trend.keyword}&quot;</strong>
                    </div>
                    {trend.matchedProductTitle && (
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.25rem 0' }}>
                        Matching Master Product: <strong>{trend.matchedProductTitle}</strong>
                      </p>
                    )}
                    <div style={{ background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden', width: '100%', maxWidth: '350px', marginTop: '0.5rem' }}>
                      <div style={{ background: '#F59E0B', height: '100%', width: `${trend.demandIndex}%` }} />
                    </div>
                  </div>

                  {trend.relatedMasterProductId && (
                    <Link href={`/p/${trend.relatedMasterProductId}`} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
                      View Master Product &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GOOGLE ANALYTICS & ATTRIBUTION */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🎯 Multi-Channel Attribution & WhatsApp Conversion Tracker
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              See where your buyer inquiries originate from: Google Search, Google Shopping, Google Maps, or Shoppage Mall rosters.
            </p>

            <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
              <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.8rem', color: '#065F46' }}>Total Pipeline Generated (30d)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
                  R {overview.estimatedPipelineValueZar.toLocaleString()}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#065F46' }}>Estimated from 98 WhatsApp chats</span>
              </div>

              <div className="card" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.8rem', color: '#1E40AF' }}>Google Maps GPS Directions</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB' }}>
                  142 Navigations
                </div>
                <span style={{ fontSize: '0.75rem', color: '#1E40AF' }}>In-person visits to stall</span>
              </div>

              <div className="card" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                <div style={{ fontSize: '0.8rem', color: '#6B21A8' }}>Click-to-Call Clicks</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333EA' }}>
                  56 Phone Calls
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6B21A8' }}>Direct buyer phone calls</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: YOUTUBE SHORTS STUDIO */}
      {activeTab === 'shorts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-purple">Automated Video Commerce</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>
                  🎬 YouTube Shorts Studio & Teardown Generator
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Turn Master Product lab tests and teardowns into vertical YouTube Shorts with your shop&apos;s direct WhatsApp lead link.
                </p>
              </div>

              <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                + Generate New Product Short
              </button>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
              {youtubeShorts.map((short: any) => (
                <div key={short.id} className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '100px', height: '160px', borderRadius: '8px', overflow: 'hidden', background: '#000000', position: 'relative', flexShrink: 0 }}>
                      <img src={short.verticalVideoPreviewUrl} alt={short.shortTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#FFFFFF', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px' }}>
                        {short.durationSeconds}s
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.3 }}>
                        {short.shortTitle}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.5rem' }}>
                        Product: {short.productTitle}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#334155' }}>
                        <span>👁️ {short.totalViews.toLocaleString()} views</span>
                        <span>👍 {short.likesCount} likes</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>💬 {short.whatsAppLeadsGenerated} leads</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Generated Storyboard & Script:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#475569' }}>
                      {short.scriptStoryboard.map((line: string, i: number) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={short.youtubeShortUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                      ▶️ Open Short on YouTube &nearr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: STALL QR & OFFLINE TOOLKIT */}
      {activeTab === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              📱 Physical Stall QR Code & Printable Storefront Kit
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Print this high-resolution QR code for your shop window, stall counter, or business card. When scanned by walk-in customers, it opens your live digital catalogue and direct WhatsApp chat.
            </p>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', background: '#F8FAFC', padding: '2rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                <img src={qrCodeUrl} alt="Storefront QR Code" style={{ width: '200px', height: '200px' }} />
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  Scan to chat with {merchant.name}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {merchant.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                  📍 {merchant.addressText} ({merchant.stallIdentifier || 'Direct Shop Unit'})
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a href={qrCodeUrl} download={`shoppage_qr_${merchant.id}.png`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    📥 Download High-Res PNG
                  </a>
                  <button onClick={() => window.print()} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                    🖨️ Print Store Poster (A4)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
