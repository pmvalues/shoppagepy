'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SA_FLAGSHIP_MARKETS } from '@shoppage/kernel';

export default function FieldMarshalPage() {
  const [coords, setCoords] = useState<{ lat: string; lng: string }>({ lat: '-26.1076', lng: '28.0567' });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [bountyEarnedZar, setBountyEarnedZar] = useState(650);

  const [formData, setFormData] = useState({
    marshalCode: 'FM-JHB-842',
    marketId: 'mkt_sandton_city',
    customMarketName: '',
    isVirtualMarket: false,
    virtualMarketCategory: 'wholesale_solar',
    storeName: '',
    stallNumber: '',
    whatsappPhone: '+27 ',
    category: 'solar_energy',
    cipcNumber: '',
    storefrontPhotoUrl: '',
  });

  const [submittedStores, setSubmittedStores] = useState([
    { id: 'sub_1', name: 'Sandton Solar Solutions', stall: 'Shop L2-14', market: 'Sandton City', time: '10 mins ago', bounty: 50 },
    { id: 'sub_2', name: 'Dragon Wholesale Electronics', stall: 'Building 2 Stall 44', market: 'Dragon City Wholesale', time: '1 hour ago', bounty: 50 },
  ]);

  const [successMsg, setSuccessMsg] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
          setIsDetectingLocation(false);
        },
        () => setIsDetectingLocation(false)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: `sub_${Date.now()}`,
      name: formData.storeName,
      stall: formData.stallNumber || 'Main Concourse',
      market: formData.isVirtualMarket ? (formData.customMarketName || 'Virtual B2B Node') : 'Sandton City',
      time: 'Just now',
      bounty: 50,
    };
    setSubmittedStores([newEntry, ...submittedStores]);
    setBountyEarnedZar(prev => prev + 50);
    setSuccessMsg(true);
    setFormData({
      ...formData,
      storeName: '',
      stallNumber: '',
      whatsappPhone: '+27 ',
      cipcNumber: '',
    });
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      {/* Field Marshal Header & Bounty Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>🎖️ Field Marshal Ground Portal</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, color: 'var(--slate-900)' }}>
            Spatial Store & Market Ingestion
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>
            Officer ID: <strong>{formData.marshalCode}</strong> · Onboard physical stalls & virtual nodes.
          </p>
        </div>

        <div className="card" style={{ background: '#ECFDF5', border: '1.5px solid #10B981', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>Bounty Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064E3B' }}>R {bountyEarnedZar}</div>
          <div style={{ fontSize: '0.7rem', color: '#059669' }}>R50 / verified store onboarded</div>
        </div>
      </div>

      {successMsg && (
        <div className="card" style={{ background: '#ECFDF5', border: '1px solid #34D399', color: '#065F46', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✓</span>
          <div>
            <strong>Store Successfully Ingested & Verified!</strong> R50 bounty credited to your Marshal Ledger.
          </div>
        </div>
      )}

      {/* Ground Ingestion Form */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Spatial GPS Locator */}
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--slate-900)' }}>📍 Field GPS Coordinates:</strong>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn btn-outline btn-sm"
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? '📡 Acquiring GPS…' : '🎯 Auto-Detect My GPS'}
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Lat: {coords.lat} | Lng: {coords.lng} (Accuracy: ~5m)
            </div>
          </div>

          {/* Market / Mall Selection */}
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Spatial Market Node *
              </label>
              <select
                value={formData.marketId}
                onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                {SA_FLAGSHIP_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.metro})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Stall / Unit Identifier *
              </label>
              <input
                type="text"
                value={formData.stallNumber}
                onChange={(e) => setFormData({ ...formData, stallNumber: e.target.value })}
                placeholder="e.g. Shop 24, Level 1, Stall B12"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                required
              />
            </div>
          </div>

          {/* Virtual Market Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', padding: '0.75rem', borderRadius: '6px' }}>
            <input
              type="checkbox"
              id="virtualMarket"
              checked={formData.isVirtualMarket}
              onChange={(e) => setFormData({ ...formData, isVirtualMarket: e.target.checked })}
            />
            <label htmlFor="virtualMarket" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF', cursor: 'pointer' }}>
              Create Virtual Wholesale Collective / Market Cluster (e.g. Crown Mines Solar Hub)
            </label>
          </div>

          {/* Store Info */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Physical Merchant Operating Name *
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="e.g. Top Solar & Electrical Wholesalers"
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)' }}
              required
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Shopkeeper WhatsApp Number for Leads *
              </label>
              <input
                type="tel"
                value={formData.whatsappPhone}
                onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                placeholder="+27 82 123 4567"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                CIPC / Tax PIN (Optional)
              </label>
              <input
                type="text"
                value={formData.cipcNumber}
                onChange={(e) => setFormData({ ...formData, cipcNumber: e.target.value })}
                placeholder="K2021/123456/07"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-whatsapp"
            style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}
          >
            🚀 Submit Ground Verification & Claim Bounty
          </button>
        </form>
      </div>

      {/* Recent Field Submissions */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Your Recent Field Ingestions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {submittedStores.map((store) => (
            <div key={store.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{store.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>📍 {store.market} · {store.stall} · {store.time}</div>
              </div>
              <span className="badge badge-green">+R{store.bounty} Paid</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
