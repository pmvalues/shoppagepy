'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  NationwideMerchantStore,
  MasterProductStore,
  SouthAfricaMallsStore,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
  MITREND_MERCHANT,
  MITREND_PRODUCTS,
} from '@shoppage/kernel';
import {
  PayloadMerchantCmsService,
  CmsProductDocument,
  CmsOrderDocument,
  CmsCustomerDocument,
  CmsMediaDocument,
  CmsShortOrShowDocument,
} from '@/cms';

export default function PlatformSuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'merchants' | 'verification' | 'catalog' | 'cms_collections' | 'diagnostics'
  >('overview');

  // Search & Filter States
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [merchantProvinceFilter, setMerchantProvinceFilter] = useState('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [selectedCmsCollection, setSelectedCmsCollection] = useState<
    'products' | 'merchants' | 'orders' | 'customers' | 'media' | 'shorts'
  >('products');
  const [cmsSearchQuery, setCmsSearchQuery] = useState('');

  // 1. Comprehensive CIPC Verification Claims Queue
  const [verificationQueue, setVerificationQueue] = useState([
    {
      id: 'claim_001',
      merchantId: 'loc_mitrend_midrand',
      storeName: 'Mitrend Products (Pty) Ltd',
      applicantName: 'Paul Mitchell',
      email: 'sales@mitrend.co.za',
      phone: '+27 10 500 7670',
      cipcNumber: '2018/489102/07',
      taxPin: '9481920194',
      bbbeeLevel: 'Level 2 B-BBEE',
      address: 'ERF710 Old Road, Halfway Gardens, Midrand, 1686, Gauteng',
      status: 'verified',
      submittedAt: '2026-08-30 09:15',
      trustScore: 98,
      category: 'Food Packaging & Catering Supplies',
      skusCount: 157,
    },
    {
      id: 'claim_002',
      merchantId: 'loc_sunpower_crownmines',
      storeName: 'SunPower Solutions (Crown Mines)',
      applicantName: 'Johan van der Merwe',
      email: 'johan@sunpowersolutions.co.za',
      phone: '+27 11 830 1100',
      cipcNumber: '2016/119024/07',
      taxPin: '9182049102',
      bbbeeLevel: 'Level 1 B-BBEE',
      address: 'Crown Mines Wholesale Hub, Johannesburg, Gauteng',
      status: 'verified',
      submittedAt: '2026-08-29 14:40',
      trustScore: 96,
      category: 'Solar & Renewable Energy',
      skusCount: 48,
    },
    {
      id: 'claim_003',
      merchantId: 'loc_durban_fasteners',
      storeName: 'Durban Industrial Fasteners & Hardware',
      applicantName: 'Rajesh Patel',
      email: 'admin@durbanfasteners.co.za',
      phone: '+27 31 555 8900',
      cipcNumber: '2021/300188/07',
      taxPin: '9840192841',
      bbbeeLevel: 'Level 2 B-BBEE',
      address: '14 Umgeni Rd, Stamford Hill, Durban, KwaZulu-Natal',
      status: 'pending',
      submittedAt: '2026-08-31 08:30',
      trustScore: 84,
      category: 'Industrial Hardware & Building Supplies',
      skusCount: 320,
    },
    {
      id: 'claim_004',
      merchantId: 'loc_cape_solar_bellville',
      storeName: 'Cape Solar & Battery Specialists',
      applicantName: 'Francois Du Plessis',
      email: 'francois@capesolar.co.za',
      phone: '+27 21 948 2000',
      cipcNumber: '2019/550192/07',
      taxPin: '9019284012',
      bbbeeLevel: 'Level 4 B-BBEE',
      address: '42 Voortrekker Rd, Bellville, Cape Town, Western Cape',
      status: 'pending',
      submittedAt: '2026-08-31 10:10',
      trustScore: 88,
      category: 'Solar & Renewable Energy',
      skusCount: 65,
    },
    {
      id: 'claim_005',
      merchantId: 'loc_bloem_agri_spares',
      storeName: 'Free State Agri-Power & Spares',
      applicantName: 'Willem Steyn',
      email: 'orders@freestateagri.co.za',
      phone: '+27 51 405 1100',
      cipcNumber: '2014/098172/07',
      taxPin: '9301928401',
      bbbeeLevel: 'Level 2 B-BBEE',
      address: '12 Harvey Rd, Oranjesig, Bloemfontein, Free State',
      status: 'verified',
      submittedAt: '2026-08-28 11:20',
      trustScore: 94,
      category: 'Automotive & Agricultural Spares',
      skusCount: 190,
    },
  ]);

  // Telemetry KPIs
  const totalMerchantsCount = NationwideMerchantStore.getTotalCount();
  const totalCatalogCount = MasterProductStore.getTotalProductsCount();
  const totalMallsCount = SouthAfricaMallsStore.getTotalCount();
  const provinceCounts = SouthAfricaMallsStore.getProvinceCounts();

  // 2. Query Live Stores
  const storesQuery = useMemo(() => {
    return NationwideMerchantStore.searchMerchants({
      query: merchantSearchQuery,
      province: merchantProvinceFilter !== 'all' ? merchantProvinceFilter : undefined,
      limit: 60,
      offset: 0,
    });
  }, [merchantSearchQuery, merchantProvinceFilter]);

  // 3. Query Live Catalog
  const catalogQuery = useMemo(() => {
    return MasterProductStore.searchProducts({
      query: catalogSearchQuery,
      category: catalogCategoryFilter !== 'all' ? catalogCategoryFilter : undefined,
      limit: 60,
      offset: 0,
    });
  }, [catalogSearchQuery, catalogCategoryFilter]);

  // 4. Query Payload CMS Live Data
  const cmsProducts = useMemo(() => {
    return PayloadMerchantCmsService.getProducts('loc_mitrend_midrand', cmsSearchQuery);
  }, [cmsSearchQuery]);

  const cmsOrders = useMemo(() => {
    return PayloadMerchantCmsService.getOrders('loc_mitrend_midrand');
  }, []);

  const cmsCustomers = useMemo(() => {
    return PayloadMerchantCmsService.getCustomers('loc_mitrend_midrand');
  }, []);

  const cmsMedia = useMemo(() => {
    return PayloadMerchantCmsService.getMedia('loc_mitrend_midrand');
  }, []);

  const cmsShorts = useMemo(() => {
    return PayloadMerchantCmsService.getShortsAndShows('loc_mitrend_midrand');
  }, []);

  // Verification actions
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
    <div style={{ background: '#090D16', minHeight: '100vh', color: '#F1F5F9', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 1. TOP PRO SUPERADMIN BAR */}
      <header
        style={{
          background: '#040711',
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
                fontSize: '1.05rem',
                color: '#FFFFFF',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Shoppage
              </span>
              <span style={{ fontSize: '0.72rem', background: '#3B82F6', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                SuperAdmin
              </span>
            </div>
          </Link>

          <span style={{ color: '#334155' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
            <span>Active Grid: <strong>{totalMerchantsCount.toLocaleString()} Stores · {totalCatalogCount.toLocaleString()} SKUs</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/merchant/dashboard?store=loc_mitrend_midrand"
            className="btn btn-outline btn-sm"
            style={{ color: '#E2E8F0', borderColor: '#334155', fontSize: '0.78rem' }}
          >
            🏨 Launch Mitrend Merchant OS &rarr;
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
            width: '250px',
            background: '#040711',
            borderRight: '1px solid #1E293B',
            padding: '1.5rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.65rem 0.5rem 0.65rem' }}>
            National Governance
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
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>🏬</span>
              <span>All Stores ({totalMerchantsCount.toLocaleString()})</span>
            </div>
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
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>⚡</span>
              <span>Payload Collections</span>
            </div>
            <span style={{ background: '#7F54B3', color: '#FFFFFF', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
              157 SKUs
            </span>
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
              {verificationQueue.filter((c) => c.status === 'pending').length}
            </span>
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
              SuperAdmin: <strong>Root Administrator</strong><br />
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

        {/* Main Content Workspace */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: 'calc(100vh - 60px)' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    National Commerce Grid Telemetry
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
                    Real-time oversight of South Africa&apos;s physical commerce footprint. Zero commission middleman model.
                  </p>
                </div>
              </div>

              {/* 4 Top KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Verified Physical Stores</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', margin: '0.35rem 0' }}>{totalMerchantsCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active in 9 Provinces · CIPC Mapped</div>
                </div>

                <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>GS1 Master Products</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', margin: '0.35rem 0' }}>{totalCatalogCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>100% In-Memory SQLite FTS5 Search</div>
                </div>

                <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Shopping Malls & Mkt Nodes</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', margin: '0.35rem 0' }}>{totalMallsCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>Dragon City, Oriental Plaza, Mall of Africa</div>
                </div>

                <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Middleman Take Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#A855F7', margin: '0.35rem 0' }}>0.00%</div>
                  <div style={{ fontSize: '0.75rem', color: '#A855F7', fontWeight: 600 }}>Direct WhatsApp Quotes & Calls</div>
                </div>
              </div>

              {/* Province Distribution Bar */}
              <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1F2937', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 1rem 0' }}>
                  📍 Provincial Commerce Hub Distribution
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(provinceCounts).map(([prov, count]) => (
                    <div key={prov} style={{ background: '#1E293B', padding: '0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>{prov}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38BDF8', margin: '0.2rem 0' }}>{count} Malls</div>
                      <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Active Geofence</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flagship Stores Quick Masquerade */}
              <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1F2937', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 1rem 0' }}>
                  🏪 Flagship Merchant Spotlights & Live Access
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>Mitrend Products (Pty) Ltd</div>
                      <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                        157 Live SKUs
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.85rem' }}>
                      📍 ERF710 Old Road, Halfway Gardens, Midrand · WhatsApp: +27 10 500 7670
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLoginAsMerchant('loc_mitrend_midrand')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        🔑 Open Mitrend OS &rarr;
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

                  <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>SunPower Solutions</div>
                      <span style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                        Solar Flagship
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.85rem' }}>
                      📍 Crown Mines Wholesale Hub, Johannesburg · Deye & Dyness Master Stockist
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLoginAsMerchant('loc_sunpower_crownmines')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        🔑 Open SunPower OS &rarr;
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

          {/* TAB 2: ALL STORES (NATIONWIDE STORE EXPLORER) */}
          {activeTab === 'merchants' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    Nationwide Physical Stores Explorer
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Displaying <strong>{storesQuery.items.length}</strong> verified stores from the national registry.
                  </p>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search store name, category, or address..."
                  value={merchantSearchQuery}
                  onChange={(e) => setMerchantSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '0.65rem 1rem',
                    background: '#111827',
                    border: '1px solid #374151',
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
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">All Provinces</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Limpopo">Limpopo</option>
                </select>
              </div>

              {/* Stores Table */}
              <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1F2937', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1F2937', textAlign: 'left', color: '#94A3B8' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Merchant / Store Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Location / Address</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Contacts</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storesQuery.items.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #1F2937' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{m.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>ID: {m.id}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#CBD5E1', maxWidth: '280px' }}>
                          <div>{m.addressText}</div>
                          <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>★ {m.googleRating || '4.8'} · {m.province || 'Gauteng'}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#CBD5E1' }}>
                          <span style={{ background: '#1E293B', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #334155', fontSize: '0.75rem' }}>
                            {m.category || 'wholesale'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#CBD5E1', fontSize: '0.78rem' }}>
                          <div>📞 {m.contacts?.telephone || m.contacts?.whatsapp || 'Direct Stockist'}</div>
                          {m.contacts?.email && <div style={{ color: '#64748B' }}>{m.contacts.email}</div>}
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

          {/* TAB 3: MASTER CATALOG (1M+ GS1 PRODUCTS) */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    1,000,000+ Master GS1 Product Catalog
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Displaying <strong>{catalogQuery.items.length}</strong> matching canonical products from the FTS5 search index.
                  </p>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search product title, MPN, SKU, or brand..."
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '0.65rem 1rem',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="solar_energy">Solar & Inverters</option>
                  <option value="packaging_catering">Food Packaging & Catering</option>
                  <option value="smartphones">Smartphones & Tech</option>
                  <option value="hardware">Hardware & Cement</option>
                </select>
              </div>

              {/* Catalog Products Table */}
              <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1F2937', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1F2937', textAlign: 'left', color: '#94A3B8' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Canonical ID / Image</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Product Title & Specs</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Brand / Category</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Est. Price (ZAR)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Compliance</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogQuery.items.map((p) => {
                      const price = p.attributes?.estimatedPriceZar as number | undefined;
                      const hasImage = p.media?.gallery?.[0]?.url;
                      return (
                        <tr key={p.canonicalId} style={{ borderBottom: '1px solid #1F2937' }}>
                          <td style={{ padding: '1rem', width: '90px' }}>
                            {hasImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={hasImage}
                                alt={p.title}
                                style={{ width: '54px', height: '54px', objectFit: 'contain', background: '#FFFFFF', borderRadius: '6px', padding: '2px' }}
                              />
                            ) : (
                              <div style={{ width: '54px', height: '54px', background: '#1E293B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                📦
                              </div>
                            )}
                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                              {p.canonicalId}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '320px' }}>
                            <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{p.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                              MPN: <strong>{p.identifiers?.mpn || 'N/A'}</strong> · GTIN: {p.identifiers?.gtin13 || '600...'}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: '#CBD5E1' }}>
                            <div style={{ fontWeight: 700, color: '#38BDF8' }}>{p.brand}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{p.categoryRef}</div>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 900, fontSize: '1.05rem', color: '#10B981', fontFamily: 'monospace' }}>
                            {typeof price === 'number' && price > 0 ? (
                              `R ${price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                            ) : (
                              <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>On request</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                              ✓ GS1 Canonical
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <Link
                              href={`/p/${p.canonicalId}`}
                              target="_blank"
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', color: '#94A3B8', borderColor: '#334155' }}
                            >
                              Inspect BuyBox &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PAYLOAD CMS LIVE COLLECTIONS EXPLORER */}
          {activeTab === 'cms_collections' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    Payload CMS Multi-Tenant Data Browser
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                    Live document collections backing the Merchant OS and Digital Flagships.
                  </p>
                </div>
              </div>

              {/* Collection Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {[
                  { id: 'products' as const, label: `🛍️ Products (${cmsProducts.length})` },
                  { id: 'orders' as const, label: `🔔 Orders (${cmsOrders.length})` },
                  { id: 'customers' as const, label: `👥 CRM Customers (${cmsCustomers.length})` },
                  { id: 'media' as const, label: `🖼️ Media DAM (${cmsMedia.length})` },
                  { id: 'shorts' as const, label: `🎬 Video Shorts (${cmsShorts.length})` },
                ].map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCmsCollection(col.id)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedCmsCollection === col.id ? '#2563EB' : '#1E293B',
                      color: selectedCmsCollection === col.id ? '#FFFFFF' : '#94A3B8',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>

              {/* Collection 1: Products */}
              {selectedCmsCollection === 'products' && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="🔍 Search Mitrend 157 products in CMS..."
                      value={cmsSearchQuery}
                      onChange={(e) => setCmsSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1F2937', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1F2937', textAlign: 'left', color: '#94A3B8' }}>
                          <th style={{ padding: '0.85rem 1rem' }}>Image / SKU</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Product Title</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Price (ZAR)</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Inventory</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Compliance</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Store Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsProducts.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #1F2937' }}>
                            <td style={{ padding: '1rem', width: '90px' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.featuredImage}
                                alt={p.title}
                                style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#FFFFFF', borderRadius: '6px', padding: '2px' }}
                              />
                              <div style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                                {p.sku}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', maxWidth: '300px' }}>
                              <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{p.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>{p.category}</div>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 900, fontSize: '1rem', color: '#10B981', fontFamily: 'monospace' }}>
                              R {p.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '1rem', color: '#CBD5E1' }}>
                              <span style={{ color: p.inStock ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                                {p.inStock ? `In Stock (${p.stockQty})` : 'Out of Stock'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ background: '#1E293B', color: '#CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                SABS Food Grade
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <Link
                                href={`/m/loc_mitrend_midrand?product=${p.id}`}
                                target="_blank"
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.75rem', color: '#94A3B8', borderColor: '#334155' }}
                              >
                                View in Store
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Collection 2: Orders */}
              {selectedCmsCollection === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cmsOrders.map((o) => (
                    <div key={o.id} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{o.orderNumber} · {o.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>📞 {o.customerPhone} · 📍 {o.deliveryAddress}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#10B981', fontFamily: 'monospace' }}>
                            R {o.grandTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </div>
                          <span style={{ background: o.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: o.paymentStatus === 'paid' ? '#10B981' : '#F59E0B', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            {o.paymentStatus} · {o.orderStatus}
                          </span>
                        </div>
                      </div>
                      <div style={{ background: '#1E293B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#CBD5E1' }}>
                        <strong>Items:</strong> {o.items.map((it) => `${it.qty}x ${it.title} (R ${it.totalPrice})`).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collection 3: Customers */}
              {selectedCmsCollection === 'customers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {cmsCustomers.map((c) => (
                    <div key={c.id} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>{c.name}</div>
                        <span style={{ background: '#2563EB', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {c.segment}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                        👤 {c.contactPerson} · 📞 {c.phone} · 📍 {c.city}
                      </div>
                      <div style={{ background: '#1E293B', padding: '0.65rem', borderRadius: '6px', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                        <strong>Lifetime Value:</strong> <span style={{ color: '#10B981', fontWeight: 800 }}>R {c.lifetimeValueZar.toLocaleString()}</span> ({c.totalOrdersCount} orders)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        📝 <em>{c.notes[0]}</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collection 4: Media DAM */}
              {selectedCmsCollection === 'media' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {cmsMedia.map((m) => (
                    <div key={m.id} style={{ background: '#111827', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1F2937', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.url}
                        alt={m.altText}
                        style={{ width: '100%', height: '120px', objectFit: 'contain', background: '#FFFFFF', borderRadius: '6px', padding: '4px', marginBottom: '0.5rem' }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'center', wordBreak: 'break-all' }}>{m.filename}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.2rem' }}>{(m.filesize / 1000).toFixed(0)} KB · {m.mediaType}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collection 5: Shorts & Shows */}
              {selectedCmsCollection === 'shorts' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {cmsShorts.map((s) => (
                    <div key={s.id} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ background: s.type === 'short' ? '#E11D48' : '#7C3AED', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {s.type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>👁️ {s.viewsCount.toLocaleString()} views · ❤️ {s.likesCount}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '0.4rem' }}>{s.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.75rem' }}>{s.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                        🏷️ {s.taggedProductIds.length} Tagged Mitrend Products
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CIPC & VERIFICATION AUDIT */}
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
                  Pending Audit ({verificationQueue.filter((c) => c.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationFilter('verified')}
                  className={`btn btn-sm ${verificationFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  Verified Passed ({verificationQueue.filter((c) => c.status === 'verified').length})
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {verificationQueue.filter((c) => (verificationFilter === 'all' ? true : c.status === verificationFilter)).map((claim) => (
                  <div key={claim.id} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{claim.storeName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#38BDF8' }}>
                          CIPC Reg: <strong>{claim.cipcNumber}</strong> · Tax PIN: {claim.taxPin} · {claim.bbbeeLevel}
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
                      <div>⭐ <strong>Computed Trust Score:</strong> {claim.trustScore}/100 · {claim.skusCount} SKUs Claimed</div>
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

          {/* TAB 6: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 1rem 0' }}>
                Engine Health & Diagnostics
              </h1>
              <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1F2937' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: '#38BDF8', margin: '0 0 0.5rem 0' }}>Runtime Status</h4>
                    <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.8 }}>
                      • <strong>Platform Runtime:</strong> Node.js 20+ (Next.js 16)<br />
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
