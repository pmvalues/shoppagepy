import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordBillingEvent, applySubscriptionTransition } from '@/server/billing-store';

/**
 * Paystack & Stripe Subscription Webhook Handler
 * Processes subscription creation, recurring renewals, and charge completions.
 * Enforces HMAC SHA-512 signature validation and idempotent event persistence:
 * every verified event is recorded exactly once (duplicate deliveries are
 * ignored) and subscription state transitions are applied for entitlement checks.
 */

const SUBSCRIPTION_STATUS_BY_EVENT: Record<string, string> = {
  'charge.success': 'active',
  'invoice.payment_succeeded': 'active',
  'subscription.create': 'active',
  'subscription.disable': 'canceled',
  'customer.subscription.deleted': 'canceled',
};

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');
    const stripeSignature = req.headers.get('stripe-signature');

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let verified = false;
    let provider = 'unknown';

    // 1. Verify Paystack HMAC-SHA512
    if (paystackSignature && paystackSecret) {
      const hash = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');
      if (hash === paystackSignature) {
        verified = true;
        provider = 'paystack';
      }
    }

    // 2. Verify Stripe HMAC-SHA256 (if configured). Stripe uses a timestamped
    //    signature: v1=<hmac>. Without STRIPE_WEBHOOK_SECRET or a valid
    //    signature, we must reject. Never trust an unverified Stripe event.
    if (!verified && stripeSignature && stripeSecret) {
      const parts = String(stripeSignature).split(',');
      const tsPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1='));
      if (tsPart && sigPart) {
        const timestamp = tsPart.slice(2);
        const signedPayload = timestamp + '.' + rawBody;
        const expected = crypto.createHmac('sha256', stripeSecret).update(signedPayload).digest('hex');
        const provided = sigPart.slice(3);
        if (expected.length === provided.length) {
          let mismatch = 0;
          for (let i = 0; i < expected.length; i++) {
            mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
          }
          if (mismatch === 0) {
            verified = true;
            provider = 'stripe';
          }
        }
      }
    }

    // If local dev / staging test without keys configured, allow structured dry-run
    if (!verified && process.env.NODE_ENV !== 'production') {
      verified = true;
      provider = 'dev_mock';
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}') as any;
    const event = payload.event || payload.type || 'charge.success';
    const data = payload?.data || {};

    const subscriptionRef = pickString(
      data?.subscription_code,
      data?.object?.subscription,
      data?.object?.id
    );
    const customerRef = pickString(
      data?.customer?.email,
      data?.customer?.customer_code,
      data?.object?.customer
    );
    const planRef = pickString(data?.plan?.plan_code, data?.plan?.id);
    const eventId = pickString(payload?.id, data?.id);

    const eventKey = eventId
      ? `${provider}:${eventId}`
      : `${provider}:${crypto.createHash('sha256').update(rawBody).digest('hex')}`;

    const persistence = recordBillingEvent({
      eventKey,
      provider,
      eventType: event,
      subscriptionRef,
      customerRef,
    });

    const nextStatus = SUBSCRIPTION_STATUS_BY_EVENT[event];
    let subscriptionApplied = false;
    if (!persistence.duplicate && nextStatus && subscriptionRef) {
      subscriptionApplied = applySubscriptionTransition({
        provider,
        subscriptionRef,
        status: nextStatus,
        customerRef,
        planRef,
      });
    }

    const base = {
      received: true,
      provider,
      event,
      duplicate: persistence.duplicate,
      stored: persistence.stored,
      subscriptionApplied,
    };

    switch (event) {
      case 'charge.success':
      case 'invoice.payment_succeeded':
      case 'subscription.create':
        return NextResponse.json({
          ...base,
          status: 'processed',
          timestamp: new Date().toISOString(),
        });

      case 'subscription.disable':
      case 'customer.subscription.deleted':
        return NextResponse.json({
          ...base,
          status: 'deactivated',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          ...base,
          status: 'ignored_unsupported_event',
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 400 }
    );
  }
}
