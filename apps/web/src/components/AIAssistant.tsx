'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import type { ProductVariant, Merchant, Offer } from '@shoppage/contracts';
import ProductCard from './ProductCard';
import MerchantCard from './MerchantCard';

interface ToolCall {
  tool: string;
  title: string;
  data: any;
}

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  products?: ProductVariant[];
  merchants?: Merchant[];
  offers?: Record<string, Offer[]>;
  toolCalls?: ToolCall[];
  calculationResult?: {
    batteryCapacityKwh: number;
    loadWatts: number;
    hours: number;
    formatted: string;
  };
}

const SUGGESTIONS = [
  '⚡ 5.12kWh battery with 450W load runtime?',
  '🍽️ Mitrend food packaging & catering supplies',
  '☀️ 5kW hybrid inverter under R20000',
  '🔋 Dyness vs Pylontech 48V battery',
  '🧱 PPC cement 50kg in Sandton',
  '📱 Samsung phone under 5k',
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: "Sawubona! I'm your Shoppage Agentic Shopping Assistant. Ask me anything — search 1M+ products, calculate load-shedding battery runtimes, check NRS 097 grid compliance, or find verified stock near your mall.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuery = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply,
          products: data.products,
          merchants: data.merchants,
          offers: data.offersByProduct,
          toolCalls: data.toolCalls,
          calculationResult: data.calculationResult,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry, I had trouble dispatching the agentic tool query. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: "Chat cleared. What product or calculation are you looking for across South Africa today?",
      },
    ]);
  };

  return (
    <>
      <button
        className="assistant-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI commerce assistant"
        title="Open Shoppage AI Agent"
      >
        ✨
      </button>

      {open && (
        <div className="assistant-panel" style={{ zIndex: 100, width: 440 }}>
          <div className="assistant-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🤖</span>
                <strong>Shoppage Agentic Shopper</strong>
                <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Tool-Calling</span>
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Live Grid Query · Solar Engine · WhatsApp RFQs</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={resetChat}
                style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: '0.2rem' }}
                title="Reset conversation"
              >
                Clear
              </button>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.1rem', cursor: 'pointer' }} aria-label="Close assistant">
                ✕
              </button>
            </div>
          </div>

          <div className="assistant-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'msg msg-user' : 'msg msg-bot'}>
                {/* Agent Tool Execution Badges */}
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.6rem' }}>
                    {m.toolCalls.map((tc, idx) => (
                      <div key={idx} style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>
                        {tc.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Calculation Chip */}
                {m.calculationResult && (
                  <div style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)', border: '1.5px solid #10B981', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>⚡ Verified Load-Shedding Duration:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#064E3B', margin: '0.15rem 0' }}>
                      {m.calculationResult.formatted}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                      {m.calculationResult.batteryCapacityKwh}kWh Capacity @ {m.calculationResult.loadWatts}W Continuous Draw
                    </div>
                  </div>
                )}

                <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{m.text}</p>

                {m.products && m.products.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', marginTop: '0.85rem' }}>
                    {m.products.slice(0, 2).map((p) => (
                      <ProductCard key={p.canonicalId} product={p} offers={m.offers?.[p.canonicalId] || []} />
                    ))}
                  </div>
                )}

                {m.merchants && m.merchants.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', marginTop: '0.85rem' }}>
                    {m.merchants.slice(0, 1).map((mer) => (
                      <MerchantCard key={mer.id} merchant={mer} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg msg-bot">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⚡</span>
                  Agent executing grid tool lookup & calculations…
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '0.5rem 0.85rem', display: 'flex', gap: '0.35rem', overflowX: 'auto', background: '#F8FAFC', borderTop: '1px solid var(--border)' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendQuery(s.replace(/^[^\w]+/g, ''))}
                style={{ padding: '0.25rem 0.6rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '9999px', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer', color: '#334155' }}
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={send} className="assistant-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Agent (e.g. 5kW inverter in Sandton or 5kWh backup hours)..."
              className="assistant-input"
              aria-label="Message"
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
