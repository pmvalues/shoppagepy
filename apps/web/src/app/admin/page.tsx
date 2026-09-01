'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'merchant' | 'superadmin'>('merchant');
  const [email, setEmail] = useState('sales@mitrend.co.za');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedStore, setSelectedStore] = useState('loc_mitrend_midrand');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsLoading(false);
      if (activeTab === 'merchant') {
        try {
          localStorage.setItem('shoppage_merchant_session', 'true');
          localStorage.setItem('shoppage_merchant_store', selectedStore);
          document.cookie = 'merchant_session=true; path=/; max-age=86400';
        } catch {}
        router.push(`/merchant/dashboard?store=${selectedStore}`);
      } else {
        router.push('/admin/dashboard');
      }
    }, 600);
  };

  const handleQuickLogin = (role: 'mitrend' | 'sunpower' | 'superadmin') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'mitrend') {
        try {
          localStorage.setItem('shoppage_merchant_session', 'true');
          localStorage.setItem('shoppage_merchant_store', 'loc_mitrend_midrand');
          document.cookie = 'merchant_session=true; path=/; max-age=86400';
        } catch {}
        router.push('/merchant/dashboard?store=loc_mitrend_midrand');
      } else if (role === 'sunpower') {
        try {
          localStorage.setItem('shoppage_merchant_session', 'true');
          localStorage.setItem('shoppage_merchant_store', 'loc_sunpower_crownmines');
          document.cookie = 'merchant_session=true; path=/; max-age=86400';
        } catch {}
        router.push('/merchant/dashboard?store=loc_sunpower_crownmines');
      } else {
        router.push('/admin/dashboard');
      }
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(37, 99, 235, 0.08) 0%, #F8FAFC 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#2563EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
            }}
          >
            S
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-0.03em' }}>
            Shoppage <span style={{ color: '#2563EB', fontWeight: 700 }}>Admin</span>
          </span>
        </Link>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', margin: 0 }}>
          Commerce Intelligence Grid & Payload CMS Multi-Tenant Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2rem',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Role Toggle Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('merchant');
              setEmail('sales@mitrend.co.za');
            }}
            style={{
              border: 'none',
              background: activeTab === 'merchant' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'merchant' ? '#0F172A' : '#64748B',
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'merchant' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🏪 Merchant Store
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('superadmin');
              setEmail('admin@shoppage.co.za');
            }}
            style={{
              border: 'none',
              background: activeTab === 'superadmin' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'superadmin' ? '#0F172A' : '#64748B',
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'superadmin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🛡️ Platform SuperAdmin
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #F87171' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {activeTab === 'merchant' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
                Select Store Account
              </label>
              <select
                value={selectedStore}
                onChange={(e) => {
                  setSelectedStore(e.target.value);
                  if (e.target.value === 'loc_mitrend_midrand') setEmail('sales@mitrend.co.za');
                  else setEmail('sales@sunpower.co.za');
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#F8FAFC',
                }}
              >
                <option value="loc_mitrend_midrand">🏨 Mitrend Products (Pty) Ltd — Midrand</option>
                <option value="loc_sunpower_crownmines">⚡ SunPower Solutions — Crown Mines</option>
                <option value="loc_powerflex_durban">🔌 PowerFlex Solar — Durban North</option>
                <option value="loc_cape_solar_bellville">☀️ Cape Solar & Battery — Bellville</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)' }}>Password</label>
              <span style={{ fontSize: '0.75rem', color: '#2563EB', cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isLoading ? 'Signing In...' : activeTab === 'merchant' ? 'Sign In to Merchant OS →' : 'Sign In as SuperAdmin →'}
          </button>
        </form>

        {/* Verified Enterprise Workspaces */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' }}>
            Verified Enterprise Workspaces
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('mitrend')}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#0F172A',
                fontSize: '0.825rem',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>🏨 Mitrend Products (Pty) Ltd</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Midrand · 157 Catalog SKUs · CIPC: 2018/489102/07</div>
              </div>
              <span style={{ color: '#7F54B3', fontSize: '0.78rem', fontWeight: 800 }}>Enter OS &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sunpower')}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#0F172A',
                fontSize: '0.825rem',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>⚡ SunPower Solutions</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Crown Mines Wholesale Hub · Deye/Dyness Stockist</div>
              </div>
              <span style={{ color: '#2563EB', fontSize: '0.78rem', fontWeight: 800 }}>Enter OS &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin')}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#0F172A',
                fontSize: '0.825rem',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>🛡️ Platform SuperAdmin Portal</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>National Grid Telemetry · 74K Stores · CIPC Queue</div>
              </div>
              <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800 }}>Enter Admin &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Security Seals */}
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.775rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <span>🔒 256-Bit SSL Encrypted</span>
        <span>•</span>
        <span>🏛️ CIPC Entity Verified</span>
        <span>•</span>
        <span>🛡️ POPIA Compliant Commerce Grid</span>
      </div>
    </div>
  );
}
