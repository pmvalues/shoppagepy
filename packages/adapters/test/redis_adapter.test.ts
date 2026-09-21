import { describe, it, expect, beforeEach } from 'vitest';
import { RedisClientAdapter } from '../src/cache/redis_adapter';

describe('Phase 2: RedisClientAdapter & Rate-Limiter with Zero-Degradation Fallback', () => {
  let adapter: RedisClientAdapter;

  beforeEach(() => {
    adapter = new RedisClientAdapter();
    adapter.reset();
  });

  it('allows requests up to max and limits subsequent requests', () => {
    const key = 'test_ip_1';
    for (let i = 0; i < 5; i++) {
      const res = adapter.rateLimit(key, 5, 60000);
      expect(res.limited).toBe(false);
      expect(res.remaining).toBe(4 - i);
    }

    const over = adapter.rateLimit(key, 5, 60000);
    expect(over.limited).toBe(true);
    expect(over.remaining).toBe(0);
    expect(over.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates different keys independently', () => {
    const keyA = 'ip_a';
    const keyB = 'ip_b';

    adapter.rateLimit(keyA, 1, 60000);
    const overA = adapter.rateLimit(keyA, 1, 60000);
    expect(overA.limited).toBe(true);

    const firstB = adapter.rateLimit(keyB, 1, 60000);
    expect(firstB.limited).toBe(false);
  });

  it('resets rate limit window when windowMs expires', () => {
    const key = 'reset_key';
    adapter.rateLimit(key, 1, 1); // 1ms window
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* wait 5ms */
    }
    const fresh = adapter.rateLimit(key, 1, 1000);
    expect(fresh.limited).toBe(false);
  });

  it('stores and retrieves cache values with in-memory fallback', async () => {
    await adapter.set('session:123', 'user_token_abc', 60);
    const val = await adapter.get('session:123');
    expect(val).toBe('user_token_abc');

    const missing = await adapter.get('non_existent');
    expect(missing).toBeNull();
  });

  it('transparently reports false for isHealthy when Redis is offline without throwing', async () => {
    const offlineAdapter = new RedisClientAdapter({ url: 'redis://127.0.0.1:65534' });
    const healthy = await offlineAdapter.isHealthy();
    expect(healthy).toBe(false);
  });
});
