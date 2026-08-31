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
  const [activeSection, setActiveSection] = useState<
    'overview' | 'orders' | 'products' | 'discovered' | 'customers' | 'coupons' | 'analytics' | 'feeds' | 'settings' | 'status'
  >('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedSeal, setCopiedSeal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'processing' | 'completed' | 'on_hold' | 'pending'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'inventory' | 'shipping' | 'payments'>('general');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', brand: '', price: '', sku: '', category: 'Solar & Inverters' });

  // 1-Click Discovered Stock Confirmation State
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
      sku: 'DEYE-5KW-SG03',
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
      sku: 'DYN-5.12KWH-BX',
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
      sku: 'JA-550W-MONO',
    },
  ]);

  // WooCommerce Products State
  const [productsList, setProductsList] = useState(
    SA_CANONICAL_PRODUCTS.slice(0, 8).map((p, idx) => ({
      id: p.canonicalId,
      sku: `SKU-${1000 + idx}`,
      title: p.title,
      brand: p.brand,
      category: idx < 3 ? 'Inverters & Solar' : idx < 6 ? 'Batteries & Storage' : 'Electrical & Cables',
      price: (p.attributes?.estimatedPriceZar as number) || (idx === 0 ? 18500 : idx === 1 ? 16900 : 1750 + idx * 800),
      salePrice: idx === 0 ? 17999 : null,
      inStock: idx !== 4,
      stockQty: idx === 4 ? 0 : 12 + idx * 5,
      feedStatus: 'Active' as 'Active' | 'Needs Action' | 'Disapproved',
      views: 1240 + idx * 310,
      salesCount: 8 + idx * 3,
    }))
  );

  // WooCommerce Orders State
  const [ordersList, setOrdersList] = useState([
    {
      id: '#10482',
      customer: 'Johannesburg Solar Installers CC',
      phone: '082 459 1102',
      email: 'orders@jhbsolar.co.za',
      items: '4x Deye 5kW Hybrid Inverter + 8x Dyness 5.12kWh',
      itemCount: 12,
      total: 198000,
      paymentMethod: 'Direct Bank Transfer (EFT)',
      date: 'Today at 14:20',
      status: 'processing' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: '14 Commerce Rd, Crown Mines, JHB',
    },
    {
      id: '#10481',
      customer: 'Pretoria East Residential Buyer',
      phone: '071 884 9231',
      email: 'gerhard@pta-east.co.za',
      items: '1x Sunsynk 8kW Hybrid Inverter 48V',
      itemCount: 1,
      total: 28500,
      paymentMethod: 'PayFast / Credit Card',
      date: 'Today at 11:05',
      status: 'processing' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: '88 Garsfontein Rd, Pretoria East',
    },
    {
      id: '#10480',
      customer: 'Sandton Building Contractor',
      phone: '083 290 7714',
      email: 'procurement@sandtonconstruct.co.za',
      items: '24x JA Solar 550W Mono PERC Panels',
      itemCount: 24,
      total: 42000,
      paymentMethod: 'Direct Bank Transfer (EFT)',
      date: 'Yesterday at 16:45',
      status: 'completed' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: 'Site 4B, Sandton Financial District',
    },
    {
      id: '#10479',
      customer: 'Cape Peninsula Marine Electric',
      phone: '084 551 8892',
      email: 'accounts@peninsulamarine.co.za',
      items: '2x Victron MultiPlus-II 48/5000/70-50',
      itemCount: 2,
      total: 39900,
      paymentMethod: 'PayFast / Instant EFT',
      date: 'Yesterday at 09:12',
      status: 'completed' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: 'Unit 9, Paarden Eiland, Cape Town',
    },
    {
      id: '#10478',
      customer: 'Durban North Eco Homes',
      phone: '082 334 1109',
      email: 'sbu@ecohomesdbn.co.za',
      items: '12x Canadian Solar 550W Panels + Mounting Kit',
      itemCount: 13,
      total: 24600,
      paymentMethod: 'Cash on Delivery (COD)',
      date: '28 Aug 2026',
      status: 'on_hold' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: '44 Umhlanga Rocks Dr, Durban',
    },
    {
      id: '#10477',
      customer: 'Bloemfontein Agricultural Estates',
      phone: '083 776 2201',
      email: 'piet@agribloem.co.za',
      items: '2x Deye 8kW Hybrid Inverter + 4x 10kWh Storage',
      itemCount: 6,
      total: 135000,
      paymentMethod: 'Direct Bank Transfer (EFT)',
      date: '27 Aug 2026',
      status: 'pending' as 'processing' | 'completed' | 'on_hold' | 'pending',
      shippingAddress: 'R30 Farm Outspan, Bloemfontein',
    },
  ]);

  // WooCommerce Customers State
  const [customersList] = useState([
    {
      id: 'cust_001',
      name: 'Johannesburg Solar Installers CC',
      location: 'Crown Mines, Gauteng',
      ordersCount: 8,
      totalSpend: 485000,
      email: 'orders@jhbsolar.co.za',
      phone: '082 459 1102',
    },
    {
      id: 'cust_002',
      name: 'Pretoria East Residential Buyer',
      location: 'Pretoria, Gauteng',
      ordersCount: 2,
      totalSpend: 54000,
      email: 'gerhard@pta-east.co.za',
      phone: '071 884 9231',
    },
    {
      id: 'cust_003',
      name: 'Sandton Building Contractor',
      location: 'Sandton, Gauteng',
      ordersCount: 5,
      totalSpend: 210000,
      email: 'procurement@sandtonconstruct.co.za',
      phone: '083 290 7714',
    },
    {
      id: 'cust_004',
      name: 'Cape Peninsula Marine Electric',
      location: 'Cape Town, Western Cape',
      ordersCount: 4,
      totalSpend: 162000,
      email: 'accounts@peninsulamarine.co.za',
      phone: '084 551 8892',
    },
  ]);

  // WooCommerce Coupons State
  const [couponsList, setCouponsList] = useState([
    {
      code: 'SOLARSPRING10',
      type: 'Percentage discount',
      amount: '10%',
      usage: '24 / 100',
      expiry: '30 Sep 2026',
      status: 'Active',
    },
    {
      code: 'CONTRACTOR500',
      type: 'Fixed cart discount',
      amount: 'R 500.00',
      usage: '18 / 50',
      expiry: '31 Dec 2026',
      status: 'Active',
    },
    {
      code: 'FIRSTORDER',
      type: 'Percentage discount',
      amount: '5%',
      usage: '89 / Unlimited',
      expiry: 'No expiry',
      status: 'Active',
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
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock, stockQty: !p.inStock ? 10 : 0 } : p))
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'processing' | 'completed' | 'on_hold' | 'pending') => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim()) return;
    const priceNum = parseFloat(newProduct.price) || 999;
    setProductsList([
      {
        id: `prod_custom_${Date.now()}`,
        sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        title: newProduct.title,
        brand: newProduct.brand || 'Custom Brand',
        category: newProduct.category,
        price: priceNum,
        salePrice: null,
        inStock: true,
        stockQty: 15,
        feedStatus: 'Active',
        views: 0,
        salesCount: 0,
      },
      ...productsList,
    ]);
    setNewProduct({ title: '', brand: '', price: '', sku: '', category: 'Solar & Inverters' });
    setShowAddProductModal(false);
  };

  const pendingDiscoveredCount = discoveredStock.filter((s) => s.status === 'pending').length;
  const processingOrdersCount = ordersList.filter((o) => o.status === 'processing').length;

  const filteredOrders = ordersList.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const filteredProducts = productsList.filter((p) => {
    if (productCategoryFilter === 'all') return true;
    return p.category === productCategoryFilter;
  });

  return (
    <div style={{ background: '#F0F0F1', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#2C3338' }}>
      {/* 1. WOOCOMMERCE / WORDPRESS ADMIN TOPBAR */}
      <header
        style={{
          background: '#1D2327',
          color: '#FFFFFF',
          padding: '0 1.25rem',
          height: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #2C3338',
          zIndex: 50,
        }}
      >
        {/* Left: Brand + Store Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Sidebar Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A7AAAD',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = '#2C3338';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#A7AAAD';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {isSidebarCollapsed ? '☰' : '◀'}
          </button>

          {/* WooCommerce Store Badge */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: '#7F54B3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.85rem',
                boxShadow: '0 2px 4px rgba(127, 84, 179, 0.4)',
              }}
            >
              W
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                WooCommerce <span style={{ color: '#96588A', fontWeight: 600 }}>Merchant Centre</span>
              </span>
            </div>
          </Link>

          <span style={{ color: '#3C434A' }}>|</span>

          {/* Store Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C8F94' }}>Store:</span>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              style={{
                background: '#2C3338',
                color: '#F0F0F1',
                border: '1px solid #484C51',
                borderRadius: '4px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
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

        {/* Right: Activity Center & Live Store Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* WooCommerce Activity Pill */}
          <div
            onClick={() => setActiveSection('orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#2C3338',
              color: '#F0F0F1',
              padding: '0.25rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Processing Orders"
          >
            <span>🔔</span>
            <span style={{ color: '#72AEE6' }}>{processingOrdersCount} Orders</span>
          </div>

          {/* Low Stock Pill */}
          <div
            onClick={() => setActiveSection('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#2C3338',
              color: '#F0F0F1',
              padding: '0.25rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Out of stock / Low stock alerts"
          >
            <span>⚠️</span>
            <span style={{ color: '#F0B849' }}>1 Alert</span>
          </div>

          {/* Visit Live Store Link */}
          <Link
            href={`/m/${merchant.id}`}
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#7F54B3',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '4px',
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            <span>Visit Store ↗</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN LAYOUT: WOOCOMMERCE SIDEBAR + PRO CONTENT CANVAS */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Navigation Sidebar */}
        <aside
          style={{
            width: isSidebarCollapsed ? '68px' : '230px',
            background: '#1D2327',
            borderRight: '1px solid #2C3338',
            padding: isSidebarCollapsed ? '1rem 0.4rem' : '1.25rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            flexShrink: 0,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s ease',
            overflowX: 'hidden',
          }}
        >
          {!isSidebarCollapsed && (
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#8C8F94',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '0.25rem 0.65rem 0.5rem',
              }}
            >
              WooCommerce Admin
            </div>
          )}

          {[
            { id: 'overview', label: 'Home / Dashboard', icon: '🏠' },
            { id: 'orders', label: 'Orders', icon: '🛒', badge: processingOrdersCount > 0 ? processingOrdersCount : null },
            { id: 'products', label: 'Products', icon: '📦' },
            { id: 'discovered', label: 'Discovered Stock', icon: '✨', badge: pendingDiscoveredCount > 0 ? pendingDiscoveredCount : null },
            { id: 'customers', label: 'Customers', icon: '👥' },
            { id: 'coupons', label: 'Coupons & Marketing', icon: '🏷️' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'feeds', label: 'Feeds & Syndication', icon: '📤' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            { id: 'status', label: 'System Status', icon: '🩺' },
          ].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                title={isSidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: isSidebarCollapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                  borderRadius: '5px',
                  border: 'none',
                  background: isActive ? '#7F54B3' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#C3C4C7',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#72AEE6';
                    e.currentTarget.style.background = '#2C3338';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#C3C4C7';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.05rem', minWidth: '22px', textAlign: 'center' }}>{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: item.id === 'discovered' ? '#2271B1' : '#7F54B3',
                      border: isActive ? '1px solid #FFFFFF' : 'none',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: isSidebarCollapsed ? '0.1rem 0.35rem' : '0.1rem 0.45rem',
                      borderRadius: '10px',
                      position: isSidebarCollapsed ? 'absolute' : 'static',
                      top: isSidebarCollapsed ? '4px' : undefined,
                      right: isSidebarCollapsed ? '4px' : undefined,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Bottom Collapse Toggle & Store Status Box */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: '0.5rem',
                background: '#2C3338',
                border: 'none',
                color: '#A7AAAD',
                padding: '0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <span>{isSidebarCollapsed ? '▶' : '◀'}</span>
              {!isSidebarCollapsed && <span>Collapse Menu</span>}
            </button>

            {!isSidebarCollapsed && (
              <div
                style={{
                  marginTop: '0.75rem',
                  background: '#262C30',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  border: '1px solid #3C434A',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#00A32A', marginBottom: '0.2rem' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00A32A', display: 'inline-block' }}></span>
                  Product Feed Active
                </div>
                <p style={{ fontSize: '0.7rem', color: '#8C8F94', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                  Automated XML product feed syncs live with sales channels.
                </p>
                <button
                  onClick={handleCopyFeedUrl}
                  style={{
                    width: '100%',
                    background: '#1D2327',
                    border: '1px solid #484C51',
                    borderRadius: '4px',
                    padding: '0.3rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#F0F0F1',
                    cursor: 'pointer',
                  }}
                >
                  {copiedFeed ? '✓ Feed Copied!' : '📋 Copy Feed URL'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Content Stage */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1280px', overflowX: 'auto' }}>
          {/* TAB 1: OVERVIEW / DASHBOARD HOME */}
          {activeSection === 'overview' && (
            <div>
              {/* Header Greeting */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    WooCommerce Dashboard
                  </h1>
                  <p style={{ color: '#646970', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                    Welcome back, <strong>{merchant.name}</strong>. Here is your store summary for today.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    style={{
                      background: '#7F54B3',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Product
                  </button>
                  <button
                    onClick={() => setActiveSection('discovered')}
                    style={{
                      background: '#2271B1',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>✨ Review Discovered ({pendingDiscoveredCount})</span>
                  </button>
                </div>
              </div>

              {/* WooCommerce KPI 4-Card Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#646970', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    NET SALES (THIS MONTH)
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D2327' }}>
                    R 268,500
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#00A32A', fontWeight: 700, marginTop: '0.25rem' }}>
                    ↑ 24.5% vs last month
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#646970', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    ORDERS PLACED
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D2327' }}>
                    {ordersList.length} orders
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2271B1', fontWeight: 700, marginTop: '0.25rem' }}>
                    {processingOrdersCount} awaiting fulfillment
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#646970', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    AVERAGE ORDER VALUE
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D2327' }}>
                    R 19,178
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#646970', marginTop: '0.25rem' }}>
                    Across wholesale & retail
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#646970', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    CATALOG & FEED HEALTH
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#00A32A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>✓ 100%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#646970', marginTop: '0.25rem' }}>
                    {productsList.filter((p) => p.inStock).length} SKUs in stock
                  </div>
                </div>
              </div>

              {/* Store Tasks / Inbox Alerts */}
              <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Store Tasks & Activity
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#646970' }}>Updated just now</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F6F0FA', border: '1px solid #E3D2F4', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📦</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D2327' }}>
                          {processingOrdersCount} Orders are ready to be fulfilled
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>
                          New orders received today from Johannesburg & Pretoria buyers.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection('orders')}
                      style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Orders →
                    </button>
                  </div>

                  {pendingDiscoveredCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F0F6FC', border: '1px solid #C8E1FF', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D2327' }}>
                            {pendingDiscoveredCount} products discovered from your store catalog
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#646970' }}>
                            Confirm price and stock to publish immediately into your WooCommerce catalog.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection('discovered')}
                        style={{ background: '#2271B1', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Confirm Stock →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Snapshot Table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => setActiveSection('orders')}
                    style={{ background: 'none', border: 'none', color: '#7F54B3', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All Orders ({ordersList.length}) →
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E0E0E0', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                      <th style={{ padding: '0.65rem' }}>Order</th>
                      <th style={{ padding: '0.65rem' }}>Date</th>
                      <th style={{ padding: '0.65rem' }}>Status</th>
                      <th style={{ padding: '0.65rem' }}>Customer</th>
                      <th style={{ padding: '0.65rem' }}>Payment</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>Total (ZAR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.slice(0, 4).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                        <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#7F54B3' }}>{order.id}</td>
                        <td style={{ padding: '0.75rem 0.65rem', color: '#646970' }}>{order.date}</td>
                        <td style={{ padding: '0.75rem 0.65rem' }}>
                          <span
                            style={{
                              background:
                                order.status === 'processing'
                                  ? '#C6E1C6'
                                  : order.status === 'completed'
                                  ? '#C8D7E1'
                                  : order.status === 'on_hold'
                                  ? '#F8DDA7'
                                  : '#E2E4E7',
                              color:
                                order.status === 'processing'
                                  ? '#5B841B'
                                  : order.status === 'completed'
                                  ? '#2E4453'
                                  : order.status === 'on_hold'
                                  ? '#94660C'
                                  : '#646970',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'capitalize',
                            }}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.65rem', fontWeight: 600, color: '#1D2327' }}>{order.customer}</td>
                        <td style={{ padding: '0.75rem 0.65rem', color: '#646970' }}>{order.paymentMethod}</td>
                        <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right', fontWeight: 800, color: '#1D2327' }}>
                          R {order.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: WOOCOMMERCE ORDERS MANAGEMENT */}
          {activeSection === 'orders' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Orders
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Manage customer orders, change order statuses, and track fulfillment.
                  </p>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All (${ordersList.length})` },
                  { id: 'processing', label: `Processing (${ordersList.filter((o) => o.status === 'processing').length})` },
                  { id: 'completed', label: `Completed (${ordersList.filter((o) => o.status === 'completed').length})` },
                  { id: 'on_hold', label: `On Hold (${ordersList.filter((o) => o.status === 'on_hold').length})` },
                  { id: 'pending', label: `Pending Payment (${ordersList.filter((o) => o.status === 'pending').length})` },
                ].map((chip) => {
                  const isSelected = orderStatusFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setOrderStatusFilter(chip.id as any)}
                      style={{
                        background: isSelected ? '#7F54B3' : '#F0F0F1',
                        color: isSelected ? '#FFFFFF' : '#2C3338',
                        border: '1px solid ' + (isSelected ? '#7F54B3' : '#DCDCDE'),
                        borderRadius: '4px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Orders Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>Order</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Customer & Contact</th>
                    <th style={{ padding: '0.75rem' }}>Items Ordered</th>
                    <th style={{ padding: '0.75rem' }}>Payment</th>
                    <th style={{ padding: '0.75rem' }}>Total (ZAR)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#7F54B3' }}>
                        {order.id}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{order.date}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          style={{
                            background:
                              order.status === 'processing'
                                ? '#C6E1C6'
                                : order.status === 'completed'
                                ? '#C8D7E1'
                                : order.status === 'on_hold'
                                ? '#F8DDA7'
                                : '#E2E4E7',
                            color:
                              order.status === 'processing'
                                ? '#5B841B'
                                : order.status === 'completed'
                                ? '#2E4453'
                                : order.status === 'on_hold'
                                ? '#94660C'
                                : '#646970',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                          <option value="pending">Pending Payment</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#1D2327' }}>{order.customer}</div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>📞 {order.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8C8F94' }}>📍 {order.shippingAddress}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#475569', maxWidth: '240px' }}>
                        {order.items}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970', fontSize: '0.78rem' }}>
                        {order.paymentMethod}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#1D2327' }}>
                        R {order.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, order.status === 'completed' ? 'processing' : 'completed')}
                          style={{
                            background: order.status === 'completed' ? '#F0F0F1' : '#00A32A',
                            color: order.status === 'completed' ? '#2C3338' : '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {order.status === 'completed' ? 'Reopen' : '✓ Complete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: WOOCOMMERCE PRODUCTS CATALOG */}
          {activeSection === 'products' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Products ({productsList.length})
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Manage catalog pricing, stock status, and product syndication.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 0.95rem', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add New Product
                  </button>
                  <button
                    onClick={() => setActiveSection('discovered')}
                    style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.45rem 0.95rem', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✨ Discovered ({pendingDiscoveredCount})
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#646970' }}>Category:</span>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.8rem' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Inverters & Solar">Inverters & Solar</option>
                    <option value="Batteries & Storage">Batteries & Storage</option>
                    <option value="Electrical & Cables">Electrical & Cables</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>SKU</th>
                    <th style={{ padding: '0.75rem' }}>Product Name</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Stock Status</th>
                    <th style={{ padding: '0.75rem' }}>Price (ZAR)</th>
                    <th style={{ padding: '0.75rem' }}>Feed Sync</th>
                    <th style={{ padding: '0.75rem' }}>Views</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontFamily: 'monospace', color: '#646970', fontWeight: 600 }}>
                        {p.sku}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#1D2327' }}>
                        <Link href={`/p/${p.id}`} target="_blank" style={{ color: '#1D2327', textDecoration: 'none' }}>
                          {p.title}
                        </Link>
                        <div style={{ fontSize: '0.72rem', color: '#8C8F94' }}>Brand: {p.brand}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{p.category}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <button
                          onClick={() => toggleProductStock(p.id)}
                          style={{
                            background: p.inStock ? '#E5F6E7' : '#FCE8E6',
                            color: p.inStock ? '#00A32A' : '#D63638',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {p.inStock ? `✓ In stock (${p.stockQty})` : '✕ Out of stock'}
                        </button>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#1D2327' }}>
                        {p.salePrice ? (
                          <div>
                            <span style={{ color: '#7F54B3' }}>R {p.salePrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>{' '}
                            <span style={{ fontSize: '0.75rem', color: '#8C8F94', textDecoration: 'line-through' }}>
                              R {p.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          `R ${p.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: '#F0F6FC', color: '#2271B1', padding: '0.15rem 0.45rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 700 }}>
                          ✓ Active
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{p.views.toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <Link href={`/p/${p.id}`} target="_blank" style={{ color: '#7F54B3', textDecoration: 'none', fontWeight: 700 }}>
                          View ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Product Modal */}
              {showAddProductModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                  }}
                >
                  <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1.75rem', width: '100%', maxWidth: '480px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Add New Product</h3>
                    <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Product Title</label>
                        <input
                          type="text"
                          required
                          value={newProduct.title}
                          onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                          placeholder="e.g. Deye 8kW Hybrid Inverter"
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Brand</label>
                          <input
                            type="text"
                            value={newProduct.brand}
                            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                            placeholder="e.g. Deye"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>SKU</label>
                          <input
                            type="text"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            placeholder="e.g. DEYE-8KW"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Regular Price (ZAR)</label>
                          <input
                            type="number"
                            required
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            placeholder="e.g. 28500"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Category</label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE' }}
                          >
                            <option value="Solar & Inverters">Solar & Inverters</option>
                            <option value="Batteries & Storage">Batteries & Storage</option>
                            <option value="Electrical & Cables">Electrical & Cables</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(false)}
                          style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Publish Product
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 1-CLICK DISCOVERED STOCK TAB */}
          {activeSection === 'discovered' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    ✨ AI Discovered Catalog Sync
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Automatically extracted from your website and inventory listings. Confirm prices and items to add them directly into your WooCommerce product catalog.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {discoveredStock.map((item) => {
                  const isConfirmed = item.status === 'confirmed';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: isConfirmed ? '1.5px solid #00A32A' : isRejected ? '1px solid #DCDCDE' : '1.5px solid #7F54B3',
                        borderRadius: '6px',
                        padding: '1.15rem',
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
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1D2327' }}>{item.title}</span>
                          {isConfirmed && <span style={{ background: '#00A32A', color: '#FFF', fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>✓ ADDED TO CATALOG</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#646970' }}>
                          SKU: <strong>{item.sku}</strong> · Brand: <strong>{item.brand}</strong> · Warranty: <strong>{item.warranty}</strong> · Source: <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2271B1' }}>{item.sourceUrl}</a>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#646970', fontWeight: 700 }}>PRICE (ZAR):</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>R</span>
                            <input
                              type="number"
                              value={item.currentPrice}
                              disabled={isConfirmed}
                              onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                              style={{ width: '90px', padding: '0.35rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontWeight: 800, fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        {!isConfirmed && !isRejected && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleConfirmStock(item.id)}
                              style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 0.9rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              ✓ Confirm & Add
                            </button>
                            <button
                              onClick={() => handleRejectStock(item.id)}
                              style={{ background: '#FFFFFF', color: '#D63638', border: '1px solid #D63638', borderRadius: '4px', padding: '0.45rem 0.75rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              ✕ Dismiss
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

          {/* TAB 5: CUSTOMERS CRM */}
          {activeSection === 'customers' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Customers ({customersList.length})
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    View registered trade buyers, contractors, and retail customer lifetime value.
                  </p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>Customer Name</th>
                    <th style={{ padding: '0.75rem' }}>Location</th>
                    <th style={{ padding: '0.75rem' }}>Orders</th>
                    <th style={{ padding: '0.75rem' }}>Total Spend (ZAR)</th>
                    <th style={{ padding: '0.75rem' }}>Email / Phone</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customersList.map((cust) => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#1D2327' }}>
                        {cust.name}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{cust.location}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>{cust.ordersCount} orders</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#7F54B3' }}>
                        R {cust.totalSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ color: '#1D2327' }}>{cust.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>📞 {cust.phone}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <button
                          style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: COUPONS & MARKETING */}
          {activeSection === 'coupons' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Coupons & Promotions
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Create and manage discount codes for wholesale buyers and trade promotions.
                  </p>
                </div>
                <button
                  style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 0.95rem', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add Coupon
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>Coupon Code</th>
                    <th style={{ padding: '0.75rem' }}>Coupon Type</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Usage / Limit</th>
                    <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {couponsList.map((coupon) => (
                    <tr key={coupon.code} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, fontFamily: 'monospace', color: '#7F54B3' }}>
                        {coupon.code}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{coupon.type}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800 }}>{coupon.amount}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{coupon.usage}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{coupon.expiry}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: '#E5F6E7', color: '#00A32A', padding: '0.15rem 0.45rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 700 }}>
                          ✓ {coupon.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: ANALYTICS & REPORTS */}
          {activeSection === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 0.5rem 0' }}>
                  WooCommerce Store Analytics
                </h2>
                <p style={{ fontSize: '0.825rem', color: '#646970', marginBottom: '1.5rem' }}>
                  Sales revenue, order volume, and top-selling product metrics.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#F6F7F7', padding: '1rem', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#646970', fontWeight: 700 }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D2327' }}>R 468,000</div>
                  </div>
                  <div style={{ background: '#F6F7F7', padding: '1rem', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#646970', fontWeight: 700 }}>TOTAL ORDERS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D2327' }}>24</div>
                  </div>
                  <div style={{ background: '#F6F7F7', padding: '1rem', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#646970', fontWeight: 700 }}>ITEMS SOLD</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D2327' }}>86 units</div>
                  </div>
                  <div style={{ background: '#F6F7F7', padding: '1rem', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#646970', fontWeight: 700 }}>CONVERSION RATE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00A32A' }}>3.8%</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', marginBottom: '0.75rem' }}>Top Selling Products</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {productsList.slice(0, 4).map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E0E0E0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#7F54B3', fontSize: '0.9rem' }}>#{i + 1}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#646970' }}>{p.salesCount} units sold</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#1D2327' }}>
                        R {(p.price * p.salesCount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: FEEDS & SYNDICATION */}
          {activeSection === 'feeds' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 0.5rem 0' }}>
                📦 Automated Product Catalog Feed (XML)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#646970', marginBottom: '1.5rem' }}>
                Use this automated XML product feed URL to syndicate inventory, prices, and availability across external sales channels.
              </p>

              {/* Feed URL Box */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '6px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  YOUR AUTOMATED XML PRODUCT FEED URL:
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={googleMerchantCenter.feedUrl}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.825rem', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={handleCopyFeedUrl}
                    style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.15rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {copiedFeed ? '✓ Copied!' : '📋 Copy Feed URL'}
                  </button>
                </div>
              </div>

              {/* Feed Diagnostics Table */}
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', marginBottom: '0.75rem' }}>
                Feed Attributes & Sync Status
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Target Country & Currency</td>
                    <td style={{ padding: '0.65rem', color: '#00A32A', fontWeight: 800 }}>🇿🇦 South Africa (ZAR Rands)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Product Feed Sync Status</td>
                    <td style={{ padding: '0.65rem', color: '#00A32A', fontWeight: 800 }}>✓ Eligible & Active</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Physical Counter Verification</td>
                    <td style={{ padding: '0.65rem', color: '#00A32A', fontWeight: 800 }}>✓ Verified Stockist Counter</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Auto-Update Frequency</td>
                    <td style={{ padding: '0.65rem', color: '#475569' }}>Continuous Webhook + Hourly Sync</td>
                  </tr>
                </tbody>
              </table>

              {/* Trust Badge Widget Embed */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid #E0E0E0', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', marginBottom: '0.35rem' }}>
                  Verified Store Trust Badge
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#646970', marginBottom: '0.75rem' }}>
                  Embed your live verified stockist seal on your website.
                </p>
                <button
                  onClick={handleCopySealSnippet}
                  style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {copiedSeal ? '✓ Embed Code Copied!' : '📋 Copy HTML Embed Code'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: WOOCOMMERCE STORE SETTINGS */}
          {activeSection === 'settings' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 1rem 0' }}>
                WooCommerce Store Settings
              </h2>

              {/* Settings Sub-Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #DCDCDE', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { id: 'general', label: 'General' },
                  { id: 'inventory', label: 'Products & Inventory' },
                  { id: 'shipping', label: 'Shipping' },
                  { id: 'payments', label: 'Payments' },
                ].map((tab) => {
                  const isSelected = settingsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsSubTab(tab.id as any)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isSelected ? '2px solid #7F54B3' : '2px solid transparent',
                        color: isSelected ? '#7F54B3' : '#646970',
                        fontWeight: isSelected ? 800 : 600,
                        padding: '0.5rem 0.25rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        marginBottom: '-1px',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {settingsSubTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Store Name
                    </label>
                    <input
                      type="text"
                      defaultValue={merchant.name}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Store Address & Location
                    </label>
                    <input
                      type="text"
                      defaultValue={merchant.addressText}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                        Currency
                      </label>
                      <input
                        type="text"
                        disabled
                        defaultValue="South African Rand (R / ZAR)"
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem', background: '#F6F7F7' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                        Currency Position
                      </label>
                      <select style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}>
                        <option>Left with space (R 1,500)</option>
                        <option>Left (R1,500)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Store Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      defaultValue={merchant.contacts?.telephone || '011 837 0122'}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input type="checkbox" defaultChecked /> Enable stock management at product level
                  </label>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      defaultValue="2"
                      style={{ width: '120px', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Out of Stock Visibility
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#646970' }}>
                      <input type="checkbox" /> Hide out of stock items from the catalog
                    </label>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Inventory Settings
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'shipping' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <div style={{ border: '1px solid #DCDCDE', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>🇿🇦 South Africa Shipping Zone</div>
                    <p style={{ fontSize: '0.78rem', color: '#646970', margin: '0 0 0.75rem 0' }}>Gauteng, Western Cape, KwaZulu-Natal, Nationwide</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
                      <label><input type="checkbox" defaultChecked /> Flat Rate Courier (R 150.00)</label>
                      <label><input type="checkbox" defaultChecked /> Local Counter Pickup (Free)</label>
                      <label><input type="checkbox" defaultChecked /> Free Shipping on Orders over R 5,000</label>
                    </div>
                  </div>
                  <div>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Shipping Settings
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  {[
                    { name: 'Direct Bank Transfer (EFT)', desc: 'Take payments directly into your South African bank account.', enabled: true },
                    { name: 'PayFast / Credit Card', desc: 'Accept Visa, Mastercard, and Instant EFT via PayFast.', enabled: true },
                    { name: 'Cash on Delivery (COD)', desc: 'Allow in-person payment on delivery or counter collection.', enabled: true },
                    { name: 'WhatsApp Trade Order', desc: 'Direct checkout with instant WhatsApp invoice dispatch.', enabled: true },
                  ].map((gateway) => (
                    <div key={gateway.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCDCDE', borderRadius: '6px', padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{gateway.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>{gateway.desc}</div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <input type="checkbox" defaultChecked={gateway.enabled} /> Enabled
                      </label>
                    </div>
                  ))}
                  <div>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Payment Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: SYSTEM STATUS */}
          {activeSection === 'status' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 0.5rem 0' }}>
                🩺 WooCommerce System Status
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#646970', marginBottom: '1.5rem' }}>
                Technical environment details, feed health, and database connection.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>WooCommerce Platform Version</td>
                    <td style={{ padding: '0.65rem', color: '#7F54B3', fontWeight: 800 }}>8.9.2 (Unified Merchant Core)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Database Status</td>
                    <td style={{ padding: '0.65rem', color: '#00A32A', fontWeight: 800 }}>✓ Connected & Optimized (PostgreSQL / SQLite)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>XML Catalog Feed Generator</td>
                    <td style={{ padding: '0.65rem', color: '#00A32A', fontWeight: 800 }}>✓ Active (Continuous Webhooks)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Active Merchant</td>
                    <td style={{ padding: '0.65rem' }}>{merchant.name} (ID: {merchant.id})</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Server Timezone</td>
                    <td style={{ padding: '0.65rem' }}>Africa/Johannesburg (UTC+2)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
