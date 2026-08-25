'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ShowEpisode {
  id: string;
  title: string;
  series: string;
  duration: string;
  marketName: string;
  views: number;
  featuredProductsCount: number;
  videoThumbUrl: string;
  description: string;
}

export default function ShowsPage() {
  const [activeSeries, setActiveSeries] = useState<string>('all');
  const [selectedEpisode, setSelectedEpisode] = useState<ShowEpisode | null>(null);

  const episodes: ShowEpisode[] = [
    {
      id: 'ep_01',
      title: 'Dragon City Wholesale Walk: Exploring Building 2 Solar & Inverter Importers',
      series: 'Market Walk South Africa',
      duration: '14:20',
      marketName: 'Dragon City Wholesale Mall, Crown Mines',
      views: 48200,
      featuredProductsCount: 12,
      videoThumbUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop',
      description: 'We walk through Dragon City Wholesale with local traders, comparing bulk prices for 5kW Deye and Sunsynk inverters directly from verified importers.',
    },
    {
      id: 'ep_02',
      title: 'Sandton City Diamond Walk & Level 2 Tech: Premium Solar & Computing Showcases',
      series: 'Market Walk South Africa',
      duration: '18:45',
      marketName: 'Sandton City, Johannesburg',
      views: 62100,
      featuredProductsCount: 8,
      videoThumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop',
      description: 'Visiting authorized distributors and specialist clean-energy retail studios in Sandton City Nelson Mandela Square concourses.',
    },
    {
      id: 'ep_03',
      title: 'Deye 8kW vs Sunsynk 8kW: Lab Load Benchmarks & Auxiliary Generator Switching',
      series: 'Product Battles: Solar & Tech',
      duration: '22:10',
      marketName: 'Shoppage Engineering Lab',
      views: 94500,
      featuredProductsCount: 4,
      videoThumbUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&h=450&fit=crop',
      description: 'Comprehensive side-by-side electrical test: MPPT efficiency, fan noise under 8000W load, and smart BMS communication with Dyness lithium batteries.',
    },
    {
      id: 'ep_04',
      title: 'Oriental Plaza Grand Bazaar: Tech Gadgets, Battery Packs & Bargain Hunting',
      series: 'Market Walk South Africa',
      duration: '16:05',
      marketName: 'Oriental Plaza Fordsburg, Johannesburg',
      views: 53800,
      featuredProductsCount: 15,
      videoThumbUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop',
      description: 'Navigating the Grand Bazaar at Oriental Plaza for cellular accessories, portable power stations, and wholesale electronics.',
    },
  ];

  const filtered = activeSeries === 'all' ? episodes : episodes.filter((e) => e.series === activeSeries);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem' }}>📺</span>
          <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
            Original Video Programming
          </span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#0F172A' }}>
          Market Walk & Product Battle Series
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Structured multi-episode tours of South Africa&apos;s commercial hubs, teardowns, and verified merchant stock.
        </p>
      </div>

      {/* Series Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {['all', 'Market Walk South Africa', 'Product Battles: Solar & Tech'].map((s) => (
          <button
            key={s}
            onClick={() => setActiveSeries(s)}
            className={`btn ${activeSeries === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            {s === 'all' ? 'All Original Series' : s}
          </button>
        ))}
      </div>

      {/* Episode Modal */}
      {selectedEpisode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '800px', width: '100%', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ position: 'relative', width: '100%', height: '400px', background: '#000000' }}>
              <img src={selectedEpisode.videoThumbUrl} alt={selectedEpisode.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,99,235,0.9)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', cursor: 'pointer' }}>
                  ▶
                </div>
              </div>
              <button
                onClick={() => setSelectedEpisode(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{selectedEpisode.series}</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0', color: '#0F172A' }}>
                {selectedEpisode.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem 0', lineHeight: 1.5 }}>
                {selectedEpisode.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  📍 {selectedEpisode.marketName} · ⏱️ {selectedEpisode.duration}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href="/search?category=solar_energy" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    View Featured Products ({selectedEpisode.featuredProductsCount}) &rarr;
                  </Link>
                  <button onClick={() => setSelectedEpisode(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Episodes Grid */}
      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        {filtered.map((ep) => (
          <div key={ep.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF' }}>
            <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000000', cursor: 'pointer' }} onClick={() => setSelectedEpisode(ep)}>
              <img src={ep.videoThumbUrl} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />

              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37,99,235,0.9)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  ▶
                </div>
              </div>

              <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.8)', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                {ep.duration}
              </span>

              <span style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#F1F5F9', fontSize: '0.75rem' }}>
                👁️ {ep.views.toLocaleString()} views
              </span>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <span className="badge badge-blue" style={{ marginBottom: '0.4rem', fontSize: '0.7rem' }}>
                {ep.series}
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#0F172A', lineHeight: 1.35 }}>
                {ep.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                {ep.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  📍 {ep.marketName.slice(0, 30)}...
                </span>
                <button onClick={() => setSelectedEpisode(ep)} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
                  Watch Episode &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
