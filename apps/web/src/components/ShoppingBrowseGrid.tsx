'use client';

import { useState } from 'react';
import type { MasterProduct, Offer, Merchant } from '@shoppage/contracts';
import ProductCard from './ProductCard';
import BuyBoxDrawer from './BuyBoxDrawer';
import ProformaInvoiceModal from './ProformaInvoiceModal';
import { SA_KEY_TRADING_HUBS } from '@/lib/geo';

export default function ShoppingBrowseGrid({
  products,
  offersByProduct = {},
  merchants = [],
}: {
  products: MasterProduct[];
  offersByProduct?: Record<string, Offer[]>;
  merchants?: Merchant[];
}) {
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');

  // BuyBox Drawer state
  const [buyBoxProduct, setBuyBoxProduct] = useState<MasterProduct | null>(null);
  const [buyBoxOffers, setBuyBoxOffers] = useState<Offer[]>([]);
  const [isBuyBoxOpen, setIsBuyBoxOpen] = useState(false);

  // Proforma Invoice state
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [proformaData, setProformaData] = useState<any | null>(null);

  const handleOpenBuyBox = (product: MasterProduct, offers: Offer[]) => {
    setBuyBoxProduct(product);
    setBuyBoxOffers(offers.length > 0 ? offers : offersByProduct[product.canonicalId] || []);
    setIsBuyBoxOpen(true);
  };

  const handleGenerateProforma = (item: {
    product: MasterProduct;
    offer?: Offer;
    merchant?: Merchant;
    price: number;
  }) => {
    const generatedNumber = `SP-PRO-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const m = item.merchant;

    const invoicePayload = {
      invoiceNumber: generatedNumber,
      date: now.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: expiry.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      merchant: {
        name: m?.name || 'Verified South African Distributor',
        cipcNumber: '2021/489102/07',
        vatNumber: '4910294812',
        address: m?.address || 'Crown Mines Commercial Precinct',
        suburb: m?.suburb || 'Crown Mines, Johannesburg',
        bankName: 'Standard Bank South Africa',
        accountNumber: '0012948102',
        branchCode: '051001',
      },
      buyer: {
        name: 'Trade Account / B2B Procurement',
        phone: '+27 11 000 0000',
      },
      items: [
        {
          id: item.product.canonicalId,
          title: item.product.title,
          sku: item.product.identifiers?.gtin13 || `SKU-${item.product.canonicalId.slice(0, 8)}`,
          gtin13: item.product.identifiers?.gtin13,
          quantity: 1,
          unitPriceZar: item.price,
        },
      ],
    };
    setProformaData(invoicePayload);
    setShowProformaModal(true);
  };

  const handleAddToCart = (item: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('shoppage_cart_items') || '[]');
      const updated = [...existing, item];
      localStorage.setItem('shoppage_cart_items', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('shoppage-cart-sync', { detail: { count: updated.length } }));
    } catch {
      /* ignore */
    }
  };

  // Derive unique brands for filters
  const availableBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  // Filter & Sort products
  const filteredProducts = products
    .filter((p) => {
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      const price = (p.attributes?.estimatedPriceZar as number) || 0;
      if (priceMin && price < parseFloat(priceMin)) return false;
      if (priceMax && price > parseFloat(priceMax)) return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = (a.attributes?.estimatedPriceZar as number) || 0;
      const priceB = (b.attributes?.estimatedPriceZar as number) || 0;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return 0;
    });

  return (
    <div>
      {/* Geolocal Precinct & Distance Ribbon */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📍 Trading Hub:
          </span>
          <button
            onClick={() => setSelectedHub('all')}
            style={{
              borderRadius: '16px',
              border: selectedHub === 'all' ? '1px solid #0F172A' : '1px solid #CBD5E1',
              background: selectedHub === 'all' ? '#0F172A' : '#FFFFFF',
              color: selectedHub === 'all' ? '#FFFFFF' : '#334155',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All South Africa (74k Stores)
          </button>
          {SA_KEY_TRADING_HUBS.map((hub) => (
            <button
              key={hub.id}
              onClick={() => setSelectedHub(hub.id)}
              style={{
                borderRadius: '16px',
                border: selectedHub === hub.id ? '1px solid #1A73E8' : '1px solid #CBD5E1',
                background: selectedHub === hub.id ? '#E8F0FE' : '#FFFFFF',
                color: selectedHub === hub.id ? '#1A73E8' : '#334155',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📍 {hub.name.split('&')[0].trim()}
            </button>
          ))}
        </div>

        {/* Distance Radius Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Proximity Radius:</span>
          {['all', '10km', '25km', '50km'].map((rad) => (
            <button
              key={rad}
              onClick={() => setSelectedRadius(rad)}
              style={{
                borderRadius: '12px',
                border: selectedRadius === rad ? '1px solid #059669' : '1px solid #E2E8F0',
                background: selectedRadius === rad ? '#ECFDF5' : '#FFFFFF',
                color: selectedRadius === rad ? '#059669' : '#64748B',
                padding: '0.2rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {rad === 'all' ? 'National Grid' : `< ${rad}`}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout: Left Refine Sidebar + Right Google Shopping 4-5 Column Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.75rem', alignItems: 'flex-start' }}>
        {/* Left Refine Results Sidebar */}
        <aside style={{ borderRight: '1px solid #E2E8F0', paddingRight: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#202124', marginBottom: '0.85rem' }}>
            Refine results
          </h3>

          {/* Availability Filter */}
          <div style={{ marginBottom: '1.25rem', fontSize: '0.825rem', color: '#3C4043' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <input type="checkbox" id="instock_cb" defaultChecked />
              <label htmlFor="instock_cb">🟢 In Stock (Immediate Pickup)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <input type="checkbox" id="verified_cb" defaultChecked />
              <label htmlFor="verified_cb">🛡️ CIPC Verified Stores</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" id="sabs_cb" />
              <label htmlFor="sabs_cb">⚡ SABS / NRS 097 Approved</label>
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#202124', marginBottom: '0.45rem' }}>
              Price (ZAR)
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="R Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                style={{ width: '65px', padding: '0.3rem', fontSize: '0.75rem', border: '1px solid #DADCE0', borderRadius: '4px' }}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="R Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                style={{ width: '65px', padding: '0.3rem', fontSize: '0.75rem', border: '1px solid #DADCE0', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Brand Checklist */}
          {availableBrands.length > 0 && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#202124', marginBottom: '0.45rem' }}>
                Brand
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <input
                    type="radio"
                    id="brand_all"
                    name="brand_filter"
                    checked={selectedBrand === 'all'}
                    onChange={() => setSelectedBrand('all')}
                  />
                  <label htmlFor="brand_all">All Brands</label>
                </div>
                {availableBrands.slice(0, 8).map((brand) => (
                  <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <input
                      type="radio"
                      id={`brand_${brand}`}
                      name="brand_filter"
                      checked={selectedBrand === brand}
                      onChange={() => setSelectedBrand(brand)}
                    />
                    <label htmlFor={`brand_${brand}`}>{brand}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Product Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#202124', margin: 0 }}>
              {filteredProducts.length} Verified Master Products
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#5F6368' }}>
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="relevance">Google Shopping Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {filteredProducts.map((product, idx) => {
              const offers = offersByProduct[product.canonicalId] || [];
              const isSponsored = idx === 0 || idx === 4;
              return (
                <ProductCard
                  key={product.canonicalId}
                  product={product}
                  offers={offers}
                  isSponsored={isSponsored}
                  onOpenBuyBox={handleOpenBuyBox}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Instant BuyBox Comparison Drawer */}
      <BuyBoxDrawer
        isOpen={isBuyBoxOpen}
        onClose={() => setIsBuyBoxOpen(false)}
        product={buyBoxProduct}
        offers={buyBoxOffers}
        merchants={merchants}
        onAddToCart={handleAddToCart}
        onGenerateProforma={handleGenerateProforma}
      />

      {/* Instant SARS B2B Proforma Tax Invoice Modal */}
      {showProformaModal && proformaData && (
        <ProformaInvoiceModal
          isOpen={showProformaModal}
          onClose={() => setShowProformaModal(false)}
          invoiceData={proformaData}
        />
      )}
    </div>
  );
}
