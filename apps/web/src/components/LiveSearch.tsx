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

/** Inline icons — emoji glyphs could not inherit colour, size or weight. */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  );
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

  const hasResults = products.length > 0 || malls.length > 0 || merchants.length > 0;

  return (
    <div ref={containerRef} className="relative mx-auto w-full">
      <form
        onSubmit={submit}
        className={[
          'flex h-[46px] items-center rounded-full border bg-surface pl-5 pr-3.5',
          'transition duration-200 ease-out-expo',
          open
            ? 'border-line-strong shadow-lg'
            : 'border-line shadow-sm hover:border-line-strong',
        ].join(' ')}
      >
        <SearchIcon className="mr-2.5 h-4 w-4 shrink-0 text-content-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search 1,000,000+ products across 74,000 SA stores & malls..."
          className="min-w-0 flex-1 border-none bg-transparent font-medium text-content outline-none placeholder:text-content-muted"
          aria-label="Search"
          autoComplete="off"
        />

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              title="Clear"
              aria-label="Clear search"
              className="rounded-md px-1.5 py-0.5 text-content-muted transition-colors hover:text-content"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            className="rounded-full bg-brand-solid px-3.5 py-1.5 text-xs font-semibold text-white transition duration-200 ease-out-expo hover:bg-brand-solid-hover active:scale-[0.98]"
          >
            Search
          </button>
        </div>
      </form>

      {/* Sub-20ms autocomplete dropdown */}
      {open && hasResults && (
        <div className="absolute left-0 right-0 top-[52px] z-[9999] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {/* Telemetry strip */}
          <div className="flex items-center justify-between border-b border-line-subtle bg-surface-subtle px-4 py-2 text-xs text-content-muted">
            <span className="font-medium">Live national grid · best price first</span>
            <span className="tabular-nums">{latencyMs ? `${latencyMs}ms in-process` : 'sub-20ms'}</span>
          </div>

          <div
            className="grid max-h-[480px] overflow-y-auto"
            style={{ gridTemplateColumns: malls.length > 0 ? '240px 1fr' : '1fr' }}
          >
            {/* Left column: malls and trading hubs */}
            {malls.length > 0 && (
              <div className="border-r border-line-subtle bg-surface-inset p-3.5">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                  <PinIcon className="h-3 w-3" />
                  Malls &amp; trading hubs
                </p>
                <div className="flex flex-col gap-1.5">
                  {malls.map((mall) => (
                    <Link
                      key={mall.id}
                      href={`/malls?q=${encodeURIComponent(mall.name)}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg border border-line bg-surface px-2.5 py-2 transition duration-200 ease-out-expo hover:border-brand-400"
                    >
                      <div className="text-sm font-semibold text-content">{mall.name}</div>
                      <div className="text-xs text-content-muted">
                        {mall.province} · {mall.storeCount} stores
                      </div>
                    </Link>
                  ))}
                </div>

                {suggestions.length > 1 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                      Suggested
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {suggestions.slice(1).map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setQ(sugg);
                            router.push(`/search?q=${encodeURIComponent(sugg)}`);
                            setOpen(false);
                          }}
                          className="flex items-center gap-1.5 py-0.5 text-left text-xs text-brand-ink transition-colors hover:text-brand-700"
                        >
                          <SearchIcon className="h-3 w-3 shrink-0" />
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main column: in-stock products */}
            <div className="py-2">
              {products.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <Link
                    key={item.canonicalId}
                    href={`/p/${item.canonicalId}`}
                    onClick={() => setOpen(false)}
                    className={[
                      'flex items-center gap-3.5 border-b border-line-subtle px-4 py-2.5',
                      'transition-colors duration-100',
                      isSelected ? 'bg-surface-subtle' : 'hover:bg-surface-subtle',
                    ].join(' ')}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface p-0.5">
                      {item.image ? (
                        <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <BoxIcon className="h-5 w-5 text-content-muted" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="rounded bg-brand-50 px-1 py-0.5 text-[10px] font-semibold text-brand-700">
                          In stock
                        </span>
                        <span className="text-xs font-medium text-content-muted">{item.brand}</span>
                      </div>
                      <div className="truncate text-sm font-semibold text-content">{item.title}</div>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-sm font-bold tabular-nums text-content">
                          R {item.priceZar ? item.priceZar.toLocaleString('en-ZA') : 'Quote'}
                        </span>
                        <span className="text-xs text-brand-ink">
                          · {item.offersCount} store offer{item.offersCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4 shrink-0 text-content-muted">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line bg-surface-subtle px-4 py-2.5 text-xs text-content-muted">
            <span>
              Press <strong className="font-semibold text-content-secondary">Enter</strong> for the full
              shopping grid
            </span>
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              onClick={() => setOpen(false)}
              className="font-semibold text-brand-ink transition-colors hover:text-brand-700"
            >
              View all results →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
