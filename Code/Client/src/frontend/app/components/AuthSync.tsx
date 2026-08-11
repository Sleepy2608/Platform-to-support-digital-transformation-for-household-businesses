'use client';

import { useEffect } from 'react';
import {
  authSyncConfig,
  clearAuth,
  getAuthItem,
  syncTabSessionFromSharedStorage,
  type AuthSyncEvent,
} from '../lib/apiClient';

function isAuthSyncEvent(value: unknown): value is AuthSyncEvent {
  if (!value || typeof value !== 'object') return false;

  const event = value as Partial<AuthSyncEvent>;
  return typeof event.id === 'string'
    && typeof event.timestamp === 'number'
    && (event.type === 'signed-in'
      || event.type === 'signed-out'
      || event.type === 'tokens-refreshed');
}

function getLoginPath() {
  return window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
}

function getLandingPath() {
  const rolesRaw = getAuthItem('roles');
  let roles: string[] = [];

  try {
    const parsedRoles: unknown = rolesRaw ? JSON.parse(rolesRaw) : [];
    roles = Array.isArray(parsedRoles)
      ? parsedRoles.filter((role): role is string => typeof role === 'string')
      : [];
  } catch {
    // An invalid role snapshot will be rejected by the protected layouts.
  }

  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('BUSINESS_OWNER')) {
    return getAuthItem('businessId') ? '/owner/account' : '/onboarding/business-profile';
  }
  return '/login';
}

export default function AuthSync() {
  useEffect(() => {
    syncTabSessionFromSharedStorage();

    const processedEvents = new Set<string>();

    const handleAuthEvent = (event: AuthSyncEvent) => {
      if (processedEvents.has(event.id)) return;
      processedEvents.add(event.id);

      if (event.type === 'signed-out') {
        clearAuth({ broadcast: false });
        window.location.replace(getLoginPath());
        return;
      }

      syncTabSessionFromSharedStorage();

      if (event.type === 'signed-in') {
        const pathname = window.location.pathname;
        if (pathname === '/login' || pathname === '/admin/login' || pathname === '/verify-email') {
          window.location.replace(getLandingPath());
        } else if (
          pathname.startsWith('/owner')
          || pathname.startsWith('/admin')
          || pathname.startsWith('/onboarding')
        ) {
          window.location.reload();
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== authSyncConfig.storageKey || !event.newValue) return;

      try {
        const authEvent: unknown = JSON.parse(event.newValue);
        if (isAuthSyncEvent(authEvent)) handleAuthEvent(authEvent);
      } catch {
        // Ignore malformed events from manually modified localStorage.
      }
    };

    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(authSyncConfig.channelName);
      channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        if (isAuthSyncEvent(event.data)) handleAuthEvent(event.data);
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, []);

  return null;
}
