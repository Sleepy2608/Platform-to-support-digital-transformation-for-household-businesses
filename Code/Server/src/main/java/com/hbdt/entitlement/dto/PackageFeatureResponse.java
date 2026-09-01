package com.hbdt.entitlement.dto;

/**
 * Response DTO cho package-feature mapping (ma trận feature matrix).
 */
public record PackageFeatureResponse(
        Long id,
        Long planId,
        String planCode,
        String planName,
        Long featureId,
        String featureCode,
        String featureName,
        Boolean enabled,
        Integer quotaLimit
) {
}
