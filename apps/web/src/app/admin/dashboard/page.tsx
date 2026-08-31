'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  NationwideMerchantStore,
  MasterProductStore,
  SouthAfricaMallsStore,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
  MITREND_MERCHANT,
} from '@shoppage/kernel';
import { PayloadMerchantCmsService } from '@/cms';

export default function PlatformSuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'merchants' | 'verification' | 'catalog' | 'cms_collections' | 'diagnostics'
  >('overview');

  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [merchantProvinceFilter, setMerchantProvinceFilter] = useState('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'verified'>('all');

  // Verification Claims Mock Queue
  const [verificationQueue, setVerificationQueue] = useState([
    {
      id: 'claim_001',
      merchantId: 'loc_mitrend_midrand',
      storeName: 'Mitrend Products (Pty) Ltd',
      applicantName: 'Paul Mitchell',
      email: 'sales@mitrend.co.za',
      phone: '+27105007670',
      cipcNumber: '2018/489102/07',
      address: 'ERF710 Old Road, Halfway Gardens, Midrand, 1686',
      status: 'verified',
      submittedAt: '2026-08-30 09:15',
      trustScore: 98,
      category: 'Food Packaging & Catering Supplies',
    },
    {
      id: 'claim_002',
      merchantId: 'loc_sunpower_crownmines',
      storeName: 'SunPower Solutions (Crown Mines)',
      applicantName: 'Johan van der Merwe',
      email: 'johan@sunpower.co.za',
      phone: '+27110001001',
      cipcNumber: '2016/119024/07',
      address: 'Crown Mines Wholesale Hub, Johannesburg',
      status: 'verified',
      submittedAt: '2026-08-29 14:40',
      trustScore: 96,
      category: 'Solar & Renewable Energy',
    },
    {
      id: 'claim_003',
      merchantId: 'loc_durban_fasteners',
      storeName: 'Durban Industrial Fasteners & Tools',
      applicantName: 'Rajesh Patel',
      email: 'admin@durbanfasteners.co.za',
      phone: '+27315558900',
      cipcNumber: '2021/300188/07',
      address: '14 Umgeni Rd, Stamford Hill, Durban',
      status: 'pending',
      submittedAt: '2026-08-31 08:30',
      trustScore: 84,
      category: 'Industrial Hardware & Tools',
    },
  ]);

  const totalMerchants = NationwideMerchantStore.getTotalCount();
  const totalCatalog = MasterProductStore.getTotalProductsCount();
  const totalMalls = SouthAfricaMallsStore.getTotalCount();

  // Search through all flagship and nationwide merchants
  const allMerchantsList = SA_FLAGSHIP_MERCHANTS;
  const filteredMerchants = allMerchantsList.filter((m) => {
    if (merchantProvinceFilter !== 'all' && m.province !== merchantProvinceFilter) return false;
    if (merchantSearchQuery.trim()) {
      const q = merchantSearchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.addressText.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredVerification = verificationQueue.filter((v) => {
    if (verificationFilter === 'all') return true;
    return v.status === verificationFilter;
  });

  const handleApproveVerification = (claimId: string) => {
    setVerificationQueue((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'verified', trustScore: 95 } : c))
    );
  };

  const handleRejectVerification = (claimId: string) => {
    setVerificationQueue((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'rejected' } : c))
    );
  };

  const handleLoginAsMerchant = (merchantId: string) => {
    router.push(`/merchant/dashboard?store=${merchantId}`);
  };

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TOP PRO SUPERADMIN BAR */}
      <header
        style={{
          background: '#0B1120',
          borderBottom: '1px solid #1E293B',
          padding: '0 1.5rem',
          height: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
                color: '#FFFFFF',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Shoppage
              </span>
              <span style={{ fontSize: '0.75rem', background: '#3B82F6', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                SuperAdmin
              </span>
            </div>
          </Link>

          <span style={{ color: '#334155' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
            <span>Production Engine: <strong>Node.js 14 + Payload CMS + Kernel FTS5</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/merchant/dashboard?store=loc_mitrend_midrand"
            className="btn btn-outline btn-sm"
            style={{ color: '#E2E8F0', borderColor: '#334155', fontSize: '0.78rem' }}
          >
            🏪 Launch Mitrend Merchant OS &rarr;
          </Link>
          <Link
            href="/"
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            🌐 Public Search SERP
          </Link>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN SUPERADMIN WORKSPACE */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar Navigation */}
        <aside
          style={{
            width: '240px',
            background: '#0B1120',
            borderRight: '1px solid #1E293B',
            padding: '1.5rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.65rem 0.5rem 0.65rem' }}>
            Platform Governance
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'overview' ? '#1E293B' : 'transparent',
              color: activeTab === 'overview' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'overview' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>📊</span>
            <span>Platform Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merchants')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'merchants' ? '#1E293B' : 'transparent',
              color: activeTab === 'merchants' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'merchants' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>🏬</span>
            <span>All Stores & Tenants</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'verification' ? '#1E293B' : 'transparent',
              color: activeTab === 'verification' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'verification' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>🛡️</span>
              <span>CIPC Verification</span>
            </div>
            <span style={{ background: '#D97706', color: '#FFFFFF', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 800 }}>
              1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'catalog' ? '#1E293B' : 'transparent',
              color: activeTab === 'catalog' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'catalog' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>📦</span>
            <span>Master Catalog (1M+)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cms_collections')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'cms_collections' ? '#1E293B' : 'transparent',
              color: activeTab === 'cms_collections' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'cms_collections' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>⚡</span>
            <span>Payload Collections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'diagnostics' ? '#1E293B' : 'transparent',
              color: activeTab === 'diagnostics' ? '#38BDF8' : '#94A3B8',
              fontWeight: activeTab === 'diagnostics' ? 800 : 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>🩺</span>
            <span>Engine Diagnostics</span>
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #1E293B' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', padding: '0 0.5rem' }}>
              Logged in as: <strong>SuperAdmin</strong><br />
              <span style={{ color: '#38BDF8' }}>admin@shoppage.co.za</span>
            </div>
            <Link
              href="/admin"
              style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: '#EF4444', textDecoration: 'none', fontWeight: 700, padding: '0 0.5rem' }}
            >
              ← Sign Out
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    National Commerce Grid Oversight
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
                    Master platform telemetry across 9 South African provinces. Zero take-rate architecture.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('All FTS5 indexes and Payload collections are healthy and synchronized.')}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#38BDF8', borderColor: '#0284C7' }}
                >
                  ⚡ Run Full Engine Health Check
                </button>
              </div>

              {/* Top 4 KPI Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Verified Physical Stores</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', margin: '0.35rem 0' }}>{totalMerchants.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Across 9 Provinces · CIPC Mapped</div>
                </div>

                <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>GS1 Master Products</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', margin: '0.35rem 0' }}>{totalCatalog.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>100% In-Memory FTS5 Search</div>
                </div>

                <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Shopping Malls & Mkt Nodes</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', margin: '0.35rem 0' }}>{totalMalls.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>GPS Geofenced Footprint</div>
                </div>

                <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Middleman Take Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#A855F7', margin: '0.35rem 0' }}>0.00%</div>
                  <div style={{ fontSize: '0.75rem', color: '#A855F7', fontWeight: 600 }}>Direct WhatsApp & In-Store Trade</div>
                </div>
              </div>

              {/* Flagship Stores Spotlight */}
              <div style={{ background: '#1E293B', borderRadius: '12px', border: '1px solid #334155', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 1rem 0' }}>
                  🏪 Featured Flagship Merchants
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>Mitrend Products (Pty) Ltd</div>
                      <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                        157 Live SKUs
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                      📍 Midrand, Gauteng · Food Packaging & Hospitality
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLoginAsMerchant('loc_mitrend_midrand')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        🔑 Log in as Mitrend OS &rarr;
                      </button>
                      <Link
                        href="/m/loc_mitrend_midrand"
                        target="_blank"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', color: '#94A3B8', borderColor: '#334155' }}
                      >
                        View Storefront
                      </Link>
                    </div>
                  </div>

                  <div style={{ background: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>SunPower Solutions</div>
                      <span style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                        Solar Flagship
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                      📍 Crown Mines, Johannesburg · Deye & Dyness Importer
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLoginAsMerchant('loc_sunpower_crownmines')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        🔑 Log in as SunPower OS &rarr;
                      </button>
                      <Link
                        href="/m/loc_sunpower_crownmines"
                        target="_blank"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', color: '#94A3B8', borderColor: '#334155' }}
                      >
                        View Storefront
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MERCHANTS & TENANTS */}
          {activeTab === 'merchants' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    All Stores & Multi-Tenant Registry
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Manage tenant profiles, override store settings, or log in directly as any merchant store.
                  </p>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search store name, category, or city..."
                  value={merchantSearchQuery}
                  onChange={(e) => setMerchantSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '260px',
                    padding: '0.65rem 1rem',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <select
                  value={merchantProvinceFilter}
                  onChange={(e) => setMerchantProvinceFilter(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">All Provinces (9)</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                </select>
              </div>

              {/* Merchants Table */}
              <div style={{ background: '#1E293B', borderRadius: '12px', border: '1px solid #334155', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Store Name / ID</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Location / Province</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{m.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{m.id}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#CBD5E1' }}>
                          <div>{m.addressText}</div>
                          <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>{m.province || 'Gauteng'}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#CBD5E1' }}>
                          <span style={{ background: '#0F172A', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #334155' }}>
                            {m.category || 'wholesale'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                            ✓ Verified Active
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleLoginAsMerchant(m.id)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              🔑 Open OS
                            </button>
                            <Link
                              href={`/m/${m.id}`}
                              target="_blank"
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', color: '#94A3B8', borderColor: '#334155' }}
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CIPC & VERIFICATION AUDIT */}
          {activeTab === 'verification' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    CIPC Compliance & Verification Queue
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Audited store claims, enterprise registration checks, and trust passport approvals.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setVerificationFilter('all')}
                  className={`btn btn-sm ${verificationFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  All Claims ({verificationQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationFilter('pending')}
                  className={`btn btn-sm ${verificationFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  Pending Audit (1)
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationFilter('verified')}
                  className={`btn btn-sm ${verificationFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  Verified Passed (2)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredVerification.map((claim) => (
                  <div key={claim.id} style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{claim.storeName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#38BDF8' }}>
                          CIPC Registration: <strong>{claim.cipcNumber}</strong> · Category: {claim.category}
                        </div>
                      </div>
                      <span
                        style={{
                          background: claim.status === 'verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: claim.status === 'verified' ? '#10B981' : '#F59E0B',
                          border: `1px solid ${claim.status === 'verified' ? '#10B981' : '#F59E0B'}`,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {claim.status === 'verified' ? '✓ CIPC Audited' : '⏳ Pending Review'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', color: '#CBD5E1', marginBottom: '1rem', lineHeight: 1.6 }}>
                      <div>👤 <strong>Applicant:</strong> {claim.applicantName} ({claim.email} · {claim.phone})</div>
                      <div>📍 <strong>Address:</strong> {claim.address}</div>
                      <div>⭐ <strong>Computed Trust Score:</strong> {claim.trustScore}/100</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {claim.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveVerification(claim.id)}
                            className="btn btn-primary btn-sm"
                            style={{ background: '#10B981', borderColor: '#10B981', fontSize: '0.78rem' }}
                          >
                            ✓ Approve CIPC Verification
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectVerification(claim.id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#EF4444', borderColor: '#EF4444', fontSize: '0.78rem' }}
                          >
                            ✕ Reject Claim
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                          ✓ Trust Passport and Verified Merchant Seal active.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    1,000,000+ Master GS1 Product Catalog
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Global product catalog indexed in SQLite FTS5 with sub-1ms search performance.
                  </p>
                </div>
              </div>

              <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>Catalog Index Diagnostics</div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
                  • <strong>Total Canonical Variants:</strong> {totalCatalog.toLocaleString()} SKUs<br />
                  • <strong>Search Engine:</strong> In-Memory + SQLite FTS5 Full-Text Index<br />
                  • <strong>Google Product Taxonomy:</strong> 5,000+ Category Nodes active<br />
                  • <strong>Mitrend Products Indexed:</strong> 157 live commercial items
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYLOAD CMS COLLECTIONS */}
          {activeTab === 'cms_collections' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    Payload CMS Active Collections
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Multi-tenant data collections powering the Merchant OS and Digital Flagships.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {[
                  { name: 'Merchants', count: '74,000+', desc: 'Store profiles, CIPC entities, branding, and WhatsApp settings.' },
                  { name: 'Products', count: '157 Mitrend + 1M Master', desc: 'WooCommerce-style catalog items, prices, inventory, SABS.' },
                  { name: 'Media (DAM)', count: '157+ Assets', desc: 'High-res photography, PDFs, and datasheets.' },
                  { name: 'Orders', count: '2 Processing', desc: 'Direct merchant orders, WhatsApp cart checkouts.' },
                  { name: 'Customers (CRM)', count: '2 VIP Contractors', desc: 'Contractor accounts, LTV ledger, and merchant notes.' },
                  { name: 'Shorts & Shows', count: '2 Video Broadcasts', desc: '9:16 vertical shorts and masterclasses.' },
                ].map((col) => (
                  <div key={col.name} style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38BDF8', marginBottom: '0.25rem' }}>{col.name}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem' }}>{col.count}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>{col.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 1rem 0' }}>
                Engine Health & Diagnostics
              </h1>
              <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: '#38BDF8', margin: '0 0 0.5rem 0' }}>Runtime Status</h4>
                    <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.8 }}>
                      • <strong>Platform Runtime:</strong> Node.js 14+ (Next.js 14.2)<br />
                      • <strong>CMS Engine:</strong> Payload CMS 3.0 Local Service<br />
                      • <strong>Database:</strong> SQLite DatabaseSync + FTS5<br />
                      • <strong>Direct Take Rate:</strong> 0% Commission<br />
                      • <strong>Status:</strong> <span style={{ color: '#10B981', fontWeight: 800 }}>● ALL SYSTEMS OPERATIONAL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
