/**
 * Lightweight shared in-memory rate limiter for API routes.
 * Production hardening step: replace with Redis once the polyglot write path
 * is wired, but a single-instance limiter is far better than no limiter.
 */

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
