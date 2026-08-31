'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  NationwideMerchantStore,
  SA_FLAGSHIP_OFFERS,
  SA_CANONICAL_PRODUCTS,
  SA_FLAGSHIP_PASSPORTS,
} from '@shoppage/kernel';
import type { Merchant } from '@shoppage/contracts';
import { SHORTS, SHOWS, type MediaItem } from '@/lib/media';

function synthesizeFallbackMerchant(id: string): Merchant {
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
      telephone: '+27110001001',
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
}

export default function MerchantProfilePage({ params }: { params: { id: string } }) {
  const merchant = NationwideMerchantStore.getMerchantById(params.id) || synthesizeFallbackMerchant(params.id);

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

  // Products for this store
  const storeProducts = SA_CANONICAL_PRODUCTS.slice(0, 10).map((p, idx) => ({
    id: p.canonicalId,
    title: p.title,
    brand: p.brand,
    sku: `SKU-${1000 + idx}`,
    category: idx < 4 ? 'inverters' : idx < 7 ? 'batteries' : 'panels',
    categoryLabel: idx < 4 ? 'Hybrid Inverters' : idx < 7 ? 'Lithium Batteries' : 'Solar Panels',
    price: (p.attributes?.estimatedPriceZar as number) || (idx === 0 ? 18500 : idx === 1 ? 16900 : idx === 2 ? 1750 : 28500),
    salePrice: idx === 0 ? 17999 : null,
    inStock: true,
    stockQty: 10 + idx * 3,
    warranty: idx < 4 ? '5 Years' : idx < 7 ? '10 Years' : '12 Years',
    specs: idx < 4 ? '48V Single Phase · Dual MPPT · SABS NRS 097 Certified' : idx < 7 ? '5.12kWh 100Ah · 6,000 Cycles · LiFePO4 Smart BMS' : '550W Mono PERC · High Efficiency · 25yr Output Warranty',
    image: idx < 4
      ? 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=500&h=400&fit=crop'
      : idx < 7
      ? 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&h=400&fit=crop'
      : 'https://images.unsplash.com/photo-1548611716-ad381335b2e0?w=500&h=400&fit=crop',
  }));

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
      return [...prev, { id: product.id, title: product.title, price: product.salePrice || product.price, qty: 1, brand: product.brand }];
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
    const msg = `Hello ${merchant.name}, I would like to place an order from your Shoppage store:\n\n${lines}\n\n*Total: R ${cartTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}*\n\nPlease confirm stock availability and banking details / collection address.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLiveChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setLiveChatMessages([...liveChatMessages, { sender: 'You (Buyer)', text: newChatText, time: 'Just now' }]);
    setNewChatText('');
  };

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRfqSubmitted(true);
  };

  const whatsappPhone = merchant.contacts?.telephone?.replace(/[^0-9]/g, '') || '27118370122';

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* 1. STORE HERO BANNER & BRANDING HEADER */}
      <div style={{ background: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
        {/* Cover Photo / Graphic Strip */}
        <div
          style={{
            height: '180px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #1E1B4B 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                ✓ VERIFIED SOUTH AFRICAN STOCKIST
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                Trust Score: {passport.score}/100
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#FCD34D', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                ★ {merchant.googleRating || 4.8} ({merchant.googleReviewsCount || 42}+ Reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Store Profile Info & Contact Actions */}
        <div className="container" style={{ padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Store Name & Meta */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    marginTop: '-36px',
                    border: '3px solid #0F172A',
                  }}
                >
                  ⚡
                </div>
                <div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                    {merchant.name}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                    Authorized Clean Energy, Inverter & Electrical Equipment Distributor
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#CBD5E1', marginTop: '0.75rem' }}>
                <span>📍 {merchant.addressText}</span>
                <span>•</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>● Open Now (Closes 17:00)</span>
                <span>•</span>
                <span>⚡ Avg reply: <strong>{passport.medianResponseMinutes} min</strong></span>
              </div>
            </div>

            {/* Omnichannel Direct Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${merchant.name}, I am viewing your online store on Shoppage and would like to inquire about your products.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  padding: '0.65rem 1.15rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                }}
              >
                <span>💬 WhatsApp Store</span>
              </a>

              {merchant.contacts?.telephone && (
                <a
                  href={`tel:${merchant.contacts.telephone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    background: '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid #334155',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem 1.15rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>📞 Call: {merchant.contacts.telephone}</span>
                </a>
              )}

              <button
                onClick={() => setActiveTab('rfq')}
                style={{
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.65rem 1.15rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                📋 Request Wholesale Quote
              </button>
            </div>
          </div>

          {/* 2. STORE NAVIGATION TABS BAR */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1.75rem',
              borderTop: '1px solid #1E293B',
              paddingTop: '0.75rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { id: 'shop', label: '🛍️ Shop & Products', count: storeProducts.length },
              { id: 'live', label: '🔴 Live Stream & Demos', isLive: true },
              { id: 'shorts', label: '🎬 Video Shorts & Demos', count: SHORTS.length },
              { id: 'shows', label: '📺 Shows & Masterclasses', count: SHOWS.length },
              { id: 'about', label: '🏢 About & Facility Gallery' },
              { id: 'reviews', label: `⭐ Reviews (${merchant.googleReviewsCount || 42})` },
              { id: 'rfq', label: '💬 Wholesale RFQ & Contact' },
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
                    borderRadius: '6px',
                    padding: '0.55rem 0.95rem',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 6px #EF4444' }} />
                  )}
                  {tab.count !== undefined && !tab.isLive && (
                    <span style={{ fontSize: '0.7rem', background: isActive ? 'rgba(255,255,255,0.2)' : '#1E293B', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAIN STOREFRONT CONTENT CONTAINER */}
      <div className="container" style={{ paddingTop: '2rem' }}>
        {/* TAB 1: 🛍️ SHOP & E-COMMERCE CATALOG */}
        {activeTab === 'shop' && (
          <div>
            {/* Filter and Search Bar */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Products' },
                  { id: 'inverters', label: '⚡ Hybrid Inverters' },
                  { id: 'batteries', label: '🔋 Lithium Batteries' },
                  { id: 'panels', label: '☀️ Solar Panels' },
                ].map((cat) => {
                  const isSelected = productCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategory(cat.id)}
                      style={{
                        background: isSelected ? '#0F172A' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
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
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Search store inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.825rem',
                    outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: '0.65rem', top: '0.45rem', color: '#94A3B8' }}>🔍</span>
              </div>
            </div>

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Product Image Stage */}
                  <div style={{ height: '180px', position: 'relative', background: '#F1F5F9', overflow: 'hidden' }}>
                    <img
                      src={product.image}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {product.brand}
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#ECFDF5',
                        color: '#059669',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      ✓ In Stock ({product.stockQty})
                    </span>
                  </div>

                  {/* Product Details */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{product.categoryLabel} · SKU: {product.sku}</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0 0.5rem 0', lineHeight: 1.35 }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                      {product.specs}
                    </p>

                    {/* Price in ZAR */}
                    <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                          R {product.salePrice ? product.salePrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        {product.salePrice && (
                          <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                            R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                        {product.warranty} Warranty · Direct Counter Collection
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        onClick={() => addToCart(product)}
                        style={{
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.78rem',
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
                          borderRadius: '6px',
                          padding: '0.5rem',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        💬 Order on WhatsApp
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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
            {/* Live Player & Pinned Live Product */}
            <div>
              <div
                style={{
                  background: '#000000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 8px #EF4444' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem' }}>LIVE SHOWROOM BROADCAST</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
                    👥 184 Viewers
                  </div>
                </div>
              </div>

              {/* Pinned Featured Live Product */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1.5px solid #2563EB',
                  padding: '1.25rem',
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>🔥</div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                      FEATURED ON LIVE STREAM:
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Special Live Broadcast Deal · 5 Year Warranty</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      R 17,999.00
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', textDecoration: 'line-through' }}>R 18,500.00</div>
                  </div>
                  <button
                    onClick={() => addToCart(storeProducts[0])}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.65rem 1.25rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
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
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💬 Live Stream Q&A</span>
                <span style={{ fontSize: '0.72rem', color: '#10B981' }}>● Host Active</span>
              </div>

              {/* Chat Log */}
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {liveChatMessages.map((msg, i) => (
                  <div key={i} style={{ background: '#F8FAFC', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ color: '#2563EB', fontSize: '0.78rem' }}>{msg.sender}</strong>
                      <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{msg.time}</span>
                    </div>
                    <div style={{ color: '#1E293B', lineHeight: 1.35 }}>{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleLiveChatSubmit} style={{ padding: '0.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Ask the host a question..."
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                />
                <button
                  type="submit"
                  style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: 🎬 VIDEO SHORTS & DEMOS */}
        {activeTab === 'shorts' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                🎬 Product Teardowns & Physical Load Test Shorts
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
                Real lab tests, battery stress tests, and unboxing shorts recorded directly by our engineers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {SHORTS.map((short) => (
                <div
                  key={short.id}
                  onClick={() => setSelectedVideo(short)}
                  style={{
                    background: '#000000',
                    borderRadius: '10px',
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
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', color: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 800, marginBottom: '0.2rem' }}>
                      ▶ {short.views.toLocaleString()} views · {short.duration}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.25 }}>
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
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                📺 Engineering Shows & Solar Masterclasses
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
                In-depth educational episodes on home backup sizing, SABS compliance, and lithium safety.
              </p>
            </div>

            {/* Featured Main Show Player */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '2rem' }}>
              <div style={{ aspectRatio: '16 / 9', background: '#000' }}>
                <video
                  src={SHOWS[activeShowEpisode].videoUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>{SHOWS[activeShowEpisode].series}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0' }}>
                  {SHOWS[activeShowEpisode].title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: '0.5rem 0 1rem 0' }}>
                  {SHOWS[activeShowEpisode].description}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('shop')}
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
                  >
                    🛍️ Browse Featured Products
                  </button>
                  <a
                    href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello, I watched your show episode "${SHOWS[activeShowEpisode].title}" and would like technical advice for my property.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.825rem', textDecoration: 'none' }}
                  >
                    💬 Ask Engineer on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Episode Grid */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>All Masterclass Episodes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {SHOWS.map((show, idx) => (
                <div
                  key={show.id}
                  onClick={() => setActiveShowEpisode(idx)}
                  style={{
                    background: idx === activeShowEpisode ? '#EFF6FF' : '#FFFFFF',
                    border: idx === activeShowEpisode ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: '140px', position: 'relative', background: '#000' }}>
                    <img src={show.thumbnailUrl} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#FFF', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {show.duration}
                    </span>
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700 }}>{show.series}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem', lineHeight: 1.3 }}>
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
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.75rem' }}>
              About {merchant.name}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, maxWidth: '800px', marginBottom: '2rem' }}>
              Founded in 2018, {merchant.name} is a premier physical stockist and direct importer of commercial-grade solar inverters, lithium battery systems, and grid protection hardware based in Johannesburg. We maintain verified physical inventory with instant counter collections and nationwide freight across all 9 provinces.
            </p>

            {/* Credential Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🏛️</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>CIPC Verified Business</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>Reg No: 2018/482910/07 · Tax Compliant</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🛡️</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>SABS & NRS 097 Certified</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>Authorized Tier-1 Deye & Dyness Partner</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🏢</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Physical Trade Counter</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>Showroom & Warehouse in Crown Mines</div>
              </div>
            </div>

            {/* Showroom & Facility Photo Gallery */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
              Showroom, Counter & Warehouse Photos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Main Trade Counter & Demo Wall', url: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=600&h=400&fit=crop' },
                { title: 'Inverter Testing Bay & SABS Lab', url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=600&h=400&fit=crop' },
                { title: 'Lithium Battery Warehouse Staging', url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop' },
                { title: 'Solar Panel Dispatch Loading Bay', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop' },
              ].map((photo, i) => (
                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.65rem', fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    {photo.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ⭐ CUSTOMER REVIEWS & TRUST */}
        {activeTab === 'reviews' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Verified Buyer Reviews
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Real reviews from trade contractors, installers, and residential clients.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A' }}>★ {merchant.googleRating || 4.8} / 5.0</div>
                <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>100% Verified Purchase Score</div>
              </div>
            </div>

            {/* Review Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: 'Kobus van der Merwe', org: 'Gauteng Solar Systems CC', rating: 5, date: '3 days ago', text: 'Collected 4x Deye 5kW inverters and 8x Dyness batteries. Stock was ready at the counter, SABS paperwork in order. Will definitely source here regularly.' },
                { name: 'Sipho Ndlovu', org: 'Midrand Electrical Contractors', rating: 5, date: '1 week ago', text: 'Fast WhatsApp confirmation. Delivered to our site within 4 hours. Excellent technical support on the inverter aux port wiring.' },
                { name: 'David Miller', org: 'Sandton Residential Client', rating: 5, date: '2 weeks ago', text: 'Great pricing compared to major hardware chains. Direct counter pickup was smooth and the warranty is registered with the importer.' },
              ].map((rev, i) => (
                <div key={i} style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{rev.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>({rev.org})</span>
                    </div>
                    <div style={{ color: '#F59E0B', fontSize: '0.85rem' }}>{'★'.repeat(rev.rating)}</div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.45, margin: '0.4rem 0 0.2rem 0' }}>
                    {rev.text}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{rev.date} · Verified Storefront Purchase</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: 💬 WHOLESALE RFQ & CONTACT */}
        {activeTab === 'rfq' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: '2rem' }}>
            {/* Wholesale RFQ Builder */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                Request Wholesale Quote (RFQ)
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
                Direct tier-1 pricing for solar installers, building contractors, and commercial developers.
              </p>

              {rfqSubmitted ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065F46', margin: '0 0 0.25rem 0' }}>RFQ Dispatched Directly to Store!</h3>
                  <p style={{ fontSize: '0.825rem', color: '#047857', margin: 0 }}>
                    Our sales engineers will contact you via WhatsApp/Phone within {passport.medianResponseMinutes} minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRfqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Your Name / Company *</label>
                    <input
                      type="text"
                      required
                      value={rfqForm.name}
                      onChange={(e) => setRfqForm({ ...rfqForm, name: e.target.value })}
                      placeholder="e.g. Pretoria Solar Installations CC"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Phone / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={rfqForm.phone}
                        onChange={(e) => setRfqForm({ ...rfqForm, phone: e.target.value })}
                        placeholder="082 123 4567"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                      <input
                        type="email"
                        value={rfqForm.email}
                        onChange={(e) => setRfqForm({ ...rfqForm, email: e.target.value })}
                        placeholder="procurement@company.co.za"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Items Required & Quantities *</label>
                    <textarea
                      required
                      rows={3}
                      value={rfqForm.items}
                      onChange={(e) => setRfqForm({ ...rfqForm, items: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.75rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}
                  >
                    🚀 Submit RFQ Direct to Store
                  </button>
                </form>
              )}
            </div>

            {/* Operating Hours & Physical Location */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                Store Location & Trading Hours
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                <strong>Address:</strong><br />
                📍 {merchant.addressText}
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#0F172A' }}>Operating Hours:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B' }}>
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
                  borderRadius: '6px',
                  padding: '0.65rem',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                }}
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

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
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: '420px',
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
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1rem',
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
            bottom: '24px',
            right: '24px',
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
                padding: '0.85rem 1.5rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
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
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                width: '340px',
                maxHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>Store Cart ({cart.length} items)</strong>
                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>R {item.price.toLocaleString('en-ZA')} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
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
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>💬 Complete Order via WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
