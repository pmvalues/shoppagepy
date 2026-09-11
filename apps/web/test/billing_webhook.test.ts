import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/billing/webhook/route';
import { getSubscription } from '../src/server/billing-store';

function webhookRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/billing/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Billing webhook persistence', () => {
  it('persists a subscription.create event once and applies the transition', async () => {
    const ref = 'sub_test_create_' + Date.now();
    const payload = {
      event: 'subscription.create',
      data: {
        id: 'evt_' + ref,
        subscription_code: ref,
        customer: { email: 'billing@example.co.za' },
        plan: { plan_code: 'business' },
      },
    };

    const first = await POST(webhookRequest(payload));
    const firstBody = await first.json();
    expect(first.status).toBe(200);
    expect(firstBody.stored).toBe(true);
    expect(firstBody.duplicate).toBe(false);
    expect(firstBody.subscriptionApplied).toBe(true);

    const second = await POST(webhookRequest(payload));
    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);
    expect(secondBody.stored).toBe(false);
    expect(secondBody.subscriptionApplied).toBe(false);

    const sub = getSubscription('dev_mock', ref);
    expect(sub?.status).toBe('active');
    expect(sub?.planRef).toBe('business');
  });

  it('marks the subscription canceled on subscription.disable', async () => {
    const ref = 'sub_test_disable_' + Date.now();
    await POST(
      webhookRequest({
        event: 'subscription.create',
        data: { id: 'evt_c_' + ref, subscription_code: ref },
      })
    );

    const res = await POST(
      webhookRequest({
        event: 'subscription.disable',
        data: { id: 'evt_d_' + ref, subscription_code: ref },
      })
    );
    const body = await res.json();
    expect(body.status).toBe('deactivated');
    expect(getSubscription('dev_mock', ref)?.status).toBe('canceled');
  });
});
