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
    badgeColor: '#059669',
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
    badge: '✓ Swept Deal',
    badgeColor: '#1877F2',
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
    badgeColor: '#7C3AED',
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
    badgeColor: '#D97706',
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
      badgeColor: '#2563EB',
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
        background: 'linear-gradient(180deg, #090D16 0%, #0F172A 100%)',
        color: '#FFFFFF',
        padding: '2rem 1rem 3rem',
        borderBottom: '1px solid #1E293B',
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
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
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
            borderBottom: '1px solid rgba(255,255,255,0.1)',
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
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', animation: 'pulse 1s infinite' }} />
              LIVE
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#38BDF8' }}>⚡</span> Shoppage Time Wire
            </div>

            <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>•</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>● {pulseCount.toLocaleString()} Trades/hr</span>
              <span>•</span>
              <span>5,200+ Facebook Groups</span>
              <span>•</span>
              <span>𝕏 Commercial Stream</span>
              <span>•</span>
              <span>0% Middleman Toll</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              href="/time"
              className="btn btn-sm"
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8rem',
                padding: '0.4rem 1rem',
                textDecoration: 'none',
                border: 'none',
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
                    background: activeFilter === tab.id ? '#2563EB' : '#1E293B',
                    color: activeFilter === tab.id ? '#FFFFFF' : '#94A3B8',
                    border: '1px solid',
                    borderColor: activeFilter === tab.id ? '#3B82F6' : '#334155',
                    borderRadius: '20px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
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
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Origin & Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                      <span>{item.sourceIcon}</span>
                      <span style={{ color: item.sourceType === 'facebook' ? '#60A5FA' : item.sourceType === 'twitter_x' ? '#F8FAFC' : '#38BDF8' }}>
                        {item.sourceLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.badge && (
                        <span style={{ background: 'rgba(255,255,255,0.08)', color: item.badgeColor || '#38BDF8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.68rem' }}>
                          {item.badge}
                        </span>
                      )}
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E293B', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {item.author} <span style={{ color: '#10B981', fontSize: '0.75rem' }}>✓</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {item.handle} · {item.location}
                      </div>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p style={{ fontSize: '0.875rem', color: '#CBD5E1', lineHeight: 1.45, margin: 0 }}>
                    {item.text}
                  </p>

                  {/* EMBEDDED IN-FEED BUYBOX / RFQ STRIP */}
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#F1F5F9' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                        ✓ {item.stockStatus} · Direct Counter Trade
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.priceZar && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34D399' }}>
                            R {item.priceZar.toLocaleString()}
                          </div>
                          {item.regularPriceZar && (
                            <div style={{ fontSize: '0.68rem', color: '#64748B', textDecoration: 'line-through' }}>
                              R {item.regularPriceZar.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      <Link
                        href={item.href}
                        className="btn btn-sm"
                        style={{
                          background: '#2563EB',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          textDecoration: 'none',
                          border: 'none',
                        }}
                      >
                        {item.sourceType === 'rfq' ? 'Quote RFQ ↗' : 'BuyBox ↗'}
                      </Link>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <button
                      onClick={() => alert(`Opening instant direct inquiry with ${item.author}...`)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>💬</span> {item.rfqs} RFQs
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('🔁 Trade deal syndicated to your commercial network!');
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>🔁</span> {item.reposts} Reposts
                    </button>

                    <button
                      onClick={() => handleLike(item.id)}
                      style={{ background: 'none', border: 'none', color: '#F87171', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <span>❤️</span> {item.likes}
                    </button>

                    <Link href="/search" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 700 }}>
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
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>✍️</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
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
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
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
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#F8FAFC',
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

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#38BDF8' }}>✓ Shoppage Time</span>
                  <span style={{ color: '#60A5FA' }}>✓ FB Groups</span>
                  <span style={{ color: '#F8FAFC' }}>✓ 𝕏 Twitter</span>
                  <span style={{ color: '#10B981' }}>0% Take Rate</span>
                </div>
              </form>
            </div>

            {/* Trending SA Topics & Deals */}
            <div
              style={{
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '14px',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#F8FAFC', margin: '0 0 0.85rem 0' }}>
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
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#38BDF8' }}>{t.tag}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{t.desc}</div>
                    </div>
                    <span style={{ color: '#475569', fontSize: '0.75rem' }}>↗</span>
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
                  color: '#F8FAFC',
                  borderColor: '#334155',
                  background: '#1E293B',
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
                  color: '#F8FAFC',
                  borderColor: '#334155',
                  background: '#1E293B',
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
                  color: '#F8FAFC',
                  borderColor: '#334155',
                  background: '#1E293B',
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
