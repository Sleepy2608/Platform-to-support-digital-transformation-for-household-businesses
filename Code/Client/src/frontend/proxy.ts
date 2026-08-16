import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * proxy.ts
 * Next.js 16 Edge Proxy — protects /admin/*, /owner/*, and /employee/* routes.
 * In Next.js 16, proxy function must be exported as `proxy` or `default`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authRole = request.cookies.get('auth_role')?.value ?? '';
  const authToken = request.cookies.get('auth_token')?.value ?? '';

  // ── /admin/* ────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isAdminRole = authRole === 'ADMIN';
    if (!authToken || !isAdminRole) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ── /admin/seed – chỉ ADMIN ─────────────────────────────────────────
  if (pathname.startsWith('/admin/seed')) {
    if (authRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Protect /manager/* routes (MANAGER only)
  if (pathname.startsWith('/manager')) {
    if (!authToken || authRole !== 'MANAGER') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Allow public employee login route
  if (pathname === '/employee/login') {
    return NextResponse.next();
  }

  // Protect /owner/* routes (BUSINESS_OWNER only)
  if (pathname.startsWith('/owner')) {
    if (!authToken || authRole !== 'BUSINESS_OWNER') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect /employee/* routes (EMPLOYEE only)
  if (pathname.startsWith('/employee')) {
    if (!authToken || authRole !== 'EMPLOYEE') {
      const loginUrl = new URL('/employee/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/owner/:path*',
    '/employee/:path*',
  ],
};
