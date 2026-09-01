package com.hbdt.entitlement.dto;

import java.util.List;

/**
 * Response DTO cho toàn bộ ma trận feature matrix.
 * Bao gồm danh sách features và danh sách mappings theo từng plan.
 */
public record FeatureMatrixResponse(
        List<FeatureResponse> features,
        List<PlanFeatureMapping> plans
) {
    public record PlanFeatureMapping(
            Long planId,
            String planCode,
            String planName,
            List<FeatureMappingEntry> mappings
    ) {
    }

    public record FeatureMappingEntry(
            Long featureId,
            String featureCode,
            boolean mapped,
            Boolean enabled,
            Integer quotaLimit
    ) {
    }
}
