import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { signSession, SESSION_COOKIE_NAME, type SessionPayload } from '../src/lib/auth';
import { GET as leadsGet, PATCH as leadsPatch } from '../src/app/api/merchants/leads/route';
import { GET as analyticsGet } from '../src/app/api/merchants/analytics/route';
import { GET as cmsGet } from '../src/app/api/cms/[collection]/route';
import { GET as agentsGet } from '../src/app/api/ops/agents/route';
import { POST as sweepPost } from '../src/app/api/v1/merchants/sweep/route';
import { POST as syncPost } from '../src/app/api/v1/merchant/sync/route';

const MERCHANT_A = 'loc_mitrend_midrand';
const MERCHANT_B = 'loc_sunpower_crownmines';
const ORIGINAL_ENV = { ...process.env };

async function cookieFor(merchantId: string): Promise<string> {
  const payload: SessionPayload = {
    userId: 'usr_' + merchantId,
    email: 'owner@store.co.za',
    role: 'merchant_owner',
    merchantId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };
  return `${SESSION_COOKIE_NAME}=${await signSession(payload)}`;
}

function request(url: string, cookie?: string): NextRequest {
  return new NextRequest(url, cookie ? { headers: { cookie } } : undefined);
}

describe('WS-1.6: privileged API routes require authentication and tenant scope', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('merchant leads: unauthenticated read is 401', async () => {
    const res = await leadsGet(request(`http://localhost:3000/api/merchants/leads?merchantId=${MERCHANT_A}`));
    expect(res.status).toBe(401);
  });

  it('merchant leads: cross-tenant read is 403', async () => {
    const res = await leadsGet(
      request(`http://localhost:3000/api/merchants/leads?merchantId=${MERCHANT_B}`, await cookieFor(MERCHANT_A))
    );
    expect(res.status).toBe(403);
  });

  it('merchant leads: own-tenant read is 200', async () => {
    const res = await leadsGet(
      request(`http://localhost:3000/api/merchants/leads?merchantId=${MERCHANT_A}`, await cookieFor(MERCHANT_A))
    );
    expect(res.status).toBe(200);
  });

  it('merchant leads: unauthenticated PATCH is 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchants/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'lead_does_not_exist', status: 'resolved' }),
    });
    const res = await leadsPatch(req);
    expect(res.status).toBe(401);
  });

  it('merchant analytics: unauthenticated is 401 and cross-tenant is 403', async () => {
    const unauth = await analyticsGet(request(`http://localhost:3000/api/merchants/analytics?merchantId=${MERCHANT_A}`));
    expect(unauth.status).toBe(401);

    const cross = await analyticsGet(
      request(`http://localhost:3000/api/merchants/analytics?merchantId=${MERCHANT_B}`, await cookieFor(MERCHANT_A))
    );
    expect(cross.status).toBe(403);
  });

  it('cms customers and orders: unauthenticated reads are 401', async () => {
    const customers = await cmsGet(
      request(`http://localhost:3000/api/cms/customers?merchantId=${MERCHANT_A}`),
      { params: Promise.resolve({ collection: 'customers' }) }
    );
    expect(customers.status).toBe(401);

    const orders = await cmsGet(
      request(`http://localhost:3000/api/cms/orders?merchantId=${MERCHANT_A}`),
      { params: Promise.resolve({ collection: 'orders' }) }
    );
    expect(orders.status).toBe(401);
  });

  it('cms products: public catalog read still works without a session', async () => {
    const res = await cmsGet(
      request(`http://localhost:3000/api/cms/products?merchantId=${MERCHANT_A}`),
      { params: Promise.resolve({ collection: 'products' }) }
    );
    expect(res.status).toBe(200);
  });

  it('ops agents: unauthenticated GET is 401', async () => {
    const res = await agentsGet(request('http://localhost:3000/api/ops/agents'));
    expect(res.status).toBe(401);
  });

  it('ops agents: valid admin token is accepted', async () => {
    process.env.SHOPPAGE_ADMIN_TOKEN = 'test-admin-token-1234567890';
    const req = new NextRequest('http://localhost:3000/api/ops/agents', {
      headers: { 'x-admin-token': 'test-admin-token-1234567890' },
    });
    const res = await agentsGet(req);
    expect(res.status).toBe(200);
  });

  it('merchants sweep: unauthenticated POST is 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/merchants/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places: [{ name: 'Test Place' }] }),
    });
    const res = await sweepPost(req);
    expect(res.status).toBe(401);
  });

  it('merchant sync: unauthenticated POST is 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/merchant/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: MERCHANT_A, items: [] }),
    });
    const res = await syncPost(req);
    expect(res.status).toBe(401);
  });

  it('merchant sync: cross-tenant POST is 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/merchant/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: await cookieFor(MERCHANT_A) },
      body: JSON.stringify({ merchantId: MERCHANT_B, items: [] }),
    });
    const res = await syncPost(req);
    expect(res.status).toBe(403);
  });

  it('merchant sync: own-tenant POST is accepted', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/merchant/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: await cookieFor(MERCHANT_A) },
      body: JSON.stringify({ merchantId: MERCHANT_A, items: [] }),
    });
    const res = await syncPost(req);
    expect(res.status).toBe(200);
  });
});
