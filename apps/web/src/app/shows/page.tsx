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
    <div style={{ background: 'var(--color-canvas-dark)', minHeight: '100vh', color: 'var(--color-on-dark)', paddingBottom: '6rem' }}>
      {/* 1. CINEMATIC HERO SPOTLIGHT */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 1rem 5rem',
          background: `linear-gradient(to right, rgba(11, 15, 25, 0.98) 0%, rgba(11, 15, 25, 0.8) 50%, rgba(11, 15, 25, 0.4) 100%), url(${heroEpisode.thumbnailUrl}) center/cover no-repeat`,
          borderBottom: '1px solid var(--color-canvas-dark-line)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger-500)' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#FCA5A5', fontWeight: 800 }}>
                ORIGINAL SERIES SPOTLIGHT · {heroEpisode.series}
              </span>
            </div>

            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--color-on-dark)', marginBottom: '1rem' }}>
              {heroEpisode.title}
            </h1>

            <p style={{ color: 'var(--color-on-dark-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {heroEpisode.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedEpisode(heroEpisode)}
                className="btn btn-primary btn-lg"
                style={{ borderRadius: '12px', fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1rem', background: 'var(--color-brand-solid)', borderColor: 'var(--color-brand-solid)' }}
              >
                ▶ Watch Full Episode ({heroEpisode.duration})
              </button>
              <Link
                href="/shorts"
                className="btn btn-outline btn-lg"
                style={{ borderRadius: '12px', fontWeight: 700, color: 'var(--color-on-dark-muted)', borderColor: 'var(--color-canvas-dark-line-strong)' }}
              >
                📱 Watch Proof Shorts &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERIES SELECTION TABS */}
      <section style={{ padding: '2.5rem 0 1.5rem', background: 'var(--color-canvas-dark)', borderBottom: '1px solid var(--color-canvas-dark-line)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {seriesList.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeries(s)}
                  style={{
                    background: activeSeries === s ? 'var(--color-brand-solid)' : 'var(--color-canvas-dark-raised)',
                    color: activeSeries === s ? 'var(--color-on-dark)' : 'var(--color-on-dark-muted)',
                    border: activeSeries === s ? '1px solid var(--color-info-500)' : '1px solid var(--color-canvas-dark-line-strong)',
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

            <span style={{ fontSize: '0.85rem', color: 'var(--color-on-dark-subtle)', fontWeight: 700 }}>
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
                  background: 'var(--color-canvas-dark-raised)',
                  border: '1px solid var(--color-canvas-dark-line-strong)',
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
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--color-canvas-black)', overflow: 'hidden' }}>
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)' }} />

                    {/* Duration Badge */}
                    <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', color: 'var(--color-on-dark)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {ep.duration}
                    </span>

                    <span style={{ position: 'absolute', bottom: 10, left: 10, color: 'var(--color-on-dark-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                      👁️ {ep.views.toLocaleString()} views
                    </span>

                    {/* Play Button Overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: 'var(--color-brand-solid)',
                          color: 'var(--color-on-dark)',
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
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-info-300)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {ep.series}
                      </span>
                      {ep.marketName && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-on-dark-muted)', fontWeight: 600 }}>
                          📍 {ep.marketName.slice(0, 24)}...
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-on-dark)', lineHeight: 1.35, marginBottom: '0.65rem' }}>
                      {ep.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-on-dark-muted)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ep.description}
                    </p>

                    {/* Featured Products Pills */}
                    {ep.featuredProducts && ep.featuredProducts.length > 0 && (
                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-canvas-dark-line-strong)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {ep.featuredProducts.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              background: 'var(--color-canvas-dark)',
                              border: '1px solid var(--color-canvas-dark-line-strong)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              color: 'var(--color-brand-400)',
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

                <div style={{ padding: '0.85rem 1.25rem', background: 'var(--color-canvas-dark)', borderTop: '1px solid var(--color-canvas-dark-line-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-on-dark-muted)' }}>
                    {ep.chapters?.length || 4} Chapters Available
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-info-300)', fontWeight: 800 }}>
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
              background: 'var(--color-canvas-dark)',
              border: '1px solid var(--color-canvas-dark-line-strong)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--color-canvas-dark-raised)', borderBottom: '1px solid var(--color-canvas-dark-line-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-info-300)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {selectedEpisode.series} · {selectedEpisode.duration}
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-on-dark)', margin: '0.1rem 0 0 0' }}>
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
                  color: 'var(--color-on-dark)',
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
              <div style={{ background: 'var(--color-canvas-black)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--color-canvas-black)' }}>
                  <video
                    src={selectedEpisode.videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ padding: '1.25rem', flex: 1, background: 'var(--color-canvas-dark)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-on-dark)', marginBottom: '0.5rem' }}>
                    Episode Overview
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-on-dark-muted)', lineHeight: 1.6 }}>
                    {selectedEpisode.description}
                  </p>
                </div>
              </div>

              {/* Sidebar: Chapters & Featured Products */}
              <div style={{ background: 'var(--color-canvas-dark-raised)', borderLeft: '1px solid var(--color-canvas-dark-line-strong)', padding: '1.25rem', overflowY: 'auto' }}>
                {/* Chapters */}
                {selectedEpisode.chapters && selectedEpisode.chapters.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-on-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
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
                            background: activeChapterIndex === idx ? 'var(--color-brand-solid)' : 'var(--color-canvas-dark)',
                            border: activeChapterIndex === idx ? '1px solid var(--color-info-500)' : '1px solid var(--color-canvas-dark-line-strong)',
                            color: 'var(--color-on-dark)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: activeChapterIndex === idx ? 'var(--color-on-dark)' : 'var(--color-info-300)' }}>
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
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-on-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                    🛍️ Products in this Episode
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(selectedEpisode.featuredProducts || [
                      { title: 'Featured Wholesale Unit', price: 14850, stockist: 'Verified Importer', link: '/search' },
                    ]).map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          background: 'var(--color-canvas-dark)',
                          border: '1px solid var(--color-canvas-dark-line-strong)',
                          borderRadius: '10px',
                          padding: '0.85rem',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-info-300)', fontWeight: 700, marginBottom: '0.2rem' }}>
                          🏬 {prod.stockist}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-on-dark)', marginBottom: '0.35rem' }}>
                          {prod.title}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-brand-400)', marginBottom: '0.65rem' }}>
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
                            style={{ fontSize: '0.75rem', fontWeight: 800, borderRadius: '6px', color: 'var(--color-on-dark)', borderColor: 'var(--color-canvas-dark-line-strong)' }}
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
