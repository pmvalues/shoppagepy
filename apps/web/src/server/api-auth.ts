import { NextResponse } from 'next/server';
import { getSessionFromRequest, type SessionPayload } from '@/lib/auth';

/**
 * Shared route-handler authorization (WS-1.6).
 *
 * Before this module, only /api/cms/* mutations and the two dashboards checked
 * for a session. Merchant, ops and ingestion endpoints were publicly callable.
 * Every privileged route handler must now call one of these helpers:
 *
 *   const auth = await requireMerchantScope(req, requestedMerchantId);
 *   if (!auth.ok) return auth.response;
 *   // auth.merchantId is the tenant the caller is allowed to act on
 *
 * Roles:
 *   - superadmin     : platform operator (all tenants)
 *   - merchant_owner : tenant owner (own merchant only)
 *   - merchant_staff : tenant member (own merchant only)
 *
 * Machine-to-machine callers (ops scripts, cron) authenticate with the
 * `x-admin-token` header against SHOPPAGE_ADMIN_TOKEN. The token check is
 * constant-time and fails closed when the variable is unset.
 */

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export interface AuthSuccess {
  ok: true;
  session: SessionPayload;
}

export type AuthResult = AuthSuccess | AuthFailure;

export interface MerchantScopeSuccess {
  ok: true;
  session: SessionPayload;
  /** The single tenant the caller may act on (undefined for unscoped superadmins). */
  merchantId: string | undefined;
}

function unauthorized(message: string): AuthFailure {
  return { ok: false, response: NextResponse.json({ error: message }, { status: 401 }) };
}

function forbidden(message: string): AuthFailure {
  return { ok: false, response: NextResponse.json({ error: message }, { status: 403 }) };
}

/** Constant-time string comparison — avoids leaking credential content via timing. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Validates the `x-admin-token` header against SHOPPAGE_ADMIN_TOKEN.
 * Returns false when no token is configured (fail closed).
 */
export function hasValidAdminToken(req: Request): boolean {
  const expected = (process.env.SHOPPAGE_ADMIN_TOKEN || '').trim();
  if (!expected) return false;
  const provided = (req.headers.get('x-admin-token') || '').trim();
  if (!provided) return false;
  return constantTimeEqual(provided, expected);
}

/** Any authenticated session (any role). */
export async function requireSession(req: Request): Promise<AuthResult> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorized('Unauthorized: Authentication session required');
  }
  return { ok: true, session };
}

/**
 * SuperAdmin session OR a valid `x-admin-token`. Intended for platform
 * operations endpoints that are also invoked by automation.
 */
export async function requireSuperAdminOrAdminToken(req: Request): Promise<AuthResult> {
  if (hasValidAdminToken(req)) {
    const now = Date.now();
    return {
      ok: true,
      session: {
        userId: 'usr_admin_token',
        email: 'service@shoppage.local',
        role: 'superadmin',
        issuedAt: now,
        expiresAt: now,
      },
    };
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorized('Unauthorized: SuperAdmin session or valid x-admin-token required');
  }
  if (session.role !== 'superadmin') {
    return forbidden('Forbidden: SuperAdmin role required');
  }
  return { ok: true, session };
}

/** SuperAdmin session only (no machine token). */
export async function requireSuperAdmin(req: Request): Promise<AuthResult> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorized('Unauthorized: SuperAdmin session required');
  }
  if (session.role !== 'superadmin') {
    return forbidden('Forbidden: SuperAdmin role required');
  }
  return { ok: true, session };
}

/**
 * Merchant-tenant scoping.
 *
 * - superadmin      : may act on any merchantId (or none).
 * - merchant_owner  : may act ONLY on their own session.merchantId. A
 *   different requested merchantId is a cross-tenant violation -> 403.
 * - merchant_staff  : same as owner.
 * - any other role  : 403.
 */
export async function requireMerchantScope(
  req: Request,
  requestedMerchantId?: string | null
): Promise<MerchantScopeSuccess | AuthFailure> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorized('Unauthorized: Authentication session required');
  }

  const requested = (requestedMerchantId || '').trim() || undefined;

  if (session.role === 'superadmin') {
    return { ok: true, session, merchantId: requested || session.merchantId };
  }

  if (session.role !== 'merchant_owner' && session.role !== 'merchant_staff') {
    return forbidden('Forbidden: Merchant role required');
  }

  const own = session.merchantId;
  if (!own) {
    return forbidden('Forbidden: No merchant tenant associated with session');
  }
  if (requested && requested !== own) {
    return forbidden('Forbidden: Cross-tenant access blocked');
  }
  return { ok: true, session, merchantId: own };
}
