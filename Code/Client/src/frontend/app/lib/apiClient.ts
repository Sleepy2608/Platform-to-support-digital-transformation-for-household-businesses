/**
 * apiClient.ts
 * Centralized HTTP client with automatic JWT refresh token handling.
 *
 * Usage:
 *   import { apiClient } from '@/app/lib/apiClient';
 *   const data = await apiClient.get('/api/owner/profile');
 *   await apiClient.post('/api/owner/password', { currentPassword, newPassword, confirmPassword });
 */

const BASE_URL = 'http://localhost:8080';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('fullName');
  localStorage.removeItem('roles');
  localStorage.removeItem('email');
  localStorage.removeItem('avatarUrl');
  localStorage.removeItem('businessId');
}

export function saveAuthData(data: {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  businessId?: number | null;
  avatarUrl?: string | null;
}) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', String(data.userId));
  localStorage.setItem('username', data.username);
  localStorage.setItem('fullName', data.fullName || '');
  localStorage.setItem('email', data.email || '');
  localStorage.setItem('roles', JSON.stringify(data.roles || []));
  localStorage.setItem('businessId', String(data.businessId ?? ''));
  localStorage.setItem('avatarUrl', data.avatarUrl || '');
}

// ─── Token refresh ────────────────────────────────────────────────────────────

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

async function attemptRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const json = await res.json();
  const { accessToken, refreshToken: newRefresh } = json.data;
  saveTokens(accessToken, newRefresh);
  return accessToken;
}

// ─── Core request function ────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders = {}, ...rest } = options;

  const buildHeaders = (token?: string | null): HeadersInit => {
    const h: Record<string, string> = {
      ...(customHeaders as Record<string, string>),
    };
    if (token) h['Authorization'] = `Bearer ${token}`;
    // Don't set Content-Type for FormData (browser handles boundary)
    if (!(body instanceof FormData)) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  };

  const buildBody = () => {
    if (body === undefined || body === null) return undefined;
    if (body instanceof FormData) return body;
    return JSON.stringify(body);
  };

  const doFetch = (token?: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders(skipAuth ? undefined : token),
      body: buildBody(),
    });

  // First attempt
  let response = await doFetch(skipAuth ? null : getAccessToken());

  // Handle 401/403 — token het han (Spring Security tra 403), thu refresh 1 lan
  if ((response.status === 401 || response.status === 403) && !skipAuth && getRefreshToken()) {
    if (isRefreshing) {
      // Queue this request until refresh is done
      const newToken = await new Promise<string>((resolve, reject) => {
        pendingRequests.push((token) => resolve(token));
        setTimeout(() => reject(new Error('Refresh timeout')), 10000);
      });
      response = await doFetch(newToken);
    } else {
      isRefreshing = true;
      try {
        const newToken = await attemptRefresh();
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];
        isRefreshing = false;
        response = await doFetch(newToken);
      } catch {
        isRefreshing = false;
        pendingRequests = [];
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
    }
  }

  // Parse JSON response
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return undefined as T;
  }

  const json = await response.json();

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Phiên đăng nhập hết hạn hoặc bạn không có quyền thực hiện. Vui lòng đăng nhập lại!');
    }
    throw new Error(json.message || `HTTP ${response.status}`);
  }

  return json.data as T;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),

  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE', body }),

  /** For multipart form uploads */
  upload: <T = unknown>(path: string, formData: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: formData }),
};
