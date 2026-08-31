'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppageMerchantCentreService,
  SA_FLAGSHIP_MERCHANTS,
  SA_CANONICAL_PRODUCTS,
  MITREND_MERCHANT,
  MITREND_PRODUCTS,
} from '@shoppage/kernel';
import { PayloadMerchantCmsService } from '@/cms';
import ProductStudioStage from '@/components/ProductStudioStage';
import { SHORTS } from '@/lib/media';
import { MERCHANT_PLAN_TIERS } from '@/cms/types';
import { showToast } from '@/lib/toast';

export default function MerchantDashboardPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('loc_sunpower_crownmines');
  const [activeSection, setActiveSection] = useState<
    'overview' | 'orders' | 'products' | 'discovered' | 'customers' | 'marketing' | 'studio' | 'coupons' | 'analytics' | 'feeds' | 'settings' | 'status'
  >('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedSeal, setCopiedSeal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'processing' | 'completed' | 'on_hold' | 'pending'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerNoteText, setCustomerNoteText] = useState('');

  // Plan entitlements gating (P0) — default business_pro shows live studio, switch to 'free' to test gate
  const [planTier, setPlanTier] = useState<'free' | 'business' | 'business_pro' | 'enterprise'>('business_pro');
  const entitlements = MERCHANT_PLAN_TIERS[planTier];

  // Studio Sub-Tabs & States
  const [studioSubTab, setStudioSubTab] = useState<'shorts' | 'photo_studio' | 'live_stream'>('shorts');
  const [studioBg, setStudioBg] = useState<'white' | 'solar' | 'warehouse' | 'hospitality'>('white');
  const [studioWatermark, setStudioWatermark] = useState<'sabs' | 'nrs097' | 'cipc' | 'none'>('sabs');
  const [studioSelectedSku, setStudioSelectedSku] = useState('DEYE-5K-SG03');
  const [showUploadShortModal, setShowUploadShortModal] = useState(false);
  const [merchantShorts, setMerchantShorts] = useState(SHORTS);
  const [newShortVideo, setNewShortVideo] = useState({
    title: '',
    videoUrl: '',
    duration: '0:58',
    linkedSku: 'DEYE-5K-SG03',
    priceZar: '14850',
    summary: '',
  });

  // Settings Sub-Tabs
  const [settingsSubTab, setSettingsSubTab] = useState<
    'general' | 'inventory' | 'shipping' | 'payments' | 'privacy' | 'emails' | 'integration'
  >('general');

  // Add Product Modal & Tabs (WooCommerce Style)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addProductTab, setAddProductTab] = useState<'general' | 'inventory' | 'shipping' | 'attributes' | 'linked'>('general');
  const [newProduct, setNewProduct] = useState({
    title: '',
    brand: '',
    category: 'Solar & Inverters',
    sku: '',
    price: '',
    salePrice: '',
    taxStatus: 'taxable',
    taxClass: 'standard',
    stockQty: '10',
    lowStockThreshold: '2',
    backorders: 'no',
    weight: '28',
    dimensions: '580 x 330 x 230',
    shippingClass: 'heavy_inverter',
    voltage: '48V',
    capacity: '5kW',
    warranty: '5 Years',
    shortDescription: '',
    longDescription: '',
    featuredImage: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop',
  });

  // Marketing & Ads Campaign State (Google Ads Style)
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignsList, setCampaignsList] = useState([
    {
      id: 'cmp_001',
      name: 'Gauteng Solar Installers & Contractors Shopping Ad',
      type: 'Search & Shopping Ad',
      status: 'active' as 'active' | 'paused',
      dailyBudget: 250,
      spent: 3450,
      impressions: 24800,
      clicks: 1420,
      ctr: '5.72%',
      cpc: 'R 2.43',
      conversions: 48,
      roas: '5.8x',
    },
    {
      id: 'cmp_002',
      name: 'Crown Mines & Southgate 25km Counter Collection Radius',
      type: 'Local Showroom Geo-Target',
      status: 'active' as 'active' | 'paused',
      dailyBudget: 150,
      spent: 1800,
      impressions: 16400,
      clicks: 980,
      ctr: '5.97%',
      cpc: 'R 1.84',
      conversions: 32,
      roas: '6.2x',
    },
    {
      id: 'cmp_003',
      name: 'Stage 6 Backup Inverter Teardown Video Shorts Boost',
      type: 'Video Shorts & Live Stream',
      status: 'paused' as 'active' | 'paused',
      dailyBudget: 100,
      spent: 600,
      impressions: 7090,
      clicks: 440,
      ctr: '6.20%',
      cpc: 'R 1.36',
      conversions: 6,
      roas: '4.1x',
    },
  ]);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'Search & Shopping Ad',
    dailyBudget: '200',
    targetLocation: 'Gauteng (Johannesburg & Pretoria)',
    headline: 'Authorized Deye & Dyness Importer · Direct Stock',
    description: 'Immediate counter pickup in Crown Mines or same-day freight. SABS approved.',
  });

  // 1-Click Discovered Stock Confirmation State
  const [discoveredStock, setDiscoveredStock] = useState([
    {
      id: 'disc_deye_5kw',
      title: 'Deye 5kW Hybrid Inverter 48V (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      scrapedPrice: 18500,
      currentPrice: 18500,
      sourceUrl: 'https://sunpower.co.za/deye-5kw',
      status: 'pending',
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
  const [productsList, setProductsList] = useState([
    {
      id: 'prod_deye_5kw',
      sku: 'DEYE-5K-SG03',
      title: 'Deye 5kW Hybrid Inverter 48V (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      category: 'Inverters & Solar',
      price: 18500,
      salePrice: 17999,
      inStock: true,
      stockQty: 14,
      feedStatus: 'Active',
      views: 3420,
      salesCount: 18,
      image: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=400&h=300&fit=crop',
    },
    {
      id: 'prod_dyness_5kwh',
      sku: 'DYN-5.12KWH-BX',
      title: 'Dyness 5.12kWh Lithium Battery BX51100 48V LiFePO4',
      brand: 'Dyness',
      category: 'Batteries & Storage',
      price: 16900,
      salePrice: null,
      inStock: true,
      stockQty: 22,
      feedStatus: 'Active',
      views: 2890,
      salesCount: 14,
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop',
    },
    {
      id: 'prod_ja_550w',
      sku: 'JA-550W-MONO',
      title: 'JA Solar 550W Mono PERC Half-Cell Solar Panel',
      brand: 'JA Solar',
      category: 'Solar Panels',
      price: 1750,
      salePrice: null,
      inStock: true,
      stockQty: 85,
      feedStatus: 'Active',
      views: 4120,
      salesCount: 42,
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&h=300&fit=crop',
    },
    {
      id: 'prod_sunsynk_8kw',
      sku: 'SYN-8K-HYB',
      title: 'Sunsynk 8kW Hybrid Inverter 48V (SUN-8K-SG01LP1)',
      brand: 'Sunsynk',
      category: 'Inverters & Solar',
      price: 28500,
      salePrice: null,
      inStock: true,
      stockQty: 8,
      feedStatus: 'Active',
      views: 1980,
      salesCount: 9,
      image: 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=400&h=300&fit=crop',
    },
    {
      id: 'prod_freedomwon_10kwh',
      sku: 'FW-LITE-10KWH',
      title: 'Freedom Won LiTE Home 10/8 10kWh LiFePO4 Battery',
      brand: 'Freedom Won',
      category: 'Batteries & Storage',
      price: 49500,
      salePrice: 47900,
      inStock: false,
      stockQty: 0,
      feedStatus: 'Needs Action',
      views: 1450,
      salesCount: 4,
      image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&h=300&fit=crop',
    },
    {
      id: 'prod_canadian_550w',
      sku: 'CS-550W-HIKU',
      title: 'Canadian Solar 550W HiKu6 Mono PERC Solar Panel',
      brand: 'Canadian Solar',
      category: 'Solar Panels',
      price: 1820,
      salePrice: null,
      inStock: true,
      stockQty: 60,
      feedStatus: 'Active',
      views: 2150,
      salesCount: 26,
      image: 'https://images.unsplash.com/photo-1545259741-2ea1417ae7a1?w=400&h=300&fit=crop',
    },
  ]);

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
  ]);

  // Mini-CRM Customers State
  const [customersList, setCustomersList] = useState([
    {
      id: 'cust_001',
      name: 'Johannesburg Solar Installers CC',
      contactPerson: 'Kobus van der Merwe',
      segment: 'VIP Gold Contractor',
      location: 'Crown Mines, Gauteng',
      ordersCount: 8,
      totalSpend: 485000,
      email: 'orders@jhbsolar.co.za',
      phone: '082 459 1102',
      vatNumber: 'ZA4920194821',
      notes: [
        'Contractor working on 40-unit townhouse project in Midrand; prefers Deye 8kW inverters.',
        'Requested wholesale credit terms on 30-day account; awaiting bank clearance.',
      ],
      lastOrder: 'Today (#10482)',
    },
    {
      id: 'cust_002',
      name: 'Pretoria East Residential Buyer',
      contactPerson: 'Gerhard Botha',
      segment: 'Retail Homeowner',
      location: 'Pretoria East, Gauteng',
      ordersCount: 2,
      totalSpend: 54000,
      email: 'gerhard@pta-east.co.za',
      phone: '071 884 9231',
      vatNumber: 'N/A',
      notes: [
        'Single-phase residential installation. Inquired about solar panels add-on next month.',
      ],
      lastOrder: 'Today (#10481)',
    },
    {
      id: 'cust_003',
      name: 'Sandton Building Contractor',
      contactPerson: 'Thabo Mokoena',
      segment: 'Wholesale Contractor',
      location: 'Sandton, Gauteng',
      ordersCount: 5,
      totalSpend: 210000,
      email: 'procurement@sandtonconstruct.co.za',
      phone: '083 290 7714',
      vatNumber: 'ZA4182910492',
      notes: [
        'Commercial contractor purchasing bulk palletized JA Solar panels. Direct site delivery.',
      ],
      lastOrder: 'Yesterday (#10480)',
    },
    {
      id: 'cust_004',
      name: 'Cape Peninsula Marine Electric',
      contactPerson: 'Sean O’Connor',
      segment: 'Wholesale Contractor',
      location: 'Cape Town, Western Cape',
      ordersCount: 4,
      totalSpend: 162000,
      email: 'accounts@peninsulamarine.co.za',
      phone: '084 551 8892',
      vatNumber: 'ZA4810294819',
      notes: [
        'Marine and offshore specialist. Orders Victron Energy multiplus inverters and heavy cables.',
      ],
      lastOrder: 'Yesterday (#10479)',
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

  const isMitrendSelected = selectedMerchantId === 'loc_mitrend_midrand';
  const dashboard = ShoppageMerchantCentreService.getUnifiedDashboard(
    selectedMerchantId,
    typeof window !== 'undefined' ? window.location.origin : 'https://shoppage.co.za'
  );
  const merchant = isMitrendSelected ? (MITREND_MERCHANT as any) : dashboard.merchant;
  const googleMerchantCenter = {
    ...dashboard.googleMerchantCenter,
    feedUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://shoppage.co.za'}/api/feeds/google-merchant-center/${selectedMerchantId}`,
    totalProducts: isMitrendSelected ? 157 : dashboard.googleMerchantCenter.totalProducts,
    approvedProducts: isMitrendSelected ? 157 : dashboard.googleMerchantCenter.approvedProducts,
  };

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

  const toggleCampaignStatus = (id: string) => {
    setCampaignsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    );
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;
    setCampaignsList([
      {
        id: `cmp_${Date.now()}`,
        name: newCampaign.name,
        type: newCampaign.type,
        status: 'active',
        dailyBudget: parseFloat(newCampaign.dailyBudget) || 200,
        spent: 0,
        impressions: 0,
        clicks: 0,
        ctr: '0.00%',
        cpc: 'R 0.00',
        conversions: 0,
        roas: '0.0x',
      },
      ...campaignsList,
    ]);
    setNewCampaign({ name: '', type: 'Search & Shopping Ad', dailyBudget: '200', targetLocation: 'Gauteng', headline: '', description: '' });
    setShowCreateCampaignModal(false);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim()) return;
    const priceNum = parseFloat(newProduct.price) || 999;
    const saleNum = newProduct.salePrice ? parseFloat(newProduct.salePrice) : null;
    const stockQtyNum = parseInt(newProduct.stockQty) || 10;
    const skuVal = newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    // Sync to Payload CMS Collections
    PayloadMerchantCmsService.createProduct({
      merchantId: selectedMerchantId,
      sku: skuVal,
      title: newProduct.title,
      brand: newProduct.brand || 'Custom Brand',
      category: newProduct.category,
      price: priceNum,
      regularPrice: priceNum,
      salePrice: saleNum,
      taxStatus: newProduct.taxStatus as any,
      taxClass: newProduct.taxClass as any,
      inStock: stockQtyNum > 0,
      stockQty: stockQtyNum,
      lowStockThreshold: parseInt(newProduct.lowStockThreshold) || 2,
      backorders: newProduct.backorders as any,
      warranty: newProduct.warranty,
      specs: `${newProduct.voltage || ''} ${newProduct.capacity || ''}`.trim() || 'Commercial Standard',
      description: newProduct.longDescription || newProduct.shortDescription || newProduct.title,
      featuredImage: newProduct.featuredImage || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop',
      galleryImages: [newProduct.featuredImage || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop'],
      compliance: {
        sabsApproved: true,
        nrs097Certified: newProduct.category.includes('Solar'),
        warrantyYears: parseInt(newProduct.warranty) || 1,
      },
      feedStatus: 'Active',
    });

    setProductsList([
      {
        id: `prod_${Date.now()}`,
        sku: skuVal,
        title: newProduct.title,
        brand: newProduct.brand || 'Custom Brand',
        category: newProduct.category,
        price: priceNum,
        salePrice: saleNum,
        inStock: stockQtyNum > 0,
        stockQty: stockQtyNum,
        feedStatus: 'Active',
        views: 0,
        salesCount: 0,
        image: newProduct.featuredImage || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop',
      },
      ...productsList,
    ]);
    setShowAddProductModal(false);
  };

  const handleAddCustomerNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNoteText.trim() || !selectedCustomer) return;
    const updatedNotes = [...selectedCustomer.notes, customerNoteText.trim()];
    setSelectedCustomer({ ...selectedCustomer, notes: updatedNotes });
    setCustomersList((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, notes: updatedNotes } : c))
    );
    setCustomerNoteText('');
  };

  const pendingDiscoveredCount = discoveredStock.filter((s) => s.status === 'pending').length;
  const processingOrdersCount = ordersList.filter((o) => o.status === 'processing').length;

  const activeMerchantProducts = isMitrendSelected
    ? MITREND_PRODUCTS.map((p) => ({
        id: p.id,
        sku: p.sku,
        title: p.title,
        brand: p.brand,
        category: p.category,
        price: p.price,
        salePrice: p.salePrice,
        inStock: p.inStock,
        stockQty: p.stockQty,
        feedStatus: 'Active',
        views: 120 + Math.floor(p.price * 10),
        salesCount: Math.max(1, Math.floor(100 / (p.price || 1))),
        image: p.image,
      }))
    : productsList;

  const filteredOrders = ordersList.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const filteredProducts = activeMerchantProducts.filter((p) => {
    if (productCategoryFilter === 'all') return true;
    return p.category === productCategoryFilter;
  });

  const filteredCustomers = customersList.filter((c) => {
    if (customerSegmentFilter !== 'all' && !c.segment.toLowerCase().includes(customerSegmentFilter.toLowerCase())) return false;
    if (customerSearchQuery.trim()) {
      const q = customerSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    return true;
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
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.85rem',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.4)',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Shoppage <span style={{ color: '#38BDF8', fontWeight: 600 }}>Merchant OS</span>
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
              <option value="loc_sunpower_crownmines">
                SunPower Solutions (Crown Mines Wholesale Hub)
              </option>
              <option value="loc_mitrend_midrand">
                Mitrend Products (Pty) Ltd (Midrand Showroom - 157 SKUs)
              </option>
              {SA_FLAGSHIP_MERCHANTS.filter((m) => m.id !== 'loc_sunpower_crownmines' && m.id !== 'loc_mitrend_midrand').map((m) => (
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

          {/* Payload CMS Multi-Tenant Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
            title="Payload CMS Active · Multi-Tenant Collections (Products, Media, Orders, CRM, Settings)"
          >
            <span>⚡</span>
            <span>Payload CMS</span>
          </div>

          {/* Low Stock Alert */}
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
              Merchant Command Center
            </div>
          )}

          {[
            { id: 'overview', label: 'Home / Dashboard', icon: '🏠' },
            { id: 'orders', label: 'Orders', icon: '🛒', badge: processingOrdersCount > 0 ? processingOrdersCount : null },
            { id: 'products', label: 'Products', icon: '📦' },
            { id: 'studio', label: 'Media & Video Studio', icon: '🎬', badge: 'Creator' },
            { id: 'discovered', label: 'Discovered Stock', icon: '✨', badge: pendingDiscoveredCount > 0 ? pendingDiscoveredCount : null },
            { id: 'customers', label: 'Customers (Mini-CRM)', icon: '👥' },
            { id: 'marketing', label: 'Marketing & Ads', icon: '📢' },
            { id: 'coupons', label: 'Coupons & Vouchers', icon: '🏷️' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'feeds', label: 'Feeds & Syndication', icon: '📤' },
            { id: 'settings', label: 'Store Settings', icon: '⚙️' },
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
          </div>
        </aside>

        {/* Right Main Content Stage */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1280px', overflowX: 'auto' }}>
          {/* TAB 1: OVERVIEW / DASHBOARD HOME */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Merchant Overview
                  </h1>
                  <p style={{ color: '#646970', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                    Welcome back, <strong>{merchant.name}</strong>. Store activity and revenue metrics.
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
                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem' }}>
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

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem' }}>
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

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem' }}>
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

                <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#646970', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    ACTIVE STORE SKUs
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#00A32A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{activeMerchantProducts.filter((p) => p.inStock).length} / {activeMerchantProducts.length}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#646970', marginTop: '0.25rem' }}>
                    Catalog Synced & In Stock
                  </div>
                </div>
              </div>

              {/* Tasks & Activity */}
              <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', margin: '0 0 0.75rem 0' }}>
                  Store Tasks & Operations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F6F0FA', border: '1px solid #E3D2F4', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📦</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D2327' }}>
                          {processingOrdersCount} Orders need fulfillment dispatch
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>
                          Johannesburg & Pretoria East orders awaiting delivery confirmation.
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
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WOOCOMMERCE ORDERS MANAGEMENT */}
          {activeSection === 'orders' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 1rem 0' }}>
                Orders ({ordersList.length})
              </h2>

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
                    Products ({activeMerchantProducts.length})
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

              {/* Filter Bar */}
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
                    <option value="Solar Panels">Solar Panels</option>
                  </select>
                </div>
              </div>

              {/* Products Table with Photos */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem', width: '60px' }}>Image</th>
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
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <img src={p.image} alt={p.title} style={{ width: '48px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #DCDCDE' }} />
                      </td>
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
                    Automatically extracted from your website and inventory listings. Confirm prices and items to add them directly into your live store catalog.
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

          {/* TAB 5: CUSTOMERS MINI-CRM */}
          {activeSection === 'customers' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Trade Customers & CRM ({customersList.length})
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Track contractor accounts, order history, VAT credentials, and private ledger notes.
                  </p>
                </div>
              </div>

              {/* CRM Key Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#646970' }}>ACTIVE TRADE CONTRACTORS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>38 Contractors</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#646970' }}>REPEAT PURCHASE RATE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00A32A' }}>64.2%</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#646970' }}>AVG. LIFETIME VALUE (LTV)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7F54B3' }}>R 48,500</div>
                </div>
              </div>

              {/* CRM Search & Segment Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All Customers' },
                    { id: 'contractor', label: 'VIP Contractors' },
                    { id: 'retail', label: 'Retail Buyers' },
                  ].map((seg) => (
                    <button
                      key={seg.id}
                      onClick={() => setCustomerSegmentFilter(seg.id)}
                      style={{
                        background: customerSegmentFilter === seg.id ? '#7F54B3' : '#F0F0F1',
                        color: customerSegmentFilter === seg.id ? '#FFFFFF' : '#2C3338',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search customer, phone, VAT..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.8rem', width: '240px' }}
                />
              </div>

              {/* Customers Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>Company / Client</th>
                    <th style={{ padding: '0.75rem' }}>Contact Person</th>
                    <th style={{ padding: '0.75rem' }}>Segment</th>
                    <th style={{ padding: '0.75rem' }}>Orders</th>
                    <th style={{ padding: '0.75rem' }}>Total Spend (ZAR)</th>
                    <th style={{ padding: '0.75rem' }}>Last Order</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 800, color: '#1D2327' }}>{cust.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8C8F94' }}>VAT: {cust.vatNumber} · {cust.location}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div>{cust.contactPerson}</div>
                        <div style={{ fontSize: '0.75rem', color: '#646970' }}>📞 {cust.phone}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: '#F6F0FA', color: '#7F54B3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {cust.segment}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>{cust.ordersCount}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#1D2327' }}>
                        R {cust.totalSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{cust.lastOrder}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            CRM Profile
                          </button>
                          <a
                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: '#25D366', color: '#FFF', textDecoration: 'none', borderRadius: '4px', padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Customer CRM Profile Modal */}
              {selectedCustomer && (
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
                  <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1.75rem', width: '100%', maxWidth: '580px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1D2327' }}>{selectedCustomer.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#646970' }}>Contact: {selectedCustomer.contactPerson} · {selectedCustomer.phone}</div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px' }}>
                      <div><strong>Total Spend:</strong> R {selectedCustomer.totalSpend.toLocaleString('en-ZA')}</div>
                      <div><strong>Total Orders:</strong> {selectedCustomer.ordersCount}</div>
                      <div><strong>VAT Registration:</strong> {selectedCustomer.vatNumber}</div>
                      <div><strong>Location:</strong> {selectedCustomer.location}</div>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Contractor Account Notes</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', maxHeight: '140px', overflowY: 'auto' }}>
                      {selectedCustomer.notes.map((note: string, idx: number) => (
                        <div key={idx} style={{ background: '#F0F0F1', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                          • {note}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddCustomerNote} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Add private contractor note..."
                        value={customerNoteText}
                        onChange={(e) => setCustomerNoteText(e.target.value)}
                        style={{ flex: 1, padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.8rem' }}
                      />
                      <button type="submit" style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Add Note
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: MARKETING & ADVERTISING (GOOGLE ADS STYLE) */}
          {activeSection === 'marketing' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Local Showroom & Catalog Ad Manager
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Create search ads, local showroom radius campaigns, and sponsored video shorts promotions.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  style={{ background: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontSize: '0.825rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Create New Campaign
                </button>
              </div>

              {/* Google Ads Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>IMPRESSIONS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D2327' }}>48,290</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>CLICKS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D2327' }}>2,840</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>AVG. CTR</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1A73E8' }}>5.88%</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>TOTAL AD SPEND</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D2327' }}>R 5,850</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>ROAS (CONVERSIONS)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00A32A' }}>5.8x (R 33,930)</div>
                </div>
              </div>

              {/* Active Campaigns Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCDCDE', textAlign: 'left', color: '#646970', background: '#F6F7F7' }}>
                    <th style={{ padding: '0.75rem' }}>Campaign Name</th>
                    <th style={{ padding: '0.75rem' }}>Type</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Budget / Day</th>
                    <th style={{ padding: '0.75rem' }}>Spent</th>
                    <th style={{ padding: '0.75rem' }}>Clicks</th>
                    <th style={{ padding: '0.75rem' }}>CTR</th>
                    <th style={{ padding: '0.75rem' }}>ROAS</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsList.map((cmp) => (
                    <tr key={cmp.id} style={{ borderBottom: '1px solid #F0F0F1' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#1D2327' }}>
                        {cmp.name}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#646970' }}>{cmp.type}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span
                          onClick={() => toggleCampaignStatus(cmp.id)}
                          style={{
                            background: cmp.status === 'active' ? '#E5F6E7' : '#F0F0F1',
                            color: cmp.status === 'active' ? '#00A32A' : '#646970',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {cmp.status === 'active' ? '● Active' : '⏸ Paused'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>R {cmp.dailyBudget}/day</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>R {cmp.spent}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>{cmp.clicks}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#1A73E8', fontWeight: 700 }}>{cmp.ctr}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#00A32A', fontWeight: 800 }}>{cmp.roas}</td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => toggleCampaignStatus(cmp.id)}
                          style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.25rem 0.55rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {cmp.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Create Campaign Modal */}
              {showCreateCampaignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                  <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Launch New Ad Campaign</h3>
                    <form onSubmit={handleAddCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Campaign Name *</label>
                        <input
                          type="text"
                          required
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                          placeholder="e.g. Pretoria Solar Installers Inverter Special"
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.825rem' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Campaign Type</label>
                          <select
                            value={newCampaign.type}
                            onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.825rem' }}
                          >
                            <option>Search & Shopping Ad</option>
                            <option>Local Showroom Geo-Target</option>
                            <option>Video Shorts & Live Stream</option>
                            <option>Flash Sale Voucher</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Daily Budget (ZAR R)</label>
                          <input
                            type="number"
                            required
                            value={newCampaign.dailyBudget}
                            onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.825rem' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Target Geographic Radius</label>
                        <input
                          type="text"
                          value={newCampaign.targetLocation}
                          onChange={(e) => setNewCampaign({ ...newCampaign, targetLocation: e.target.value })}
                          placeholder="e.g. Gauteng (Johannesburg & Pretoria)"
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.825rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={() => setShowCreateCampaignModal(false)} style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.45rem 1rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ background: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 1.25rem', fontWeight: 800, cursor: 'pointer' }}>Launch Campaign</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MEDIA & VIDEO STUDIO (BAKED INTO MERCHANT OS) */}
          {activeSection === 'studio' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              {/* Studio Header & Sub-Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F0F0F1', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎬</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327', margin: 0 }}>
                      Shoppage Creator & Product Media Studio
                    </h2>
                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                      Studio Pro v7.0
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#646970', margin: 0 }}>
                    Produce verified unboxing shorts, SABS-watermarked 360 product photography, and live trade counter walkthroughs.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'shorts', label: '🎬 Proof Shorts & Video Hub', icon: '⚡' },
                    { id: 'photo_studio', label: '📸 360 Product Staging & SABS Stamp', icon: '✨' },
                    { id: 'live_stream', label: '📡 Showroom Live Broadcast', icon: '🔴' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStudioSubTab(tab.id as any)}
                      style={{
                        background: studioSubTab === tab.id ? '#2563EB' : '#F0F0F1',
                        color: studioSubTab === tab.id ? '#FFFFFF' : '#2C3338',
                        border: '1px solid',
                        borderColor: studioSubTab === tab.id ? '#1D4ED8' : '#DCDCDE',
                        borderRadius: '6px',
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SUB-TAB 1: PROOF SHORTS & VIDEO CREATOR */}
              {studioSubTab === 'shorts' && (
                <div>
                  {/* Top Creator Performance KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL VIDEO VIEWS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', margin: '0.2rem 0' }}>148,200</div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>+28.4% this month</div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>BUYBOX ENGAGEMENT</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563EB', margin: '0.2rem 0' }}>6,420 Likes</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>980 Shares</div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>DIRECT INQUIRIES & RFQS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', margin: '0.2rem 0' }}>412 RFQs</div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>0% Commission Kept</div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>SYNDICATED SURFACE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7C3AED', margin: '0.2rem 0' }}>/shorts & Catalog</div>
                      <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>1-Click National Feed</div>
                    </div>
                  </div>

                  {/* Header & Upload Trigger */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                      Published Store Proof Shorts ({merchantShorts.length})
                    </h3>
                    <button
                      onClick={() => setShowUploadShortModal(true)}
                      className="btn btn-primary btn-sm"
                      style={{ borderRadius: '6px', fontWeight: 800, background: '#2563EB', borderColor: '#2563EB' }}
                    >
                      + Record / Upload New Short
                    </button>
                  </div>

                  {/* Merchant Shorts Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {merchantShorts.map((short) => (
                      <div
                        key={short.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '160px', background: '#000000' }}>
                          <img
                            src={short.thumbnailUrl}
                            alt={short.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                          <span style={{ position: 'absolute', top: 8, left: 8, background: '#059669', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                            ✓ Live on /shorts
                          </span>
                          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {short.duration}
                          </span>
                        </div>

                        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.35, marginBottom: '0.4rem' }}>
                              {short.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                              <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                SKU: {short.productRef || 'ALL'}
                              </span>
                              {short.priceZar && (
                                <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                  R {short.priceZar.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
                            <span>👁️ {short.views.toLocaleString()}</span>
                            <span>❤️ {short.likes?.toLocaleString() || 120}</span>
                            <Link href="/shorts" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                              Preview &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: 360 PRODUCT STAGING & SABS STAMP */}
              {studioSubTab === 'photo_studio' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Live Preview Canvas Stage */}
                    <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A' }}>
                          Live 360 Visual Studio Canvas
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Mode: <strong>{studioBg.toUpperCase()}</strong>
                        </span>
                      </div>

                      {/* Rendered Studio Canvas */}
                      <div style={{ position: 'relative' }}>
                        {activeMerchantProducts.find((p) => p.sku === studioSelectedSku) ? (
                          <ProductStudioStage
                            product={{
                              canonicalId: 'studio_preview',
                              title: activeMerchantProducts.find((p) => p.sku === studioSelectedSku)?.title || 'Product Visual',
                              brand: activeMerchantProducts.find((p) => p.sku === studioSelectedSku)?.brand || 'Brand',
                              gtin13: '6001234567890',
                              categoryRef: studioBg === 'solar' ? 'solar_energy' : studioBg === 'hospitality' ? 'smartphones' : 'hardware',
                              description: 'High resolution product asset',
                              media: {
                                gallery: [
                                  {
                                    id: 'med_preview',
                                    altText: 'Product Studio Preview',
                                    url: activeMerchantProducts.find((p) => p.sku === studioSelectedSku)?.image || 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop',
                                    type: 'image',
                                  },
                                ],
                                videos: [],
                                documents: [],
                              },
                              complianceStandards: ['SABS_APPROVED', 'NRS_097_CERTIFIED'],
                            } as any}
                            variant="detail"
                          />
                        ) : null}

                        {/* Watermark Overlay Stamp */}
                        {studioWatermark !== 'none' && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '1.5px solid #10B981',
                              borderRadius: '8px',
                              padding: '0.35rem 0.65rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              zIndex: 10,
                            }}
                          >
                            <span style={{ fontSize: '0.9rem' }}>🛡️</span>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#065F46', textTransform: 'uppercase', lineHeight: 1.1 }}>
                                {studioWatermark === 'sabs' ? 'SABS APPROVED' : studioWatermark === 'nrs097' ? 'NRS 097 CERTIFIED' : 'CIPC VERIFIED'}
                              </div>
                              <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 700 }}>
                                Shoppage Trust Passport
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Export & Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button
                          onClick={() => showToast('High-Resolution 4K Asset with SABS Watermark exported to your Catalog.', 'success')}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontWeight: 800, borderRadius: '6px' }}
                        >
                          💾 Save & Apply to Master Catalog
                        </button>
                        <button
                          onClick={() => showToast('GS1 GTIN-13 Barcode generated.', 'success')}
                          className="btn btn-outline btn-sm"
                          style={{ borderRadius: '6px', fontWeight: 700 }}
                        >
                          🏷️ Print GS1 Barcode
                        </button>
                      </div>
                    </div>

                    {/* Staging Controls Panel */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.25rem' }}>
                        Studio Staging Controls
                      </h3>

                      {/* SKU Selector */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                          Select Catalog Product to Stage:
                        </label>
                        <select
                          value={studioSelectedSku}
                          onChange={(e) => setStudioSelectedSku(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem', fontWeight: 600 }}
                        >
                          {activeMerchantProducts.map((p) => (
                            <option key={p.sku} value={p.sku}>
                              {p.title} (R {p.price.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Background Environment Selector */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                          Stage Lighting & Background:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {[
                            { id: 'white', label: 'Studio White (GS1)', icon: '💡' },
                            { id: 'solar', label: 'Clean Energy & Solar', icon: '☀️' },
                            { id: 'warehouse', label: 'Trade Counter & Hub', icon: '🏬' },
                            { id: 'hospitality', label: 'Hospitality Smalls', icon: '🍽️' },
                          ].map((env) => (
                            <button
                              key={env.id}
                              type="button"
                              onClick={() => setStudioBg(env.id as any)}
                              style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1.5px solid',
                                borderColor: studioBg === env.id ? '#2563EB' : '#E2E8F0',
                                background: studioBg === env.id ? '#EFF6FF' : '#FFFFFF',
                                color: studioBg === env.id ? '#1E40AF' : '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {env.icon} {env.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Compliance Watermark Selector */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                          Stamp Compliance Watermark:
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {[
                            { id: 'sabs', label: '✓ SABS Approved Standard (Food & Cement)', color: '#047857' },
                            { id: 'nrs097', label: '✓ NRS 097-2-1 Grid Certified (Inverters)', color: '#1D4ED8' },
                            { id: 'cipc', label: '✓ CIPC Registered Business Guarantee', color: '#6D28D9' },
                            { id: 'none', label: 'No Watermark Stamp', color: '#64748B' },
                          ].map((wm) => (
                            <label
                              key={wm.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                color: '#1E293B',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: studioWatermark === wm.id ? '#F8FAFC' : 'transparent',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              <input
                                type="radio"
                                name="studioWatermark"
                                checked={studioWatermark === wm.id}
                                onChange={() => setStudioWatermark(wm.id as any)}
                              />
                              <span style={{ color: wm.color, fontWeight: 700 }}>{wm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: SHOWROOM LIVE BROADCAST DECK — gated on Business Pro */}
              {studioSubTab === 'live_stream' && !entitlements.hasLiveBroadcastStudio && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#92400E', marginBottom: '0.5rem' }}>Live Broadcast requires Business Pro</h3>
                  <p style={{ fontSize: '0.85rem', color: '#78350F', marginBottom: '1.25rem', maxWidth: '520px', margin: '0 auto 1.25rem auto' }}>
                    Your current plan <strong>{entitlements.name} ({planTier})</strong> does not include Live Studio. Upgrade to <strong>Business Pro R499/mo</strong> (10 branches, Live Broadcast, RFQ Tender Desk) to go live from your showroom.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={() => setPlanTier('business_pro')} className="btn btn-primary" style={{ background: '#92400E', borderColor: '#92400E' }}>Upgrade to Business Pro — R499/mo</button>
                    <button onClick={() => setStudioSubTab('shorts')} className="btn btn-outline">Back to Shorts</button>
                  </div>
                </div>
              )}
              {studioSubTab === 'live_stream' && entitlements.hasLiveBroadcastStudio && (
                <div style={{ background: '#0F172A', color: '#FFFFFF', borderRadius: '12px', padding: '2rem' }}>
                  <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem auto' }}>
                      📡
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                      Trade Counter Live Broadcast Deck
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                      Stream live product unboxings directly from your physical showroom to thousands of local buyers and wholesale contractors.
                    </p>

                    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Broadcast Status:</span>
                        <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.8rem' }}>● Ready to Go Live</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Syndicated Channels:</span>
                        <span style={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.8rem' }}>Shoppage Live + Shows Hub</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Take Rate on Live Orders:</span>
                        <span style={{ color: '#34D399', fontWeight: 800, fontSize: '0.8rem' }}>0.00% (Direct Buyer RFQ)</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => showToast('Starting live stream broadcast from your showroom camera.', 'success')}
                        className="btn btn-primary btn-lg"
                        style={{ borderRadius: '8px', fontWeight: 800, background: '#EF4444', borderColor: '#EF4444' }}
                      >
                        🔴 Go Live Now (Showroom Camera)
                      </button>
                      <button
                        onClick={() => showToast('Live broadcast scheduled for tomorrow 10:00 AM.', 'success')}
                        className="btn btn-outline btn-lg"
                        style={{ borderRadius: '8px', fontWeight: 700, color: '#FFFFFF', borderColor: '#475569' }}
                      >
                        📅 Schedule Trade Counter Live
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload / Link Short Modal */}
              {showUploadShortModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '1.75rem',
                      width: '100%',
                      maxWidth: '540px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                        Upload / Link Product Video Short
                      </h3>
                      <button onClick={() => setShowUploadShortModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const newEntry = {
                          id: `sh_${Date.now()}`,
                          type: 'short' as const,
                          title: newShortVideo.title,
                          productTitle: activeMerchantProducts.find((p) => p.sku === newShortVideo.linkedSku)?.title || newShortVideo.title,
                          productRef: newShortVideo.linkedSku,
                          priceZar: parseInt(newShortVideo.priceZar) || 14850,
                          category: 'solar' as const,
                          merchantName: merchant.name,
                          merchantPhone: '+27 11 884 1234',
                          views: 1,
                          likes: 0,
                          shares: 0,
                          duration: newShortVideo.duration,
                          thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
                          videoUrl: newShortVideo.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                          summary: newShortVideo.summary || 'Verified product teardown and showroom demonstration.',
                        };
                        setMerchantShorts([newEntry, ...merchantShorts]);
                        setShowUploadShortModal(false);
                        showToast('Video Short successfully linked and syndicated to /shorts feed!', 'success');
                      }}
                    >
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Video Title</label>
                        <input
                          type="text"
                          required
                          value={newShortVideo.title}
                          onChange={(e) => setNewShortVideo({ ...newShortVideo, title: e.target.value })}
                          placeholder="e.g. Deye 5kW Real Stage 6 Load Test & Teardown"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Video URL (MP4, YouTube Shorts, or TikTok)</label>
                        <input
                          type="url"
                          required
                          value={newShortVideo.videoUrl}
                          onChange={(e) => setNewShortVideo({ ...newShortVideo, videoUrl: e.target.value })}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Link to Catalog SKU</label>
                          <select
                            value={newShortVideo.linkedSku}
                            onChange={(e) => setNewShortVideo({ ...newShortVideo, linkedSku: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                          >
                            {activeMerchantProducts.map((p) => (
                              <option key={p.sku} value={p.sku}>{p.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>In-Video Price (ZAR)</label>
                          <input
                            type="number"
                            value={newShortVideo.priceZar}
                            onChange={(e) => setNewShortVideo({ ...newShortVideo, priceZar: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                        <button type="button" onClick={() => setShowUploadShortModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>Publish to /shorts & Catalog</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: COUPONS & VOUCHERS */}
          {activeSection === 'coupons' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                    Coupons & Vouchers
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                    Create and manage discount vouchers for wholesale contractors and retail promotions.
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

          {/* TAB 8: FULLY FLEDGED ANALYTICS */}
          {activeSection === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: 0 }}>
                      Store Commercial Analytics
                    </h2>
                    <p style={{ fontSize: '0.825rem', color: '#646970', margin: '0.2rem 0 0 0' }}>
                      Comprehensive store metrics, revenue time-series, and customer purchase channels.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'Year to Date'].map((period, i) => (
                      <button
                        key={period}
                        style={{
                          background: i === 2 ? '#7F54B3' : '#F0F0F1',
                          color: i === 2 ? '#FFFFFF' : '#2C3338',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6 Key Financial Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>GROSS SALES</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>R 468,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#00A32A', fontWeight: 700 }}>↑ 18.4%</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>NET SALES</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>R 424,500</div>
                    <div style={{ fontSize: '0.7rem', color: '#00A32A', fontWeight: 700 }}>↑ 22.1%</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>ORDERS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>24</div>
                    <div style={{ fontSize: '0.7rem', color: '#2271B1', fontWeight: 700 }}>4 pending</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>AVG. ORDER VALUE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>R 19,500</div>
                    <div style={{ fontSize: '0.7rem', color: '#646970' }}>Wholesale/Retail</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>ITEMS SOLD</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D2327' }}>86 units</div>
                    <div style={{ fontSize: '0.7rem', color: '#646970' }}>Pallets & Singles</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#646970', fontWeight: 700 }}>REFUNDS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00A32A' }}>R 0.00</div>
                    <div style={{ fontSize: '0.7rem', color: '#00A32A' }}>0% return rate</div>
                  </div>
                </div>

                {/* Sales Breakdown by Category */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D2327', marginBottom: '0.75rem' }}>Top Selling Products & Revenue Share</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {productsList.slice(0, 4).map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E0E0E0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#7F54B3', fontSize: '0.9rem' }}>#{i + 1}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#646970' }}>{p.salesCount} units sold · SKU: {p.sku}</div>
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

          {/* TAB 9: FEEDS & SYNDICATION */}
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
            </div>
          )}

          {/* TAB 10: FULLY FLEDGED STORE SETTINGS */}
          {activeSection === 'settings' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 1rem 0' }}>
                Merchant Store Settings
              </h2>

              {/* Settings 7 Sub-Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #DCDCDE', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {[
                  { id: 'general', label: 'General' },
                  { id: 'inventory', label: 'Products & Inventory' },
                  { id: 'shipping', label: 'Shipping Zones' },
                  { id: 'payments', label: 'Payment Gateways' },
                  { id: 'privacy', label: 'Accounts & Privacy' },
                  { id: 'emails', label: 'Email Notifications' },
                  { id: 'integration', label: 'Feeds & API' },
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Subtab 1: General */}
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
                        Base Country
                      </label>
                      <input
                        type="text"
                        disabled
                        defaultValue="South Africa (Gauteng)"
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem', background: '#F6F7F7' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                        Currency Format
                      </label>
                      <select style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}>
                        <option>South African Rand (R) · Left with space</option>
                        <option>South African Rand (R) · Left</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save General Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Subtab 2: Products & Inventory */}
              {settingsSubTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input type="checkbox" defaultChecked /> Enable stock management at product level
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                        Weight Unit
                      </label>
                      <select style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}>
                        <option>kg (Kilograms)</option>
                        <option>g (Grams)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                        Dimension Unit
                      </label>
                      <select style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}>
                        <option>cm (Centimeters)</option>
                        <option>mm (Millimeters)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D2327', display: 'block', marginBottom: '0.3rem' }}>
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      defaultValue="2"
                      style={{ width: '120px', padding: '0.45rem', borderRadius: '4px', border: '1px solid #DCDCDE', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Inventory Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Subtab 3: Shipping */}
              {settingsSubTab === 'shipping' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <div style={{ border: '1px solid #DCDCDE', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>🇿🇦 South Africa Nationwide Shipping Zones</div>
                    <p style={{ fontSize: '0.78rem', color: '#646970', margin: '0 0 0.75rem 0' }}>Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Free State</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
                      <label><input type="checkbox" defaultChecked /> Flat Rate Courier (R 150.00)</label>
                      <label><input type="checkbox" defaultChecked /> Local Counter Collection (Free)</label>
                      <label><input type="checkbox" defaultChecked /> Heavy Pallet Freight (R 450.00 for Solar Batteries)</label>
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

              {/* Subtab 4: Payments */}
              {settingsSubTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  {[
                    { name: 'Direct Bank Transfer (EFT / BACS)', desc: 'Direct South African FNB / Standard Bank / Nedbank transfer.', enabled: true },
                    { name: 'PayFast / Credit Card', desc: 'Accept Visa, Mastercard, and Instant EFT securely via PayFast.', enabled: true },
                    { name: 'Cash on Counter Collection (COD)', desc: 'In-person cash or speedpoint terminal at your physical stall.', enabled: true },
                    { name: 'WhatsApp Trade Order Dispatch', desc: 'Direct WhatsApp instant invoice and pro-forma generation.', enabled: true },
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
                      Save Payment Gateways
                    </button>
                  </div>
                </div>
              )}

              {/* Subtab 5: Privacy */}
              {settingsSubTab === 'privacy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" defaultChecked /> Allow customers to place orders without creating an account (Guest Checkout)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" defaultChecked /> Allow customers to create an account during checkout
                  </label>
                  <div>
                    <button style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.55rem 1.25rem', fontWeight: 800, fontSize: '0.825rem', cursor: 'pointer' }}>
                      Save Privacy Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Subtab 6: Emails */}
              {settingsSubTab === 'emails' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '640px' }}>
                  {[
                    { event: 'New Order Placed', recipient: 'Merchant (orders@shoppage.co.za)', active: true },
                    { event: 'Order Processing Notification', recipient: 'Customer', active: true },
                    { event: 'Order Completed / Dispatched', recipient: 'Customer', active: true },
                    { event: 'Low Stock Alert Triggered', recipient: 'Merchant', active: true },
                  ].map((email, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.65rem 0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>{email.event}</div>
                        <div style={{ fontSize: '0.72rem', color: '#646970' }}>Recipient: {email.recipient}</div>
                      </div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700 }}><input type="checkbox" defaultChecked={email.active} /> Active</label>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 7: Integration */}
              {settingsSubTab === 'integration' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Store REST API Key</label>
                    <input type="text" readOnly defaultValue="ck_9f88d16e5a777c928471" style={{ width: '100%', padding: '0.45rem', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #DCDCDE' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Webhook Secret</label>
                    <input type="password" readOnly defaultValue="whsec_shoppage_2026_live" style={{ width: '100%', padding: '0.45rem', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #DCDCDE' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: SYSTEM STATUS */}
          {activeSection === 'status' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCDCDE', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2327', margin: '0 0 0.5rem 0' }}>
                🩺 Store Diagnostic Status
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#646970', marginBottom: '1.5rem' }}>
                Technical environment details, feed health, and database connection.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>Shoppage OS Version</td>
                    <td style={{ padding: '0.65rem', color: '#2563EB', fontWeight: 800 }}>7.0.0 (Unified Merchant Core)</td>
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
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ADD NEW PRODUCT MODAL */}
      {showAddProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '740px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ background: '#1D2327', color: '#FFFFFF', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem' }}>Add New Product — Live Store Catalog</strong>
              <button
                onClick={() => setShowAddProductModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Product Data Tabs */}
            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #DCDCDE' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deye 8kW Single Phase Hybrid Inverter SUN-8K-SG01LP1"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700 }}
                />
              </div>

              {/* Product Data MetaBox Tabs */}
              <div style={{ display: 'flex', flex: 1 }}>
                {/* Left Meta Tabs */}
                <div style={{ width: '160px', background: '#F8FAFC', borderRight: '1px solid #DCDCDE', display: 'flex', flexDirection: 'column' }}>
                  {[
                    { id: 'general', label: 'General', icon: '💰' },
                    { id: 'inventory', label: 'Inventory', icon: '📦' },
                    { id: 'shipping', label: 'Shipping', icon: '🚚' },
                    { id: 'attributes', label: 'Attributes', icon: '⚙️' },
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setAddProductTab(tab.id as any)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid #E2E8F0',
                        background: addProductTab === tab.id ? '#FFFFFF' : 'transparent',
                        color: addProductTab === tab.id ? '#7F54B3' : '#646970',
                        fontWeight: addProductTab === tab.id ? 800 : 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Right Meta Tab Panel */}
                <div style={{ flex: 1, padding: '1.25rem' }}>
                  {addProductTab === 'general' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Regular Price (ZAR R) *</label>
                          <input
                            type="number"
                            required
                            placeholder="28500"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Sale Price (ZAR R)</label>
                          <input
                            type="number"
                            placeholder="26999"
                            value={newProduct.salePrice}
                            onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Brand</label>
                          <input
                            type="text"
                            placeholder="e.g. Deye"
                            value={newProduct.brand}
                            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Category</label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          >
                            <option>Inverters & Solar</option>
                            <option>Batteries & Storage</option>
                            <option>Solar Panels</option>
                            <option>Protection & Cables</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {addProductTab === 'inventory' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>SKU (Stock Keeping Unit)</label>
                        <input
                          type="text"
                          placeholder="SYN-8K-HYB"
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Stock Quantity</label>
                          <input
                            type="number"
                            value={newProduct.stockQty}
                            onChange={(e) => setNewProduct({ ...newProduct, stockQty: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Low Stock Threshold</label>
                          <input
                            type="number"
                            value={newProduct.lowStockThreshold}
                            onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {addProductTab === 'shipping' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Weight (kg)</label>
                          <input
                            type="number"
                            value={newProduct.weight}
                            onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Dimensions (L x W x H cm)</label>
                          <input
                            type="text"
                            value={newProduct.dimensions}
                            onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {addProductTab === 'attributes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Voltage</label>
                          <input
                            type="text"
                            value={newProduct.voltage}
                            onChange={(e) => setNewProduct({ ...newProduct, voltage: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Warranty</label>
                          <input
                            type="text"
                            value={newProduct.warranty}
                            onChange={(e) => setNewProduct({ ...newProduct, warranty: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #DCDCDE', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  style={{ background: '#F0F0F1', border: '1px solid #DCDCDE', borderRadius: '4px', padding: '0.45rem 1rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#7F54B3', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.45rem 1.25rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Publish to Live Store Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
