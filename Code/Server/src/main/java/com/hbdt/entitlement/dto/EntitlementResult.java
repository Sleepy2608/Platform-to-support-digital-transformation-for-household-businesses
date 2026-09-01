package com.hbdt.entitlement.dto;

/**
 * Kết quả kiểm tra quyền truy cập feature.
 * Được trả về bởi FeatureEntitlementService.checkEntitlement().
 */
public record EntitlementResult(
        boolean allowed,
        String featureCode,
        Integer quotaLimit,
        String denyReason,
        String requiredPackage
) {
    public static EntitlementResult allowed(String featureCode, Integer quotaLimit) {
        return new EntitlementResult(true, featureCode, quotaLimit, null, null);
    }

    public static EntitlementResult denied(String featureCode, String reason, String requiredPackage) {
        return new EntitlementResult(false, featureCode, null, reason, requiredPackage);
    }
}
