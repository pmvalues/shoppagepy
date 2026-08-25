'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_MARKETS } from '@shoppage/kernel';

export default function MerchantClaimWizardPage({
  searchParams,
}: {
  searchParams?: { variantId?: string; title?: string; source?: string };
}) {
  const initialVariantId = searchParams?.variantId || '';
  const initialTitle = searchParams?.title || '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'solar_energy',
    whatsappPhone: '+27 ',
    email: '',
    marketId: 'mkt_sandton_city',
    stallNumber: '',
    streetAddress: 'Sandton City Shopping Centre, 83 Rivonia Rd, Sandhurst, Sandton',
    selectedProductId: initialVariantId || 'var_deye_5kw_hybrid',
    customTitle: initialTitle,
    priceZar: '18500',
    stockQuantity: '10',
    condition: 'new',
    warrantyYears: '5',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedProduct = SA_CANONICAL_PRODUCTS.find((p) => p.canonicalId === formData.selectedProductId) || SA_CANONICAL_PRODUCTS[0];

  const handleNext = () => setStep((s) => Math.min(s + 1, 4) as any);
  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as any);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setStep(4);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: '840px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
          ⚡ 60-Second Onboarding Wizard
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0', color: '#0F172A' }}>
          List Your Store & Inventory
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Join 3.1M+ verified suppliers across 3,296 shopping centres. 0% commission, direct WhatsApp leads, and automated Google Shopping feeds.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: '#E2E8F0', zIndex: 1 }} />
        {[
          { num: 1, title: 'Store Details' },
          { num: 2, title: 'Physical Location' },
          { num: 3, title: 'Stock & Pricing' },
          { num: 4, title: 'Live Verification' },
        ].map((s) => {
          const isActive = step >= s.num;
          return (
            <div key={s.num} style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isActive ? '#2563EB' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  border: `2px solid ${isActive ? '#2563EB' : '#CBD5E1'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  margin: '0 auto 0.4rem auto',
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? '#1E293B' : '#94A3B8' }}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: BUSINESS DETAILS */}
      {step === 1 && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 1: Your Business & WhatsApp Info</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Where should customer inquiries be sent? All leads are dispatched directly to your WhatsApp with zero middlemen.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Registered Business or Trade Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Apex Solar Tech, Sandton Cellular, Mama's Hardware"
                className="form-control"
                required
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-control"
                >
                  <option value="solar_energy">☀️ Solar Inverters & Batteries</option>
                  <option value="smartphones">📱 Tech & Electronics</option>
                  <option value="hardware">🧱 Building & Hardware Supplies</option>
                  <option value="groceries">🛒 Wholesale Food & FMCG</option>
                  <option value="pharmacy">💊 Health & Beauty</option>
                  <option value="automotive">🚗 Automotive & Spares</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Number for Leads *</label>
                <input
                  type="tel"
                  value={formData.whatsappPhone}
                  onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Official Email Address (for reports & Google sync)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@yourstore.co.za"
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.businessName.trim()}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.75rem' }}
              >
                Next: Physical Location &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PHYSICAL LOCATION & MALL */}
      {step === 2 && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 2: Store Location & Shopping Centre</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Map your physical shop to Google Maps and Shoppage&apos;s 3,296 shopping centre graph.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Shopping Centre / Mall (Optional)</label>
                <select
                  value={formData.marketId}
                  onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
                  className="form-control"
                >
                  <option value="">-- Standalone High Street / Strip --</option>
                  {SA_FLAGSHIP_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.metro})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Stall / Unit Number</label>
                <input
                  type="text"
                  value={formData.stallNumber}
                  onChange={(e) => setFormData({ ...formData, stallNumber: e.target.value })}
                  placeholder="e.g. Shop 42, Level 2, Stall #B-18"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Street Address & Suburb *</label>
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                placeholder="e.g. 83 Rivonia Rd, Sandhurst, Sandton, Johannesburg"
                className="form-control"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" onClick={handleBack} className="btn btn-outline">
                &larr; Back
              </button>
              <button type="button" onClick={handleNext} className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
                Next: Stock & Pricing &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: STOCK & PRICING */}
      {step === 3 && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 3: Select Product & Set Price</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Attach your store as a verified supplier to an existing Master Product or create a new SKU.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Select Master Product SKU *</label>
              <select
                value={formData.selectedProductId}
                onChange={(e) => setFormData({ ...formData, selectedProductId: e.target.value })}
                className="form-control"
              >
                {SA_CANONICAL_PRODUCTS.map((p) => (
                  <option key={p.canonicalId} value={p.canonicalId}>
                    {p.brand} - {p.title} (GTIN: {p.identifiers.gtin13 || p.identifiers.mpn})
                  </option>
                ))}
              </select>
            </div>

            <div className="card" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 700 }}>Selected Master Product:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A', margin: '0.25rem 0' }}>
                {selectedProduct.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Brand: <strong>{selectedProduct.brand}</strong> · SABS / NRS 097 Grid Compliant
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Selling Price (ZAR) *</label>
                <input
                  type="number"
                  value={formData.priceZar}
                  onChange={(e) => setFormData({ ...formData, priceZar: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available Units *</label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warranty (Years)</label>
                <input
                  type="number"
                  value={formData.warrantyYears}
                  onChange={(e) => setFormData({ ...formData, warrantyYears: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" onClick={handleBack} className="btn btn-outline">
                &larr; Back
              </button>
              <button type="submit" className="btn btn-whatsapp" style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }}>
                🚀 Publish Live Offer & Connect Store
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: SUCCESS & LIVE CONFIRMATION */}
      {step === 4 && isSubmitted && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: '#FFFFFF' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #34D399', color: '#059669', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            ✓
          </div>

          <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
            Live on South Africa Commercial Grid
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#0F172A' }}>
            Congratulations, {formData.businessName || 'Your Store'} is Live!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
            Your confirmed offer for <strong>{selectedProduct.title}</strong> at <strong>R {parseInt(formData.priceZar || '0').toLocaleString()}</strong> has been published.
          </p>

          <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', maxWidth: '500px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.4rem' }}>Synchronized Across Network:</div>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>✓ <strong>Product Detail Page:</strong> Listed as Verified Confirmed Supplier</div>
              <div>✓ <strong>Direct WhatsApp:</strong> Connected to {formData.whatsappPhone}</div>
              <div>✓ <strong>Google Merchant Center:</strong> XML product feed live</div>
              <div>✓ <strong>Local Mall Roster:</strong> Mapped to {formData.stallNumber || 'Main Trade Concourse'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={`/p/${selectedProduct.canonicalId}`} className="btn btn-primary">
              View Product Listing &rarr;
            </Link>
            <Link href="/merchant/dashboard" className="btn btn-outline">
              Open Merchant Centre Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
