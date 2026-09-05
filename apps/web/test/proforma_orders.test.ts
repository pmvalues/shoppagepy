import { describe, it, expect } from 'vitest';
import { GET, POST } from '../src/app/api/orders/proforma/route';
import { NextRequest } from 'next/server';

describe('B2B SARS-Compliant Proforma Orders API', () => {
  it('lists existing proforma orders for SunPower Crown Mines', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/proforma?merchantId=loc_sunpower_crownmines');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.orders)).toBe(true);
    expect(data.orders.length).toBeGreaterThan(0);
    expect(data.orders[0].merchantId).toBe('loc_sunpower_crownmines');
    expect(data.orders[0].vatAmountZar).toBeGreaterThan(0);
  });

  it('creates a new SARS-compliant proforma order with 15% VAT calculation and 24h lock', async () => {
    const payload = {
      merchantId: 'loc_sunpower_crownmines',
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
