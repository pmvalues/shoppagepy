import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/merchants/claim/route';
import { verifyCredentials } from '../src/lib/auth';
import { verifyStoredMerchantCredential } from '../src/server/merchant-credentials';

const ORIGINAL_ENV = { ...process.env };

const VERIFY_OPTIONS = { verifyStoredCredential: verifyStoredMerchantCredential };

function claimRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/merchants/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Merchant claim flow provisions usable credentials', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('issues a one-time credential that authenticates the new merchant', async () => {
    const unique = 'Test Claim Store ' + Date.now();
    const res = await POST(
      claimRequest({
        businessName: unique,
        whatsappPhone: '082 555 0101',
        streetAddress: '12 Test Road, Midrand',
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.credentialIssued).toBe(true);
    expect(typeof data.credential).toBe('string');
    expect(data.credential.length).toBeGreaterThan(20);

    const session = verifyCredentials(
      'owner@example.co.za',
      data.credential,
      'merchant_owner',
      data.merchant.id,
      VERIFY_OPTIONS
    );
    expect(session).not.toBeNull();
    expect(session?.merchantId).toBe(data.merchant.id);

    const wrong = verifyCredentials(
      'owner@example.co.za',
      'not-the-credential',
      'merchant_owner',
      data.merchant.id,
      VERIFY_OPTIONS
    );
    expect(wrong).toBeNull();
  });

  it('refuses to re-claim an already-claimed merchant with 409', async () => {
    const unique = 'Reclaim Test Store ' + Date.now();
    const first = await POST(
      claimRequest({
        businessName: unique,
        whatsappPhone: '082 555 0102',
        streetAddress: '14 Test Road, Midrand',
      })
    );
    const created = await first.json();

    const second = await POST(
      claimRequest({
        merchantId: created.merchant.id,
        businessName: unique,
        whatsappPhone: '082 555 0102',
        streetAddress: '14 Test Road, Midrand',
      })
    );
    expect(second.status).toBe(409);
  });

  it('never exposes an operator-managed env secret to a claimant', async () => {
    process.env.SHOPPAGE_MERCHANT_SECRET_LOC_MITREND_MIDRAND = 'operator-managed-secret-abcdef';

    const res = await POST(
      claimRequest({
        merchantId: 'loc_mitrend_midrand',
        businessName: 'Mitrend Products',
        whatsappPhone: '082 555 0103',
        streetAddress: 'Warehouse ERF710, Midrand',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(JSON.stringify(body)).not.toContain('operator-managed-secret-abcdef');
  });
});
