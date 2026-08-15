import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts – Route Guard ở tầng Next.js Edge
 *
 * Kiểm tra cookie `auth_role` (được set bởi apiClient.setAuthCookies)
 * để bảo vệ các route trước khi render.
 *
 * Cookie `auth_role` có thể có các giá trị:
 *   HEAD_ADMIN | ADMIN | BUSINESS_OWNER | EMPLOYEE | (rỗng)
 *
 * Lưu ý: Đây là lớp bảo vệ bổ sung – layout useEffect cũng kiểm tra role.
 * Không thay thế backend authorization (JWT + @PreAuthorize).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authRole = request.cookies.get('auth_role')?.value ?? '';
  const authToken = request.cookies.get('auth_token')?.value ?? '';

  // ── /admin/* ────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isAdminRole = authRole === 'HEAD_ADMIN' || authRole === 'ADMIN';
    if (!authToken || !isAdminRole) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ── /admin/seed – chỉ HEAD_ADMIN ─────────────────────────────────────────
  if (pathname.startsWith('/admin/seed')) {
    if (authRole !== 'HEAD_ADMIN') {
      // ADMIN thường bị chặn từ /admin/seed, redirect về /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // ── /owner/* ────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/owner')) {
    if (!authToken || authRole !== 'BUSINESS_OWNER') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── /employee/* ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/employee') && pathname !== '/employee/login') {
    if (!authToken || authRole !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/employee/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/employee/:path*',
  ],
};
