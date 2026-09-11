import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'superadmin' | 'merchant_owner' | 'merchant_staff';

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  merchantId?: string; // Tenant scope
  issuedAt: number;
  expiresAt: number;
}

export const SESSION_COOKIE_NAME = 'shoppage_session';
const DEFAULT_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Values that are treated as known-weak and refused in production.
 * These exist because the UI quick-login surfaces show a masked placeholder.
 */
const PLACEHOLDER_PASSWORDS = new Set(['••••••••••••', 'admin123', 'password', 'changeme']);
const MIN_SECRET_LENGTH = 32;

/**
 * Detects a weak secret, including the realistic case of a placeholder padded out
 * to satisfy a minimum-length rule (e.g. "changeme".padEnd(40, 'changeme')).
 */
function isWeakSecret(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.length < MIN_SECRET_LENGTH) return true;
  for (const placeholder of PLACEHOLDER_PASSWORDS) {
    if (v.startsWith(placeholder) || v === placeholder) return true;
  }
  // Reject genuinely degenerate secrets (e.g. 'aaaa....' or 'ababab....').
  // Threshold is deliberately low: a random base64 secret sits well above it.
  const uniqueChars = new Set(v).size;
  if (uniqueChars < 6) return true;
  return false;
}

/**
 * Explicit, opt-in development authentication.
 *
 * SECURITY (WS-1.1): dev auth is NEVER inferred from `NODE_ENV` being absent or
 * anything other than exactly 'production'. An operator running `next start` without
 * NODE_ENV set must NOT silently get an open platform. It requires a deliberate
 * SHOPPAGE_ALLOW_DEV_AUTH=true, and is refused outright in production regardless.
 */
export function isDevAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.SHOPPAGE_ALLOW_DEV_AUTH === 'true';
}

function getAuthSecret(): string {
  const secret = (process.env.SHOPPAGE_AUTH_SECRET || process.env.PAYLOAD_SECRET || '').trim();

  // Production strength checks run FIRST and unconditionally — including under test —
  // so a weak production secret can never be masked by a test-environment shortcut.
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'SHOPPAGE_AUTH_SECRET (or PAYLOAD_SECRET) must be configured. ' +
          'Session tokens cannot be signed without it.'
      );
    }
    if (secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `SHOPPAGE_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`
      );
    }
    if (isWeakSecret(secret)) {
      throw new Error(
        'SHOPPAGE_AUTH_SECRET is a known placeholder, or is too low-entropy, for production. ' +
          'Generate one with: openssl rand -base64 48'
      );
    }
    return secret;
  }

  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return secret || 'test_secret_for_auth_testing_minimum_32_chars_long';
  }

  if (!secret) {
    throw new Error(
      'SHOPPAGE_AUTH_SECRET (or PAYLOAD_SECRET) must be configured. ' +
        'Session tokens cannot be signed without it.'
    );
  }

  return secret;
}

/**
 * Base64URL encoding / decoding helpers
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Native Web Crypto HMAC-SHA256 signature generator (Edge and Node.js runtime compliant)
 */
async function computeHmacSignature(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(signature).toString('base64url');
}

/**
 * Signs a session payload into a tamper-proof token using Web Crypto HMAC-SHA256
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const data = base64UrlEncode(JSON.stringify(payload));
  const signature = await computeHmacSignature(getAuthSecret(), data);
  return `${data}.${signature}`;
}

/**
 * Verifies and parses a signed session token. Returns null if invalid or expired.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  try {
    const expectedSig = await computeHmacSignature(getAuthSecret(), data);

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) {
      return null;
    }

    // Constant-time comparison
    let mismatch = 0;
    for (let i = 0; i < sigBuf.length; i++) {
      mismatch |= sigBuf[i] ^ expBuf[i];
    }
    if (mismatch !== 0) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(data));
    const now = Date.now();

    if (payload.expiresAt && now > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from an incoming HTTP request
 */
export async function getSessionFromRequest(req: Request | NextRequest): Promise<SessionPayload | null> {
  let token: string | null = null;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    const cookie = (req as NextRequest).cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) {
      token = cookie.value;
    }
  }

  if (!token) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c) => c.trim());
      for (const c of cookies) {
        if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
          token = decodeURIComponent(c.substring(SESSION_COOKIE_NAME.length + 1));
          break;
        }
      }
    }
  }

  if (!token) return null;
  return verifySession(token);
}

/**
 * Sets an HttpOnly, Secure, SameSite session cookie on a NextResponse
 */
export async function setSessionCookie(
  res: NextResponse,
  payload: SessionPayload,
  maxAgeMs = DEFAULT_SESSION_DURATION
): Promise<void> {
  const token = await signSession(payload);
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  });
}

/**
 * Clears the session cookie on a NextResponse
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Constant-time string comparison to avoid leaking credential length/content via timing.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export interface VerifyCredentialOptions {
  verifyStoredCredential?: (storeId: string, password: string) => boolean;
}

/**
 * Validates credentials for admin and merchant users.
 *
 * SECURITY (WS-1.1) — the fix for the P0 dev-auth bypass:
 *  1. Dev mode requires the explicit SHOPPAGE_ALLOW_DEV_AUTH=true opt-in.
 *  2. A missing merchant secret NO LONGER falls through to "any password".
 *  3. In production, a merchant without a configured secret cannot authenticate at all.
 *  4. All credential comparisons are constant-time.
 *  5. A placeholder or too-short production password is refused (fail closed).
 *
 * `options.verifyStoredCredential` is injected by the Node-runtime login route;
 * this module itself is bundled for the Edge runtime and must stay dependency-free.
 */
export function verifyCredentials(
  email: string,
  pass: string,
  targetRole?: UserRole,
  storeId?: string,
  options?: VerifyCredentialOptions
): SessionPayload | null {
  const normalizedEmail = email.trim().toLowerCase();
  const password = pass.trim();
  const now = Date.now();
  const devAuth = isDevAuthEnabled();

  const superAdminEmail = (process.env.SHOPPAGE_ADMIN_EMAIL || 'admin@shoppage.co.za').toLowerCase();
  const superAdminPass = (process.env.SHOPPAGE_ADMIN_PASSWORD || '').trim();

  // ---------------------------------------------------------------------------
  // 1. SuperAdmin
  // ---------------------------------------------------------------------------
  // Only attempt the superadmin path when the caller is asking for a privileged
  // platform role. A login explicitly requesting `merchant_*` must never be
  // satisfied by platform-admin credentials (privilege confusion).
  const requestsSuperAdmin = targetRole === undefined || targetRole === 'superadmin';

  if (requestsSuperAdmin && (superAdminPass || devAuth)) {
    if (process.env.NODE_ENV === 'production' && superAdminPass) {
      if (superAdminPass.length < 12 || PLACEHOLDER_PASSWORDS.has(superAdminPass.toLowerCase())) {
        // Fail closed: a weak production superadmin password is a deployment error.
        throw new Error(
          'SHOPPAGE_ADMIN_PASSWORD is weak or a known placeholder. Rotate it before deploying.'
        );
      }
    }

    const passwordMatches = superAdminPass
      ? safeEqual(password, superAdminPass)
      : false;

    // Dev-only convenience. Reached ONLY when SHOPPAGE_ALLOW_DEV_AUTH=true.
    const devMatch = devAuth && PLACEHOLDER_PASSWORDS.has(password.toLowerCase());

    if (
      (passwordMatches || devMatch) &&
      normalizedEmail === superAdminEmail
    ) {
      return {
        userId: 'usr_superadmin_01',
        email: normalizedEmail,
        role: 'superadmin',
        issuedAt: now,
        expiresAt: now + DEFAULT_SESSION_DURATION,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Merchant
  // ---------------------------------------------------------------------------
  const merchantSecret = storeId
    ? (
        process.env['SHOPPAGE_MERCHANT_SECRET_' + storeId.toUpperCase().replace(/[^A-Z0-9]/g, '_')] || ''
      ).trim()
    : '';

  const isMerchantRole = targetRole === 'merchant_owner' || targetRole === 'merchant_staff';

  if (storeId && isMerchantRole) {
    let authenticated = false;

    if (merchantSecret) {
      // Real credential path.
      if (process.env.NODE_ENV === 'production') {
        if (
          merchantSecret.length < 12 ||
          PLACEHOLDER_PASSWORDS.has(merchantSecret.toLowerCase())
        ) {
          throw new Error(
            `Merchant secret for store "${storeId}" is weak or a known placeholder. Rotate it before deploying.`
          );
        }
      }
      // A merchant must not be able to authenticate with the platform admin password,
      // nor with the platform admin email as a merchant identity.
      const isAdminCredentialReuse =
        (superAdminPass && safeEqual(password, superAdminPass)) ||
        normalizedEmail === superAdminEmail;

      if (!isAdminCredentialReuse && safeEqual(password, merchantSecret)) {
        authenticated = true;
      }
    } else if (devAuth) {
      // Dev-only: a store with no configured secret is open ONLY under the explicit flag.
      authenticated = PLACEHOLDER_PASSWORDS.has(password.toLowerCase());
    } else {
      authenticated = options?.verifyStoredCredential
        ? options.verifyStoredCredential(storeId, password)
        : false;
    }
    // NOTE: with no env secret, no stored credential and dev auth off,
    // `authenticated` stays false — the previously-open hole remains closed.

    if (authenticated) {
      return {
        userId: 'usr_' + storeId,
        email: normalizedEmail,
        role: targetRole as UserRole,
        merchantId: storeId,
        issuedAt: now,
        expiresAt: now + DEFAULT_SESSION_DURATION,
      };
    }
  }

  return null;
}
