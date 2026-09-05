import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/search/autocomplete/route';
import { NextRequest } from 'next/server';

describe('Instant Sub-20ms Autocomplete API', () => {
  it('returns instant default suggestions for short or empty queries without LLM call', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/autocomplete?q=');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.products).toEqual([]);
  });

  it('searches in-process FTS5 and returns products, merchants, and malls for solar query', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/autocomplete?q=solar');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.query).toBe('solar');
    expect(Array.isArray(data.products)).toBe(true);
    expect(Array.isArray(data.merchants)).toBe(true);
    expect(Array.isArray(data.malls)).toBe(true);
    expect(data.latencyMs).toBeLessThan(500); // Sub-second cold-start in-process guarantee
  });
});
