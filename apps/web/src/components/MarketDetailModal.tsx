'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { MarketItem } from '@/lib/feed';
import { showToast } from '@/lib/toast';

export default function MarketDetailModal({
  market,
  onClose,
  isFav = false,
  isFollowed = false,
  onToggleFav,
  onToggleFollow,
}: {
  market: MarketItem | null;
  onClose: () => void;
  isFav?: boolean;
  isFollowed?: boolean;
  onToggleFav?: (id: string, name: string) => void;
  onToggleFollow?: (id: string, name: string) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!market) return null;

  const mapsUrl =
    market.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${market.name} ${market.location}`,
    )}`;

  const shareMarket = () => {
    const url = `${window.location.origin}${market.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
      showToast('Market link copied to clipboard', 'info');
    }
  };

  const whatsappTradeDeskUrl = `https://wa.me/${market.whatsapp || '27820000000'}?text=${encodeURIComponent(
    `Hi Shoppage Trade Desk, I'm inquiring about wholesale stalls, trading hours, and verified merchants at ${market.name} (${market.province}).`,
  )}`;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-modal-title"
    >
      <div
        className="modal-sheet market-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-top">
          <div className="modal-brand-badge">
            <span className="dot" />
            VERIFIED TRADE PRECINCT · {market.province.toUpperCase()}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Hero Profile */}
        <div className="market-modal-hero">
          <div className={`avatar ${market.avatarClass} modal-avatar`}>
            {market.initials}
          </div>
          <div className="market-hero-details">
            <div className="market-title-row">
              <h2 id="market-modal-title">{market.name}</h2>
              <span className="vbadge-pill">✓ Verified</span>
            </div>
            <div className="market-meta-row">
              <span className="market-handle">{market.handle}</span>
              <span className="bullet">·</span>
              <span className="chip-cat">{market.typeLabel}</span>
              <span className="bullet">·</span>
              <span className="market-province">📍 {market.province}</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="market-toolbar">
          {onToggleFav && (
            <button
              type="button"
              className={`action-pill fav-pill${isFav ? ' active' : ''}`}
              onClick={() => onToggleFav(market.id, market.name)}
            >
              {isFav ? '★ Favoured' : '☆ Add to Favourites'}
            </button>
          )}
          {onToggleFollow && (
            <button
              type="button"
              className={`action-pill follow-pill${isFollowed ? ' active' : ''}`}
              onClick={() => onToggleFollow(market.id, market.name)}
            >
              {isFollowed ? '✓ Following Market' : '+ Follow Updates'}
            </button>
          )}
          <button
            type="button"
            className="action-pill share-pill"
            onClick={shareMarket}
          >
            📋 Share
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="market-stats-strip">
          <div className="stat-box">
            <span className="stat-num">{market.stalls ? `${market.stalls}+` : '150+'}</span>
            <span className="stat-lbl">Active Stalls</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">
              {market.type === 'wholesale_plaza'
                ? 'Wholesale'
                : market.type === 'mega_mall'
                ? 'Retail & Flagship'
                : 'Trade Rank'}
            </span>
            <span className="stat-lbl">Commerce Format</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{market.metro || market.province}</span>
            <span className="stat-lbl">Trading Metro</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">Tax Invoices</span>
            <span className="stat-lbl">B2B Compliance</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="market-modal-body">
          {/* Description */}
          <div className="market-section">
            <h4 className="section-title">About the Precinct</h4>
            <p className="section-desc">{market.description}</p>
          </div>

          {/* Operating Hours & Safety */}
          <div className="market-section-grid">
            <div className="info-card">
              <div className="info-card-head">
                <span className="icon">⏰</span>
                <b>Operating Hours</b>
              </div>
              <p className="info-card-text">
                {market.operatingHours || 'Mon-Sat: 08:30 - 17:30 | Sun: 09:00 - 14:00'}
              </p>
            </div>

            <div className="info-card">
              <div className="info-card-head">
                <span className="icon">🛡️</span>
                <b>Access &amp; Security</b>
              </div>
              <p className="info-card-text">
                {market.safetyNotices && market.safetyNotices.length > 0
                  ? market.safetyNotices.join(' · ')
                  : 'Covered parking, private on-site armed security, loading bays available.'}
              </p>
            </div>
          </div>

          {/* Location & Directions */}
          <div className="market-section">
            <h4 className="section-title">Physical Address &amp; Directions</h4>
            <div className="location-box">
              <div className="loc-text">
                <p className="loc-street">🏢 {market.location}</p>
                {market.landmarks && market.landmarks.length > 0 && (
                  <p className="loc-landmarks">
                    Landmarks: {market.landmarks.join(' · ')}
                  </p>
                )}
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map"
              >
                Open in Google Maps ↗
              </a>
            </div>
          </div>

          {/* Zones & Specialized Trade Sections */}
          {market.zones && market.zones.length > 0 && (
            <div className="market-section">
              <h4 className="section-title">Specialized Trade Zones ({market.zones.length})</h4>
              <div className="zones-list">
                {market.zones.map((z, i) => (
                  <div key={i} className="zone-chip-item">
                    <span className="zone-name">{z.name}</span>
                    {z.stallCount && (
                      <span className="zone-stalls">{z.stallCount} stalls</span>
                    )}
                    {z.categoryFocus && (
                      <span className="zone-focus">{z.categoryFocus.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="market-modal-footer">
          <Link
            href={market.href}
            className="btn-browse-stalls"
            onClick={onClose}
          >
            Explore Full Stall Directory 🏢
          </Link>
          <a
            href={whatsappTradeDeskUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-desk"
          >
            WhatsApp Trade Desk 💬
          </a>
        </div>
      </div>
    </div>
  );
}
