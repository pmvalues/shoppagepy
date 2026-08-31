'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

interface ActionFeedItem {
  id: string;
  sourceType: 'showroom' | 'facebook' | 'twitter_x' | 'rfq' | 'video_short' | 'twitter_x_live' | 'facebook_group_live' | 'verified_catalog' | 'placeholder_template';
  sourceLabel: string;
  sourceIcon: string;
  sourceUrl?: string;
  authorName?: string;
  author?: string;
  handle?: string;
  authorHandle?: string;
  location?: string;
  authorLocation?: string;
  timeAgo?: string;
  timestamp?: string;
  title?: string;
  productTitle?: string;
  text: string;
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  videoDuration?: string;
  priceZar?: number;
  regularPriceZar?: number;
  stockStatus?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  href?: string;
  likes?: number;
  reposts?: number;
  rfqs?: number;
  isLiveScraped?: boolean;
  isPlaceholder?: boolean;
}

export default function ShoppageTimeActionHero() {
  const [feed, setFeed] = useState<ActionFeedItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'solar' | 'packaging' | 'rfqs' | 'social'>('all');
  const [isScrapingLive, setIsScrapingLive] = useState(false);
  const [lastScrapedAt, setLastScrapedAt] = useState<string>('Live active');
  const [pulseCount, setPulseCount] = useState(1425);
  const [showPostModal, setShowPostModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastPrice, setBroadcastPrice] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch from Live Scraper API
  const fetchLiveScrapedData = async (filter: string = 'all') => {
    setIsScrapingLive(true);
    try {
      const res = await fetch(`/api/v1/scraper/live?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        if (data.feed && data.feed.length > 0) {
          setFeed(data.feed);
          setLastScrapedAt(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.warn('Live scraper fetch fallback:', err);
    } finally {
      setIsScrapingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveScrapedData(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const newItem: ActionFeedItem = {
      id: `hero_user_${Date.now()}`,
      sourceType: 'verified_catalog',
      sourceLabel: 'Shoppage Time · Live Verified Broadcast',
      sourceIcon: '⚡',
      authorName: 'You (Verified Trader)',
      authorHandle: '@VerifiedTrader',
      authorLocation: 'South Africa Commercial Grid',
      timestamp: 'Just now',
      productTitle: 'Direct Stock Clearance / Trade Drop',
      text: broadcastText.trim(),
      mediaType: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
      priceZar: broadcastPrice ? parseInt(broadcastPrice) : 14850,
      stockStatus: 'Immediate Pickup',
      badge: '⚡ Live Broadcast',
      badgeBg: '#EFF6FF',
      badgeColor: '#1E40AF',
      href: '/search',
      likes: 1,
      reposts: 0,
      rfqs: 0,
      isLiveScraped: false,
      isPlaceholder: false,
    };

    setFeed([newItem, ...feed]);
    setBroadcastText('');
    setBroadcastPrice('');
    setShowPostModal(false);
    setToastMessage('⚡ Deal broadcast live to Shoppage Time, Facebook & 𝕏!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <section style={{ background: '#FFFFFF', padding: '1.5rem 0 2.5rem', borderBottom: '1px solid #E2E8F0' }}>
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
            padding: '0.6rem 1.4rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.85rem',
            zIndex: 9999,
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Broadcast Modal */}
      {showPostModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                ⚡ Post to Shoppage Time
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <textarea
                rows={3}
                required
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Describe your stock drop, clearance deal, or contractor sourcing RFQ..."
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Price in ZAR (Optional)"
                value={broadcastPrice}
                onChange={(e) => setBroadcastPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                <span>✓ Auto-syndicate to FB Groups & 𝕏</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>0% Take Rate</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: '8px', fontWeight: 800, padding: '0.65rem', background: '#2563EB', borderColor: '#2563EB' }}
              >
                ⚡ Broadcast Deal Now
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* COMPACT CLEAN LIVE PULSE STRIP */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '0.65rem 1.15rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#FFFFFF', animation: 'pulse 1s infinite' }} />
              LIVE FEED
            </div>

            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
              ● {pulseCount.toLocaleString()} Trades/hr
            </span>

            <span style={{ color: '#CBD5E1' }}>|</span>

            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Real-time Showroom & Web Scraper ({lastScrapedAt})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => fetchLiveScrapedData(activeFilter)}
              disabled={isScrapingLive}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: '#CBD5E1',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '0.35rem 0.65rem',
                cursor: 'pointer',
              }}
            >
              {isScrapingLive ? '⏳ Scraping Live...' : '🔄 Scrape Live'}
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="btn btn-sm"
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
              }}
            >
              + Post Trade
            </button>
            <Link
              href="/time"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#2563EB',
                textDecoration: 'none',
              }}
            >
              Full Timeline &rarr;
            </Link>
          </div>
        </div>

        {/* 2-COLUMN SLEEK STREAM GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 0.9fr)', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* LEFT: LIVE STREAM FEED */}
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', marginBottom: '0.85rem' }}>
              {[
                { id: 'all', label: '⚡ All Live Streams' },
                { id: 'solar', label: '⚡ Solar & Inverters' },
                { id: 'packaging', label: '🍽️ Mitrend Packaging' },
                { id: 'rfqs', label: '📋 Sourcing Desks' },
                { id: 'social', label: '📘 FB & 𝕏 Feeds' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  style={{
                    background: activeFilter === tab.id ? '#0F172A' : '#FFFFFF',
                    color: activeFilter === tab.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilter === tab.id ? '#0F172A' : '#E2E8F0',
                    borderRadius: '16px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cards Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {feed.map((item) => {
                const author = item.authorName || item.author || 'Verified Trader';
                const handle = item.authorHandle || item.handle || '@VerifiedTrader';
                const location = item.authorLocation || item.location || 'South Africa';
                const productTitle = item.productTitle || item.title || 'Stock Drop';
                const timeAgo = item.timestamp || item.timeAgo || 'Recently';

                return (
                  <article
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Origin */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                        <span>{item.sourceIcon || '⚡'}</span>
                        <span style={{ color: item.sourceType?.includes('facebook') ? '#1877F2' : item.sourceType?.includes('twitter') ? '#0F172A' : '#2563EB' }}>
                          {item.sourceLabel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item.badge && (
                          <span style={{ background: item.badgeBg || '#EFF6FF', color: item.badgeColor || '#1E40AF', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.65rem' }}>
                            {item.badge}
                          </span>
                        )}
                        <span>{timeAgo}</span>
                      </div>
                    </div>

                    {/* Author & Text */}
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#0F172A' }}>{author}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '0.4rem' }}>{handle} · 📍 {location}</span>
                      <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.45, margin: '0.25rem 0 0 0' }}>
                        {item.text}
                      </p>
                    </div>

                    {/* X-STYLE RICH PHOTO / VIDEO STAGE */}
                    {item.mediaUrl && (
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid #E2E8F0',
                          maxHeight: '220px',
                          background: '#0F172A',
                        }}
                      >
                        <img
                          src={item.mediaUrl}
                          alt={productTitle}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />

                        {/* Video Play Overlay */}
                        {item.mediaType === 'video' && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.28)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={() => showToast(`Playing live video proof short for ${productTitle}...`)}
                          >
                            <div
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '50%',
                                background: 'rgba(37, 99, 235, 0.95)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.15rem',
                                paddingLeft: '3px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                              }}
                            >
                              ▶
                            </div>

                            {item.videoDuration && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '8px',
                                  left: '8px',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  color: '#FFFFFF',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <span>🎬</span> {item.videoDuration} Proof Short
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Embedded Compact BuyBox Strip */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A' }}>
                          {productTitle}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                          ✓ {item.stockStatus || 'Counter Trade Ready'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {item.priceZar && (
                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857' }}>
                            R {item.priceZar.toLocaleString()}
                          </div>
                        )}
                        <Link
                          href={item.href || `/search?q=${encodeURIComponent(productTitle)}`}
                          className="btn btn-sm"
                          style={{
                            background: item.isPlaceholder ? '#0F172A' : '#2563EB',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            padding: '0.35rem 0.7rem',
                            textDecoration: 'none',
                            border: 'none',
                          }}
                        >
                          {item.isPlaceholder ? 'Quote RFQ ↗' : 'BuyBox ↗'}
                        </Link>
                      </div>
                    </div>

                    {/* Action Micro-Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#64748B' }}>
                      <button
                        onClick={() => showToast(`Opening RFQ inquiry for ${productTitle}...`)}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                      >
                        💬 {item.rfqs || 8} RFQs
                      </button>
                      <button
                        onClick={() => {
                          setToastMessage('🔁 Trade deal syndicated to your network!');
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔁 {item.reposts || 12} Reposts
                      </button>
                      <button
                        onClick={() => {
                          setFeed((prev) => prev.map((x) => x.id === item.id ? { ...x, likes: (x.likes || 0) + 1 } : x));
                        }}
                        style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ❤️ {item.likes || 25}
                      </button>
                      <Link href={`/search?q=${encodeURIComponent(productTitle)}`} style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 700 }}>
                        Compare 4 Sellers &rarr;
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* RIGHT: COMPACT TRENDS & CHANNELS */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Trending SA Topics */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1.15rem',
              }}
            >
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.65rem 0' }}>
                🔥 Trending Commercial Topics 🇿🇦
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                      padding: '0.2rem 0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB' }}>{t.tag}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{t.desc}</div>
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>↗</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Fast Channel Navigation Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <Link
                href="/markets"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#E2E8F0',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  padding: '0.4rem',
                }}
              >
                👥 5,200+ Markets
              </Link>
              <Link
                href="/shorts"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#E2E8F0',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  padding: '0.4rem',
                }}
              >
                📱 Proof Shorts
              </Link>
              <Link
                href="/requests"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#0F172A',
                  borderColor: '#E2E8F0',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  padding: '0.4rem',
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
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  border: 'none',
                  padding: '0.4rem',
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
