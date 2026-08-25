'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProductVariant } from '@shoppage/contracts';

export default function LiveSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [overview, setOverview] = useState('');
  const [results, setResults] = useState<ProductVariant[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      router.push(`/search?q=${encodeURIComponent(q)}`);
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
    <div ref={containerRef} style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
      <form onSubmit={submit} style={{ position: 'relative' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, malls — or ask the AI anything…"
          className="live-search-input"
          aria-label="Search"
          autoComplete="off"
        />

        {q && (
          <button
            type="button"
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: '90px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem',
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ position: 'absolute', right: 6, top: 6, borderRadius: 9999, padding: '0.6rem 1.3rem' }}
        >
          Search
        </button>
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
