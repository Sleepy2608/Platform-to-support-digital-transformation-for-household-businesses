import { useEntitlementContext, type FeatureEntitlement } from './EntitlementContext';

/**
 * Custom hook để kiểm tra quyền truy cập 1 feature cụ thể.
 *
 * Ví dụ:
 * ```tsx
 * const { allowed, quotaLimit, isLoading } = useEntitlement('EMPLOYEE_MANAGEMENT');
 * ```
 */
export function useEntitlement(featureCode: string): {
  /** Feature có được phép sử dụng không */
  allowed: boolean;
  /** Giới hạn quota (null = không giới hạn) */
  quotaLimit: number | null;
  /** Đang tải entitlements */
  isLoading: boolean;
  /** Package cần thiết nếu feature bị khóa */
  requiredPackage: string | null;
  /** Tên hiển thị của feature */
  featureName: string | null;
  /** Mô tả feature */
  description: string | null;
  /** Full entitlement data */
  entitlement: FeatureEntitlement | undefined;
} {
  const ctx = useEntitlementContext();

  const entitlement = ctx.getEntitlement(featureCode);

  return {
    allowed: entitlement?.allowed ?? false,
    quotaLimit: entitlement?.quotaLimit ?? null,
    isLoading: ctx.isLoading,
    requiredPackage: entitlement?.requiredPackage ?? null,
    featureName: entitlement?.featureName ?? null,
    description: entitlement?.description ?? null,
    entitlement,
  };
}
