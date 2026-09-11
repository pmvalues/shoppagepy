'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SHORTS, MediaItem } from '@/lib/media';

/**
 * Video chrome (tiles, scrims, modals) sits on top of media, so it is dark in
 * BOTH themes by design. It therefore uses stable neutral values rather than the
 * themed surface tokens — `bg-surface` would turn the tile light in light mode
 * and destroy the contrast the overlay text depends on.
 */
export default function ShortsRail() {
  const [activeModalItem, setActiveModalItem] = useState<MediaItem | null>(null);

  return (
    <div>
      <div className="flex gap-5 overflow-x-auto pb-4">
        {SHORTS.map((short) => (
          <button
            key={short.id}
            type="button"
            onClick={() => setActiveModalItem(short)}
            aria-label={`Play ${short.title}`}
            className="group w-60 shrink-0 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-800 p-0 text-left transition duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-brand-500"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
              <img
                src={short.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30" />

              <span className="absolute left-2.5 top-2.5 rounded bg-black/65 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                {short.duration}
              </span>

              {/* Play affordance */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-solid/90 text-white shadow-lg transition duration-300 ease-out-expo group-hover:scale-110 group-hover:bg-brand-solid-hover">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-0.5 h-5 w-5">
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  </svg>
                </span>
              </span>

              {/* Overlay details */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className="mb-0.5 text-xs font-semibold text-brand-400">{short.merchantName}</p>
                <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
                  {short.title}
                </h4>

                {short.priceZar && (
                  <span className="inline-block rounded border border-brand-500/50 bg-brand-500/25 px-2 py-0.5 text-xs font-bold text-brand-300">
                    R {short.priceZar.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Instant video modal */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative h-[88vh] max-h-[800px] w-full max-w-[420px] overflow-hidden rounded-[20px] bg-black shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <video
              src={activeModalItem.videoUrl}
              autoPlay
              controls
              loop
              className="h-full w-full object-cover"
            />

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 to-transparent p-5">
              <p className="mb-0.5 text-sm font-semibold text-brand-400">
                {activeModalItem.merchantName}
              </p>
              <h3 className="mb-3 text-base font-semibold text-white">{activeModalItem.title}</h3>

              {activeModalItem.featuredProducts && activeModalItem.featuredProducts[0] && (
                <div className="flex items-center justify-between rounded-lg bg-neutral-800/90 px-3.5 py-2.5">
                  <div className="text-sm font-bold text-brand-300">
                    R {activeModalItem.featuredProducts[0].price.toLocaleString()}
                  </div>
                  <Link
                    href={activeModalItem.featuredProducts[0].link}
                    className="rounded-full bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white transition duration-200 ease-out-expo hover:bg-brand-solid-hover"
                  >
                    Compare sellers →
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
