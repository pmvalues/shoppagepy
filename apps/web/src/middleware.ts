import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Guard Platform SuperAdmin Dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'superadmin') {
      const loginUrl = new URL('/admin', req.url);
      loginUrl.searchParams.set('error', 'unauthorized_superadmin');
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Guard Merchant Centre OS Dashboard
  if (pathname.startsWith('/merchant/dashboard')) {
    const session = await getSessionFromRequest(req);
    if (
      !session ||
      (session.role !== 'merchant_owner' &&
        session.role !== 'merchant_staff' &&
        session.role !== 'superadmin')
    ) {
      const loginUrl = new URL('/admin', req.url);
      loginUrl.searchParams.set('error', 'unauthorized_merchant');
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Enforce Tenant Isolation: Ensure merchant can only access their assigned store
    const requestedStore = searchParams.get('store');
    if (
      session.role !== 'superadmin' &&
      requestedStore &&
      session.merchantId &&
      requestedStore !== session.merchantId
    ) {
      // Redirect to their own authorized store dashboard
      const correctUrl = new URL('/merchant/dashboard', req.url);
      correctUrl.searchParams.set('store', session.merchantId);
      return NextResponse.redirect(correctUrl);
    }

    return NextResponse.next();
  }

  // 3. Guard CSV Bulk Import Endpoint
  if (pathname.startsWith('/api/cms/import')) {
    const session = await getSessionFromRequest(req);
    const adminToken = (req.headers.get('x-admin-token') || '').trim();
    const expectedToken = (process.env.SHOPPAGE_ADMIN_TOKEN || '').trim();

    const isTokenAuthorized = expectedToken.length > 0 && adminToken === expectedToken;
    const isSessionAuthorized = session && session.role === 'superadmin';

    if (!isTokenAuthorized && !isSessionAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: SuperAdmin session or valid x-admin-token required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Guard Privileged CMS Mutations (POST, PUT, DELETE)
  if (pathname.startsWith('/api/cms/')) {
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized: Active session required for CMS mutations' },
          { status: 401 }
        );
      }

      // Add verified session headers for downstream route handlers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-auth-user-id', session.userId);
      requestHeaders.set('x-auth-user-role', session.role);
      if (session.merchantId) {
        requestHeaders.set('x-auth-merchant-id', session.merchantId);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/merchant/dashboard/:path*',
    '/api/cms/:path*',
  ],
};
