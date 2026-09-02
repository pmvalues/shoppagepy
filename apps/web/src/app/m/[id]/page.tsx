'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  NationwideMerchantStore,
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_PASSPORTS,
  MITREND_MERCHANT,
  MITREND_PRODUCTS,
} from '@shoppage/kernel';
import type { Merchant } from '@shoppage/contracts';
import { SHORTS, SHOWS, type MediaItem } from '@/lib/media';
import Breadcrumb from '@/components/Breadcrumb';
import WooButton from '@/components/WooButton';
import WhatsAppCTA from '@/components/WhatsAppCTA';

function synthesizeFallbackMerchant(id: string): Merchant {
  if (id.toLowerCase().includes('mitrend')) {
    return MITREND_MERCHANT as Merchant;
  }
  const clean = id.replace(/^(?:mer_ext_|loc_|mer_)/, '').replace(/_/g, ' ');
  const name = clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    id,
    name: `${name} (Verified Storefront)`,
    country: 'ZA',
    category: 'solar_energy',
    addressText: 'Commercial Trading Node, Johannesburg, Gauteng',
    province: 'Gauteng',
    googleRating: 4.8,
    googleReviewsCount: 34,
    operatingHours: 'Mon-Fri 08:00 - 17:00 · Sat 08:00 - 13:00',
    medianResponseMinutes: 10,
    verificationState: 'fully_verified',
    contacts: {
      telephone: '+27105007670',
      whatsapp: '+27105007670',
      email: `sales@${clean.replace(/\s+/g, '')}.co.za`,
      website: `https://${clean.replace(/\s+/g, '')}.co.za`,
    },
  };
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  brand: string;
  image: string;
}

export default function MerchantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const merchant = NationwideMerchantStore.getMerchantById(resolvedParams.id) || synthesizeFallbackMerchant(resolvedParams.id);
  const isMitrend = resolvedParams.id.toLowerCase().includes('mitrend');

  // Active Store Tabs
  const [activeTab, setActiveTab] = useState<'shop' | 'live' | 'shorts' | 'shows' | 'about' | 'reviews' | 'rfq'>('shop');
  const [productCategory, setProductCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);
  const [activeShowEpisode, setActiveShowEpisode] = useState(0);
  const [liveChatMessages, setLiveChatMessages] = useState([
    { sender: 'Johan V.', text: 'Does this 5kW Deye inverter include the CT clamp?', time: '14:21' },
    { sender: 'Thabo M.', text: 'Can this run a 2.5kW borehole pump?', time: '14:22' },
    { sender: 'Pretoria Solar CC', text: 'Placed an order for 4 units, thanks guys!', time: '14:23' },
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [rfqSubmitted, setRfqSubmitted] = useState(false);
  const [rfqForm, setRfqForm] = useState({ name: '', phone: '', email: '', items: '4x Deye 5kW + 8x Dyness 5.12kWh', notes: 'Need delivery to Midrand construction site.' });

  const passport = SA_FLAGSHIP_PASSPORTS[merchant.id] || {
    merchantId: merchant.id,
    merchantName: merchant.name,
    score: merchant.googleRating ? Math.round(merchant.googleRating * 19) : 94,
    freshOffersTodayCount: 14,
    medianResponseMinutes: merchant.medianResponseMinutes || 8,
    complaintCountLast90d: 0,
    state: 'VERIFIED_ACTIVE',
  };

  // High-Resolution Product Photography & Catalog
  const solarProducts = [
    {
      id: 'prod_deye_5kw',
      title: 'Deye 5kW Hybrid Inverter 48V (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      sku: 'DEYE-5K-SG03',
      category: 'inverters',
      categoryLabel: 'Hybrid Inverters',
      price: 18500,
      salePrice: 17999,
      inStock: true,
      stockQty: 14,
      warranty: '5 Years Warranty',
      specs: '48V Single Phase · Dual MPPT (500V) · SABS NRS 097 Certified · 4ms UPS Switch',
      image: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_dyness_5kwh',
      title: 'Dyness 5.12kWh Lithium Battery BX51100 48V LiFePO4',
      brand: 'Dyness',
      sku: 'DYN-5.12KWH-BX',
      category: 'batteries',
      categoryLabel: 'Lithium Batteries',
      price: 16900,
      salePrice: null,
      inStock: true,
      stockQty: 22,
      warranty: '10 Years Warranty',
      specs: '5.12kWh 100Ah · 6,000 Cycles (80% DoD) · LiFePO4 Chemistry · Smart BMS CAN/RS485',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_ja_550w',
      title: 'JA Solar 550W Mono PERC Half-Cell Solar Panel',
      brand: 'JA Solar',
      sku: 'JA-550W-MONO',
      category: 'panels',
      categoryLabel: 'Solar Panels',
      price: 1750,
      salePrice: null,
      inStock: true,
      stockQty: 85,
      warranty: '12 Years Product / 25 Years Output',
      specs: 'Tier-1 Mono PERC · 21.3% Efficiency · 144 Half-Cells · Silver Frame 35mm',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_sunsynk_8kw',
      title: 'Sunsynk 8kW Hybrid Inverter 48V (SUN-8K-SG01LP1)',
      brand: 'Sunsynk',
      sku: 'SYN-8K-HYB',
      category: 'inverters',
      categoryLabel: 'Hybrid Inverters',
      price: 28500,
      salePrice: null,
      inStock: true,
      stockQty: 8,
      warranty: '5 Years Warranty',
      specs: '8kW Output / 10.4kW Max Solar · Dual MPPT · Auxiliary Load Port · Wi-Fi Data Logger',
      image: 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_freedomwon_10kwh',
      title: 'Freedom Won LiTE Home 10/8 10kWh LiFePO4 Battery',
      brand: 'Freedom Won',
      sku: 'FW-LITE-10KWH',
      category: 'batteries',
      categoryLabel: 'Lithium Batteries',
      price: 49500,
      salePrice: 47900,
      inStock: true,
      stockQty: 5,
      warranty: '10 Years Warranty',
      specs: '10kWh Total (8kWh Usable) · Heavy Duty Wall Mount · Made in South Africa · SABS Compliant',
      image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_canadian_550w',
      title: 'Canadian Solar 550W HiKu6 Mono PERC Solar Panel',
      brand: 'Canadian Solar',
      sku: 'CS-550W-HIKU',
      category: 'panels',
      categoryLabel: 'Solar Panels',
      price: 1820,
      salePrice: null,
      inStock: true,
      stockQty: 60,
      warranty: '12 Years Product / 25 Years Linear Power',
      specs: '550W Pmax · 21.5% Module Efficiency · Low NMOT: 42 ± 3 °C · Heavy Snow & Wind Load',
      image: 'https://images.unsplash.com/photo-1545259741-2ea1417ae7a1?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_victron_multiplus',
      title: 'Victron MultiPlus-II 48/5000/70-50 230V Inverter Charger',
      brand: 'Victron Energy',
      sku: 'VIC-MPII-48-5000',
      category: 'inverters',
      categoryLabel: 'Hybrid Inverters',
      price: 24500,
      salePrice: null,
      inStock: true,
      stockQty: 6,
      warranty: '5 Years Warranty',
      specs: 'Pure Sine Wave 5000VA · PowerControl & PowerAssist · True UPS Seamless Transfer',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&h=400&fit=crop',
    },
    {
      id: 'prod_solar_cables',
      title: '4mm² KBE Solar PV Cable (100m Drum, Red & Black)',
      brand: 'KBE Solar',
      sku: 'CAB-4MM-100M',
      category: 'cables',
      categoryLabel: 'Cables & Protection',
      price: 1850,
      salePrice: null,
      inStock: true,
      stockQty: 40,
      warranty: '25 Years Rated Life',
      specs: 'TUV Certified 1500V DC · Double Insulated XLPO · Halogen Free · UV & Ozone Resistant',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&h=400&fit=crop',
    },
  ];

  const storeProducts = isMitrend
    ? MITREND_PRODUCTS.map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand,
        sku: p.sku,
        category: p.category,
        categoryLabel: p.category,
        price: p.price,
        salePrice: p.salePrice,
        inStock: p.inStock,
        stockQty: p.stockQty,
        warranty: p.warranty,
        specs: p.specs,
        image: p.image,
      }))
    : solarProducts;

  // Dynamic Categories from the store products
  const uniqueCategories = Array.from(new Set(storeProducts.map((p) => p.category)));
  const categoryFilterList = [
    { id: 'all', label: 'All Items' },
    ...uniqueCategories.slice(0, 6).map((c) => ({ id: c, label: c })),
  ];

  const filteredProducts = storeProducts.filter((p) => {
    if (productCategory !== 'all' && p.category !== productCategory) return false;
    if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const addToCart = (product: typeof storeProducts[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id: product.id, title: product.title, price: product.salePrice || product.price, qty: 1, brand: product.brand, image: product.image }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSendWhatsAppOrder = () => {
    const phone = merchant.contacts?.telephone?.replace(/[^0-9]/g, '') || '27118370122';
    const lines = cart.map((item) => `• ${item.qty}x ${item.title} (R ${(item.price * item.qty).toLocaleString('en-ZA')})`).join('\n');
    const msg = `Hello ${merchant.name}, I would like to place an order from your online store:\n\n${lines}\n\n*Total: R ${cartTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}*\n\nPlease confirm availability and payment/collection details.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLiveChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setLiveChatMessages([...liveChatMessages, { sender: 'You (Buyer)', text: newChatText, time: 'Just now' }]);
    setNewChatText('');
  };

  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/v1/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCategory: merchant.category || 'wholesale_trade',
          itemSummary: rfqForm.items,
          buyerContact: {
            name: rfqForm.name,
            phone: rfqForm.phone,
            email: rfqForm.email || undefined,
          },
          targetMerchantId: merchant.id,
          additionalNotes: rfqForm.notes,
        }),
      });
    } catch (err) {
      console.error('[RFQ] Dispatch error:', err);
    }
    setRfqSubmitted(true);
  };

  const whatsappPhone = merchant.contacts?.telephone?.replace(/[^0-9]/g, '') || '27118370122';

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '5rem', color: '#0F172A' }}>
      {/* 1. STREAMLINED COMPACT STORE IDENTITY HEADER (NO EMPTY TOP BANNER) */}
      <header style={{ background: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
        <div className="container" style={{ padding: '1rem 1rem 0.5rem' }}>
          <Breadcrumb
            onDark
            items={[
              { label: 'Home', href: '/' },
              { label: 'Stores', href: '/search?mode=shopping' },
              { label: merchant.name },
            ]}
          />
          {/* Top Identity Row: Logo, Name, Badges, & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                  flexShrink: 0,
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {merchant.name}
                  </h1>
                  <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ✓ VERIFIED STORE
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', color: '#FCD34D', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ★ {merchant.googleRating || 4.8} ({merchant.googleReviewsCount || 42}+ Reviews)
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span>📍 {merchant.addressText}</span>
                  <span>•</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>● Open Now</span>
                  <span>•</span>
                  <span>⚡ Avg reply: <strong>{passport.medianResponseMinutes} min</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <WhatsAppCTA
                phone={whatsappPhone}
                message={`Hello ${merchant.name}, I am viewing your online store on Shoppage and would like to inquire about your products.`}
                label="WhatsApp"
                size="sm"
              />

              {merchant.contacts?.telephone && (
                <a
                  href={`tel:${merchant.contacts.telephone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-dark btn-sm"
                >
                  📞 Call
                </a>
              )}

              <WooButton variant="primary" size="sm" onClick={() => setActiveTab('rfq')}>
                📋 Get RFQ Quote
              </WooButton>
            </div>
          </div>

          {/* 2. STORE NAVIGATION TABS (IMMEDIATELY COMPACT) */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              marginTop: '0.85rem',
              borderTop: '1px solid #1E293B',
              paddingTop: '0.5rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { id: 'shop', label: '🛍️ Products & Shop', count: storeProducts.length },
              { id: 'live', label: '🔴 Live Stream', isLive: true },
              { id: 'shorts', label: '🎬 Video Shorts', count: SHORTS.length },
              { id: 'shows', label: '📺 Masterclass Shows', count: SHOWS.length },
              { id: 'about', label: '🏢 About & Facility' },
              { id: 'reviews', label: `⭐ Reviews (${merchant.googleReviewsCount || 42})` },
              { id: 'rfq', label: '💬 Wholesale RFQ & Location' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: isActive ? '#2563EB' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#94A3B8';
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.isLive && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 6px #EF4444' }} />
                  )}
                  {tab.count !== undefined && !tab.isLive && (
                    <span style={{ fontSize: '0.68rem', background: isActive ? 'rgba(255,255,255,0.2)' : '#1E293B', padding: '0.1rem 0.35rem', borderRadius: '10px' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. PRODUCTS & CONTENT CANVAS (CLEARLY VISIBLE ABOVE THE FOLD) */}
      <main className="container" style={{ paddingTop: '1.25rem' }}>
        {/* TAB 1: 🛍️ SHOP & E-COMMERCE PRODUCTS */}
        {activeTab === 'shop' && (
          <div>
            {/* Filter and Search Bar */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {categoryFilterList.map((cat) => {
                  const isSelected = productCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategory(cat.id)}
                      style={{
                        background: isSelected ? '#0F172A' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* In-Store Search Input */}
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  placeholder="Search store inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.65rem 0.4rem 1.85rem',
                    borderRadius: '5px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: '0.6rem', top: '0.4rem', color: '#94A3B8', fontSize: '0.85rem' }}>🔍</span>
              </div>
            </div>

            {/* Products Grid with Clear Photography */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  {/* Product Image Stage */}
                  <div style={{ height: '175px', position: 'relative', background: '#F1F5F9', overflow: 'hidden' }}>
                    <img
                      src={product.image}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      {product.brand}
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#ECFDF5',
                        color: '#059669',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      ✓ In Stock ({product.stockQty})
                    </span>
                  </div>

                  {/* Product Details */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{product.categoryLabel} · SKU: {product.sku}</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0.4rem 0', lineHeight: 1.35 }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 0.85rem 0', lineHeight: 1.35 }}>
                      {product.specs}
                    </p>

                    {/* Price in ZAR */}
                    <div style={{ marginTop: 'auto', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                          R {product.salePrice ? product.salePrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        {product.salePrice && (
                          <span style={{ fontSize: '0.8rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                            R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                        {product.warranty} · Immediate Collection
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                      <button
                        onClick={() => addToCart(product)}
                        style={{
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '0.45rem',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        + Add to Cart
                      </button>
                      <a
                        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${merchant.name}, I want to order 1x ${product.title} for R ${product.salePrice || product.price}. Is it available today?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          borderRadius: '5px',
                          padding: '0.45rem',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        💬 Order WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: 🔴 LIVE STREAM & LIVE SHOPPING BROADCAST */}
        {activeTab === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
            {/* Live Player & Pinned Live Product */}
            <div>
              <div
                style={{
                  background: '#000000',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                }}
              >
                <video
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Top Live Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.65rem', borderRadius: '20px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 8px #EF4444' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}>LIVE SHOWROOM BROADCAST</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.65rem', borderRadius: '20px' }}>
                    👥 184 Viewers
                  </div>
                </div>
              </div>

              {/* Pinned Featured Live Product */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1.5px solid #2563EB',
                  padding: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.75rem' }}>🔥</div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                      FEATURED ON LIVE STREAM:
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                      Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Special Live Broadcast Deal · 5 Year Warranty</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      R 17,999.00
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textDecoration: 'line-through' }}>R 18,500.00</div>
                  </div>
                  <button
                    onClick={() => addToCart(storeProducts[0])}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '0.55rem 1.15rem',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Buy on Live Stream
                  </button>
                </div>
              </div>
            </div>

            {/* Live Chat & Q&A Stream */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: '460px',
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💬 Live Stream Q&A</span>
                <span style={{ fontSize: '0.7rem', color: '#10B981' }}>● Host Active</span>
              </div>

              {/* Chat Log */}
              <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {liveChatMessages.map((msg, i) => (
                  <div key={i} style={{ background: '#F8FAFC', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <strong style={{ color: '#2563EB', fontSize: '0.75rem' }}>{msg.sender}</strong>
                      <span style={{ color: '#94A3B8', fontSize: '0.68rem' }}>{msg.time}</span>
                    </div>
                    <div style={{ color: '#1E293B', lineHeight: 1.35 }}>{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleLiveChatSubmit} style={{ padding: '0.65rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Ask the host a question..."
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  style={{ flex: 1, padding: '0.45rem', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                />
                <button
                  type="submit"
                  style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '5px', padding: '0.45rem 0.75rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: 🎬 VIDEO SHORTS & PRODUCT SHOWCASES */}
        {activeTab === 'shorts' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                🎬 Product Teardowns & Physical Load Test Shorts
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Real lab tests, battery stress tests, and unboxing shorts recorded directly by our engineers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {SHORTS.map((short) => (
                <div
                  key={short.id}
                  onClick={() => setSelectedVideo(short)}
                  style={{
                    background: '#000000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    aspectRatio: '9 / 16',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', color: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 800, marginBottom: '0.15rem' }}>
                      ▶ {short.views.toLocaleString()} views · {short.duration}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.25 }}>
                      {short.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 📺 SHOWS & MASTERCLASSES */}
        {activeTab === 'shows' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                📺 Engineering Shows & Solar Masterclasses
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                In-depth educational episodes on home backup sizing, SABS compliance, and lithium safety.
              </p>
            </div>

            {/* Featured Main Show Player */}
            <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ aspectRatio: '16 / 9', background: '#000' }}>
                <video
                  src={SHOWS[activeShowEpisode].videoUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.25rem' }}>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>{SHOWS[activeShowEpisode].series}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0' }}>
                  {SHOWS[activeShowEpisode].title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.45, margin: '0.4rem 0 0.85rem 0' }}>
                  {SHOWS[activeShowEpisode].description}
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('shop')}
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '5px', padding: '0.45rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    🛍️ Browse Featured Products
                  </button>
                  <a
                    href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello, I watched your show episode "${SHOWS[activeShowEpisode].title}" and would like technical advice.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '0.45rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    💬 Ask Engineer on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Episode Grid */}
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>All Masterclass Episodes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {SHOWS.map((show, idx) => (
                <div
                  key={show.id}
                  onClick={() => setActiveShowEpisode(idx)}
                  style={{
                    background: idx === activeShowEpisode ? '#EFF6FF' : '#FFFFFF',
                    border: idx === activeShowEpisode ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: '130px', position: 'relative', background: '#000' }}>
                    <img src={show.thumbnailUrl} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', color: '#FFF', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {show.duration}
                    </span>
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#2563EB', fontWeight: 700 }}>{show.series}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem', lineHeight: 1.3 }}>
                      {show.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: 🏢 ABOUT US & FACILITY GALLERY */}
        {activeTab === 'about' && (
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem' }}>
              About {merchant.name}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55, maxWidth: '800px', marginBottom: '1.5rem' }}>
              Founded in 2018, {merchant.name} is a premier physical stockist and direct importer of commercial-grade solar inverters, lithium battery systems, and grid protection hardware based in Johannesburg. We maintain verified physical inventory with instant counter collections and nationwide freight across all 9 provinces.
            </p>

            {/* Credential Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>🏛️</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>CIPC Verified Business</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>Reg No: 2018/482910/07 · Tax Compliant</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>🛡️</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>SABS & NRS 097 Certified</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>Authorized Tier-1 Partner</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>🏢</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>Physical Trade Counter</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>Showroom & Warehouse in Crown Mines</div>
              </div>
            </div>

            {/* Showroom & Facility Photo Gallery */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem' }}>
              Showroom, Counter & Warehouse Photos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {[
                { title: 'Main Trade Counter & Display Showroom', url: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=600&h=400&fit=crop' },
                { title: 'Inverter Testing Bay & SABS Lab', url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=600&h=400&fit=crop' },
                { title: 'Lithium Battery Warehouse Staging', url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop' },
                { title: 'Solar Panel Dispatch Loading Bay', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop' },
              ].map((photo, i) => (
                <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.55rem', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                    {photo.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ⭐ CUSTOMER REVIEWS & TRUST */}
        {activeTab === 'reviews' && (
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Verified Buyer Reviews
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                  Real reviews from trade contractors, installers, and residential clients.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A' }}>★ {merchant.googleRating || 4.8} / 5.0</div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>100% Verified Purchase Score</div>
              </div>
            </div>

            {/* Review Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { name: 'Kobus van der Merwe', org: 'Gauteng Solar Systems CC', rating: 5, date: '3 days ago', text: 'Collected 4x Deye 5kW inverters and 8x Dyness batteries. Stock was ready at the counter, SABS paperwork in order. Will definitely source here regularly.' },
                { name: 'Sipho Ndlovu', org: 'Midrand Electrical Contractors', rating: 5, date: '1 week ago', text: 'Fast WhatsApp confirmation. Delivered to our site within 4 hours. Excellent technical support on the inverter aux port wiring.' },
                { name: 'David Miller', org: 'Sandton Residential Client', rating: 5, date: '2 weeks ago', text: 'Great pricing compared to major hardware chains. Direct counter pickup was smooth and the warranty is registered with the importer.' },
              ].map((rev, i) => (
                <div key={i} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div>
                      <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{rev.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '0.4rem' }}>({rev.org})</span>
                    </div>
                    <div style={{ color: '#F59E0B', fontSize: '0.8rem' }}>{'★'.repeat(rev.rating)}</div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.4, margin: '0.3rem 0 0.15rem 0' }}>
                    {rev.text}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{rev.date} · Verified Storefront Purchase</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: 💬 WHOLESALE RFQ & CONTACT */}
        {activeTab === 'rfq' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)', gap: '1.5rem' }}>
            {/* Wholesale RFQ Builder */}
            <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
                Request Wholesale Quote (RFQ)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Direct tier-1 pricing for solar installers, building contractors, and commercial developers.
              </p>

              {rfqSubmitted ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>✓</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#065F46', margin: '0 0 0.2rem 0' }}>RFQ Dispatched Directly to Store!</h3>
                  <p style={{ fontSize: '0.8rem', color: '#047857', margin: 0 }}>
                    Our sales engineers will contact you via WhatsApp/Phone within {passport.medianResponseMinutes} minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRfqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>Your Name / Company *</label>
                    <input
                      type="text"
                      required
                      value={rfqForm.name}
                      onChange={(e) => setRfqForm({ ...rfqForm, name: e.target.value })}
                      placeholder="e.g. Pretoria Solar Installations CC"
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>Phone / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={rfqForm.phone}
                        onChange={(e) => setRfqForm({ ...rfqForm, phone: e.target.value })}
                        placeholder="082 123 4567"
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>Email Address</label>
                      <input
                        type="email"
                        value={rfqForm.email}
                        onChange={(e) => setRfqForm({ ...rfqForm, email: e.target.value })}
                        placeholder="procurement@company.co.za"
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>Items Required & Quantities *</label>
                    <textarea
                      required
                      rows={3}
                      value={rfqForm.items}
                      onChange={(e) => setRfqForm({ ...rfqForm, items: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '5px', padding: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    🚀 Submit RFQ Direct to Store
                  </button>
                </form>
              )}
            </div>

            {/* Operating Hours & Physical Location */}
            <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem' }}>
                Store Location & Trading Hours
              </h3>
              <div style={{ fontSize: '0.825rem', color: '#334155', marginBottom: '1rem', lineHeight: 1.45 }}>
                <strong>Address:</strong><br />
                📍 {merchant.addressText}
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.4rem', color: '#0F172A' }}>Operating Hours:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: '#64748B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Monday – Friday</span><strong>08:00 – 17:00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Saturday</span><strong>08:00 – 13:00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sunday & Holidays</span><span style={{ color: '#EF4444' }}>Closed</span></div>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(merchant.addressText || merchant.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  padding: '0.55rem',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                🗺️ GPS Directions & Navigation
              </a>
            </div>
          </div>
        )}
      </main>

      {/* 4. VIDEO MODAL POPUP */}
      {selectedVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            style={{
              background: '#000000',
              borderRadius: '10px',
              overflow: 'hidden',
              maxWidth: '380px',
              width: '100%',
              aspectRatio: '9 / 16',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              onClick={() => setSelectedVideo(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 5. FLOATING WHATSAPP QUICK CART DRAWER */}
      {cart.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100,
          }}
        >
          {!isCartOpen ? (
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                background: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.35rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🛒</span>
              <span>Cart ({cart.reduce((s, i) => s + i.qty, 0)})</span>
              <span>· R {cartTotal.toLocaleString('en-ZA')}</span>
            </button>
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                width: '320px',
                maxHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem' }}>Store Cart ({cart.length} items)</strong>
                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem' }}>
                    <div style={{ flex: 1, paddingRight: '0.4rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>R {item.price.toLocaleString('en-ZA')} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Total:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                    R {cartTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={handleSendWhatsAppOrder}
                  style={{
                    width: '100%',
                    background: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>💬 Complete Order on WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
