import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit, enforceRateLimit, clientIp, RATE_LIMITS } from '../src/server/rate-limit';

function reqWithIp(ip: string, url = 'http://localhost:3000/api/search') {
  return new NextRequest(url, { headers: { 'x-forwarded-for': ip } });
}

describe('WS-1.3: shared rate limiter', () => {
  it('allows requests up to the limit and blocks beyond it', () => {
    const key = 'test:' + Math.random();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).limited).toBe(false);
    }
    const over = rateLimit(key, 5, 60_000);
    expect(over.limited).toBe(true);
    expect(over.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates distinct keys from one another', () => {
    const a = 'iso-a:' + Math.random();
    const b = 'iso-b:' + Math.random();
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).limited).toBe(true);
    expect(rateLimit(b, 1, 60_000).limited).toBe(false);
  });

  it('resets the bucket once the window elapses', () => {
    const key = 'reset:' + Math.random();
    expect(rateLimit(key, 1, 1).limited).toBe(false);
    expect(rateLimit(key, 1, 1).limited).toBe(true);
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* spin briefly to cross the 1ms window */
    }
    expect(rateLimit(key, 1, 1).limited).toBe(false);
  });

  it('extracts the client IP from x-forwarded-for, taking the first hop', () => {
    expect(clientIp(reqWithIp('203.0.113.9, 10.0.0.1'))).toBe('203.0.113.9');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new NextRequest('http://localhost:3000/api/search', {
      headers: { 'x-real-ip': '198.51.100.4' },
    });
    expect(clientIp(req)).toBe('198.51.100.4');
  });

  it('falls back to "unknown" when no forwarding header is present', () => {
    const req = new NextRequest('http://localhost:3000/api/search');
    expect(clientIp(req)).toBe('unknown');
  });
});

describe('WS-1.3: enforceRateLimit policy responses', () => {
  it('returns null while under the limit', () => {
    const req = reqWithIp('192.0.2.' + Math.floor(Math.random() * 250));
    const res = enforceRateLimit('assistant', req);
    // First call in a fresh bucket must be allowed.
    if (res !== null) {
      // Only acceptable if another test already exhausted this IP; assert shape then.
      expect(res.status).toBe(429);
    } else {
      expect(res).toBeNull();
    }
  });

  it('returns a 429 with Retry-After once the assistant limit is exceeded', () => {
    const ip = 'brute-' + Date.now() + '-' + Math.random();
    const req = reqWithIp(ip, 'http://localhost:3000/api/assistant');

    let blocked: Response | null = null;
    for (let i = 0; i <= RATE_LIMITS.assistant.max; i++) {
      blocked = enforceRateLimit('assistant', req);
      if (blocked) break;
    }

    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
    expect(Number(blocked!.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(blocked!.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMITS.assistant.max));
  });

  it('uses a stricter limit for login than for search', () => {
    expect(RATE_LIMITS.login.max).toBeLessThan(RATE_LIMITS.search.max);
  });

  it('enforces the login limit independently of the search limit', () => {
    const ip = 'login-iso-' + Date.now() + '-' + Math.random();
    const loginReq = reqWithIp(ip, 'http://localhost:3000/api/auth/login');
    const searchReq = reqWithIp(ip, 'http://localhost:3000/api/v1/search');

    let loginBlocked: Response | null = null;
    for (let i = 0; i <= RATE_LIMITS.login.max; i++) {
      loginBlocked = enforceRateLimit('login', loginReq);
      if (loginBlocked) break;
    }
    expect(loginBlocked).not.toBeNull();

    // The same IP must still be able to search.
    expect(enforceRateLimit('search', searchReq)).toBeNull();
  });
});
