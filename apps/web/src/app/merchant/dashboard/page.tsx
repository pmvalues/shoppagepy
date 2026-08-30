'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppageMerchantCentreService,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
} from '@shoppage/kernel';

export default function MerchantDashboardPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('loc_sunpower_crownmines');
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'discovered' | 'gmc' | 'inquiries' | 'trust' | 'settings'>('overview');
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedSeal, setCopiedSeal] = useState(false);

  // 1-Click Discovered Stock Confirmation State (Google Discovery Engine)
  const [discoveredStock, setDiscoveredStock] = useState([
    {
      id: 'disc_deye_5kw',
      title: 'Deye 5kW Hybrid Inverter 48V (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      scrapedPrice: 18500,
      currentPrice: 18500,
      sourceUrl: 'https://sunpower.co.za/deye-5kw',
      status: 'pending', // pending | confirmed | rejected
      warranty: '5 Years',
      inStock: true,
      googleApproved: true,
    },
    {
      id: 'disc_dyness_5kwh',
      title: 'Dyness 5.12kWh Lithium Battery BX51100 48V LiFePO4',
      brand: 'Dyness',
      scrapedPrice: 16900,
      currentPrice: 16900,
      sourceUrl: 'https://sunpower.co.za/dyness-bx51100',
      status: 'pending',
      warranty: '10 Years',
      inStock: true,
      googleApproved: true,
    },
    {
      id: 'disc_tier1_550w',
      title: 'JA Solar 550W Mono PERC Half-Cell Solar Panel',
      brand: 'JA Solar',
      scrapedPrice: 1750,
      currentPrice: 1750,
      sourceUrl: 'https://sunpower.co.za/ja-solar-550w',
      status: 'pending',
      warranty: '12 Years',
      inStock: true,
      googleApproved: true,
    },
  ]);

  // Shopify Active Products State
  const [productsList, setProductsList] = useState(
    SA_CANONICAL_PRODUCTS.slice(0, 6).map((p, idx) => ({
      id: p.canonicalId,
      title: p.title,
      brand: p.brand,
      price: (p.attributes?.estimatedPriceZar as number) || (idx === 0 ? 18500 : idx === 1 ? 16900 : 1750),
      inStock: true,
      gmcStatus: 'Active' as 'Active' | 'Needs Action' | 'Disapproved',
      impressions: 1240 + idx * 310,
      clicks: 84 + idx * 19,
    }))
  );

  // Inquiries CRM State
  const [inquiriesList, setInquiriesList] = useState([
    {
      id: 'inq_001',
      buyer: 'Johannesburg Solar Installers CC',
      phone: '082 459 1102',
      items: '4x Deye 5kW + 8x Dyness 5.12kWh',
      type: 'Wholesale RFQ',
      amount: 198000,
      channel: '📋 Buyer RFQ Desk',
      date: 'Today, 14:20',
      status: 'New',
    },
    {
      id: 'inq_002',
      buyer: 'Pretoria East Residential Buyer',
      phone: '071 884 9231',
      items: '1x Sunsynk 8kW Hybrid Inverter',
      type: 'Direct Phone Call',
      amount: 28500,
      channel: '📞 Phone Inquiry',
      date: 'Today, 11:05',
      status: 'Quoted',
    },
    {
      id: 'inq_003',
      buyer: 'Sandton Building Contractor',
      phone: '083 290 7714',
      items: '24x JA Solar 550W Panels',
      type: 'Website Clickout',
      amount: 42000,
      channel: '🌐 Storefront Redirect',
      date: 'Yesterday',
      status: 'Completed',
    },
  ]);

  const dashboard = ShoppageMerchantCentreService.getUnifiedDashboard(
    selectedMerchantId,
    typeof window !== 'undefined' ? window.location.origin : 'https://shoppage.co.za'
  );
  const { merchant, googleMerchantCenter } = dashboard;

  const handleConfirmStock = (id: string) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'confirmed' } : item))
    );
  };

  const handleRejectStock = (id: string) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setDiscoveredStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentPrice: newPrice } : item))
    );
  };

  const handleCopyFeedUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(googleMerchantCenter.feedUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2500);
    }
  };

  const handleCopySealSnippet = () => {
    if (typeof navigator !== 'undefined') {
      const snippet = `<a href="https://shoppage.co.za/m/${merchant.id}" target="_blank"><img src="https://shoppage.co.za/api/seal/${merchant.id}" alt="Shoppage Verified Store" /></a>`;
      navigator.clipboard.writeText(snippet);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2500);
    }
  };

  const toggleProductStock = (id: string) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p))
    );
  };

  const pendingDiscoveredCount = discoveredStock.filter((s) => s.status === 'pending').length;

  return (
    <div style={{ background: '#F6F6F7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. SHOPIFY / GMC TOP SYSTEM NAVBAR */}
      <header
        style={{
          background: '#1A1A1A',
          color: '#FFFFFF',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #2B2B2B',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Shopify-style Logo Bag + GMC Spark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#FFFFFF' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #008060 0%, #004C3F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
              }}
            >
              🛍️
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Shoppage <span style={{ color: '#008060' }}>Merchant OS</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Google Merchant Center + Shopify Unified Control
              </div>
            </div>
          </Link>

          <span style={{ color: '#444444' }}>|</span>

          {/* Store Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#A0A0A0' }}>Store:</span>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              style={{
                background: '#2B2B2B',
                color: '#FFFFFF',
                border: '1px solid #404040',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SA_FLAGSHIP_MERCHANTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.province || 'SA'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Right Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#004C3F', color: '#95F5D0', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
            <span>✓ 0% Take Rate</span>
            <span>·</span>
            <span>Direct Trade</span>
          </div>

          <Link
            href={`/m/${merchant.id}`}
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#303030',
              color: '#E0E0E0',
              textDecoration: 'none',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '1px solid #444444',
            }}
          >
            <span>👁️ View Live Storefront</span>
            <span>&nearr;</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN LAYOUT: SHOPIFY LEFT SIDEBAR + PRO CONTENT AREA */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Navigation Sidebar */}
        <aside
          style={{
            width: '240px',
            background: '#EBEBEB',
            borderRight: '1px solid #D2D2D2',
            padding: '1.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6D7175', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.35rem 0.65rem 0.5rem' }}>
            Main Menu
          </div>

          {[
            { id: 'overview', label: 'Home / Overview', icon: '🏠' },
            { id: 'products', label: 'All Products (Catalog)', icon: '📦' },
            { id: 'discovered', label: `Discovered by AI (${pendingDiscoveredCount})`, icon: '✨', badge: pendingDiscoveredCount > 0 ? pendingDiscoveredCount : null },
            { id: 'gmc', label: 'Google Merchant Center', icon: '🛒' },
            { id: 'inquiries', label: 'Inquiries & Leads', icon: '💬', badge: 3 },
            { id: 'trust', label: 'Trust & Seals', icon: '🛡️' },
            { id: 'settings', label: 'Store Settings', icon: '⚙️' },
          ].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#202223' : '#5C5F62',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: item.id === 'discovered' ? '#4285F4' : '#008060',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Support / Live Sync Box */}
          <div style={{ marginTop: 'auto', background: '#FFFFFF', borderRadius: '10px', padding: '1rem', border: '1px solid #D2D2D2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#008060', marginBottom: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#008060', display: 'inline-block' }}></span>
              GMC Live Feed Active
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6D7175', margin: '0 0 0.65rem 0', lineHeight: 1.4 }}>
              Feed auto-synchronizes every hour with Google Shopping.
            </p>
            <button
              onClick={handleCopyFeedUrl}
              style={{
                width: '100%',
                background: '#F1F2F4',
                border: '1px solid #C9CCCF',
                borderRadius: '6px',
                padding: '0.35rem',
                fontSize: '0.725rem',
                fontWeight: 700,
                color: '#202223',
                cursor: 'pointer',
              }}
            >
              {copiedFeed ? '✓ Feed URL Copied!' : '📋 Copy GMC Feed URL'}
            </button>
          </div>
        </aside>

        {/* Right Main Content Stage */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px' }}>
          {/* SECTION 1: OVERVIEW / DASHBOARD HOME */}
          {activeSection === 'overview' && (
            <div>
              {/* Header Greeting */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#202223', margin: 0 }}>
                    Welcome back, {merchant.name}
                  </h1>
                  <p style={{ color: '#6D7175', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                    Here is what is happening across your Google Shopping & Shoppage storefront today.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setActiveSection('discovered')}
                    style={{
                      background: '#4285F4',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 1.15rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>✨ Confirm Discovered ({pendingDiscoveredCount})</span>
                  </button>
                </div>
              </div>

              {/* Shopify KPI 4-Card Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6D7175', marginBottom: '0.4rem' }}>
                    TOTAL INQUIRY VALUE
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#202223' }}>
                    R 268,500
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#008060', fontWeight: 700, marginTop: '0.25rem' }}>
                    ↑ 24.5% vs last week · 0% Take Rate
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6D7175', marginBottom: '0.4rem' }}>
                    GOOGLE & GRID IMPRESSIONS
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#202223' }}>
                    48,290
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#008060', fontWeight: 700, marginTop: '0.25rem' }}>
                    ↑ 18.2% across South Africa
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6D7175', marginBottom: '0.4rem' }}>
                    ACTIVE STORE SKUs
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#202223' }}>
                    {productsList.filter((p) => p.inStock).length} / {productsList.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4285F4', fontWeight: 700, marginTop: '0.25rem' }}>
                    {pendingDiscoveredCount} pending confirmation
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6D7175', marginBottom: '0.4rem' }}>
                    GMC FEED DIAGNOSTICS
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#008060', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>✓ 100%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6D7175', marginTop: '0.25rem' }}>
                    Free Listings Active in SA
                  </div>
                </div>
              </div>

              {/* Google Merchant Center Diagnostics Strip */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#202223', margin: 0 }}>
                      Google Merchant Center — Product Diagnostics
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: '#6D7175', margin: '0.2rem 0 0 0' }}>
                      Status of your inventory on Google Shopping and Free Listings in South Africa
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('gmc')}
                    style={{ background: '#F1F2F4', border: '1px solid #C9CCCF', borderRadius: '6px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View GMC Settings →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803D' }}>24</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>Active (Approved)</div>
                  </div>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D4ED8' }}>{pendingDiscoveredCount}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>Ready to Confirm</div>
                  </div>
                  <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A16207' }}>0</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854D0E' }}>Expiring Soon</div>
                  </div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#B91C1C' }}>0</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>Disapproved (0 Errors)</div>
                  </div>
                </div>
              </div>

              {/* Recent Discovered Products Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#202223', margin: 0 }}>
                    ✨ Discovered by Web Crawler (Ready to Publish)
                  </h3>
                  <button
                    onClick={() => setActiveSection('discovered')}
                    style={{ color: '#008060', background: 'none', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All ({pendingDiscoveredCount}) →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {discoveredStock.filter((s) => s.status === 'pending').map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #E1E3E5',
                        borderRadius: '8px',
                        padding: '0.85rem 1.15rem',
                        background: '#FAFAFA',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202223' }}>{item.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#6D7175', marginTop: '0.15rem' }}>
                          Brand: <strong>{item.brand}</strong> · Warranty: <strong>{item.warranty}</strong> · Source: <span style={{ color: '#4285F4' }}>{item.sourceUrl}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#202223' }}>
                          R {item.currentPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </div>
                        <button
                          onClick={() => handleConfirmStock(item.id)}
                          style={{
                            background: '#008060',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.4rem 0.85rem',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Confirm Stock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SHOPIFY ALL PRODUCTS TABLE */}
          {activeSection === 'products' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202223', margin: 0 }}>
                    Products & Inventory ({productsList.length})
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#6D7175', margin: '0.2rem 0 0 0' }}>
                    Manage catalog pricing, availability, and Google Shopping feed sync.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('discovered')}
                  style={{ background: '#008060', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Add / Import Products
                </button>
              </div>

              {/* Shopify Products Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E1E3E5', textAlign: 'left', color: '#6D7175', background: '#FAFAFA' }}>
                    <th style={{ padding: '0.75rem' }}>Product</th>
                    <th style={{ padding: '0.75rem' }}>Brand</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Price (ZAR)</th>
                    <th style={{ padding: '0.75rem' }}>GMC Sync</th>
                    <th style={{ padding: '0.75rem' }}>Impressions</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F2F4' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#202223' }}>
                        <Link href={`/p/${p.id}`} target="_blank" style={{ color: '#202223', textDecoration: 'none' }}>
                          {p.title}
                        </Link>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#6D7175' }}>{p.brand}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <button
                          onClick={() => toggleProductStock(p.id)}
                          style={{
                            background: p.inStock ? '#E3F1DF' : '#F6E6E6',
                            color: p.inStock ? '#008060' : '#D72C0D',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.2rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {p.inStock ? '✓ In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#202223' }}>
                        R {p.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ Active
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#6D7175' }}>{p.impressions.toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <Link href={`/p/${p.id}`} target="_blank" style={{ color: '#008060', textDecoration: 'none', fontWeight: 700 }}>
                          View PDP &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 3: 1-CLICK DISCOVERED STOCK TAB */}
          {activeSection === 'discovered' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202223', margin: 0 }}>
                    ✨ AI Discovered Products Engine
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#6D7175', margin: '0.2rem 0 0 0' }}>
                    Automatically extracted from your website and physical store catalog. Confirm to publish directly to Google Shopping.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {discoveredStock.map((item) => {
                  const isConfirmed = item.status === 'confirmed';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: isConfirmed ? '1.5px solid #008060' : isRejected ? '1px solid #E1E3E5' : '1.5px solid #BFDBFE',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        background: isConfirmed ? '#F0FDF4' : isRejected ? '#F6F6F7' : '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#202223' }}>{item.title}</span>
                          {isConfirmed && <span style={{ background: '#008060', color: '#FFF', fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>✓ LIVE ON GOOGLE</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6D7175' }}>
                          Brand: <strong>{item.brand}</strong> · Warranty: <strong>{item.warranty}</strong> · Source: <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4285F4' }}>{item.sourceUrl}</a>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#6D7175', fontWeight: 700 }}>CONFIRM PRICE:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>R</span>
                            <input
                              type="number"
                              value={item.currentPrice}
                              disabled={isConfirmed}
                              onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                              style={{ width: '90px', padding: '0.35rem', borderRadius: '4px', border: '1px solid #C9CCCF', fontWeight: 800, fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>

                        {!isConfirmed && !isRejected && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleConfirmStock(item.id)}
                              style={{ background: '#008060', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}
                            >
                              ✓ Confirm & Publish
                            </button>
                            <button
                              onClick={() => handleRejectStock(item.id)}
                              style={{ background: '#FFFFFF', color: '#D72C0D', border: '1px solid #D72C0D', borderRadius: '6px', padding: '0.5rem 0.8rem', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
                            >
                              ✕ Ignore
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: GOOGLE MERCHANT CENTER FEED DIAGNOSTICS */}
          {activeSection === 'gmc' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202124', margin: '0 0 0.5rem 0' }}>
                🛒 Google Merchant Center — Direct XML Feed Integration
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#5F6368', marginBottom: '1.5rem' }}>
                Paste this automated feed URL into your Google Merchant Center account. Updates to inventory and prices reflect automatically across Google Shopping without manual uploads.
              </p>

              {/* Feed URL Box */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #BFDBFE', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  YOUR AUTOMATED GOOGLE MERCHANT CENTER FEED URL:
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={googleMerchantCenter.feedUrl}
                    style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={handleCopyFeedUrl}
                    style={{ background: '#008060', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.65rem 1.25rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {copiedFeed ? '✓ Copied!' : '📋 Copy Feed URL'}
                  </button>
                </div>
              </div>

              {/* GMC Diagnostics Table */}
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202124', marginBottom: '0.75rem' }}>
                Feed Attributes & Compliance
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E1E3E5' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>Target Country & Currency</td>
                    <td style={{ padding: '0.75rem', color: '#008060', fontWeight: 800 }}>🇿🇦 South Africa (ZAR Rands)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E1E3E5' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>Google Free Listings Status</td>
                    <td style={{ padding: '0.75rem', color: '#008060', fontWeight: 800 }}>✓ Eligible & Active</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E1E3E5' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>Local Inventory Ads (LIA)</td>
                    <td style={{ padding: '0.75rem', color: '#008060', fontWeight: 800 }}>✓ Enabled (Physical Counter Verified)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>Auto-Update Frequency</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>Continuous Webhook + Hourly Full Sweep</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 5: INQUIRIES & DIRECT ORDERS CRM */}
          {activeSection === 'inquiries' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202223', margin: 0 }}>
                    Omnichannel Inquiries & Leads ({inquiriesList.length})
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#6D7175', margin: '0.2rem 0 0 0' }}>
                    Direct customer calls, web clickouts, and RFQ broadcast quotes (0% middleman take rate).
                  </p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E1E3E5', textAlign: 'left', color: '#6D7175', background: '#FAFAFA' }}>
                    <th style={{ padding: '0.75rem' }}>Customer / Organization</th>
                    <th style={{ padding: '0.75rem' }}>Items Requested</th>
                    <th style={{ padding: '0.75rem' }}>Channel</th>
                    <th style={{ padding: '0.75rem' }}>Estimated Value</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiriesList.map((inq) => (
                    <tr key={inq.id} style={{ borderBottom: '1px solid #F1F2F4' }}>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 800, color: '#202223' }}>{inq.buyer}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6D7175' }}>📞 {inq.phone}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#475569' }}>{inq.items}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#1E40AF' }}>{inq.channel}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#202223' }}>
                        R {inq.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#6D7175' }}>{inq.date}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: inq.status === 'New' ? '#FEF3C7' : '#DCFCE7', color: inq.status === 'New' ? '#B45309' : '#15803D', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 6: TRUST & SEALS */}
          {activeSection === 'trust' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202223', margin: '0 0 0.5rem 0' }}>
                🛡️ Verified Merchant Trust Seal & Counter QR Kit
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#5F6368', marginBottom: '1.5rem' }}>
                Embed your live Shoppage Verified Trust Seal on your website or print your physical counter QR code.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {/* Trust Seal Embed Card */}
                <div style={{ border: '1px solid #E1E3E5', borderRadius: '8px', padding: '1.25rem', background: '#FAFAFA' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#202223', marginBottom: '0.5rem' }}>
                    Website Vector Trust Badge
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#6D7175', marginBottom: '1rem' }}>
                    Displays live verification, 0% take rate, and verified reviews on your own website.
                  </p>
                  <button
                    onClick={handleCopySealSnippet}
                    style={{ background: '#008060', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {copiedSeal ? '✓ HTML Snippet Copied!' : '📋 Copy SVG HTML Embed'}
                  </button>
                </div>

                {/* Counter QR Code Kit */}
                <div style={{ border: '1px solid #E1E3E5', borderRadius: '8px', padding: '1.25rem', background: '#FAFAFA' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#202223', marginBottom: '0.5rem' }}>
                    Physical Counter QR Kit
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#6D7175', marginBottom: '1rem' }}>
                    Print your in-store counter QR sign so walk-in buyers can instantly view your live catalog.
                  </p>
                  <Link
                    href={`/m/${merchant.id}`}
                    target="_blank"
                    style={{ display: 'inline-block', background: '#202223', color: '#FFFFFF', textDecoration: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 800, fontSize: '0.8rem' }}
                  >
                    🖨️ Print Counter QR
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: STORE SETTINGS */}
          {activeSection === 'settings' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E1E3E5', borderRadius: '12px', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202223', margin: '0 0 0.5rem 0' }}>
                ⚙️ Store Profile & Direct Trade Settings
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#5F6368', marginBottom: '1.5rem' }}>
                Configure public storefront contact channels and commercial terms.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#202223', display: 'block', marginBottom: '0.3rem' }}>
                    Store Name
                  </label>
                  <input
                    type="text"
                    defaultValue={merchant.name}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #C9CCCF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#202223', display: 'block', marginBottom: '0.3rem' }}>
                    Physical Address & Stall Identifier
                  </label>
                  <input
                    type="text"
                    defaultValue={merchant.addressText}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #C9CCCF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#202223', display: 'block', marginBottom: '0.3rem' }}>
                    Direct Telephone / Counter Hotline
                  </label>
                  <input
                    type="text"
                    defaultValue={merchant.contacts?.telephone || '011 837 0122'}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #C9CCCF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#202223', display: 'block', marginBottom: '0.3rem' }}>
                    Official Website URL
                  </label>
                  <input
                    type="text"
                    defaultValue={merchant.contacts?.website || 'https://sunpower.co.za'}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #C9CCCF', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    style={{ background: '#008060', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.65rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Save Store Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
