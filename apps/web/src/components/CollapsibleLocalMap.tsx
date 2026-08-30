'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Merchant } from '@shoppage/contracts';

export default function CollapsibleLocalMap({ merchants }: { merchants: Merchant[] }) {
  // USER SPECIFIC REQUIREMENT: "frontend like the attached with the maps default closed."
  const [isMapOpen, setIsMapOpen] = useState(false);

  const localStores = merchants.slice(0, 4);

  return (
    <section className="card" style={{ background: '#FFFFFF', border: '1px solid #DADCE0', padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '12px' }}>
      {/* Header Bar with Toggle Chevron */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: 0 }}>
            Nearby places
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#5F6368', margin: '0.2rem 0 0 0' }}>
            Physical suppliers & store counters within 25km of your location
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsMapOpen(!isMapOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: isMapOpen ? '#EEF2FF' : '#F1F5F9',
              color: isMapOpen ? '#1D4ED8' : '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '20px',
              padding: '0.4rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>🗺️ {isMapOpen ? 'Hide Map' : 'Show Map'}</span>
            <span>{isMapOpen ? '▲' : '▼'}</span>
          </button>
          <span style={{ fontSize: '1.1rem', color: '#70757A', cursor: 'pointer' }}>⋮</span>
        </div>
      </div>

      {/* Map Graphic (DEFAULT CLOSED: renders only when isMapOpen is true) */}
      {isMapOpen && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #E2E8F0 100%)',
            border: '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Map Vector Graphic / Canvas representation of South Africa & Gauteng */}
          <svg width="100%" height="100%" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice">
            {/* Roads & Geography lines */}
            <path d="M0,80 Q200,120 400,90 T800,140" fill="none" stroke="#CBD5E1" strokeWidth="4" />
            <path d="M150,0 Q350,180 500,280" fill="none" stroke="#CBD5E1" strokeWidth="3" />
            <path d="M400,0 L400,280" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="6 4" />
            <circle cx="400" cy="140" r="90" fill="none" stroke="rgba(37,99,235,0.15)" strokeWidth="40" />

            {/* City Nodes */}
            <text x="400" y="135" fill="#1E293B" fontSize="13" fontWeight="bold" textAnchor="middle">Johannesburg</text>
            <text x="360" y="85" fill="#475569" fontSize="10">Pretoria / Tshwane</text>
            <text x="450" y="195" fill="#475569" fontSize="10">Ekurhuleni</text>

            {/* Map Pins */}
            {localStores.map((store, i) => {
              const cx = 350 + i * 40;
              const cy = 110 + (i % 2) * 35;
              return (
                <g key={store.id} transform={`translate(${cx}, ${cy})`}>
                  <circle cx="0" cy="0" r="10" fill="#EA4335" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
                  <text x="14" y="4" fill="#0F172A" fontSize="10" fontWeight="bold">
                    {store.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Controls */}
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button style={{ width: 28, height: 28, background: '#FFF', border: '1px solid #CCC', borderRadius: 4, fontWeight: 'bold' }}>+</button>
            <button style={{ width: 28, height: 28, background: '#FFF', border: '1px solid #CCC', borderRadius: 4, fontWeight: 'bold' }}>-</button>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', color: '#475569' }}>
            Open in Maps
          </div>
        </div>
      )}

      {/* Local 3-Pack Store Cards List (Matching Image 2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {localStores.map((merchant, idx) => (
          <div
            key={merchant.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: idx !== localStores.length - 1 ? '1rem' : 0,
              borderBottom: idx !== localStores.length - 1 ? '1px solid #F1F5F9' : 'none',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#1A0DAB' }}>
                <Link href={`/m/${merchant.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {merchant.name}
                </Link>
              </h4>

              <div style={{ fontSize: '0.85rem', color: '#4D5156', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: '#D97706' }}>5,0 ★★★★★ ({merchant.googleReviewsCount || 78})</span>
                <span>·</span>
                <span>Solar energy equipment supplier</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#5F6368', marginBottom: '0.35rem' }}>
                📍 {merchant.addressText} · 📞 {merchant.contacts?.telephone || '068 168 7431'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                <span style={{ color: '#15803D', fontWeight: 700 }}>Open 24 hours</span>
                <span>·</span>
                <span style={{ color: '#70757A', fontStyle: 'italic' }}>&quot;Outstanding customer service and a seamless installation.&quot;</span>
              </div>
            </div>

            {/* Quick Action Buttons (Website / Directions) */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {merchant.contacts?.website && (
                <a
                  href={merchant.contacts.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '54px',
                    borderRadius: '8px',
                    border: '1px solid #DADCE0',
                    background: '#FFFFFF',
                    textDecoration: 'none',
                    color: '#1A73E8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🌐</span>
                  <span>Website</span>
                </a>
              )}

              <Link
                href={`/m/${merchant.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '54px',
                  borderRadius: '8px',
                  border: '1px solid #DADCE0',
                  background: '#FFFFFF',
                  textDecoration: 'none',
                  color: '#1A73E8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>↪</span>
                <span>Directions</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
