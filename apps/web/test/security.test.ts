import { describe, it, expect } from 'vitest';
import {
  signSession,
  verifySession,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
  type SessionPayload,
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
