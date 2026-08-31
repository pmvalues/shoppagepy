'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SHORTS, MediaItem } from '@/lib/media';

export default function ShortsRail() {
  const [activeModalItem, setActiveModalItem] = useState<MediaItem | null>(null);

  return (
    <div>
      <div className="rail-track" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {SHORTS.map((short) => (
          <div
            key={short.id}
            onClick={() => setActiveModalItem(short)}
            className="card card-interactive"
            style={{
              width: '240px',
              flex: '0 0 auto',
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {/* Thumbnail Canvas */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 16', background: '#000000', overflow: 'hidden' }}>
              <img
                src={short.thumbnailUrl}
                alt={short.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(0,0,0,0.3) 100%)' }} />

              <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                {short.duration}
              </span>

              {/* Play Badge */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(37, 99, 235, 0.9)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  ▶
                </span>
              </div>

              {/* Details Overlay */}
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                <div style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 800, marginBottom: '0.2rem' }}>
                  🏬 {short.merchantName}
                </div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {short.title}
                </h4>

                {short.priceZar && (
                  <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.5)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 900, color: '#34D399' }}>
                    R {short.priceZar.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instant Video Modal */}
      {activeModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              height: '88vh',
              maxHeight: '800px',
              background: '#000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalItem(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 30,
              }}
            >
              ✕
            </button>

            <video
              src={activeModalItem.videoUrl}
              autoPlay
              controls
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Bottom Overlay Info */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)', zIndex: 20 }}>
              <div style={{ fontSize: '0.8rem', color: '#60A5FA', fontWeight: 800, marginBottom: '0.2rem' }}>
                🏬 {activeModalItem.merchantName}
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                {activeModalItem.title}
              </h3>

              {activeModalItem.featuredProducts && activeModalItem.featuredProducts[0] && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.9)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#34D399' }}>
                    R {activeModalItem.featuredProducts[0].price.toLocaleString()}
                  </div>
                  <Link
                    href={activeModalItem.featuredProducts[0].link}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', fontWeight: 800 }}
                  >
                    Compare Sellers &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
