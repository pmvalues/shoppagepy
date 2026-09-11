import { describe, it, expect } from 'vitest';
import { validateEnvironment, assertEnvironmentIsSafe } from '../src/server/env-check';

const STRONG = 'Zx9' + 'Qm4'.repeat(12) + '7';

/**
 * Builds a hermetic production environment. Deliberately does NOT spread the real
 * process.env — vitest loads apps/web/.env.local, which would leak ambient values
 * (including SHOPPAGE_ALLOW_DEV_AUTH) into these assertions.
 */
function productionEnv(overrides: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = {
    NODE_ENV: 'production',
    SHOPPAGE_AUTH_SECRET: STRONG,
    SHOPPAGE_ADMIN_PASSWORD: 'a-strong-admin-password-9942',
    NEXT_PUBLIC_SERVER_URL: 'https://shoppage.co.za',
    SHOPPAGE_ALLOW_DEV_AUTH: undefined,
    PAYLOAD_SECRET: undefined,
    GEMINI_API_KEY: 'test-key',
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete base[k];
    else base[k] = v;
  }
  return base as NodeJS.ProcessEnv;
}

describe('WS-1.2: production environment validation', () => {
  it('passes a correctly configured production environment', () => {
    const issues = validateEnvironment(productionEnv());
    expect(issues.filter((i) => i.severity === 'fatal')).toHaveLength(0);
  });

  it('flags a missing auth secret as fatal in production', () => {
    const issues = validateEnvironment(productionEnv({ SHOPPAGE_AUTH_SECRET: '' }));
    const hit = issues.find((i) => i.variable === 'SHOPPAGE_AUTH_SECRET');
    expect(hit?.severity).toBe('fatal');
  });

  it('flags the original admin123 password as fatal in production', () => {
    const issues = validateEnvironment(productionEnv({ SHOPPAGE_ADMIN_PASSWORD: 'admin123' }));
    const hit = issues.find((i) => i.variable === 'SHOPPAGE_ADMIN_PASSWORD');
    expect(hit?.severity).toBe('fatal');
  });

  it('flags a padded placeholder secret as fatal in production', () => {
    const issues = validateEnvironment(
      productionEnv({ SHOPPAGE_AUTH_SECRET: 'changeme'.padEnd(40, 'changeme') })
    );
    const hit = issues.find((i) => i.variable === 'SHOPPAGE_AUTH_SECRET');
    expect(hit?.severity).toBe('fatal');
  });

  it('flags dev auth enabled in production as fatal', () => {
    const issues = validateEnvironment(productionEnv({ SHOPPAGE_ALLOW_DEV_AUTH: 'true' }));
    const hit = issues.find((i) => i.variable === 'SHOPPAGE_ALLOW_DEV_AUTH');
    expect(hit?.severity).toBe('fatal');
  });

  it('detects every merchant sharing one secret', () => {
    const issues = validateEnvironment(
      productionEnv({
        SHOPPAGE_MERCHANT_SECRET_LOC_A: 'the-same-secret-for-both',
        SHOPPAGE_MERCHANT_SECRET_LOC_B: 'the-same-secret-for-both',
      })
    );
    const hits = issues.filter((i) => i.message.includes('Shares its value with'));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.severity === 'fatal')).toBe(true);
  });

  it('does not treat a weak secret as fatal outside production', () => {
    const issues = validateEnvironment({
      NODE_ENV: 'development',
      SHOPPAGE_AUTH_SECRET: 'short',
      GEMINI_API_KEY: 'test-key',
    } as NodeJS.ProcessEnv);
    expect(issues.filter((i) => i.severity === 'fatal')).toHaveLength(0);
    expect(issues.some((i) => i.severity === 'warning')).toBe(true);
  });

  it('throws from assertEnvironmentIsSafe when a fatal issue exists', () => {
    expect(() =>
      assertEnvironmentIsSafe(productionEnv({ SHOPPAGE_ADMIN_PASSWORD: 'admin123' }))
    ).toThrow(/Refusing to start/);
  });

  it('does not throw when only warnings exist', () => {
    expect(() =>
      assertEnvironmentIsSafe({
        NODE_ENV: 'development',
        SHOPPAGE_AUTH_SECRET: 'short',
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });

  it('warns about no merchant secrets configured in production', () => {
    const issues = validateEnvironment(productionEnv());
    const hit = issues.find((i) => i.variable === 'SHOPPAGE_MERCHANT_SECRET_*');
    expect(hit?.severity).toBe('warning');
  });
});
