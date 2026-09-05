'use client';

import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AutocompleteProduct {
  canonicalId: string;
  title: string;
  brand: string;
  image?: string;
  priceZar: number;
  offersCount: number;
  gtin13?: string;
}

interface AutocompleteMerchant {
  id: string;
  name: string;
  suburb: string;
  isVerified: boolean;
}

interface AutocompleteMall {
  id: string;
  name: string;
  province: string;
  storeCount: number;
}

export default function LiveSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<AutocompleteProduct[]>([]);
  const [merchants, setMerchants] = useState<AutocompleteMerchant[]>([]);
  const [malls, setMalls] = useState<AutocompleteMall[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if URL query changes
  useEffect(() => {
    if (initialQ && initialQ !== q) {
      setQ(initialQ);
    }
  }, [initialQ]);

  // Fast Autocomplete Fetch (<20ms)
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      setProducts([]);
      setMerchants([]);
      setMalls([]);
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setProducts(data.products || []);
        setMerchants(data.merchants || []);
        setMalls(data.malls || []);
        setLatencyMs(data.latencyMs || 8);
        setOpen(true);
        setSelectedIndex(-1);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 150); // Snappy 150ms debounce

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < products.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : products.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < products.length) {
        e.preventDefault();
        const selected = products[selectedIndex];
        setOpen(false);
        router.push(`/p/${selected.canonicalId}`);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const clearSearch = () => {
    setQ('');
    setProducts([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
      <form
        onSubmit={submit}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #DFE1E5',
          boxShadow: open ? '0 4px 16px rgba(32, 33, 36, 0.18)' : '0 1px 6px rgba(32, 33, 36, 0.12)',
          padding: '0 0.85rem 0 1.25rem',
          height: '46px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span style={{ fontSize: '1.1rem', color: '#9AA0A6', marginRight: '0.65rem' }}>🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search 1,000,000+ products across 74,000 SA stores & malls..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            color: '#1E293B',
            fontWeight: 500,
          }}
          aria-label="Search"
          autoComplete="off"
        />

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: '#70757A',
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '0.2rem 0.4rem',
              }}
              title="Clear"
            >
              ✕
            </button>
          )}

          <button
            type="submit"
            style={{
              background: '#1A73E8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '0.4rem 0.9rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Google Shopping-Style Sub-20ms Dropdown */}
      {open && (products.length > 0 || malls.length > 0 || merchants.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #DADCE0',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header Telemetry Strip */}
          <div style={{ padding: '0.55rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B' }}>
            <span>⚡ LIVE NATIONAL GRID · BEST PRICE FIRST</span>
            <span>{latencyMs ? `${latencyMs}ms in-process` : 'sub-20ms'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: malls.length > 0 ? '240px 1fr' : '1fr', maxHeight: '480px', overflowY: 'auto' }}>
            {/* Left Column: Geolocal Trading Hubs & Malls */}
            {malls.length > 0 && (
              <div style={{ borderRight: '1px solid #F1F5F9', background: '#FAFAFA', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                  📍 Malls & Trading Hubs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {malls.map((mall) => (
                    <Link
                      key={mall.id}
                      href={`/malls?q=${encodeURIComponent(mall.name)}`}
                      onClick={() => setOpen(false)}
                      style={{
                        padding: '0.45rem 0.6rem',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{mall.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{mall.province} · {mall.storeCount} stores</div>
                    </Link>
                  ))}
                </div>

                {/* Query suggestions */}
                {suggestions.length > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Suggested
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {suggestions.slice(1).map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setQ(sugg);
                            router.push(`/search?q=${encodeURIComponent(sugg)}`);
                            setOpen(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontSize: '0.78rem',
                            color: '#1A73E8',
                            padding: '0.2rem 0',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Column: In-Stock Canonical Products */}
            <div style={{ padding: '0.5rem 0' }}>
              {products.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <Link
                    key={item.canonicalId}
                    href={`/p/${item.canonicalId}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.65rem 1rem',
                      background: isSelected ? '#F1F5F9' : 'transparent',
                      textDecoration: 'none',
                      borderBottom: '1px solid #F8FAFC',
                      transition: 'background 0.1s ease',
                    }}
                    className="hover:bg-slate-50"
                  >
                    {/* Packshot Image */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        padding: '0.2rem',
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '1.25rem' }}>📦</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#137333', background: '#E6F4EA', padding: '1px 4px', borderRadius: '3px' }}>
                          IN STOCK
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{item.brand}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0F172A' }}>
                          R {item.priceZar ? item.priceZar.toLocaleString('en-ZA') : 'Quote'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#1A73E8' }}>
                          · {item.offersCount} store offer{item.offersCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Arrow CTA */}
                    <div style={{ color: '#94A3B8', fontSize: '1rem', flexShrink: 0 }}>→</div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer Bar */}
          <div style={{ padding: '0.6rem 1rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
            <span>Press <strong>Enter</strong> for complete 5-column Google Shopping grid</span>
            <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)} style={{ color: '#1A73E8', fontWeight: 700, textDecoration: 'none' }}>
              View all results →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
