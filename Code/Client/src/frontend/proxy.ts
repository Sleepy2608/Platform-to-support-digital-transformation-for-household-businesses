import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * proxy.ts
 * Next.js 16 Edge Proxy — protects /owner/* and /employee/* routes.
 * In Next.js 16, proxy function must be exported as `proxy` or `default`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /owner/* routes (BUSINESS_OWNER only)
  if (pathname.startsWith('/owner')) {
    const authCookie = request.cookies.get('auth_role')?.value;
    const hasToken = request.cookies.get('auth_token')?.value;

    if (!hasToken || authCookie !== 'BUSINESS_OWNER') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Protect /employee/* routes (EMPLOYEE only)
  if (pathname.startsWith('/employee')) {
    const authCookie = request.cookies.get('auth_role')?.value;
    const hasToken = request.cookies.get('auth_token')?.value;

    if (!hasToken || authCookie !== 'EMPLOYEE') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/owner/:path*', '/employee/:path*'],
};
