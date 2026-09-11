/**
 * Lightweight shared in-memory rate limiter for API routes.
 *
 * WS-1.3 / WS-4B: single-instance limiter. Replace with the Redis implementation
 * when the polyglot layer lands — the interface below is designed so call sites do
 * not change.
 */

import { NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function evictOldest(): void {
  const oldest = buckets.keys().next();
  if (!oldest.done) buckets.delete(oldest.value);
}

export function rateLimit(key: string, max: number, windowMs: number): { limited: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= 5000) evictOldest();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: max - 1, retryAfterSec: 0 };
  }
  bucket.count += 1;
  return {
    limited: bucket.count > max,
    remaining: Math.max(0, max - bucket.count),
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function clientIp(req: { headers: Headers | { get(name: string): string | null } }): string {
  const headers = req.headers as Headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

export function rateLimitHeaders(res: { headers: Headers }, remaining: number): void {
  res.headers.set('X-RateLimit-Remaining', String(remaining));
}

/**
 * Standard rate-limit policy per public surface. Centralised so the limits are
 * reviewable in one place rather than scattered as magic numbers.
 */
export const RATE_LIMITS = {
  search: { max: 120, windowMs: 60_000 },
  autocomplete: { max: 240, windowMs: 60_000 },
  assistant: { max: 20, windowMs: 60_000 },
  claim: { max: 10, windowMs: 60_000 },
  requests: { max: 20, windowMs: 60_000 },
  login: { max: 10, windowMs: 60_000 },
  files: { max: 60, windowMs: 60_000 },
} as const;

/**
 * Applies a named policy and returns a ready-to-send 429 response when exceeded,
 * or `null` when the request may proceed.
 *
 * Usage:
 *   const limited = enforceRateLimit('search', req);
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  policy: keyof typeof RATE_LIMITS,
  req: { headers: Headers | { get(name: string): string | null } }
): NextResponse | null {
  const { max, windowMs } = RATE_LIMITS[policy];
  const result = rateLimit(`${policy}:${clientIp(req)}`, max, windowMs);
  if (!result.limited) return null;

  const res = NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429 }
  );
  res.headers.set('Retry-After', String(result.retryAfterSec));
  res.headers.set('X-RateLimit-Limit', String(max));
  res.headers.set('X-RateLimit-Remaining', '0');
  return res;
}
