'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LiveSearch from './LiveSearch';

interface ActionFeedItem {
  id: string;
  sourceType: 'showroom' | 'facebook' | 'twitter_x' | 'rfq';
  sourceLabel: string;
  sourceIcon: string;
  author: string;
  handle: string;
  location: string;
  timeAgo: string;
  title: string;
  text: string;
  priceZar?: number;
  regularPriceZar?: number;
  stockStatus: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  href: string;
  likes: number;
  reposts: number;
  rfqs: number;
}

const INITIAL_HERO_FEED: ActionFeedItem[] = [
  {
    id: 'hero_1',
    sourceType: 'showroom',
    sourceLabel: 'SunPower Crown Mines · Official Showroom',
    sourceIcon: '🛍️',
    author: 'SunPower Solutions',
    handle: '@SunPowerCrownMines',
    location: 'Crown Mines Wholesale Hub, JHB',
    timeAgo: '1m ago',
    title: 'Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)',
    text: '⚡ FLASH TRADE CLEARANCE: Pallet clearance for Gauteng solar contractors. Full NRS 097 grid certified & 5-yr warranty. Counter pickup or same-day dispatch.',
    priceZar: 14850,
    regularPriceZar: 18500,
    stockStatus: '14 Units Left',
    badge: '✓ NRS 097 Certified',
    badgeBg: '#ECFDF5',
    badgeColor: '#065F46',
    href: '/search?q=Deye+5kW',
    likes: 54,
    reposts: 22,
    rfqs: 12,
  },
  {
    id: 'hero_2',
    sourceType: 'facebook',
    sourceLabel: 'via Sandton & Bryanston Buy, Sell & Trade (142k Members)',
    sourceIcon: '📘',
    author: 'David Van Der Merwe',
    handle: '@DavidInstallSA',
    location: 'Sandton & Bryanston',
    timeAgo: '3m ago',
    title: 'Dyness 5.12kWh LiFePO4 Lithium Battery BX51100',
    text: 'Clearing 12x Dyness 5.12kWh Lithium Batteries from commercial project over-order. Sealed in crates with tax invoice.',
    priceZar: 16900,
    regularPriceZar: 19500,
    stockStatus: '12 Crates Sealed',
    badge: '✓ Swept FB Deal',
    badgeBg: '#EFF6FF',
    badgeColor: '#1E40AF',
    href: '/search?q=Dyness',
    likes: 39,
    reposts: 16,
    rfqs: 9,
  },
  {
    id: 'hero_3',
    sourceType: 'twitter_x',
    sourceLabel: 'via 𝕏 Twitter / X Feed (@MitrendPackaging)',
    sourceIcon: '𝕏',
    author: 'Mitrend Products (Pty) Ltd',
    handle: '@MitrendPackaging',
    location: 'Midrand Factory Concourse, Gauteng',
    timeAgo: '7m ago',
    title: '500ml Tamper-Evident Clear Food Tubs (Box of 250)',
    text: '📦 Direct factory stock drop: Food-grade polypropylene containers with snap-lock seal for catering & takeout kitchens.',
    priceZar: 185,
    regularPriceZar: 230,
    stockStatus: 'Bulk Stock Ready',
    badge: '✓ SABS Food Grade',
    badgeBg: '#F3E8FF',
    badgeColor: '#6B21A8',
    href: '/search?q=Mitrend',
    likes: 88,
    reposts: 31,
    rfqs: 15,
  },
  {
    id: 'hero_4',
    sourceType: 'rfq',
    sourceLabel: 'Contractor RFQ Broadcast · Western Cape Network',
    sourceIcon: '📋',
    author: 'Cape Peninsula Solar Contractors Guild',
    handle: '@CPSolarGuild',
    location: 'Tygerberg & Cape Town Northern Suburbs',
    timeAgo: '12m ago',
    title: '80x 550W Tier-1 Mono Solar Panels',
    text: '🚨 URGENT SOURCING: Contractor seeking 80x 550W Mono PERC panels in Cape Town / Paarden Eiland for Monday installation.',
    priceZar: 1750,
    stockStatus: 'Buyer Seeking Stock',
    badge: '📋 High Priority RFQ',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    href: '/requests',
    likes: 27,
    reposts: 14,
    rfqs: 21,
  },
];

export default function ShoppageTimeActionHero() {
  const [feed, setFeed] = useState<ActionFeedItem[]>(INITIAL_HERO_FEED);
  const [activeFilter, setActiveFilter] = useState<'all' | 'solar' | 'packaging' | 'rfqs' | 'social'>('all');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastPrice, setBroadcastPrice] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState(1420);

  // Live Simulated Pulse Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const newItem: ActionFeedItem = {
      id: `hero_user_${Date.now()}`,
      sourceType: 'showroom',
      sourceLabel: 'Shoppage Time · Live Verified Broadcast',
      sourceIcon: '⚡',
      author: 'You (Verified Merchant Passport)',
      handle: '@VerifiedTrader',
      location: 'South Africa Commercial Grid',
      timeAgo: 'Just now',
      title: 'Direct Stock Clearance / Trade Drop',
      text: broadcastText.trim(),
      priceZar: broadcastPrice ? parseInt(broadcastPrice) : 14850,
      stockStatus: 'Live Counter Ready',
      badge: '⚡ Live Broadcast',
      badgeBg: '#EFF6FF',
      badgeColor: '#1E40AF',
      href: '/search',
      likes: 1,
      reposts: 0,
      rfqs: 0,
    };

    setFeed([newItem, ...feed]);
    setBroadcastText('');
    setBroadcastPrice('');
    setToastMessage('⚡ Deal broadcasted live to Shoppage Time, Facebook Groups & Twitter / X!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLike = (id: string) => {
    setFeed((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item))
    );
  };

  const filteredFeed = feed.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'solar') return item.title.toLowerCase().includes('inverter') || item.title.toLowerCase().includes('solar') || item.title.toLowerCase().includes('battery');
    if (activeFilter === 'packaging') return item.title.toLowerCase().includes('food') || item.title.toLowerCase().includes('mitrend') || item.title.toLowerCase().includes('tub');
    if (activeFilter === 'rfqs') return item.sourceType === 'rfq';
    if (activeFilter === 'social') return item.sourceType === 'facebook' || item.sourceType === 'twitter_x';
    return true;
  });

  return (
    <section
      style={{
        background: 'radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(37, 99, 235, 0.09) 0%, rgba(16, 185, 129, 0.05) 40%, #F8FAFC 100%)',
        color: '#0F172A',
        padding: '2.5rem 1rem 3.5rem',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      {/* Toast Notification */}
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
            fontSize: '0.85rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* TOP COMMAND & TELEMETRY STRIP */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
              }}
            >
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', animation: 'pulse 1s infinite' }} />
              LIVE
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#2563EB' }}>⚡</span> Shoppage Time Wire
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 800 }}>● {pulseCount.toLocaleString()} Trades/hr</span>
              <span>•</span>
              <span>5,200+ Facebook Groups</span>
              <span>•</span>
              <span>𝕏 Commercial Stream</span>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>0% Take Rate</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              href="/time"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8rem',
                padding: '0.45rem 1.15rem',
                textDecoration: 'none',
                border: 'none',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              Explore Full Timeline &rarr;
            </Link>
          </div>
        </div>

        {/* COMPACT SEARCH DISCOVERY OMNIBOX */}
        <div style={{ marginBottom: '1.75rem' }}>
          <LiveSearch />
        </div>

        {/* 2-COLUMN REAL-TIME ACTION TERMINAL */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.95fr)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT: THE LIVE STREAMING FEED (TWITTER / X STYLE) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Feed Filter Strip */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {[
                { id: 'all', label: '⚡ All Real-Time Drops' },
                { id: 'solar', label: '⚡ Solar & Batteries' },
                { id: 'packaging', label: '🍽️ Mitrend Packaging' },
                { id: 'rfqs', label: '📋 Contractor RFQs' },
                { id: 'social', label: '📘 FB & 𝕏 Swept Feeds' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  style={{
                    background: activeFilter === tab.id ? '#0F172A' : '#FFFFFF',
                    color: activeFilter === tab.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilter === tab.id ? '#0F172A' : '#CBD5E1',
                    borderRadius: '20px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    boxShadow: activeFilter === tab.id ? '0 2px 6px rgba(15, 23, 42, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Feed Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredFeed.map((item) => (
                <article
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.35rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Origin & Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                      <span>{item.sourceIcon}</span>
                      <span style={{ color: item.sourceType === 'facebook' ? '#1877F2' : item.sourceType === 'twitter_x' ? '#0F172A' : '#2563EB' }}>
                        {item.sourceLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.badge && (
                        <span style={{ background: item.badgeBg || '#EFF6FF', color: item.badgeColor || '#1E40AF', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.7rem' }}>
                          {item.badge}
                        </span>
                      )}
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.825rem' }}>
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F172A' }}>
                        {item.author} <span style={{ color: '#10B981', fontSize: '0.8rem' }} title="CIPC Verified">✓</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {item.handle} · 📍 {item.location}
                      </div>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                    {item.text}
                  </p>

                  {/* EMBEDDED IN-FEED BUYBOX / RFQ STRIP */}
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
                      gap: '0.6rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                        ✓ {item.stockStatus} · Direct Counter Trade
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.priceZar && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>
                            R {item.priceZar.toLocaleString()}
                          </div>
                          {item.regularPriceZar && (
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                              R {item.regularPriceZar.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      <Link
                        href={item.href}
                        className="btn btn-sm"
                        style={{
                          background: item.sourceType === 'rfq' ? '#0F172A' : '#2563EB',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.85rem',
                          textDecoration: 'none',
                          border: 'none',
                        }}
                      >
                        {item.sourceType === 'rfq' ? 'Quote RFQ ↗' : 'BuyBox ↗'}
                      </Link>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.45rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
                    <button
                      onClick={() => alert(`Opening instant direct RFQ inquiry with ${item.author}...`)}
                      style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>💬</span> {item.rfqs} RFQs
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('🔁 Trade deal syndicated to your commercial network!');
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>🔁</span> {item.reposts} Reposts
                    </button>

                    <button
                      onClick={() => handleLike(item.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>❤️</span> {item.likes}
                    </button>

                    <Link href="/search" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 700 }}>
                      Compare 4 Sellers &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* RIGHT: 1-CLICK BROADCAST STUDIO & LIVE TRADE RADAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1-Click Broadcast Studio */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1.35rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>✍️</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  1-Click Live Trade Broadcast
                </h3>
              </div>

              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  rows={3}
                  required
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Drop a stock clearance, price cut, or contractor sourcing RFQ live to South Africa..."
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#0F172A',
                    padding: '0.65rem',
                    fontSize: '0.825rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Price (ZAR)"
                    value={broadcastPrice}
                    onChange={(e) => setBroadcastPrice(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#0F172A',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 900,
                      fontSize: '0.78rem',
                      padding: '0.45rem 1rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚡ Broadcast Live
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#2563EB', fontWeight: 700 }}>✓ Shoppage Time</span>
                  <span style={{ color: '#1877F2', fontWeight: 700 }}>✓ FB Groups</span>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>✓ 𝕏 Twitter</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>0% Take Rate</span>
                </div>
              </form>
            </div>

            {/* Trending SA Topics & Deals */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1.35rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
                Trending on Shoppage Time 🇿🇦
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { tag: '#Stage6Inverters', desc: '14.2K trades · Deye & Sunsynk' },
                  { tag: '#MitrendPackaging', desc: '8.4K orders · Midrand Factory' },
                  { tag: '#DynessLithium', desc: '5.1K trades · 5.12kWh BX51100' },
                  { tag: '#CementWholesale', desc: '3.9K trades · SABS 42.5N Quality' },
                ].map((t) => (
                  <Link
                    key={t.tag}
                    href={`/search?q=${encodeURIComponent(t.tag.replace('#', ''))}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textDecoration: 'none',
                      padding: '0.35rem 0',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#2563EB' }}>{t.tag}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{t.desc}</div>
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>↗</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Fast Channel Navigation Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              <Link
                href="/markets"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#CBD5E1',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                }}
              >
                👥 5,200+ Markets
              </Link>
              <Link
                href="/shorts"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#CBD5E1',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                }}
              >
                📱 Proof Shorts
              </Link>
              <Link
                href="/requests"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#CBD5E1',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                }}
              >
                📋 Buyer RFQs
              </Link>
              <Link
                href="/merchant/claim"
                className="btn btn-sm"
                style={{
                  color: '#FFFFFF',
                  background: '#059669',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  border: 'none',
                }}
              >
                + List Store
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
