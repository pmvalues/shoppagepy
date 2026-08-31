'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_MERCHANTS,
  CommunityGroupAutoPosterService,
} from '@shoppage/kernel';

interface TimelineItem {
  id: string;
  source: 'facebook_group' | 'twitter_x' | 'shoppage_catalog' | 'buyer_rfq' | 'video_short';
  sourceLabel: string;
  sourceIcon: string;
  sourceUrl?: string;
  authorName: string;
  authorHandle: string;
  authorLocation: string;
  isVerifiedMerchant: boolean;
  timestamp: string;
  text: string;
  hashtags: string[];
  productTitle?: string;
  productSku?: string;
  priceZar?: number;
  regularPriceZar?: number;
  stockStatus?: string;
  likesCount: number;
  repostsCount: number;
  replyCount: number;
  contactPhone?: string;
  mediaImage?: string;
  isVideo?: boolean;
  videoDuration?: string;
}

const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: 'time_001',
    source: 'video_short',
    sourceLabel: 'SunPower Crown Mines · Official Video Proof',
    sourceIcon: '🎬',
    authorName: 'SunPower Solutions',
    authorHandle: '@SunPowerCrownMines',
    authorLocation: 'Crown Mines Wholesale Hub, JHB',
    isVerifiedMerchant: true,
    timestamp: '1m ago',
    text: '⚡ FLASH TRADE DROP: Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU) pallet clearance for Gauteng contractors. Full NRS 097-2-1 grid compliance & 5-year factory warranty. Immediate counter pickup or same-day delivery.',
    hashtags: ['#SolarSA', '#LoadSheddingDeals', '#DeyeInverter', '#ShoppageTime'],
    productTitle: 'Deye 5kW Hybrid Inverter 48V',
    productSku: 'DEYE-5K-SG03',
    priceZar: 14850,
    regularPriceZar: 18500,
    stockStatus: 'In Stock (14 Units)',
    likesCount: 54,
    repostsCount: 22,
    replyCount: 9,
    contactPhone: '+27 11 884 1234',
    mediaImage: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
    isVideo: true,
    videoDuration: '0:48',
  },
  {
    id: 'time_002',
    source: 'facebook_group',
    sourceLabel: 'via Sandton & Bryanston Buy, Sell & Direct Trade (142k Members)',
    sourceIcon: '📘',
    sourceUrl: 'https://www.facebook.com/groups/sandton.bryanston.buysell',
    authorName: 'David Van Der Merwe',
    authorHandle: '@DavidInstallSA',
    authorLocation: 'Sandton & Randburg',
    isVerifiedMerchant: true,
    timestamp: '4m ago',
    text: 'Clearing 12x Dyness 5.12kWh LiFePO4 Lithium Batteries from a commercial project over-order. Brand new in sealed crates. Invoicing available.',
    hashtags: ['#SandtonDeals', '#BatteryStorage', '#Dyness', '#SolarInstallers'],
    productTitle: 'Dyness 5.12kWh Lithium Battery BX51100',
    productSku: 'DYN-5.12KWH-BX',
    priceZar: 16900,
    regularPriceZar: 19500,
    stockStatus: '12 Crates Left',
    likesCount: 39,
    repostsCount: 16,
    replyCount: 12,
    contactPhone: '+27 82 555 4321',
    mediaImage: 'https://images.unsplash.com/photo-1558441719-8b489c6340c0?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'time_003',
    source: 'twitter_x',
    sourceLabel: 'via 𝕏 Twitter Trade Feed (@MitrendPackaging)',
    sourceIcon: '𝕏',
    sourceUrl: 'https://twitter.com/MitrendPackaging',
    authorName: 'Mitrend Products (Pty) Ltd',
    authorHandle: '@MitrendPackaging',
    authorLocation: 'Midrand Factory Concourse, Gauteng',
    isVerifiedMerchant: true,
    timestamp: '9m ago',
    text: '📦 High-demand restock alert: 500ml Tamper-Evident Food Tubs with Snap Lids (Box of 250) ready for commercial caterers and takeaway kitchens. Food-grade polypropylene certified.',
    hashtags: ['#PackagingSA', '#FoodGrade', '#WholesaleContainers', '#HospitalitySA'],
    productTitle: '500ml Tamper-Evident Clear Food Tubs (Box of 250)',
    productSku: 'MIT-TUB-500ML',
    priceZar: 185,
    regularPriceZar: 230,
    stockStatus: 'Bulk Stock Ready',
    likesCount: 88,
    repostsCount: 31,
    replyCount: 14,
    contactPhone: '+27 11 314 0000',
    mediaImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'time_004',
    source: 'buyer_rfq',
    sourceLabel: 'Contractor RFQ Broadcast · Western Cape Network',
    sourceIcon: '📋',
    authorName: 'Cape Peninsula Solar Contractors Guild',
    authorHandle: '@CPSolarGuild',
    authorLocation: 'Tygerberg & Cape Town Northern Suburbs',
    isVerifiedMerchant: false,
    timestamp: '16m ago',
    text: '🚨 URGENT RFQ: Seeking stockist with 80x 550W Mono PERC Solar Panels in Cape Town / Paarden Eiland for immediate Monday collection. Cash on collection or instant EFT.',
    hashtags: ['#CapeTownSolar', '#B2BRFQ', '#SolarPanels', '#UrgentSourcing'],
    productTitle: '550W Tier-1 Mono PERC Solar Panels (Qty 80)',
    productSku: 'JA-550W-MONO',
    priceZar: 1750,
    stockStatus: 'Buyer Seeking Stock',
    likesCount: 27,
    repostsCount: 14,
    replyCount: 21,
    mediaImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'time_005',
    source: 'video_short',
    sourceLabel: 'via Proof Shorts Video Commerce Rail',
    sourceIcon: '🎥',
    sourceUrl: '/shorts',
    authorName: 'Dragon City Wholesale Walk',
    authorHandle: '@DragonCityTrade',
    authorLocation: 'Dragon City Mall, Fordsburg, JHB',
    isVerifiedMerchant: true,
    timestamp: '24m ago',
    text: '🎬 Video Proof: Live trade walk inside Building 2 wholesale electrical importers. Price teardown on 8kW hybrid inverters vs 5kW units. Check live BuyBox below.',
    hashtags: ['#DragonCity', '#WholesaleWalk', '#InverterTeardown', '#ShoppageTime'],
    productTitle: 'Sunsynk 8kW Hybrid Inverter 48V',
    productSku: 'SYN-8K-HYB',
    priceZar: 28500,
    stockStatus: 'Showroom Verified',
    likesCount: 142,
    repostsCount: 45,
    replyCount: 19,
    contactPhone: '+27 11 838 5000',
    mediaImage: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&auto=format&fit=crop&q=80',
    isVideo: true,
    videoDuration: '1:14',
  },
];

export default function ShoppageTimePage() {
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [activeFilter, setActiveFilter] = useState<'all' | 'deals' | 'rfqs' | 'facebook' | 'twitter_x'>('all');
  const [livePulseTick, setLivePulseTick] = useState(0);

  // Compose State
  const [composeText, setComposeText] = useState('');
  const [composePrice, setComposePrice] = useState('');
  const [composeSku, setComposeSku] = useState('DEYE-5K-SG03');
  const [postToTime, setPostToTime] = useState(true);
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [postToTwitterX, setPostToTwitterX] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Telemetry Pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulseTick((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handlePostTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim()) return;

    const newItem: TimelineItem = {
      id: `time_user_${Date.now()}`,
      source: 'shoppage_catalog',
      sourceLabel: 'Shoppage Time · Verified Merchant Broadcast',
      sourceIcon: '⚡',
      authorName: 'You (Verified Merchant Passport)',
      authorHandle: '@VerifiedTrader',
      authorLocation: 'Johannesburg Commercial Hub',
      isVerifiedMerchant: true,
      timestamp: 'Just now',
      text: composeText.trim(),
      hashtags: ['#ShoppageTime', '#DirectTradeSA', '#LiveDeals'],
      productTitle: composeSku === 'DEYE-5K-SG03' ? 'Deye 5kW Hybrid Inverter' : 'Direct Stock Clearance',
      productSku: composeSku,
      priceZar: composePrice ? parseInt(composePrice) : 14850,
      stockStatus: 'Immediate Collection',
      likesCount: 1,
      repostsCount: 0,
      replyCount: 0,
      contactPhone: '+27 82 123 4567',
    };

    setTimeline([newItem, ...timeline]);
    setComposeText('');
    setComposePrice('');
    setToastMessage('⚡ Successfully broadcast to Shoppage Time, Facebook Groups & Twitter / X!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLike = (id: string) => {
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likesCount: item.likesCount + 1 } : item
      )
    );
  };

  const handleRepost = (id: string) => {
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, repostsCount: item.repostsCount + 1 } : item
      )
    );
    setToastMessage('🔁 Trade deal syndicated to your network!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTimeline = timeline.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'deals') return item.source === 'shoppage_catalog' || item.priceZar !== undefined;
    if (activeFilter === 'rfqs') return item.source === 'buyer_rfq';
    if (activeFilter === 'facebook') return item.source === 'facebook_group';
    if (activeFilter === 'twitter_x') return item.source === 'twitter_x';
    return true;
  });

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '6rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#059669',
            color: '#FFFFFF',
            padding: '0.65rem 1.5rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.875rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Main 3-Column Layout (Twitter / X Desktop Architecture) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem', alignItems: 'start' }}>
          
          {/* CENTER FEED COLUMN */}
          <main>
            {/* Header Title */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>⚡</span>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                      Shoppage Time
                    </h1>
                    <span style={{ background: '#EF4444', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                      LIVE WIRE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    The Real-Time Commercial Timeline across South Africa. Aggregating 5,200+ Facebook Groups, Twitter / X, and Verified Showrooms with 0% middleman toll.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                    LIVE PULSE #{livePulseTick + 1}
                  </span>
                </div>
              </div>
            </div>

            {/* COMPOSE TRADE TWEET BOX (TWITTER / X STYLE) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                  S
                </div>

                <form onSubmit={handlePostTrade} style={{ flex: 1 }}>
                  <textarea
                    rows={3}
                    required
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    placeholder="Broadcast a stock clearance, wholesale price drop, or buyer RFQ to South Africa in real time..."
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      fontSize: '1rem',
                      color: '#0F172A',
                      padding: '0.25rem 0',
                    }}
                  />

                  {/* Multi-Channel Syndication Checkboxes */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', cursor: 'pointer' }}>
                        <input type="checkbox" checked={postToTime} onChange={(e) => setPostToTime(e.target.checked)} />
                        <span>⚡ Shoppage Time</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1877F2', cursor: 'pointer' }}>
                        <input type="checkbox" checked={postToFacebook} onChange={(e) => setPostToFacebook(e.target.checked)} />
                        <span>📘 FB Groups</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#000000', cursor: 'pointer' }}>
                        <input type="checkbox" checked={postToTwitterX} onChange={(e) => setPostToTwitterX(e.target.checked)} />
                        <span>𝕏 Twitter / X</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        placeholder="Price (ZAR)"
                        value={composePrice}
                        onChange={(e) => setComposePrice(e.target.value)}
                        style={{
                          width: '110px',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: '20px', fontWeight: 800, padding: '0.45rem 1.25rem' }}
                      >
                        ⚡ Post to Time
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* TIMELINE FILTER TABS (TWITTER / X STYLE) */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.4rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
              {[
                { id: 'all', label: '⚡ For You (All Sources)' },
                { id: 'deals', label: '🔥 Price Drops & Clearance' },
                { id: 'rfqs', label: '📋 Contractor RFQs' },
                { id: 'facebook', label: '📘 Facebook Groups' },
                { id: 'twitter_x', label: '𝕏 Twitter / X Feed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  style={{
                    background: activeFilter === tab.id ? '#0F172A' : '#FFFFFF',
                    color: activeFilter === tab.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilter === tab.id ? '#0F172A' : '#E2E8F0',
                    borderRadius: '20px',
                    padding: '0.4rem 0.95rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TIMELINE FEED STREAM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTimeline.map((item) => (
                <article
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Origin Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span>{item.sourceIcon}</span>
                      {item.sourceUrl ? (
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>
                          {item.sourceLabel}
                        </a>
                      ) : (
                        <span>{item.sourceLabel}</span>
                      )}
                    </div>
                    <span>{item.timestamp}</span>
                  </div>

                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      {item.authorName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>{item.authorName}</span>
                        {item.isVerifiedMerchant && <span style={{ color: '#10B981', fontSize: '0.8rem' }} title="CIPC Verified Stockist">✓</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {item.authorHandle} · 📍 {item.authorLocation}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p style={{ fontSize: '0.925rem', color: '#1E293B', lineHeight: 1.5, margin: 0 }}>
                    {item.text}
                  </p>

                  {/* X-Style Media Stage (Photo / Video Short) */}
                  {item.mediaImage && (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        maxHeight: '260px',
                        border: '1px solid #E2E8F0',
                        background: '#0F172A',
                      }}
                    >
                      <img
                        src={item.mediaImage}
                        alt={item.productTitle || 'Media'}
                        style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                      />

                      {/* Video Play Overlay */}
                      {item.isVideo && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => alert(`Playing live video proof short for ${item.productTitle || item.authorName}...`)}
                        >
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              background: 'rgba(37, 99, 235, 0.95)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              paddingLeft: '3px',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}
                          >
                            ▶
                          </div>

                          {item.videoDuration && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                background: 'rgba(15, 23, 42, 0.85)',
                                color: '#FFFFFF',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span>🎬</span> {item.videoDuration} Proof Short
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hashtags Strip */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {item.hashtags.map((tag) => (
                      <span key={tag} style={{ color: '#2563EB', fontSize: '0.78rem', fontWeight: 700 }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* EMBEDDED IN-FEED BUYBOX STRIP */}
                  {item.productTitle && (
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '0.85rem 1.15rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                          {item.productTitle}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                          ✓ {item.stockStatus || 'Available'} · 0% Take-Rate
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.priceZar && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>
                              R {item.priceZar.toLocaleString()}
                            </div>
                            {item.regularPriceZar && (
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                                R {item.regularPriceZar.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}

                        <Link
                          href="/search"
                          className="btn btn-primary btn-sm"
                          style={{ borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem' }}
                        >
                          Compare Sellers &rarr;
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ACTION BAR (TWITTER / X STYLE) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#64748B' }}>
                    <button
                      onClick={() => alert(`Opening instant RFQ chat with ${item.authorName}...`)}
                      style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>💬</span> {item.replyCount} RFQs
                    </button>

                    <button
                      onClick={() => handleRepost(item.id)}
                      style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>🔁</span> {item.repostsCount} Reposts
                    </button>

                    <button
                      onClick={() => handleLike(item.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>❤️</span> {item.likesCount}
                    </button>

                    {item.contactPhone && (
                      <a
                        href={`tel:${item.contactPhone}`}
                        style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>📞</span> Call
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* RIGHT RAIL COLUMN (TWITTER / X STYLE TRENDS & STORES) */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Trending SA Topics Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1rem 0' }}>
                Trending on Shoppage Time 🇿🇦
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { tag: '#Stage6Inverters', count: '14.2K trades', cat: 'Solar & Backup Energy' },
                  { tag: '#MitrendPackaging', count: '8.4K orders', cat: 'Catering & Food Grade' },
                  { tag: '#DynessLithium', count: '5.1K trades', cat: 'Batteries & Storage' },
                  { tag: '#CementWholesale', count: '3.9K trades', cat: 'Building & Hardware' },
                  { tag: '#SandtonTrade', count: '3.2K inquiries', cat: 'Gauteng Commerce' },
                ].map((trend, i) => (
                  <div key={trend.tag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>
                        {i + 1} · {trend.cat}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                        {trend.tag}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {trend.count}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>↗</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Importers to Follow */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1rem 0' }}>
                Top Verified Stockists
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { name: 'SunPower Crown Mines', handle: '@SunPowerCrownMines', location: 'Crown Mines, JHB' },
                  { name: 'Mitrend Products (Pty)', handle: '@MitrendPackaging', location: 'Midrand Factory' },
                  { name: 'Dragon City Importers', handle: '@DragonCityTrade', location: 'Fordsburg Wholesale' },
                ].map((s) => (
                  <div key={s.handle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A' }}>{s.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.handle} · {s.location}</div>
                    </div>
                    <button
                      onClick={() => alert(`Following ${s.name} on Shoppage Time!`)}
                      className="btn btn-outline btn-sm"
                      style={{ borderRadius: '20px', fontWeight: 800, fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Shortcuts */}
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.6, padding: '0 0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <Link href="/markets" style={{ color: '#64748B', textDecoration: 'none' }}>Virtual Markets</Link>
                <span>•</span>
                <Link href="/shorts" style={{ color: '#64748B', textDecoration: 'none' }}>Proof Shorts</Link>
                <span>•</span>
                <Link href="/requests" style={{ color: '#64748B', textDecoration: 'none' }}>Buyer RFQs</Link>
              </div>
              <div>© 2026 Shoppage Platform · Real-Time Commercial Timeline</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
