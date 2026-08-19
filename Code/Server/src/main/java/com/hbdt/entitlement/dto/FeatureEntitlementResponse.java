package com.hbdt.entitlement.dto;

/**
 * DTO trả về cho frontend — trạng thái entitlement của 1 feature.
 */
public record FeatureEntitlementResponse(
        String featureCode,
        String featureName,
        String description,
        boolean allowed,
        Integer quotaLimit,
        String requiredPackage
) {
}
