import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, setSessionCookie, type UserRole } from '@/lib/auth';
import { verifyStoredMerchantCredential } from '@/server/merchant-credentials';
import { enforceRateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Unthrottled login is a credential-brute-force vector.
  const limited = enforceRateLimit('login', req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { email, password, role, storeId } = body;

    if (!email && !storeId) {
      return NextResponse.json({ error: 'Email or storeId required' }, { status: 400 });
    }

    const sessionPayload = verifyCredentials(
      email || '',
      password || '',
      role as UserRole | undefined,
      storeId,
      { verifyStoredCredential: verifyStoredMerchantCredential }
    );

    if (!sessionPayload) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        userId: sessionPayload.userId,
        email: sessionPayload.email,
        role: sessionPayload.role,
        merchantId: sessionPayload.merchantId,
      },
    });

    await setSessionCookie(res, sessionPayload);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
