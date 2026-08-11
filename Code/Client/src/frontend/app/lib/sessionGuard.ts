/**
 * sessionGuard.ts
 *
 * Tiện ích hỗ trợ kiểm tra và quản lý phiên làm việc độc lập theo Tab (sessionStorage).
 * Với sessionStorage, trình duyệt tự động cách ly vùng nhớ của từng tab,
 * giúp hỗ trợ đa tài khoản trên nhiều tab mà không bị xung đột.
 */

export interface TabSessionInfo {
  username: string | null;
  userId: string | null;
  roles: string[];
}

/**
 * Lấy thông tin session hiện tại của tab từ sessionStorage.
 */
export function getTabSessionInfo(): TabSessionInfo {
  if (typeof window === 'undefined') {
    return { username: null, userId: null, roles: [] };
  }
  try {
    const rolesRaw = sessionStorage.getItem('roles');
    return {
      username: sessionStorage.getItem('username'),
      userId: sessionStorage.getItem('userId'),
      roles: rolesRaw ? JSON.parse(rolesRaw) : [],
    };
  } catch {
    return { username: null, userId: null, roles: [] };
  }
}

/**
 * Kiểm tra xem tab hiện tại đã được đăng nhập hay chưa.
 */
export function isTabLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem('accessToken'));
}
