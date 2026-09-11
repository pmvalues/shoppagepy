import { describe, it, expect, afterEach } from 'vitest';
import {
  signSession,
  verifySession,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
  type SessionPayload,
  verifyCredentials,
} from '../src/lib/auth';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/cms/[collection]/route';

describe('P0 Security Hardening: Server-Side Cryptographic Session Layer', () => {
  it('signs and verifies a valid session payload', async () => {
    const payload: SessionPayload = {
      userId: 'usr_superadmin_01',
      email: 'admin@shoppage.co.za',
      role: 'superadmin',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const token = await signSession(payload);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(2);

    const verified = await verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe('superadmin');
  });

  it('rejects tampered session tokens', async () => {
    const payload: SessionPayload = {
      userId: 'usr_merchant_01',
      email: 'merchant@store.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_store_01',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const token = await signSession(payload);
    const [data, sig] = token.split('.');

    // Tamper with payload to escalate role to superadmin
    const tamperedPayload = { ...payload, role: 'superadmin' };
    const tamperedData = Buffer.from(JSON.stringify(tamperedPayload))
      .toString('base64')
      .replace(/=/g, '');
    const tamperedToken = `${tamperedData}.${sig}`;

    expect(await verifySession(tamperedToken)).toBeNull();
  });

  it('rejects expired session tokens', async () => {
    const payload: SessionPayload = {
      userId: 'usr_expired_01',
      email: 'expired@store.co.za',
      role: 'merchant_staff',
      issuedAt: Date.now() - 7200000,
      expiresAt: Date.now() - 3600000, // Expired 1 hour ago
    };

    const token = await signSession(payload);
    expect(await verifySession(token)).toBeNull();
  });

  it('extracts session payload from Cookie header', async () => {
    const payload: SessionPayload = {
      userId: 'usr_mitrend_midrand',
      email: 'sales@mitrend.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_mitrend_midrand',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const token = await signSession(payload);
    const req = new NextRequest('http://localhost:3000/merchant/dashboard', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}; other_cookie=xyz`,
      },
    });

    const session = await getSessionFromRequest(req);
    expect(session).not.toBeNull();
    expect(session?.merchantId).toBe('loc_mitrend_midrand');
  });

  it('authenticates superadmin with the configured password', () => {
    process.env.SHOPPAGE_ADMIN_PASSWORD = 'a-real-strong-admin-password';
    process.env.SHOPPAGE_ADMIN_EMAIL = 'admin@shoppage.co.za';

    const s1 = verifyCredentials('admin@shoppage.co.za', 'a-real-strong-admin-password', 'superadmin');
    expect(s1).not.toBeNull();
    expect(s1?.role).toBe('superadmin');

    const s3 = verifyCredentials('admin@shoppage.co.za', 'wrong_pass', 'superadmin');
    expect(s3).toBeNull();
  });
});

// =============================================================================
// WS-1.1 REGRESSION GUARD — the development auth bypass (P0)
// =============================================================================
// The original suite asserted that `admin123` and the dot placeholder were ACCEPTED,
// which locked in an open platform whenever NODE_ENV was not exactly 'production'.
// These tests now assert the opposite so the hole cannot silently return.
describe('WS-1.1 Regression: development auth bypass is closed', () => {
  const ORIGINAL_ENV = { ...process.env };

  /** process.env.NODE_ENV is typed readonly; this is the sanctioned way to set it in tests. */
  function setNodeEnv(value: string | undefined) {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  }

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('refuses the placeholder password when NODE_ENV is unset and dev auth is off', () => {
    // This is the exact production-danger case: `next start` with no NODE_ENV.
    setNodeEnv(undefined);
    delete process.env.SHOPPAGE_ALLOW_DEV_AUTH;
    process.env.SHOPPAGE_AUTH_SECRET = 'a'.repeat(40);
    process.env.SHOPPAGE_ADMIN_PASSWORD = 'a-real-strong-admin-password';
    process.env.SHOPPAGE_ADMIN_EMAIL = 'admin@shoppage.co.za';

    expect(verifyCredentials('admin@shoppage.co.za', '••••••••••••', 'superadmin')).toBeNull();
    expect(verifyCredentials('admin@shoppage.co.za', 'admin123', 'superadmin')).toBeNull();
  });

  it('refuses ANY password for a merchant with no configured secret when dev auth is off', () => {
    // Previously this fell through to `isDev` and accepted everything.
    setNodeEnv(undefined);
    delete process.env.SHOPPAGE_ALLOW_DEV_AUTH;
    delete process.env.SHOPPAGE_MERCHANT_SECRET_LOC_UNCONFIGURED_STORE;
    process.env.SHOPPAGE_AUTH_SECRET = 'a'.repeat(40);

    expect(
      verifyCredentials('anyone@example.co.za', 'literally-anything', 'merchant_owner', 'loc_unconfigured_store')
    ).toBeNull();
    expect(
      verifyCredentials('anyone@example.co.za', 'admin123', 'merchant_owner', 'loc_unconfigured_store')
    ).toBeNull();
  });

  it('refuses placeholder passwords in production even if the dev flag is set', () => {
    setNodeEnv('production');
    process.env.SHOPPAGE_ALLOW_DEV_AUTH = 'true';
    process.env.SHOPPAGE_AUTH_SECRET = 'a'.repeat(40);
    process.env.SHOPPAGE_ADMIN_PASSWORD = 'a-real-strong-admin-password';

    expect(verifyCredentials('admin@shoppage.co.za', '••••••••••••', 'superadmin')).toBeNull();
    expect(verifyCredentials('admin@shoppage.co.za', 'admin123', 'superadmin')).toBeNull();
  });

  it('throws when production is configured with a short or placeholder auth secret', async () => {
    setNodeEnv('production');
    process.env.SHOPPAGE_AUTH_SECRET = 'short';

    await expect(signSession({
      userId: 'u', email: 'e@x.co.za', role: 'superadmin',
      issuedAt: Date.now(), expiresAt: Date.now() + 1000,
    })).rejects.toThrow(/at least 32 characters/);
  });

  it('throws when the production auth secret is a known placeholder', async () => {
    setNodeEnv('production');
    // Long enough to clear the length check (still non-ASCII-free, still weak).
    process.env.SHOPPAGE_AUTH_SECRET = 'changeme'.padEnd(40, 'changeme');

    await expect(signSession({
      userId: 'u', email: 'e@x.co.za', role: 'superadmin',
      issuedAt: Date.now(), expiresAt: Date.now() + 1000,
    })).rejects.toThrow(/placeholder|low-entropy/);
  });

  it('still allows explicit opt-in dev auth to work for local development', () => {
    setNodeEnv('development');
    process.env.SHOPPAGE_ALLOW_DEV_AUTH = 'true';
    process.env.SHOPPAGE_AUTH_SECRET = 'a'.repeat(40);
    process.env.SHOPPAGE_ADMIN_PASSWORD = 'a-real-strong-admin-password';
    process.env.SHOPPAGE_ADMIN_EMAIL = 'admin@shoppage.co.za';

    const s = verifyCredentials('admin@shoppage.co.za', '••••••••••••', 'superadmin');
    expect(s).not.toBeNull();
    expect(s?.role).toBe('superadmin');

    const m = verifyCredentials('dev@store.co.za', '••••••••••••', 'merchant_owner', 'loc_mitrend_midrand');
    expect(m).not.toBeNull();
    expect(m?.merchantId).toBe('loc_mitrend_midrand');
  });

  it('prevents the platform admin password from authenticating as a merchant', () => {
    setNodeEnv('production');
    process.env.SHOPPAGE_AUTH_SECRET = 'a'.repeat(40);
    process.env.SHOPPAGE_ADMIN_PASSWORD = 'shared-secret-value-1234';
    process.env.SHOPPAGE_ADMIN_EMAIL = 'admin@shoppage.co.za';
    process.env.SHOPPAGE_MERCHANT_SECRET_LOC_TEST_STORE = 'a-different-merchant-secret';

    // Reusing the platform admin password on a merchant login must fail.
    expect(
      verifyCredentials('admin@shoppage.co.za', 'shared-secret-value-1234', 'merchant_owner', 'loc_test_store')
    ).toBeNull();

    // The merchant's own secret works.
    const ok = verifyCredentials('owner@store.co.za', 'a-different-merchant-secret', 'merchant_owner', 'loc_test_store');
    expect(ok).not.toBeNull();
    expect(ok?.merchantId).toBe('loc_test_store');
  });
});

describe('P0 Security Hardening: Edge Middleware Protection', () => {
  it('redirects unauthenticated users trying to access /admin/dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/admin/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307); // Next.js redirect
    expect(res.headers.get('location')).toContain('/admin?error=unauthorized_superadmin');
  });

  it('blocks merchants from accessing /admin/dashboard', async () => {
    const merchantPayload: SessionPayload = {
      userId: 'usr_merchant_01',
      email: 'merchant@store.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_mitrend_midrand',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    const token = await signSession(merchantPayload);

    const req = new NextRequest('http://localhost:3000/admin/dashboard', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin?error=unauthorized_superadmin');
  });

  it('allows superadmins to access /admin/dashboard', async () => {
    const superAdminPayload: SessionPayload = {
      userId: 'usr_superadmin_01',
      email: 'admin@shoppage.co.za',
      role: 'superadmin',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    const token = await signSession(superAdminPayload);

    const req = new NextRequest('http://localhost:3000/admin/dashboard', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated users trying to access /merchant/dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/merchant/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin?error=unauthorized_merchant');
  });

  it('enforces tenant isolation on /merchant/dashboard query parameters', async () => {
    const mitrendPayload: SessionPayload = {
      userId: 'usr_mitrend_01',
      email: 'sales@mitrend.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_mitrend_midrand',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    const token = await signSession(mitrendPayload);

    // Mitrend user tries to view Sunpower store
    const req = new NextRequest(
      'http://localhost:3000/merchant/dashboard?store=loc_sunpower_crownmines',
      {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      }
    );
    const res = await middleware(req);

    // Middleware forces redirect back to their own store
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/merchant/dashboard?store=loc_mitrend_midrand');
  });

  it('rejects unauthenticated mutations to /api/cms/products with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/products', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hacked Product' }),
    });
    const res = await middleware(req);

    expect(res.status).toBe(401);
  });
});

describe('P0 Security Hardening: Tenant Isolation on CMS API Routes', () => {
  it('rejects unauthenticated POST requests with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/products', {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthorized Product', price: 500 }),
    });

    const res = await POST(req, { params: Promise.resolve({ collection: 'products' }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('blocks cross-tenant product creation attempts with 403', async () => {
    const mitrendPayload: SessionPayload = {
      userId: 'usr_mitrend_01',
      email: 'sales@mitrend.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_mitrend_midrand',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    const token = await signSession(mitrendPayload);

    // Mitrend authenticated user attempts to inject product into SunPower merchant
    const req = new NextRequest('http://localhost:3000/api/cms/products', {
      method: 'POST',
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Tampered Solar Panel',
        merchantId: 'loc_sunpower_crownmines', // Cross-tenant attempt!
        price: 1500,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ collection: 'products' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Cross-tenant');
  });

  it('allows authenticated merchant to create product within their own tenant scope', async () => {
    const mitrendPayload: SessionPayload = {
      userId: 'usr_mitrend_01',
      email: 'sales@mitrend.co.za',
      role: 'merchant_owner',
      merchantId: 'loc_mitrend_midrand',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
    const token = await signSession(mitrendPayload);

    const req = new NextRequest('http://localhost:3000/api/cms/products', {
      method: 'POST',
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Authentic Mitrend Cake Box 10-Pack',
        merchantId: 'loc_mitrend_midrand',
        price: 120,
        brand: 'Mitrend',
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ collection: 'products' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.doc.title).toBe('Authentic Mitrend Cake Box 10-Pack');
    expect(body.doc.merchantId).toBe('loc_mitrend_midrand');
  });
});
