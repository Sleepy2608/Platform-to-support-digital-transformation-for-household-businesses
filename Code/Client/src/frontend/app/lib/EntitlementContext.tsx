'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, getAuthItem } from './apiClient';
import { getRoles } from './roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeatureEntitlement {
  featureCode: string;
  featureName: string;
  description: string | null;
  allowed: boolean;
  quotaLimit: number | null;
  requiredPackage: string | null;
}

interface EntitlementContextType {
  /** Map of featureCode → entitlement data */
  entitlements: Map<string, FeatureEntitlement>;
  /** Whether entitlements are still loading */
  isLoading: boolean;
  /** Whether initial load encountered an error */
  hasError: boolean;
  /** Check if user has access to a specific feature */
  hasFeature: (featureCode: string) => boolean;
  /** Get quota limit for a feature (null = unlimited) */
  getQuota: (featureCode: string) => number | null;
  /** Get entitlement data for a specific feature */
  getEntitlement: (featureCode: string) => FeatureEntitlement | undefined;
  /** Force refresh entitlements from server */
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<Map<string, FeatureEntitlement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchEntitlements = useCallback(async () => {
    try {
      // Determine API path based on role
      const roles = getRoles();
      const isOwner = roles.includes('BUSINESS_OWNER');
      const isEmp = roles.includes('EMPLOYEE');

      if (!isOwner && !isEmp) {
        // Admin/Manager — no entitlement restrictions
        setEntitlements(new Map());
        setIsLoading(false);
        return;
      }

      const path = isOwner ? '/api/owner/entitlements' : '/api/employee/entitlements';
      const data = await apiClient.get<FeatureEntitlement[]>(path);

      if (Array.isArray(data)) {
        const map = new Map<string, FeatureEntitlement>();
        for (const item of data) {
          map.set(item.featureCode, item);
        }
        setEntitlements(map);
        setHasError(false);
      }
    } catch (err) {
      console.error('[Entitlement] Failed to fetch entitlements:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  // Auto-refresh every 60s to detect subscription changes
  useEffect(() => {
    const interval = setInterval(fetchEntitlements, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchEntitlements]);

  // Listen for subscription changes via custom event
  useEffect(() => {
    const handler = () => {
      fetchEntitlements();
    };
    window.addEventListener('subscription-changed', handler);
    return () => window.removeEventListener('subscription-changed', handler);
  }, [fetchEntitlements]);

  const hasFeature = useCallback(
    (featureCode: string) => {
      const entry = entitlements.get(featureCode);
      return entry?.allowed ?? false;
    },
    [entitlements]
  );

  const getQuota = useCallback(
    (featureCode: string) => {
      const entry = entitlements.get(featureCode);
      return entry?.quotaLimit ?? null;
    },
    [entitlements]
  );

  const getEntitlement = useCallback(
    (featureCode: string) => entitlements.get(featureCode),
    [entitlements]
  );

  const contextValue = useMemo<EntitlementContextType>(
    () => ({
      entitlements,
      isLoading,
      hasError,
      hasFeature,
      getQuota,
      getEntitlement,
      refresh: fetchEntitlements,
    }),
    [entitlements, isLoading, hasError, hasFeature, getQuota, getEntitlement, fetchEntitlements]
  );

  return (
    <EntitlementContext.Provider value={contextValue}>
      {children}
    </EntitlementContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the entitlement context.
 * Must be used within an EntitlementProvider.
 */
export function useEntitlementContext(): EntitlementContextType {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    throw new Error('useEntitlementContext must be used within an EntitlementProvider');
  }
  return ctx;
}
