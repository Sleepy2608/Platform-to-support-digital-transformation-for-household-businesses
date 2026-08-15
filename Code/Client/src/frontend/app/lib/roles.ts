/**
 * roles.ts
 *
 * Định nghĩa tập trung các role trong hệ thống và các utility helper
 * để kiểm tra quyền truy cập dựa trên role từ JWT/session.
 *
 * 4 Role hệ thống:
 *   HEAD_ADMIN   – Siêu quản trị viên: seed data, create/delete Admin
 *   ADMIN        – Quản trị viên thường: quản lý Owner/hệ thống, không seed/create/delete Admin
 *   BUSINESS_OWNER – Chủ hộ kinh doanh: quản lý cửa hàng, CRUD nhân viên
 *   EMPLOYEE     – Nhân viên: các nghiệp vụ được cấp quyền
 */

export type AppRole = 'HEAD_ADMIN' | 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lấy mảng role từ sessionStorage/localStorage.
 * Trả về [] nếu chưa đăng nhập hoặc parse lỗi.
 */
export function getRoles(): AppRole[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw =
      sessionStorage.getItem('roles') || localStorage.getItem('roles');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is AppRole =>
        typeof r === 'string' &&
        ['HEAD_ADMIN', 'ADMIN', 'BUSINESS_OWNER', 'EMPLOYEE'].includes(r)
    );
  } catch {
    return [];
  }
}

/** Kiểm tra user có role HEAD_ADMIN không. */
export function isHeadAdmin(roles?: AppRole[]): boolean {
  return (roles ?? getRoles()).includes('HEAD_ADMIN');
}

/** Kiểm tra user có role ADMIN (thường) không. */
export function isAdmin(roles?: AppRole[]): boolean {
  return (roles ?? getRoles()).includes('ADMIN');
}

/** Kiểm tra user có bất kỳ admin role nào (HEAD_ADMIN hoặc ADMIN). */
export function isAnyAdmin(roles?: AppRole[]): boolean {
  const r = roles ?? getRoles();
  return r.includes('HEAD_ADMIN') || r.includes('ADMIN');
}

/** Kiểm tra user có role BUSINESS_OWNER không. */
export function isOwner(roles?: AppRole[]): boolean {
  return (roles ?? getRoles()).includes('BUSINESS_OWNER');
}

/** Kiểm tra user có role EMPLOYEE không. */
export function isEmployee(roles?: AppRole[]): boolean {
  return (roles ?? getRoles()).includes('EMPLOYEE');
}

/**
 * Trả về route redirect sau khi login thành công dựa trên role.
 * Ưu tiên role cao nhất nếu user có nhiều role.
 */
export function getLoginRedirectPath(
  roles: AppRole[],
  businessId?: number | null
): string {
  if (roles.includes('HEAD_ADMIN')) return '/admin';
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('BUSINESS_OWNER')) {
    return businessId ? '/owner/account' : '/onboarding/business-profile';
  }
  if (roles.includes('EMPLOYEE')) return '/employee/account';
  return '/login';
}

/**
 * Kiểm tra role có được phép truy cập một portal nhất định không.
 * portal: 'admin' | 'owner' | 'employee'
 */
export function canAccessPortal(
  portal: 'admin' | 'owner' | 'employee',
  roles?: AppRole[]
): boolean {
  const r = roles ?? getRoles();
  switch (portal) {
    case 'admin':
      return r.includes('HEAD_ADMIN') || r.includes('ADMIN');
    case 'owner':
      return r.includes('BUSINESS_OWNER');
    case 'employee':
      return r.includes('EMPLOYEE');
    default:
      return false;
  }
}
