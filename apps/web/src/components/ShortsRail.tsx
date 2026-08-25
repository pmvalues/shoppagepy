'use client';

import { SHORTS } from '@/lib/media';
import VideoCard from './VideoCard';

export default function ShortsRail() {
  return (
    <div className="rail-track">
      {SHORTS.map((s) => (
        <div key={s.id} style={{ width: 250, flex: '0 0 auto' }}>
          <VideoCard item={s} aspect="vertical" showActions />
        </div>
      ))}
    </div>
  );
}
