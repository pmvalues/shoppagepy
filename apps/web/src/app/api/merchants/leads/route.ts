import { NextRequest, NextResponse } from 'next/server';
import { createReferralLead, getLeadById, getLeadsByMerchant, updateLeadStatus } from '@/server/referral-lead-store';
import { appendReferralEvent, createReferralEvent } from '@/server/action-ledger';
import { rateLimit, clientIp } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Referral lead intake + retrieval API (/api/merchants/leads).
 *
 * The missing inbound path for the Merchant Centre: every buyer intent routed
 * to a merchant becomes a lead here so the merchant dashboard reflects real
 * demand. No order/invoice semantics — Shoppage refers, the merchant transacts.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit('leads:' + ip, 120, 60_000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const merchantId = String(body?.merchantId || '').trim();
    const intentAction = String(body?.intentAction || 'whatsapp').trim();
    const allowedActions = ['whatsapp', 'call', 'directions', 'quote', 'rfq'];
    const allowedSources = ['trade_inquiry', 'merchant_page', 'search', 'short', 'market', 'rfq'];

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }
    if (!allowedActions.includes(intentAction)) {
      return NextResponse.json({ error: 'intentAction must be whatsapp/call/directions/quote/rfq' }, { status: 400 });
    }

    // Emit the routing event into the action ledger first.
    const event = createReferralEvent({
      country: 'ZA',
      sessionFingerprint: 'lead_' + (body?.buyerPhone || 'anonymous'),
      action: intentAction === 'quote' || intentAction === 'rfq' ? 'quote_submitted' : 'whatsapp_start',
      merchantRef: merchantId,
      variantRef: body?.productSummary ? String(body.productSummary).slice(0, 120) : undefined,
      metadata: { source: body?.source || 'trade_inquiry' },
    });

    const lead = createReferralLead({
      merchantId,
      merchantName: body?.merchantName ? String(body.merchantName) : undefined,
      buyerName: String(body?.buyerName || 'Trade Buyer').trim(),
      buyerPhone: String(body?.buyerPhone || '').trim(),
      buyerEmail: body?.buyerEmail ? String(body.buyerEmail) : undefined,
      productSummary: String(body?.productSummary || body?.needDescription || 'Trade inquiry').trim().slice(0, 400),
      intentAction: intentAction as any,
      source: allowedSources.includes(String(body?.source)) ? body.source : 'trade_inquiry',
      eventIds: [event.eventId],
      notes: body?.notes ? String(body.notes) : undefined,
    });

    return NextResponse.json({ success: true, lead, eventId: event.eventId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create lead', message: String(error?.message || error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId query param required' }, { status: 400 });
  }
  const leads = getLeadsByMerchant(merchantId);
  return NextResponse.json({ success: true, total: leads.length, leads });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim();
    const allowed = ['new', 'responded', 'resolved', 'closed', 'lost'];
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ error: 'id and a valid status required' }, { status: 400 });
    }

    let eventId: string | undefined;
    if (status === 'resolved') {
      const lead = getLeadById(id);
      if (lead) {
        const event = createReferralEvent({
          country: 'ZA',
          sessionFingerprint: 'merchant_' + lead.merchantId,
          action: 'buyer_resolved',
          merchantRef: lead.merchantId,
          variantRef: lead.productSummary.slice(0, 120),
          metadata: { leadId: id, capturedBy: 'merchant' },
        });
        eventId = event.eventId;
      }
    }

    const lead = updateLeadStatus(id, status as any, eventId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update lead', message: String(error?.message || error) },
      { status: 500 }
    );
  }
}
