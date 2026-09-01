package com.hbdt.entitlement.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entitlement.dto.FeatureMatrixResponse;
import com.hbdt.entitlement.dto.FeatureRequest;
import com.hbdt.entitlement.dto.FeatureResponse;
import com.hbdt.entitlement.dto.MapFeatureRequest;
import com.hbdt.entitlement.dto.PackageFeatureResponse;
import com.hbdt.entity.Feature;
import com.hbdt.entity.PackageFeature;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.repository.FeatureRepository;
import com.hbdt.repository.PackageFeatureRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Service cho Admin quản lý features và feature-package mappings.
 * Hỗ trợ:
 * - CRUD features
 * - Toggle bật/tắt feature (Dynamic Config — không cần deploy lại)
 * - Map/Unmap feature vào packages
 * - Lấy ma trận feature matrix
 */
@Service
@Transactional(readOnly = true)
public class FeatureAdminService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";

    private final FeatureRepository featureRepository;
    private final PackageFeatureRepository packageFeatureRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public FeatureAdminService(FeatureRepository featureRepository,
                                PackageFeatureRepository packageFeatureRepository,
                                SubscriptionPlanRepository subscriptionPlanRepository) {
        this.featureRepository = featureRepository;
        this.packageFeatureRepository = packageFeatureRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    // ─── Feature CRUD ─────────────────────────────────────────────────────────────

    public List<FeatureResponse> getAllFeatures() {
        return featureRepository.findAllByOrderByFeatureCodeAsc().stream()
                .map(this::toFeatureResponse)
                .toList();
    }

    public FeatureResponse getFeature(Long id) {
        return toFeatureResponse(findFeature(id));
    }

    @Transactional
    public FeatureResponse createFeature(FeatureRequest request) {
        String code = request.featureCode().trim().toUpperCase(Locale.ROOT);
        if (featureRepository.existsByFeatureCodeIgnoreCase(code)) {
            throw new BadRequestException("Mã tính năng đã tồn tại: " + code);
        }

        Feature feature = Feature.builder()
                .featureCode(code)
                .featureName(request.featureName().trim())
                .description(cleanOptional(request.description()))
                .status(normalizeStatus(request.status()))
                .build();

        return toFeatureResponse(featureRepository.save(feature));
    }

    @Transactional
    public FeatureResponse updateFeature(Long id, FeatureRequest request) {
        Feature feature = findFeature(id);
        String code = request.featureCode().trim().toUpperCase(Locale.ROOT);

        if (featureRepository.existsByFeatureCodeIgnoreCaseAndIdNot(code, id)) {
            throw new BadRequestException("Mã tính năng đã tồn tại: " + code);
        }

        feature.setFeatureCode(code);
        feature.setFeatureName(request.featureName().trim());
        feature.setDescription(cleanOptional(request.description()));
        feature.setStatus(normalizeStatus(request.status()));

        return toFeatureResponse(featureRepository.save(feature));
    }

    /**
     * Toggle bật/tắt feature — Dynamic Config, không cần deploy lại.
     */
    @Transactional
    public FeatureResponse toggleFeature(Long id) {
        Feature feature = findFeature(id);
        feature.setStatus(ACTIVE.equals(feature.getStatus()) ? INACTIVE : ACTIVE);
        return toFeatureResponse(featureRepository.save(feature));
    }

    // ─── Feature Matrix ───────────────────────────────────────────────────────────

    /**
     * Lấy ma trận feature-package: rows = plans, mỗi plan chứa danh sách features + mapping config.
     */
    public FeatureMatrixResponse getFeatureMatrix() {
        List<Feature> allFeatures = featureRepository.findAllByOrderByFeatureCodeAsc();
        List<SubscriptionPlan> allPlans = subscriptionPlanRepository.findAll();

        List<FeatureResponse> featureResponses = allFeatures.stream()
                .map(this::toFeatureResponse)
                .toList();

        List<FeatureMatrixResponse.PlanFeatureMapping> planMappings = new ArrayList<>();

        for (SubscriptionPlan plan : allPlans) {
            List<PackageFeature> mappingsForPlan = packageFeatureRepository.findAllByPlanId(plan.getId());

            List<FeatureMatrixResponse.FeatureMappingEntry> entries = new ArrayList<>();
            for (Feature feature : allFeatures) {
                Optional<PackageFeature> mapping = mappingsForPlan.stream()
                        .filter(pf -> pf.getFeature().getId().equals(feature.getId()))
                        .findFirst();

                entries.add(new FeatureMatrixResponse.FeatureMappingEntry(
                        feature.getId(),
                        feature.getFeatureCode(),
                        mapping.isPresent(),
                        mapping.map(PackageFeature::getEnabled).orElse(null),
                        mapping.map(PackageFeature::getQuotaLimit).orElse(null)
                ));
            }

            planMappings.add(new FeatureMatrixResponse.PlanFeatureMapping(
                    plan.getId(),
                    plan.getPlanCode(),
                    plan.getPlanName(),
                    entries
            ));
        }

        return new FeatureMatrixResponse(featureResponses, planMappings);
    }

    /**
     * Lấy danh sách mappings cho 1 plan cụ thể.
     */
    public List<PackageFeatureResponse> getMappingsByPlan(Long planId) {
        return packageFeatureRepository.findAllByPlanId(planId).stream()
                .map(this::toPackageFeatureResponse)
                .toList();
    }

    /**
     * Map feature vào package — tạo mới hoặc cập nhật mapping hiện có.
     */
    @Transactional
    public PackageFeatureResponse mapFeatureToPackage(MapFeatureRequest request) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.planId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói thuê bao: " + request.planId()));
        Feature feature = findFeature(request.featureId());

        // Nếu đã mapped → cập nhật config
        Optional<PackageFeature> existing = packageFeatureRepository
                .findByPlanIdAndFeatureId(request.planId(), request.featureId());

        PackageFeature mapping;
        if (existing.isPresent()) {
            mapping = existing.get();
            mapping.setEnabled(request.enabled() != null ? request.enabled() : true);
            mapping.setQuotaLimit(request.quotaLimit());
        } else {
            mapping = PackageFeature.builder()
                    .plan(plan)
                    .feature(feature)
                    .enabled(request.enabled() != null ? request.enabled() : true)
                    .quotaLimit(request.quotaLimit())
                    .build();
        }

        return toPackageFeatureResponse(packageFeatureRepository.save(mapping));
    }

    /**
     * Unmap feature khỏi package.
     */
    @Transactional
    public void unmapFeatureFromPackage(Long planId, Long featureId) {
        if (!packageFeatureRepository.existsByPlanIdAndFeatureId(planId, featureId)) {
            throw new ResourceNotFoundException("Mapping không tồn tại");
        }
        packageFeatureRepository.deleteByPlanIdAndFeatureId(planId, featureId);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────────

    private Feature findFeature(Long id) {
        return featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tính năng với ID: " + id));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return ACTIVE;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!ACTIVE.equals(normalized) && !INACTIVE.equals(normalized)) {
            throw new BadRequestException("Trạng thái phải là ACTIVE hoặc INACTIVE");
        }
        return normalized;
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private FeatureResponse toFeatureResponse(Feature feature) {
        return new FeatureResponse(
                feature.getId(),
                feature.getFeatureCode(),
                feature.getFeatureName(),
                feature.getDescription(),
                feature.getStatus(),
                feature.getCreatedAt(),
                feature.getUpdatedAt()
        );
    }

    private PackageFeatureResponse toPackageFeatureResponse(PackageFeature pf) {
        return new PackageFeatureResponse(
                pf.getId(),
                pf.getPlan().getId(),
                pf.getPlan().getPlanCode(),
                pf.getPlan().getPlanName(),
                pf.getFeature().getId(),
                pf.getFeature().getFeatureCode(),
                pf.getFeature().getFeatureName(),
                pf.getEnabled(),
                pf.getQuotaLimit()
        );
    }
}
