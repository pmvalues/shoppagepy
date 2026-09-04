'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ShortItem } from '@/lib/feed';
import { showToast } from '@/lib/toast';

export default function ShortsViewerModal({
  short,
  shortsList,
  onClose,
  onSelectShort,
}: {
  short: ShortItem | null;
  shortsList: ShortItem[];
  onClose: () => void;
  onSelectShort: (short: ShortItem) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [likesCountDelta, setLikesCountDelta] = useState<Record<string, number>>({});

  const currentIndex = short
    ? shortsList.findIndex((s) => s.id === short.id)
    : -1;

  const goToNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < shortsList.length - 1) {
      onSelectShort(shortsList[currentIndex + 1]);
    } else if (shortsList.length > 0) {
      onSelectShort(shortsList[0]);
    }
  }, [currentIndex, shortsList, onSelectShort]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectShort(shortsList[currentIndex - 1]);
    } else if (shortsList.length > 0) {
      onSelectShort(shortsList[shortsList.length - 1]);
    }
  }, [currentIndex, shortsList, onSelectShort]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNext, goToPrev]);

  // When short changes, reset video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Auto-play policy may require muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
      setIsPlaying(true);
    }
  }, [short?.id]);

  if (!short) return null;

  const isCurrentLiked = !!liked[short.id];
  const isCurrentFollowed = !!followed[short.id];
  const delta = likesCountDelta[short.id] || 0;
  const totalLikes = (short.likes || 1200) + delta;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => ({ ...prev, [short.id]: !isCurrentLiked }));
    setLikesCountDelta((prev) => ({
      ...prev,
      [short.id]: isCurrentLiked ? (prev[short.id] || 0) - 1 : (prev[short.id] || 0) + 1,
    }));
  };

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowed((prev) => ({ ...prev, [short.id]: !isCurrentFollowed }));
    showToast(
      isCurrentFollowed ? `Unfollowed ${short.merchantName || 'Merchant'}` : `Following ${short.merchantName || 'Merchant'}`,
      'info',
    );
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?tab=shorts&shortId=${short.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
      showToast('Reel link copied to clipboard', 'info');
    }
  };

  const featured = short.featuredProducts?.[0];
  const whatsappUrl = `https://wa.me/${short.merchantWhatsApp || '27820000000'}?text=${encodeURIComponent(
    `Hi ${short.merchantName || 'Merchant'}, I watched your Shoppage video "${short.title}" and want to inquire about purchasing${
      featured ? ` ${featured.title} (${featured.badge || ''} R${featured.price.toLocaleString('en-ZA')})` : ''
    }.`,
  )}`;

  return (
    <div
      className="modal-backdrop shorts-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={short.title}
    >
      <div
        className="shorts-reel-viewport"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Player */}
        <div className="shorts-video-wrapper" onClick={togglePlay}>
          {short.videoUrl ? (
            <video
              ref={videoRef}
              src={short.videoUrl}
              poster={short.img}
              loop
              playsInline
              autoPlay
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              className="shorts-video-elem"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={short.img}
              alt={short.title}
              className="shorts-video-elem poster-fallback"
            />
          )}

          {/* Central Play/Pause Animation Overlay */}
          {!isPlaying && (
            <div className="play-pause-indicator">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Scrubber Progress Line */}
          <div className="reel-progress-track">
            <div
              className="reel-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="reel-top-bar">
          <button
            type="button"
            className="reel-icon-btn close-btn"
            onClick={onClose}
            aria-label="Close reels viewer"
          >
            ✕
          </button>

          {short.category && (
            <span className="reel-category-pill">{short.category}</span>
          )}

          <button
            type="button"
            className="reel-icon-btn sound-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Right Action Rail (Vertical Buttons) */}
        <div className="reel-actions-rail">
          {/* Like */}
          <button
            type="button"
            className={`reel-action-circle${isCurrentLiked ? ' liked' : ''}`}
            onClick={handleToggleLike}
            aria-label={`Like (${totalLikes})`}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" fill={isCurrentLiked ? '#EF4444' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <span className="count">
              {totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}
            </span>
          </button>

          {/* WhatsApp Direct */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="reel-action-circle whatsapp-circle"
            aria-label="Contact Merchant via WhatsApp"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="icon">💬</span>
            <span className="count">Order</span>
          </a>

          {/* Share */}
          <button
            type="button"
            className="reel-action-circle"
            onClick={handleShare}
            aria-label="Share video"
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            <span className="count">Share</span>
          </button>

          {/* Up Navigation (Previous Short) */}
          <button
            type="button"
            className="reel-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            title="Previous video (Arrow Up)"
            aria-label="Previous video"
          >
            ▲
          </button>

          {/* Down Navigation (Next Short) */}
          <button
            type="button"
            className="reel-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            title="Next video (Arrow Down)"
            aria-label="Next video"
          >
            ▼
          </button>
        </div>

        {/* Bottom Metadata Overlay */}
        <div className="reel-bottom-info">
          {/* Merchant Profile */}
          <div className="reel-merchant-row">
            <div className="avatar g7 reel-avatar">
              {(short.merchantName || 'SP').slice(0, 2).toUpperCase()}
            </div>
            <div className="merchant-name-block">
              <span className="merchant-name">{short.merchantName || 'Verified Merchant'}</span>
              <span className="verified-check">✓</span>
            </div>
            <button
              type="button"
              className={`reel-follow-btn${isCurrentFollowed ? ' following' : ''}`}
              onClick={handleToggleFollow}
            >
              {isCurrentFollowed ? 'Following' : '+ Follow'}
            </button>
          </div>

          {/* Short Title & Summary */}
          <h3 className="reel-title">{short.title}</h3>
          {short.summary && (
            <p className="reel-desc">{short.summary}</p>
          )}

          {/* Tagged Product Pill Card */}
          {featured && (
            <div className="reel-product-card">
              <div className="prod-badge-indicator">🏷️ TAGGED TRADE ITEM</div>
              <div className="prod-card-body">
                <div className="prod-card-left">
                  <span className="prod-title">{featured.title}</span>
                  <span className="prod-price">
                    R {featured.price.toLocaleString('en-ZA')}
                  </span>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="prod-btn-inquire"
                  onClick={(e) => e.stopPropagation()}
                >
                  Buy via WhatsApp 💬
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
