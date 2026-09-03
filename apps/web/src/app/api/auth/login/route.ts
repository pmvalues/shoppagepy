import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, setSessionCookie, type UserRole } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
      storeId
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
