import { NextRequest, NextResponse } from 'next/server';
import { askAssistant } from '@/lib/intelligence';
import { LLMError } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_MAX = 200;
const REQUEST_TIMEOUT_MS = 25_000;

const hits = new Map<string, { count: number; resetAt: number }>();
const cache = new Map<string, { expires: number; body: unknown }>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function evictOldest(map: Map<string, unknown>) {
  const oldest = map.keys().next();
  if (!oldest.done) map.delete(oldest.value);
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    if (hits.size >= 2000) evictOldest(hits);
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function cacheGet(key: string): unknown | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.body;
}

function cacheSet(key: string, body: unknown) {
  if (cache.size >= CACHE_MAX) evictOldest(cache);
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, body });
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => null);
    const message: string = typeof body?.message === 'string' ? body.message : '';
    const clean = message.trim().slice(0, 500);
    if (!clean) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }
    if (rateLimited(clientIp(req))) {
      return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
    }
    const limitRaw = typeof body?.limit === 'number' ? body.limit : 24;
    const limit = Math.min(Math.max(Math.floor(limitRaw), 1), 48);
    const cacheKey = `${limit}:${clean.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached !== undefined) return NextResponse.json(cached);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const result = await askAssistant(clean, { limit, signal: controller.signal });
      cacheSet(cacheKey, result);
      return NextResponse.json(result);
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    if (err instanceof LLMError && err.code === 'NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Assistant is not configured yet' }, { status: 503 });
    }
    if (err instanceof LLMError && err.code === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Assistant is busy, try again shortly' }, { status: 503 });
    }
    if (err instanceof LLMError && err.code === 'TIMEOUT') {
      return NextResponse.json({ error: 'Assistant timed out, try again' }, { status: 504 });
    }
    console.error('[assistant] error', err);
    return NextResponse.json({ error: 'Assistant unavailable' }, { status: 502 });
  }
}
