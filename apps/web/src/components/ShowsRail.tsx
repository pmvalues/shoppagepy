'use client';

import { SHOWS } from '@/lib/media';
import VideoCard from './VideoCard';

export default function ShowsRail() {
  return (
    <div className="rail-track">
      {SHOWS.map((ep) => (
        <div key={ep.id} style={{ width: 360, flex: '0 0 auto' }}>
          <VideoCard item={ep} aspect="horizontal" showActions />
        </div>
      ))}
    </div>
  );
}
