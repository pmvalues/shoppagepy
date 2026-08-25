'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import type { ProductVariant, Merchant, Offer } from '@shoppage/contracts';
import ProductCard from './ProductCard';
import MerchantCard from './MerchantCard';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  products?: ProductVariant[];
  merchants?: Merchant[];
  offers?: Record<string, Offer[]>;
}

const SUGGESTIONS = [
  '⚡ 5kW inverter under R20000',
  '🔋 Dyness 5.12kWh in Sandton',
  '⚖️ Compare Deye vs Sunsynk',
  '🧱 PPC cement 50kg pallet price',
  '📱 Samsung phone under 5k',
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: "Sawubona! I'm your Shoppage AI Commerce Assistant. I can check 1M+ master products, search 3.1M South African stores, compare prices, or find local stock — e.g. \"5kW inverter under R20000\".",
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
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry, I had trouble reaching the intelligence service. Please try again.' },
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
        text: "Chat cleared. What product or supplier are you looking for across South Africa today?",
      },
    ]);
  };

  return (
    <>
      <button
        className="assistant-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI commerce assistant"
        title="Open Shoppage AI Assistant"
      >
        ✨
      </button>

      {open && (
        <div className="assistant-panel" style={{ zIndex: 100 }}>
          <div className="assistant-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1rem' }}>🤖</span>
                <strong>Shoppage AI</strong>
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Commerce intelligence & local sourcing</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={resetChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  padding: '0.2rem',
                }}
                title="Reset conversation"
              >
                Clear
              </button>
              <button onClick={() => setOpen(false)} className="assistant-close" aria-label="Close assistant">
                ✕
              </button>
            </div>
          </div>

          <div className="assistant-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'msg msg-user' : 'msg msg-bot'}>
                <p style={{ margin: 0, lineHeight: 1.45 }}>{m.text}</p>
                {m.products && m.products.length > 0 && (
                  <div className="msg-cards" style={{ marginTop: '0.75rem' }}>
                    {m.products.slice(0, 3).map((p) => (
                      <ProductCard key={p.canonicalId} product={p} offers={m.offers?.[p.canonicalId] || []} />
                    ))}
                  </div>
                )}
                {m.merchants && m.merchants.length > 0 && (
                  <div className="msg-cards" style={{ marginTop: '0.75rem' }}>
                    {m.merchants.slice(0, 2).map((mer) => (
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
                  Searching 1M+ products & 3.1M stores…
                </div>
              </div>
            )}
          </div>

          <div className="assistant-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendQuery(s.replace(/^[^\w]+/g, ''))}
                className="chip"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={send} className="assistant-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inverters, stores, prices, or RFQs…"
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
