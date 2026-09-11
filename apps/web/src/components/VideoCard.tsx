'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MediaItem } from '@/lib/media';

export default function VideoCard({
  item,
  aspect = 'vertical',
  showActions = false,
}: {
  item: MediaItem;
  aspect?: 'vertical' | 'horizontal';
  showActions?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const isVertical = aspect === 'vertical';

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        background: 'var(--color-canvas-black)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: isVertical ? '9 / 16' : '16 / 9', background: 'var(--color-canvas-black)' }}>
        {playing ? (
          <video src={item.videoUrl} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
            <button
              onClick={() => setPlaying(true)}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Play video"
            >
              <span
                style={{
                  width: isVertical ? 56 : 64,
                  height: isVertical ? 56 : 64,
                  borderRadius: '50%',
                  background: 'var(--color-brand-solid)',
                  color: 'var(--color-on-solid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isVertical ? '1.5rem' : '1.75rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                ▶
              </span>
            </button>
            <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'var(--color-on-solid)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
              {item.duration}
            </span>
            <span style={{ position: 'absolute', bottom: 10, left: 10, color: 'var(--color-content-inverse)', fontSize: '0.75rem' }}>
              👁️ {item.views.toLocaleString()}
            </span>
          </>
        )}
      </div>

      <div style={{ padding: '1rem', background: 'var(--color-surface)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="badge badge-green" style={{ fontSize: '0.65rem', marginBottom: '0.4rem', alignSelf: 'flex-start' }}>
          {item.merchantName || item.series || 'Shoppage'}
        </span>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0', lineHeight: 1.3, color: 'var(--color-content)' }}>{item.title}</h3>
        {item.summary && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.25rem 0' }}>{item.summary}</p>}

        {item.productRef && (
          <Link href={`/p/${item.productRef}`} className="btn btn-outline" style={{ fontSize: '0.75rem', marginTop: '0.6rem', width: '100%', padding: '0.4rem' }}>
            Compare Sellers →
          </Link>
        )}

        {showActions && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
            <button
              onClick={() => setLiked((v) => !v)}
              style={{
                background: liked ? 'var(--color-brand-50)' : 'transparent',
                border: liked ? '1px solid var(--color-brand-200)' : 'none',
                color: liked ? 'var(--color-brand-ink)' : 'inherit',
                padding: '0.25rem 0.5rem',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              👍 {((item.likes || 0) + (liked ? 1 : 0)).toLocaleString()}
            </button>
            <span>🔗 {item.shares || 0} shares</span>
          </div>
        )}
      </div>
    </div>
  );
}
