'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProofShort {
  id: string;
  title: string;
  productTitle: string;
  productRef: string;
  merchantName: string;
  merchantWhatsApp: string;
  views: number;
  likes: number;
  shares: number;
  duration: string;
  thumbnailUrl: string;
  summary: string;
}

export default function ShortsPage() {
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});

  const shorts: ProofShort[] = [
    {
      id: 'sh_01',
      title: '🔥 Deye 5kW Hybrid Inverter Full Teardown & Real Load Test under Stage 6',
      productTitle: 'Deye 5kW 48V Hybrid Inverter',
      productRef: 'var_deye_5kw_hybrid',
      merchantName: 'SolarBros Sandton',
      merchantWhatsApp: '27712345678',
      views: 42500,
      likes: 1840,
      shares: 420,
      duration: '0:58',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
      summary: 'Testing dual MPPT strings and 4ms UPS switchover with 5000W load.',
    },
    {
      id: 'sh_02',
      title: '🔋 6,000 Cycles! Dyness BX51100 5.12kWh Lithium Battery Inside Look & Runtime',
      productTitle: 'Dyness BX51100 5.12kWh Lithium Battery',
      productRef: 'var_dyness_5kwh_battery',
      merchantName: 'SunPower Solutions Crown Mines',
      merchantWhatsApp: '27829876543',
      views: 28900,
      likes: 1220,
      shares: 290,
      duration: '0:48',
      thumbnailUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
      summary: 'Checking smart BMS communication and 11.4h backup runtime on home essentials.',
    },
    {
      id: 'sh_03',
      title: '🏢 Dragon City Wholesale Mall: Walking the Solar & Tech Aisles in Crown Mines',
      productTitle: 'Dragon City Wholesale Mall',
      productRef: 'mkt_dragon_city',
      merchantName: 'Dragon City Traders Association',
      merchantWhatsApp: '27118301234',
      views: 88200,
      likes: 4100,
      shares: 980,
      duration: '1:12',
      thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=480&h=854&fit=crop',
      summary: 'Exploring building 2 wholesale pricing and importer trade counters.',
    },
    {
      id: 'sh_04',
      title: '⚡ Sunsynk 8kW Single Phase vs Three Phase: Which One Fits Your Home?',
      productTitle: 'Sunsynk 8kW Single Phase Hybrid Inverter',
      productRef: 'var_sunsynk_8kw_hybrid',
      merchantName: 'SolarBros Sandton',
      merchantWhatsApp: '27712345678',
      views: 34100,
      likes: 1560,
      shares: 340,
      duration: '0:55',
      thumbnailUrl: 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=480&h=854&fit=crop',
      summary: 'Auxiliary load port configuration for geysers and smart generator integration.',
    },
  ];

  const handleLike = (id: string, initialLikes: number) => {
    if (!hasLiked[id]) {
      setLikes({ ...likes, [id]: (likes[id] || initialLikes) + 1 });
      setHasLiked({ ...hasLiked, [id]: true });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem' }}>🎬</span>
          <span style={{ fontSize: '0.8rem', color: '#6D28D9', fontWeight: 700 }}>
            Video Commerce & Proof Engine
          </span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#0F172A' }}>
          Proof Shorts & Lab Teardowns
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Verified hardware tests, teardowns, and mall walkthroughs tethered directly to canonical Master Products and live merchant WhatsApp actions.
        </p>
      </div>

      {/* Shorts Grid */}
      <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
        {shorts.map((short) => {
          const currentLikes = likes[short.id] || short.likes;
          const userLiked = hasLiked[short.id];

          return (
            <div
              key={short.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0',
                overflow: 'hidden',
                background: '#FFFFFF',
              }}
            >
              {/* Vertical Video Thumbnail */}
              <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000000', overflow: 'hidden' }}>
                <img
                  src={short.thumbnailUrl}
                  alt={short.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

                {/* Duration Badge */}
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⏱️ {short.duration}
                </span>

                {/* Views Badge */}
                <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                  👁️ {short.views.toLocaleString()} views
                </span>

                {/* Overlaid Title */}
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', color: '#FFFFFF' }}>
                  <span className="badge badge-green" style={{ marginBottom: '0.4rem', fontSize: '0.65rem', background: '#10B981', color: '#FFFFFF' }}>
                    {short.merchantName}
                  </span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, lineHeight: 1.3, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                    {short.title}
                  </h3>
                </div>
              </div>

              {/* Short Body & Actions */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  {short.summary}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <button
                    onClick={() => handleLike(short.id, short.likes)}
                    style={{
                      background: userLiked ? '#ECFDF5' : 'transparent',
                      border: userLiked ? '1px solid #A7F3D0' : 'none',
                      color: userLiked ? '#059669' : 'inherit',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontWeight: 600,
                    }}
                  >
                    👍 {currentLikes.toLocaleString()}
                  </button>

                  <span>🔗 {short.shares} shares</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <Link
                    href={`/p/${short.productRef}`}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}
                  >
                    Compare Sellers ({short.productTitle.slice(0, 20)}...)
                  </Link>

                  <a
                    href={`https://wa.me/${short.merchantWhatsApp}?text=${encodeURIComponent(`Hi ${short.merchantName}, I saw your video short on "${short.title}". Can you give me a quote?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                    style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}
                  >
                    💬 WhatsApp {short.merchantName}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
