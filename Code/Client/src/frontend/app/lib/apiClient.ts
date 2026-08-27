/**
 * apiClient.ts
 * Centralized HTTP client with automatic JWT refresh token handling and multi-tab auth synchronization.
 */

const BASE_URL = 'http://localhost:8080';

const AUTH_STORAGE_KEYS = [
  'accessToken', 'refreshToken', 'userId', 'username',
  'fullName', 'email', 'roles', 'businessId', 'avatarUrl',
] as const;

const AUTH_SYNC_STORAGE_KEY = 'hbdt:auth-sync';
const AUTH_SYNC_CHANNEL = 'hbdt-auth';

export type AuthSyncEventType = 'signed-in' | 'signed-out' | 'tokens-refreshed';

export interface AuthSyncEvent {
  id: string;
  type: AuthSyncEventType;
  timestamp: number;
}

function createAuthSyncEvent(type: AuthSyncEventType): AuthSyncEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    timestamp: Date.now(),
  };
}

function publishAuthSync(type: AuthSyncEventType) {
  if (typeof window === 'undefined') return;

  const event = createAuthSyncEvent(type);
  try {
    localStorage.setItem(AUTH_SYNC_STORAGE_KEY, JSON.stringify(event));
  } catch {
    // BroadcastChannel can still synchronize tabs when storage is unavailable.
  }

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      channel.postMessage(event);
      channel.close();
    } catch {
      // localStorage remains the compatibility fallback.
    }
  }
}

function setAuthCookies(accessToken: string, roles: string[] = []) {
  const maxAge = 60 * 60 * 24;
  const role = roles.includes('ADMIN')
    ? 'ADMIN'
    : roles.includes('MANAGER')
      ? 'MANAGER'
      : roles.includes('BUSINESS_OWNER')
        ? 'BUSINESS_OWNER'
        : roles.includes('EMPLOYEE')
          ? 'EMPLOYEE'
          : '';

  document.cookie = `auth_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `auth_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookies() {
  document.cookie = 'auth_token=; max-age=0; path=/';
  document.cookie = 'auth_role=; max-age=0; path=/';
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Tự động khôi phục sessionStorage cho tab mới từ localStorage (nếu có).
 * Giúp người dùng mở tab mới hay gõ URL trực tiếp không bị mất phiên làm việc.
 */
export function initTabSessionIfNeeded() {
  if (typeof window === 'undefined') return;
  if (!sessionStorage.getItem('accessToken') && localStorage.getItem('accessToken')) {
    AUTH_STORAGE_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) sessionStorage.setItem(k, val);
    });
  }
}

/** Replace this tab's auth snapshot with the shared auth snapshot. */
export function syncTabSessionFromSharedStorage() {
  if (typeof window === 'undefined') return;

  AUTH_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value === null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  });
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  initTabSessionIfNeeded();
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  initTabSessionIfNeeded();
  return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
}

export function getAuthItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  initTabSessionIfNeeded();
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('accessToken', accessToken);
  sessionStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  const rolesRaw = localStorage.getItem('roles');
  let roles: string[] = [];
  try {
    const parsedRoles: unknown = rolesRaw ? JSON.parse(rolesRaw) : [];
    roles = Array.isArray(parsedRoles)
      ? parsedRoles.filter((role): role is string => typeof role === 'string')
      : [];
  } catch {
    // Invalid roles are handled by protected layouts.
  }
  setAuthCookies(accessToken, roles);
  publishAuthSync('tokens-refreshed');
}

export function clearAuth(options: { broadcast?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  AUTH_STORAGE_KEYS.forEach((k) => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
  clearAuthCookies();

  if (options.broadcast !== false) {
    publishAuthSync('signed-out');
  }
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
  if (typeof window === 'undefined') return;
  const items: Record<string, string> = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: String(data.userId),
    username: data.username,
    fullName: data.fullName || '',
    email: data.email || '',
    roles: JSON.stringify(data.roles || []),
    businessId: String(data.businessId ?? ''),
    avatarUrl: data.avatarUrl || '',
  };
  Object.entries(items).forEach(([k, v]) => {
    sessionStorage.setItem(k, v);
    localStorage.setItem(k, v);
  });
  setAuthCookies(data.accessToken, data.roles || []);
  publishAuthSync('signed-in');
}

export const authSyncConfig = {
  channelName: AUTH_SYNC_CHANNEL,
  storageKey: AUTH_SYNC_STORAGE_KEY,
} as const;

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

  let response = await doFetch(skipAuth ? null : getAccessToken());

  // 401 means the access token may be expired. A 403 is an authorization or
  // subscription denial and must be shown to the user, not treated as a bad token.
  if (response.status === 401 && !skipAuth && getRefreshToken()) {
    if (isRefreshing) {
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
          const pathname = window.location.pathname;
          const loginPath = pathname.startsWith('/admin')
            ? '/admin/login'
            : '/login';
          window.location.href = loginPath;
        }
        throw new Error('Session expired. Please log in again.');
      }
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return undefined as T;
  }

  const json = await response.json();

  if (!response.ok) {
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

  upload: <T = unknown>(path: string, formData: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: formData }),
};
