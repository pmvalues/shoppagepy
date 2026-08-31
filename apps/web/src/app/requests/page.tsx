'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SourcingRequest {
  id: string;
  title: string;
  category: string;
  metro: string;
  budgetZar?: number;
  urgency: string;
  timeAgo: string;
  responsesCount: number;
  buyerPhoneMasked: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<SourcingRequest[]>([
    {
      id: 'req_01',
      title: 'Deye 5kW Hybrid Inverter + 5.12kWh Dyness Battery for 3-bedroom house',
      category: 'Solar & Energy',
      metro: 'Johannesburg South / Soweto',
      budgetZar: 42000,
      urgency: 'Immediate (Today)',
      timeAgo: '12 minutes ago',
      responsesCount: 3,
      buyerPhoneMasked: '+27 82 ••• ••34',
    },
    {
      id: 'req_02',
      title: '50 Bags PPC Surebuild Cement 42.5N + Site Delivery to Waterfall',
      category: 'Building Materials',
      metro: 'Midrand, Gauteng',
      budgetZar: 5800,
      urgency: 'Within 48 Hours',
      timeAgo: '45 minutes ago',
      responsesCount: 6,
      buyerPhoneMasked: '+27 71 ••• ••89',
    },
    {
      id: 'req_03',
      title: 'Samsung Galaxy A16 128GB (Black) - Collect at Dragon City or Fordsburg',
      category: 'Tech & Phones',
      metro: 'Crown Mines, Johannesburg',
      budgetZar: 2900,
      urgency: 'Immediate (Today)',
      timeAgo: '2 hours ago',
      responsesCount: 4,
      buyerPhoneMasked: '+27 84 ••• ••12',
    },
    {
      id: 'req_04',
      title: '10x 550W Tier 1 Mono PV Solar Panels (JA Solar / Canadian Solar)',
      category: 'Solar & Energy',
      metro: 'Durban North / Umhlanga, KZN',
      budgetZar: 16000,
      urgency: 'This Week',
      timeAgo: '3 hours ago',
      responsesCount: 2,
      buyerPhoneMasked: '+27 73 ••• ••67',
    },
    {
      id: 'req_05',
      title: '500x Tamper-Proof Food Containers 500ml + Tasting Spoons for Event',
      category: 'Packaging & Catering',
      metro: 'Midrand / Sandton, Gauteng',
      budgetZar: 4500,
      urgency: 'Immediate (Today)',
      timeAgo: '15 minutes ago',
      responsesCount: 3,
      buyerPhoneMasked: '+27 83 ••• ••45',
    },
  ]);

  const [form, setForm] = useState({
    title: '',
    category: 'Solar & Energy',
    metro: '',
    budgetZar: '',
    urgency: 'Immediate (Today)',
    phone: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const newReq: SourcingRequest = {
      id: `req_${Date.now()}`,
      title: form.title,
      category: form.category,
      metro: form.metro || 'Gauteng',
      budgetZar: form.budgetZar ? parseInt(form.budgetZar, 10) : undefined,
      urgency: form.urgency,
      timeAgo: 'Just now',
      responsesCount: 0,
      buyerPhoneMasked: form.phone ? form.phone.replace(/(\d{3})\d{4}(\d{2})/, '$1 ••• ••$2') : '+27 82 ••• ••99',
    };

    setRequests([newReq, ...requests]);
    setSubmitted(true);
    setForm({
      title: '',
      category: 'Solar & Energy',
      metro: '',
      budgetZar: '',
      urgency: 'Immediate (Today)',
      phone: '',
    });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: '880px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>
          ⚡ Demand-First Sourcing Desk
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#0F172A' }}>
          Post a Specific Product Need (RFQ)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
          Can’t find exact local stock? Broadcast your requirement to verified South African suppliers. Receive instant quotes directly on WhatsApp with zero markup.
        </p>
      </div>

      {/* Request Submission Card */}
      <div className="card" style={{ marginBottom: '3rem', padding: '2rem', background: '#FFFFFF', border: '2px solid #3B82F6' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem', color: '#1E3A8A' }}>
          📝 Create New Buyer Sourcing Request
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Verified suppliers in your province will be alerted on WhatsApp to submit their lowest price.
        </p>

        {submitted && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', color: '#065F46', fontSize: '0.9rem' }}>
            ✓ <strong>Request Broadcasted!</strong> Local verified suppliers have been notified. Check your WhatsApp for quotes shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">What product or bill of quantities do you need? *</label>
            <textarea
              rows={3}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Need 1x Deye 8kW Hybrid Inverter + 10kWh battery ready for collection in Sandton or Midrand..."
              className="form-control"
              style={{ minHeight: '80px' }}
              required
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Industry Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-control"
              >
                <option value="Solar & Energy">☀️ Solar & Energy</option>
                <option value="Packaging & Catering">🍽️ Food Packaging & Catering</option>
                <option value="Tech & Phones">📱 Tech & Smartphones</option>
                <option value="Building Materials">🧱 Building & Hardware</option>
                <option value="Food & Groceries">🛒 Wholesale Food & FMCG</option>
                <option value="Health & Beauty">💊 Health & Pharmacy</option>
                <option value="Auto & Spares">🚗 Automotive & Spares</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Your Metro / City / Suburb *</label>
              <input
                type="text"
                value={form.metro}
                onChange={(e) => setForm({ ...form, metro: e.target.value })}
                placeholder="e.g. Johannesburg, Durban, Cape Town"
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Budget (ZAR Optional)</label>
              <input
                type="number"
                value={form.budgetZar}
                onChange={(e) => setForm({ ...form, budgetZar: e.target.value })}
                placeholder="e.g. 25000"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="form-control"
              >
                <option value="Immediate (Today)">⚡ Immediate (Today)</option>
                <option value="Within 48 Hours">⏱️ Within 48 Hours</option>
                <option value="This Week">📅 This Week</option>
                <option value="Price Exploration">🔍 Price Exploration</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Your WhatsApp Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+27 82 123 4567"
                className="form-control"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1rem' }}>
            🚀 Broadcast Sourcing Request to Local Merchants
          </button>
        </form>
      </div>

      {/* Live Public Requests Feed */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              📋 Live South African Sourcing Feed ({requests.length})
            </h2>
            <p className="section-desc">Active product needs posted by buyers across South Africa.</p>
          </div>
          <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>
            ● Live Stream Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((req) => (
            <div key={req.id} className="card" style={{ background: '#FFFFFF', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{req.category}</span>
                  <span className="badge badge-amber">{req.urgency}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>📍 {req.metro}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{req.timeAgo}</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.35rem 0', color: '#0F172A', lineHeight: 1.3 }}>
                {req.title}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Buyer: {req.buyerPhoneMasked} · Responses: <strong style={{ color: '#10B981' }}>{req.responsesCount} verified quotes</strong>
                  </span>
                  {req.budgetZar && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                      Target Budget: R {req.budgetZar.toLocaleString()}
                    </div>
                  )}
                </div>

                <a
                  href={`https://wa.me/27829876543?text=${encodeURIComponent(`Hi, I saw your Shoppage request: "${req.title}". I am a verified supplier and have stock available.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                >
                  💬 Quote Buyer on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
