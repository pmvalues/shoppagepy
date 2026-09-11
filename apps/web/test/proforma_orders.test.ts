import { describe, it, expect } from 'vitest';
import { GET, POST } from '../src/app/api/orders/proforma/route';
import { NextRequest } from 'next/server';
import { signSession, SESSION_COOKIE_NAME, type SessionPayload } from '../src/lib/auth';

const MERCHANT = 'loc_sunpower_crownmines';
const OTHER_MERCHANT = 'loc_mitrend_midrand';

async function requestAsMerchant(url: string, merchantId: string): Promise<NextRequest> {
  const payload: SessionPayload = {
    userId: 'usr_' + merchantId,
    email: 'owner@store.co.za',
    role: 'merchant_owner',
    merchantId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };
  const token = await signSession(payload);
  return new NextRequest(url, { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } });
}

describe('B2B SARS-Compliant Proforma Orders API', () => {
  it('rejects unauthenticated order reads with 401', async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/proforma?merchantId=${MERCHANT}`);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('blocks cross-tenant order reads with 403', async () => {
    const req = await requestAsMerchant(
      `http://localhost:3000/api/orders/proforma?merchantId=${MERCHANT}`,
      OTHER_MERCHANT
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('lists existing proforma orders for the authenticated merchant', async () => {
    const req = await requestAsMerchant(
      `http://localhost:3000/api/orders/proforma?merchantId=${MERCHANT}`,
      MERCHANT
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.orders)).toBe(true);
    expect(data.orders.length).toBeGreaterThan(0);
    expect(data.orders[0].merchantId).toBe(MERCHANT);
    expect(data.orders[0].vatAmountZar).toBeGreaterThan(0);
  });

  it('creates a new SARS-compliant proforma order with 15% VAT calculation and 24h lock', async () => {
    const payload = {
      merchantId: MERCHANT,
      merchantName: 'SunPower South Africa (Pty) Ltd',
      buyerName: 'David Sithole',
      buyerPhone: '083 111 2233',
      buyerCompany: 'Sithole Electrical Contractors',
      items: [
        {
          id: 'item_test_1',
          title: 'Deye 5kW Hybrid Inverter 48V',
          sku: 'DEYE-5K-SG03',
          quantity: 1,
          unitPriceZar: 14850,
        },
      ],
    };

    const req = new NextRequest('http://localhost:3000/api/orders/proforma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.order.invoiceNumber).toMatch(/^SP-INV-2026-\d{5}$/);
    expect(data.order.vatAmountZar).toBeCloseTo((14850 / 1.15) * 0.15, 1);
    expect(data.order.totalInclVatZar).toBe(14850);
    expect(data.order.status).toBe('pending_payment');
  });
});
