'use client';

import { useEffect, useState } from 'react';

interface ReferralLead {
  id: string;
  merchantId: string;
  merchantName?: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  productSummary: string;
  intentAction: string;
  source: string;
  status: 'new' | 'responded' | 'resolved' | 'closed' | 'lost';
  createdAt: string;
  updatedAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  responded: 'Responded',
  resolved: 'Resolved',
  closed: 'Closed',
  lost: 'Lost',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#2563EB',
  responded: '#D97706',
  resolved: '#059669',
  closed: '#64748B',
  lost: '#DC2626',
};

export default function ReferralLeadsInbox({ merchantId }: { merchantId: string }) {
  const [leads, setLeads] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/merchants/leads?merchantId=' + encodeURIComponent(merchantId), {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.leads) {
        setLeads(data.leads);
      } else {
        setError(data.error || 'Could not load leads');
      }
    } catch {
      setError('Could not load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  const setStatus = async (id: string, status: ReferralLead['status']) => {
    try {
      await fetch('/api/merchants/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      // ignore transient failures; row refresh will reconcile
    }
  };

  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#2C3338' }}>
            Referral Leads Inbox
          </h3>
          <div style={{ fontSize: '0.78rem', color: '#646970', marginTop: '0.15rem' }}>
            Real buyer intent routed to your store. Shoppage refers — you own the sale.
          </div>
        </div>
        {newCount > 0 && (
          <span style={{ background: '#ECFDF5', color: '#059669', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 800 }}>
            {newCount} new
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#646970', fontSize: '0.85rem' }}>Loading leads...</div>
      ) : error ? (
        <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#B91C1C', fontSize: '0.85rem' }}>{error}</div>
      ) : leads.length === 0 ? (
        <div style={{ padding: '1.25rem', textAlign: 'center', color: '#646970', fontSize: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
          No referral leads yet. When buyers start WhatsApp conversations, RFQs or direction requests from Shoppage, they appear here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {leads.slice(0, 20).map((lead) => (
            <div key={lead.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2C3338' }}>{lead.buyerName}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{timeAgo(lead.createdAt)}</span>
                  <span style={{ fontSize: '0.7rem', background: '#F1F5F9', borderRadius: '4px', padding: '0.1rem 0.4rem', color: '#475569' }}>{lead.intentAction.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.4 }}>{lead.productSummary}</div>
                {lead.buyerPhone && <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>📱 {lead.buyerPhone}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: STATUS_COLOR[lead.status] || '#475569' }}>
                  {STATUS_LABEL[lead.status] || lead.status}
                </span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    onClick={() => setStatus(lead.id, 'responded')}
                    disabled={lead.status === 'responded' || lead.status === 'resolved'}
                    style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #D97706', color: '#D97706', background: '#FFFBEB', cursor: lead.status === 'new' ? 'pointer' : 'not-allowed' }}
                  >
                    Responded
                  </button>
                  <button
                    onClick={() => setStatus(lead.id, 'resolved')}
                    disabled={lead.status === 'resolved'}
                    style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #059669', color: '#059669', background: '#ECFDF5', cursor: lead.status === 'resolved' ? 'not-allowed' : 'pointer' }}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
