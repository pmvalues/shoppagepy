'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SHORTS, MediaItem } from '@/lib/media';
import { showToast } from '@/lib/toast';

export default function ShortsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeShortIndex, setActiveShortIndex] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'submit'>('feed');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const filteredShorts = selectedCategory === 'all'
    ? SHORTS
    : SHORTS.filter((s) => s.category === selectedCategory);

  const activeShort: MediaItem | null = activeShortIndex !== null ? filteredShorts[activeShortIndex] || null : null;

  const handleLike = (id: string, initialLikes: number) => {
    if (!hasLiked[id]) {
      setLikes({ ...likes, [id]: (likes[id] || initialLikes) + 1 });
      setHasLiked({ ...hasLiked, [id]: true });
    } else {
      setLikes({ ...likes, [id]: Math.max(0, (likes[id] || initialLikes) - 1) });
      setHasLiked({ ...hasLiked, [id]: false });
    }
  };

  const handleShare = (short: MediaItem) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/shorts?id=${short.id}`);
      setCopyToast(`Copied short link for "${short.title.slice(0, 30)}..."`);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  // Keyboard shortcuts when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeShortIndex === null) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        setActiveShortIndex((prev) => (prev !== null && prev < filteredShorts.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        setActiveShortIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredShorts.length - 1));
      } else if (e.key === 'Escape') {
        setActiveShortIndex(null);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeShortIndex, filteredShorts.length]);

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#FFFFFF', paddingBottom: '6rem' }}>
      {/* Toast Notification */}
      {copyToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#059669',
            color: '#FFFFFF',
            padding: '0.65rem 1.25rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.85rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span> {copyToast}
        </div>
      )}

      {/* Hero Header */}
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(37, 99, 235, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#60A5FA',
            marginBottom: '1rem',
          }}
        >
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></span>
          <span>LIVE COMMERCE & PRODUCT PROOF FEED</span>
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: '0.75rem' }}>
          Video Shorts & Product Teardowns
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
          Watch real teardowns, factory tours, and warehouse price walks. Trade directly with verified stockists with 0% take rate.
        </p>

        {/* View Switcher / Submit Video */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('feed')}
            className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem' }}
          >
            🎬 Watch Proof Feed
          </button>
          <Link
            href="/shows"
            className="btn btn-outline"
            style={{ borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem', color: '#CBD5E1', borderColor: '#334155' }}
          >
            📺 Market Walk Shows Series &rarr;
          </Link>
          <button
            onClick={() => setActiveTab('submit')}
            className={`btn ${activeTab === 'submit' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem', background: activeTab === 'submit' ? '#059669' : 'transparent', borderColor: activeTab === 'submit' ? '#059669' : '#334155', color: '#FFFFFF' }}
          >
            + Submit Merchant Video
          </button>
        </div>

        {/* Category Filter Pills */}
        {activeTab === 'feed' && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '3rem' }}>
            {[
              { id: 'all', label: '🔥 All Proof Shorts' },
              { id: 'solar', label: '⚡ Solar & Load-Shedding' },
              { id: 'packaging', label: '🍽️ Mitrend Packaging' },
              { id: 'markets', label: '🏢 Wholesale Malls' },
              { id: 'hardware', label: '🧱 Building & Hardware' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? '#2563EB' : 'rgba(30, 41, 59, 0.8)',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#94A3B8',
                  border: selectedCategory === cat.id ? '1px solid #3B82F6' : '1px solid #334155',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {activeTab === 'feed' ? (
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {filteredShorts.map((short, idx) => {
              const currentLikes = likes[short.id] || short.likes || 1200;
              const isLiked = Boolean(hasLiked[short.id]);

              return (
                <div
                  key={short.id}
                  className="card card-interactive"
                  onClick={() => {
                    setActiveShortIndex(idx);
                    setIsPlaying(true);
                  }}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                  }}
                >
                  {/* Video Thumbnail Stage */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 16', background: '#000000', overflow: 'hidden' }}>
                    <img
                      src={short.thumbnailUrl}
                      alt={short.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(0,0,0,0.4) 100%)' }} />

                    {/* Top Badges */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {short.duration}
                      </span>
                      <span style={{ background: '#059669', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                        ✓ Verified Stock
                      </span>
                    </div>

                    {/* Center Play Button Overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(37, 99, 235, 0.9)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        }}
                      >
                        ▶
                      </span>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 800, marginBottom: '0.25rem' }}>
                        🏬 {short.merchantName}
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                        {short.title}
                      </h3>

                      {short.priceZar && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>
                          <span>R {short.priceZar.toLocaleString()}</span>
                          {short.discountText && <span style={{ color: '#94A3B8', fontSize: '0.65rem' }}>· {short.discountText}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Engagement */}
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', borderTop: '1px solid #334155' }}>
                    <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                      <span>👁️ {short.views.toLocaleString()}</span>
                      <span style={{ color: isLiked ? '#F43F5E' : 'inherit' }}>❤️ {currentLikes.toLocaleString()}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#60A5FA', fontWeight: 800 }}>
                      Watch Fullscreen &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Merchant Video Submission Portal */
        <div className="container" style={{ maxWidth: '640px' }}>
          <div className="card" style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Submit Product Video or Teardown
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Attach TikTok, YouTube Shorts, or MP4 unboxings directly to your store catalog. Zero listing fee.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); showToast('Video submitted successfully! Pending CIPC merchant verification.', 'success'); setActiveTab('feed'); }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                  Video URL (YouTube Shorts, TikTok, or MP4)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/shorts/... or https://vm.tiktok.com/..."
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#0F172A', border: '1px solid #475569', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                  Product Name / SKU Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deye 8kW Hybrid Inverter or Mitrend 500ml Tubs"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#0F172A', border: '1px solid #475569', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                  Verified Merchant / Store Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mitrend Products (Midrand)"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#0F172A', border: '1px solid #475569', color: '#FFFFFF' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', fontWeight: 800, background: '#059669', borderColor: '#059669' }}
              >
                ✓ Submit for Instant Syndication
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMMERSIVE TIKTOK/REELS SHORTS MODAL */}
      {activeShort && activeShortIndex !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveShortIndex(null);
          }}
        >
          {/* Modal Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              height: '92vh',
              maxHeight: '860px',
              background: '#000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Close & Progress Bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem', zIndex: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#2563EB', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                  PRODUCER PROOF
                </span>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700 }}>
                  {activeShortIndex + 1} / {filteredShorts.length}
                </span>
              </div>

              <button
                onClick={() => setActiveShortIndex(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Video Canvas */}
            <div
              style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (videoRef.current) {
                  if (videoRef.current.paused) videoRef.current.play();
                  else videoRef.current.pause();
                }
              }}
            >
              <video
                ref={videoRef}
                src={activeShort.videoUrl}
                autoPlay
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Pause Icon Indicator */}
              {!isPlaying && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                  <span style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    ❚❚
                  </span>
                </div>
              )}
            </div>

            {/* Right Action Rail */}
            <div
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '160px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(activeShort.id, activeShort.likes || 1000);
                }}
                style={{
                  background: hasLiked[activeShort.id] ? '#F43F5E' : 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  color: '#FFFFFF',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                ❤️
              </button>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {((likes[activeShort.id] || activeShort.likes || 1000)).toLocaleString()}
              </span>

              {/* Share Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(activeShort);
                }}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  color: '#FFFFFF',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                🔗
              </button>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                Share
              </span>

              {/* Call Button */}
              {activeShort.merchantPhone && (
                <a
                  href={`tel:${activeShort.merchantPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: '#2563EB',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    color: '#FFFFFF',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                  title="Direct Phone Call"
                >
                  📞
                </a>
              )}
            </div>

            {/* Bottom Product BuyBox Drawer */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1.25rem',
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.85) 75%, transparent 100%)',
                zIndex: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8' }}>
                  🏬 {activeShort.merchantName}
                </span>
                <span style={{ background: '#059669', color: '#FFFFFF', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                  ✓ CIPC Verified
                </span>
              </div>

              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                {activeShort.title}
              </h2>

              {activeShort.summary && (
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {activeShort.summary}
                </p>
              )}

              {/* In-Video Product Trigger Bar */}
              {activeShort.featuredProducts && activeShort.featuredProducts.length > 0 && (
                <div style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {activeShort.featuredProducts[0].title}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#34D399' }}>
                      R {activeShort.featuredProducts[0].price.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link
                      href={activeShort.featuredProducts[0].link}
                      className="btn btn-primary btn-sm"
                      style={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      Compare &rarr;
                    </Link>
                    <Link
                      href="/requests"
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: '6px', color: '#FFFFFF', borderColor: '#475569' }}
                    >
                      ✉️ RFQ
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Prev / Next Navigation Floating Controls */}
            <div style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', zIndex: 30 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveShortIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredShorts.length - 1));
                }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ▲
              </button>
            </div>

            <div style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', zIndex: 30 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveShortIndex((prev) => (prev !== null && prev < filteredShorts.length - 1 ? prev + 1 : 0));
                }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
