'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SourcingRequest {
  id: string;
  title: string;
  category: string;
  metro: string;
  province: string;
  quantityText?: string;
  fulfillmentType: 'Site Delivery' | 'Trade Counter Pickup' | 'Courier Dispatch';
  budgetZar?: number;
  urgency: string;
  timeAgo: string;
  responsesCount: number;
  buyerContactMasked: string;
  preferredChannel: 'Direct Call' | 'Email PDF Quote' | 'WhatsApp / Message' | 'Portal';
  verifiedCompliance?: boolean;
}

const INITIAL_REQUESTS: SourcingRequest[] = [
  {
    id: 'req_01',
    title: '1x Deye 8kW Hybrid Inverter + 2x Dyness 5.12kWh BX51100 Lithium Batteries',
    category: 'Solar & Renewable Energy',
    metro: 'Sandton & Midrand',
    province: 'Gauteng',
    quantityText: '3 Items (Full Kit)',
    fulfillmentType: 'Site Delivery',
    budgetZar: 58000,
    urgency: 'Immediate (Today)',
    timeAgo: '8 minutes ago',
    responsesCount: 4,
    buyerContactMasked: '+27 11 ••• ••00',
    preferredChannel: 'Email PDF Quote',
    verifiedCompliance: true,
  },
  {
    id: 'req_02',
    title: '80x 550W Tier-1 Mono PERC Solar Panels (JA Solar or Canadian Solar)',
    category: 'Solar & Renewable Energy',
    metro: 'Paarden Eiland / Tygerberg',
    province: 'Western Cape',
    quantityText: '80 Panels (2 Pallets)',
    fulfillmentType: 'Trade Counter Pickup',
    budgetZar: 140000,
    urgency: 'Within 48 Hours',
    timeAgo: '24 minutes ago',
    responsesCount: 6,
    buyerContactMasked: '+27 21 ••• ••00',
    preferredChannel: 'Direct Call',
    verifiedCompliance: true,
  },
  {
    id: 'req_03',
    title: '5,000x 500ml Tamper-Evident Polypropylene Food Tubs with Snap Lids',
    category: 'Packaging & Catering',
    metro: 'Halfway Gardens / Midrand',
    province: 'Gauteng',
    quantityText: '20 Cartons (5,000 Pcs)',
    fulfillmentType: 'Site Delivery',
    budgetZar: 3700,
    urgency: 'Immediate (Today)',
    timeAgo: '42 minutes ago',
    responsesCount: 3,
    buyerContactMasked: '+27 10 ••• ••70',
    preferredChannel: 'Email PDF Quote',
    verifiedCompliance: true,
  },
  {
    id: 'req_04',
    title: '120 Bags PPC Surebuild Cement 42.5N + 6m³ River Sand',
    category: 'Building Materials & Hardware',
    metro: 'Durban North / Umhlanga',
    province: 'KwaZulu-Natal',
    quantityText: '120 Bags + 6m³ Bulk',
    fulfillmentType: 'Site Delivery',
    budgetZar: 14200,
    urgency: 'This Week',
    timeAgo: '2 hours ago',
    responsesCount: 5,
    buyerContactMasked: '+27 31 ••• ••00',
    preferredChannel: 'Direct Call',
    verifiedCompliance: true,
  },
  {
    id: 'req_05',
    title: 'Samsung Galaxy A16 128GB (Black, Dual SIM) - Tax Invoice Required',
    category: 'Tech & Electronics',
    metro: 'Crown Mines / Fordsburg',
    province: 'Gauteng',
    quantityText: '5 Units',
    fulfillmentType: 'Trade Counter Pickup',
    budgetZar: 14500,
    urgency: 'Immediate (Today)',
    timeAgo: '3 hours ago',
    responsesCount: 7,
    buyerContactMasked: '+27 11 ••• ••52',
    preferredChannel: 'WhatsApp / Message',
    verifiedCompliance: false,
  },
];

function RequestsContent() {
  const searchParams = useSearchParams();
  const prefillSku = searchParams.get('prefillSku') || '';
  const prefillTitle = searchParams.get('prefillTitle') || '';
  const prefillBrand = searchParams.get('prefillBrand') || '';
  const prefillBudget = searchParams.get('prefillBudget') || '';

  const [requests, setRequests] = useState<SourcingRequest[]>(INITIAL_REQUESTS);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState<SourcingRequest | null>(null);
  const [quotePriceInput, setQuotePriceInput] = useState<string>('');
  const [quoteNotesInput, setQuoteNotesInput] = useState<string>('');
  const [quoteSuccessId, setQuoteSuccessId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: prefillTitle ? `${prefillBrand ? `${prefillBrand} ` : ''}${prefillTitle}` : '',
    category: prefillTitle.toLowerCase().includes('inverter') || prefillTitle.toLowerCase().includes('solar') || prefillTitle.toLowerCase().includes('battery')
      ? 'Solar & Renewable Energy'
      : prefillTitle.toLowerCase().includes('tub') || prefillTitle.toLowerCase().includes('mitrend') || prefillTitle.toLowerCase().includes('packaging')
      ? 'Packaging & Catering'
      : 'Solar & Renewable Energy',
    quantityText: '1 Unit',
    fulfillmentType: 'Site Delivery' as 'Site Delivery' | 'Trade Counter Pickup' | 'Courier Dispatch',
    province: 'Gauteng',
    metro: '',
    budgetZar: prefillBudget || '',
    urgency: 'Immediate (Today)',
    preferredChannel: 'Email PDF Quote' as 'Direct Call' | 'Email PDF Quote' | 'WhatsApp / Message' | 'Portal',
    buyerName: '',
    buyerContact: '',
    requiresCoCOrSABS: true,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.buyerContact.trim()) return;

    const newReq: SourcingRequest = {
      id: `req_${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      metro: form.metro || `${form.province} Metro`,
      province: form.province,
      quantityText: form.quantityText || 'Custom Volume',
      fulfillmentType: form.fulfillmentType,
      budgetZar: form.budgetZar ? parseInt(form.budgetZar, 10) : undefined,
      urgency: form.urgency,
      timeAgo: 'Just now',
      responsesCount: 0,
      buyerContactMasked: form.buyerContact.includes('@')
        ? form.buyerContact.replace(/^(.{2})(.*)(@.*)$/, '$1•••$3')
        : form.buyerContact.replace(/(\d{3})\d{4}(\d{2})/, '$1 ••• ••$2'),
      preferredChannel: form.preferredChannel,
      verifiedCompliance: form.requiresCoCOrSABS,
    };

    setRequests([newReq, ...requests]);
    setSubmitted(true);
    setForm({
      title: '',
      category: 'Solar & Renewable Energy',
      quantityText: '1 Unit',
      fulfillmentType: 'Site Delivery',
      province: 'Gauteng',
      metro: '',
      budgetZar: '',
      urgency: 'Immediate (Today)',
      preferredChannel: 'Email PDF Quote',
      buyerName: '',
      buyerContact: '',
      requiresCoCOrSABS: true,
    });
    setTimeout(() => setSubmitted(false), 6000);
  };

  const handleSendSupplierQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForQuote) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequestForQuote.id
          ? { ...r, responsesCount: r.responsesCount + 1 }
          : r
      )
    );

    setQuoteSuccessId(selectedRequestForQuote.id);
    setSelectedRequestForQuote(null);
    setQuotePriceInput('');
    setQuoteNotesInput('');
    setTimeout(() => setQuoteSuccessId(null), 5000);
  };

  const filteredRequests = activeCategoryFilter === 'all'
    ? requests
    : requests.filter((r) => r.category.toLowerCase().includes(activeCategoryFilter.toLowerCase()));

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '1040px' }}>
      
      {/* Platform Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.35rem 0.85rem', borderRadius: '9999px', color: '#065F46', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          National B2B &amp; Trade Procurement Desk · 0% Commission
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0.2rem 0 0.5rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Post a Specific Product Need (RFQ)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
          Broadcast your exact bill of quantities to 3,296+ verified South African manufacturers and wholesale stockists. Receive direct, competitive trade quotations within minutes.
        </p>

        {/* Live Network Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.75rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>142 Stockists</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Online in Gauteng &amp; WC</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>14 Mins</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Median Quote Response Time</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>0% Take-Rate</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Direct Trade Counter Pricing</div>
          </div>
        </div>
      </div>

      {/* Sourcing Submission Card */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              📝 Submit Contractor or Enterprise RFQ
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Your request is routed directly to accredited distributors with ready stock in your province.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
            POPIA Compliant · Buyer Privacy Protected
          </span>
        </div>

        {submitted && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#065F46', fontSize: '0.95rem' }}>
            ✓ <strong>Request Broadcasted Successfully!</strong> Verified South African stockists have been notified. Expect itemized quotes via your preferred response channel shortly.
          </div>
        )}

        {quoteSuccessId && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#1E40AF', fontSize: '0.9rem' }}>
            ✓ <strong>Supplier Quote Submitted!</strong> The buyer has been notified with your trade pricing and availability notes.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Product need & quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Product Title, Model or Bill of Quantities *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU) or 500x 500ml Food Tubs"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Volume / Quantity *</label>
              <input
                type="text"
                value={form.quantityText}
                onChange={(e) => setForm({ ...form, quantityText: e.target.value })}
                placeholder="e.g. 5 Units, 2 Pallets, 500 Cartons"
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Industry Category & Province */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Industry Sector</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-control"
              >
                <option value="Solar & Renewable Energy">☀️ Solar &amp; Renewable Energy</option>
                <option value="Packaging & Catering">🍽️ Packaging &amp; Catering Supplies</option>
                <option value="Building Materials & Hardware">🧱 Building Materials &amp; Hardware</option>
                <option value="Tech & Electronics">📱 Tech &amp; Smart Devices</option>
                <option value="Automotive & Industrial Spares">🚗 Automotive &amp; Spares</option>
                <option value="Wholesale Food & FMCG">🛒 Wholesale Food &amp; FMCG</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Target Province</label>
              <select
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="form-control"
              >
                <option value="Gauteng">Gauteng (JHB / PTA / Midrand)</option>
                <option value="Western Cape">Western Cape (Cape Town / Paarden Eiland)</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal (Durban / Umhlanga)</option>
                <option value="Eastern Cape">Eastern Cape (Gqeberha / East London)</option>
                <option value="Free State">Free State (Bloemfontein)</option>
                <option value="Mpumalanga">Mpumalanga (Mbombela)</option>
                <option value="Limpopo">Limpopo (Polokwane)</option>
                <option value="North West">North West (Rustenburg)</option>
                <option value="Northern Cape">Northern Cape (Kimberley)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Specific Suburb / Delivery Site</label>
              <input
                type="text"
                value={form.metro}
                onChange={(e) => setForm({ ...form, metro: e.target.value })}
                placeholder="e.g. Crown Mines, Sandton, Bellville"
                className="form-control"
              />
            </div>
          </div>

          {/* Sourcing Details: Budget, Fulfillment, Urgency, Preferred Channel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Target Budget (ZAR Excl. VAT)</label>
              <input
                type="number"
                value={form.budgetZar}
                onChange={(e) => setForm({ ...form, budgetZar: e.target.value })}
                placeholder="e.g. 45000"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Fulfillment Preference</label>
              <select
                value={form.fulfillmentType}
                onChange={(e) => setForm({ ...form, fulfillmentType: e.target.value as any })}
                className="form-control"
              >
                <option value="Site Delivery">🚚 Direct Site Delivery</option>
                <option value="Trade Counter Pickup">🏪 Trade Counter Pickup</option>
                <option value="Courier Dispatch">📦 Courier Express Dispatch</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Urgency Timeline</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="form-control"
              >
                <option value="Immediate (Today)">⚡ Immediate (Today)</option>
                <option value="Within 48 Hours">⏱️ Within 48 Hours</option>
                <option value="This Week">📅 This Week</option>
                <option value="Project Planning">📐 Project Planning / Tender</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Preferred Quote Channel</label>
              <select
                value={form.preferredChannel}
                onChange={(e) => setForm({ ...form, preferredChannel: e.target.value as any })}
                className="form-control"
              >
                <option value="Email PDF Quote">📧 Official Email PDF Quote</option>
                <option value="Direct Call">📞 Direct Phone Call</option>
                <option value="WhatsApp / Message">💬 WhatsApp / Direct Message</option>
                <option value="Portal">🖥️ In-App Shoppage Portal</option>
              </select>
            </div>
          </div>

          {/* Buyer Contact Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Your Name or Company *</label>
              <input
                type="text"
                value={form.buyerName}
                onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                placeholder="e.g. Apex Electrical Contracting / Sarah Ndlovu"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Your Direct Phone or Email *</label>
              <input
                type="text"
                value={form.buyerContact}
                onChange={(e) => setForm({ ...form, buyerContact: e.target.value })}
                placeholder="e.g. 011 830 1100 or procurement@apexelectrical.co.za"
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Technical Compliance Check */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="complianceCheck"
              checked={form.requiresCoCOrSABS}
              onChange={(e) => setForm({ ...form, requiresCoCOrSABS: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="complianceCheck" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Require suppliers to provide SABS / NRS 097 or CoC compliance documentation with quote.
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.85rem', fontSize: '1.05rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            🚀 Broadcast Request to Verified National Stockists
          </button>
        </form>
      </div>

      {/* Live Sourcing Stream & Category Tabs */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              📋 Live National Procurement Feed ({requests.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Real-time contractor procurement requests active across South African commercial zones.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'Solar', 'Packaging', 'Building', 'Tech'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  background: activeCategoryFilter === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: activeCategoryFilter === cat ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'All Sectors' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Feed Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{req.category}</span>
                  <span className="badge badge-amber">{req.urgency}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>📍 {req.metro}, {req.province}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🚚 {req.fulfillmentType}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{req.timeAgo}</span>
              </div>

              {/* Title & Quantity */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                  {req.title}
                </h3>
                {req.quantityText && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Requested Volume: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{req.quantityText}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions & Quote Channel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Buyer: <strong style={{ color: 'var(--text-primary)' }}>{req.buyerContactMasked}</strong> · Response: <strong style={{ color: 'var(--emerald)' }}>{req.responsesCount} verified quotes</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Preferred Channel: <strong>{req.preferredChannel}</strong>
                    </span>
                    {req.budgetZar && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                        · Target: R {req.budgetZar.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForQuote(req)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 800 }}
                  >
                    💼 Submit Supplier Quote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supplier Instant Quote Modal */}
      {selectedRequestForQuote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', maxWidth: '540px', width: '100%', padding: '1.75rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSelectedRequestForQuote(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              💼 Submit Verified Trade Quote
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              RFQ: <strong>{selectedRequestForQuote.title}</strong> ({selectedRequestForQuote.metro})
            </p>

            <form onSubmit={handleSendSupplierQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Your Unit or Total Trade Price (ZAR Excl. VAT) *</label>
                <input
                  type="number"
                  value={quotePriceInput}
                  onChange={(e) => setQuotePriceInput(e.target.value)}
                  placeholder="e.g. 14500"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Stock Availability &amp; Collection/Delivery Terms *</label>
                <textarea
                  rows={3}
                  value={quoteNotesInput}
                  onChange={(e) => setQuoteNotesInput(e.target.value)}
                  placeholder="e.g. 14 Units available in Crown Mines. Same-day collection or 24h site delivery. CoC test certificates included."
                  className="form-control"
                  required
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Your quote will be dispatched instantly to the buyer via <strong>{selectedRequestForQuote.preferredChannel}</strong>.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForQuote(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.5rem 1rem', fontWeight: 800 }}
                >
                  Confirm &amp; Send Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading National Sourcing Desk...</div>}>
      <RequestsContent />
    </Suspense>
  );
}
