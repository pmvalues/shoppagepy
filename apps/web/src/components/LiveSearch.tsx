'use client';

import { useState, useRef, useEffect, Suspense, FormEvent, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ProductVariant } from '@shoppage/contracts';

function LiveSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';
  const [q, setQ] = useState(initialQ);
  const [overview, setOverview] = useState('');
  const [results, setResults] = useState<ProductVariant[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if URL query changes
  useEffect(() => {
    if (initialQ && initialQ !== q) {
      setQ(initialQ);
    }
  }, [initialQ]);

  useEffect(() => {
    if (!q.trim()) {
      setOverview('');
      setResults([]);
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setOverview(data.overview || '');
        setResults((data.products || []).slice(0, 4));
        setOpen(true);
        setSelectedIndex(-1);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Handle clicking outside to close search dropdown
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
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        const selected = results[selectedIndex];
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
    setOverview('');
    setResults([]);
    setOpen(false);
    setSelectedIndex(-1);
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
          boxShadow: '0 1px 6px rgba(32, 33, 36, 0.22)',
          padding: '0 0.85rem 0 1.25rem',
          height: '44px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, malls, stores in South Africa..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.975rem',
            color: '#1E293B',
            fontWeight: 500,
          }}
          aria-label="Search"
          autoComplete="off"
        />

        {/* Right Google-Style Controls */}
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
                fontSize: '1rem',
                padding: '0.2rem 0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          )}

          <span style={{ width: '1px', height: '20px', background: '#DFE1E5', margin: '0 0.15rem' }}></span>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                alert('🎙️ Voice Search activated. Speak your query now...');
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Search by voice"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.66 15 15 13.66 15 12V6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15Z" fill="#4285F4" />
              <path d="M19 12C19 15.53 16.14 18.4 12.67 18.93V21H11.33V18.93C7.86 18.4 5 15.53 5 12H7C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12H19Z" fill="#34A853" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => alert('📷 Visual Search & Google Lens mode ready. Upload or drop an image.')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Search by image (Lens)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="#4285F4" />
              <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="#EA4335" />
            </svg>
          </button>

          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Search"
            aria-label="Submit search"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </form>

      {open && (overview || results.length > 0 || loading) && (
        <div className="live-search-panel" style={{ zIndex: 50 }}>
          {loading && !overview && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
              Shoppage intelligence is thinking…
            </div>
          )}
          {overview && (
            <div className="ai-overview" style={{ marginBottom: results.length > 0 ? 10 : 0 }}>
              <span className="ai-spark">✨ AI Overview</span>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', lineHeight: 1.45 }}>{overview}</p>
            </div>
          )}
          {results.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              {results.map((p, idx) => {
                const isSelected = selectedIndex === idx;
                const estPrice = (p.attributes as Record<string, unknown>)?.estimatedPriceZar;
                return (
                  <Link
                    key={p.canonicalId}
                    href={`/p/${p.canonicalId}`}
                    className="live-result"
                    style={{
                      background: isSelected ? '#EFF6FF' : undefined,
                      borderColor: isSelected ? '#3B82F6' : undefined,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                        {p.brand}
                      </span>
                      <span style={{ fontWeight: 600, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </span>
                    </div>
                    {typeof estPrice === 'number' && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', flexShrink: 0 }}>
                        R {estPrice.toLocaleString()}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
          <button
            onClick={submit}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: 10, fontSize: '0.8rem', padding: '0.5rem' }}
          >
            See all results for &quot;{q}&quot; &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveSearch() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #DFE1E5',
            boxShadow: '0 1px 6px rgba(32, 33, 36, 0.22)',
            height: '44px',
            padding: '0 1.25rem',
          }}
        />
      }
    >
      <LiveSearchContent />
    </Suspense>
  );
}
