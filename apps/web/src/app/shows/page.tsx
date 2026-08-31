'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SHOWS, MediaItem } from '@/lib/media';

export default function ShowsPage() {
  const [activeSeries, setActiveSeries] = useState<string>('all');
  const [selectedEpisode, setSelectedEpisode] = useState<MediaItem | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  const seriesList = [
    'all',
    'Market Walk South Africa',
    'Product Battles: Solar & Tech',
    'Factory & Warehouse Tours',
  ];

  const filteredEpisodes = activeSeries === 'all'
    ? SHOWS
    : SHOWS.filter((e) => e.series === activeSeries);

  const heroEpisode = SHOWS[0];

  return (
    <div style={{ background: '#0B0F19', minHeight: '100vh', color: '#FFFFFF', paddingBottom: '6rem' }}>
      {/* 1. CINEMATIC HERO SPOTLIGHT */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 1rem 5rem',
          background: `linear-gradient(to right, rgba(11, 15, 25, 0.98) 0%, rgba(11, 15, 25, 0.8) 50%, rgba(11, 15, 25, 0.4) 100%), url(${heroEpisode.thumbnailUrl}) center/cover no-repeat`,
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#FCA5A5', fontWeight: 800 }}>
                ORIGINAL SERIES SPOTLIGHT · {heroEpisode.series}
              </span>
            </div>

            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#FFFFFF', marginBottom: '1rem' }}>
              {heroEpisode.title}
            </h1>

            <p style={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {heroEpisode.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedEpisode(heroEpisode)}
                className="btn btn-primary btn-lg"
                style={{ borderRadius: '12px', fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1rem', background: '#2563EB', borderColor: '#2563EB' }}
              >
                ▶ Watch Full Episode ({heroEpisode.duration})
              </button>
              <Link
                href="/shorts"
                className="btn btn-outline btn-lg"
                style={{ borderRadius: '12px', fontWeight: 700, color: '#CBD5E1', borderColor: '#334155' }}
              >
                📱 Watch Proof Shorts &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERIES SELECTION TABS */}
      <section style={{ padding: '2.5rem 0 1.5rem', background: '#0F172A', borderBottom: '1px solid #1E293B' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {seriesList.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeries(s)}
                  style={{
                    background: activeSeries === s ? '#2563EB' : '#1E293B',
                    color: activeSeries === s ? '#FFFFFF' : '#94A3B8',
                    border: activeSeries === s ? '1px solid #3B82F6' : '1px solid #334155',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s === 'all' ? 'All Original Series' : s}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>
              Showing {filteredEpisodes.length} Episodes
            </span>
          </div>
        </div>
      </section>

      {/* 3. EPISODES GRID */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {filteredEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="card card-interactive"
                onClick={() => setSelectedEpisode(ep)}
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '16px',
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  {/* Thumbnail Video Canvas */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000000', overflow: 'hidden' }}>
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)' }} />

                    {/* Duration Badge */}
                    <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {ep.duration}
                    </span>

                    <span style={{ position: 'absolute', bottom: 10, left: 10, color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>
                      👁️ {ep.views.toLocaleString()} views
                    </span>

                    {/* Play Button Overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: 'rgba(37, 99, 235, 0.9)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        }}
                      >
                        ▶
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {ep.series}
                      </span>
                      {ep.marketName && (
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                          📍 {ep.marketName.slice(0, 24)}...
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.35, marginBottom: '0.65rem' }}>
                      {ep.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ep.description}
                    </p>

                    {/* Featured Products Pills */}
                    {ep.featuredProducts && ep.featuredProducts.length > 0 && (
                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {ep.featuredProducts.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              background: '#0F172A',
                              border: '1px solid #334155',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              color: '#34D399',
                              fontWeight: 700,
                            }}
                          >
                            🛍️ {p.title} (R {p.price.toLocaleString()})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1.25rem', background: '#0F172A', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {ep.chapters?.length || 4} Chapters Available
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#60A5FA', fontWeight: 800 }}>
                    Watch Episode &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CINEMATIC LONG-FORM VIDEO & CHAPTERS MODAL */}
      {selectedEpisode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEpisode(null);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1080px',
              maxHeight: '92vh',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', background: '#1E293B', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase' }}>
                  {selectedEpisode.series} · {selectedEpisode.duration}
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0.1rem 0 0 0' }}>
                  {selectedEpisode.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEpisode(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Video Player + Sidebar Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', overflow: 'auto', flex: 1 }}>
              {/* Main Player Canvas */}
              <div style={{ background: '#000000', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000000' }}>
                  <video
                    src={selectedEpisode.videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ padding: '1.25rem', flex: 1, background: '#0F172A' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    Episode Overview
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
                    {selectedEpisode.description}
                  </p>
                </div>
              </div>

              {/* Sidebar: Chapters & Featured Products */}
              <div style={{ background: '#1E293B', borderLeft: '1px solid #334155', padding: '1.25rem', overflowY: 'auto' }}>
                {/* Chapters */}
                {selectedEpisode.chapters && selectedEpisode.chapters.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                      📋 Episode Chapters
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {selectedEpisode.chapters.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveChapterIndex(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            background: activeChapterIndex === idx ? '#2563EB' : '#0F172A',
                            border: activeChapterIndex === idx ? '1px solid #3B82F6' : '1px solid #334155',
                            color: '#FFFFFF',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: activeChapterIndex === idx ? '#FFFFFF' : '#60A5FA' }}>
                            {ch.time}
                          </span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ch.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured Products BuyBox Roster */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                    🛍️ Products in this Episode
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(selectedEpisode.featuredProducts || [
                      { title: 'Featured Wholesale Unit', price: 14850, stockist: 'Verified Importer', link: '/search' },
                    ]).map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          background: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          padding: '0.85rem',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, marginBottom: '0.2rem' }}>
                          🏬 {prod.stockist}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                          {prod.title}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34D399', marginBottom: '0.65rem' }}>
                          R {prod.price.toLocaleString()}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link
                            href={prod.link}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, borderRadius: '6px' }}
                          >
                            Compare &rarr;
                          </Link>
                          <Link
                            href="/requests"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', fontWeight: 800, borderRadius: '6px', color: '#FFFFFF', borderColor: '#475569' }}
                          >
                            ✉️ RFQ
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
