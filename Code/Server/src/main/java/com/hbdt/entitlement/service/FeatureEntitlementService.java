package com.hbdt.entitlement.service;

import com.hbdt.entitlement.dto.EntitlementResult;
import com.hbdt.entitlement.dto.FeatureEntitlementResponse;
import com.hbdt.entity.Feature;
import com.hbdt.entity.PackageFeature;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.FeatureRepository;
import com.hbdt.repository.PackageFeatureRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service chuyên trách xử lý logic kiểm tra quyền truy cập feature
 * dựa trên subscription package hiện tại của Owner.
 *
 * Security: Employee gọi API cũng bị giới hạn bởi entitlement của Owner
 * (thông qua resolveBusinessId → cùng businessId).
 */
@Service
@Transactional(readOnly = true)
public class FeatureEntitlementService {

    private static final Logger logger = LoggerFactory.getLogger(FeatureEntitlementService.class);
    private static final String FEATURE_ACTIVE = "ACTIVE";
    private static final SubscriptionStatus ACTIVE_SUBSCRIPTION_STATUS = SubscriptionStatus.ACTIVE;

    private final SubscriptionRepository subscriptionRepository;
    private final PackageFeatureRepository packageFeatureRepository;
    private final FeatureRepository featureRepository;

    public FeatureEntitlementService(SubscriptionRepository subscriptionRepository,
                                     PackageFeatureRepository packageFeatureRepository,
                                     FeatureRepository featureRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.packageFeatureRepository = packageFeatureRepository;
        this.featureRepository = featureRepository;
    }

    /**
     * Kiểm tra Owner (hoặc Employee thuộc Owner) có quyền sử dụng feature hay không.
     *
     * @param businessId ID của business (resolve từ authenticated user, KHÔNG từ request body)
     * @param featureCode Mã feature cần kiểm tra
     * @return EntitlementResult chứa kết quả allowed/denied
     */
    public EntitlementResult checkEntitlement(Long businessId, String featureCode) {
        if (businessId == null) {
            return EntitlementResult.denied(featureCode,
                    "Tài khoản chưa được liên kết với hộ kinh doanh nào", null);
        }

        // 1. Kiểm tra feature có tồn tại và active không
        Optional<Feature> featureOpt = featureRepository.findByFeatureCode(featureCode);
        if (featureOpt.isEmpty()) {
            logger.warn("Feature code '{}' not found in system", featureCode);
            return EntitlementResult.denied(featureCode,
                    "Tính năng không tồn tại trong hệ thống", null);
        }

        Feature feature = featureOpt.get();
        if (!FEATURE_ACTIVE.equals(feature.getStatus())) {
            return EntitlementResult.denied(featureCode,
                    "Tính năng đang bị tắt bởi hệ thống", null);
        }

        // 2. Tìm subscription ACTIVE của business
        Optional<Subscription> subscriptionOpt = subscriptionRepository
                .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, ACTIVE_SUBSCRIPTION_STATUS);

        if (subscriptionOpt.isEmpty()) {
            return EntitlementResult.denied(featureCode,
                    "Chưa có gói thuê bao đang hoạt động. Vui lòng đăng ký gói dịch vụ.", "VIP");
        }

        Subscription subscription = subscriptionOpt.get();

        // 3. Validate subscription chưa hết hạn
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(LocalDate.now())) {
            return EntitlementResult.denied(featureCode,
                    "Gói thuê bao đã hết hạn. Vui lòng gia hạn.", null);
        }

        // 4. Kiểm tra feature có nằm trong package không
        Optional<PackageFeature> mappingOpt = packageFeatureRepository
                .findByPlanIdAndFeatureFeatureCode(subscription.getPlan().getId(), featureCode);

        if (mappingOpt.isEmpty()) {
            // Feature không nằm trong package hiện tại → cần nâng cấp
            String currentPlan = subscription.getPlan().getPlanName();
            return EntitlementResult.denied(featureCode,
                    String.format("Tính năng '%s' không có trong gói '%s'. Vui lòng nâng cấp gói.",
                            feature.getFeatureName(), currentPlan),
                    findRequiredPackageForFeature(featureCode));
        }

        PackageFeature mapping = mappingOpt.get();

        // 5. Kiểm tra feature có được enabled trong package không
        if (!Boolean.TRUE.equals(mapping.getEnabled())) {
            return EntitlementResult.denied(featureCode,
                    "Tính năng đang bị tạm tắt trong gói hiện tại", null);
        }

        // 6. Cho phép truy cập
        return EntitlementResult.allowed(featureCode, mapping.getQuotaLimit());
    }

    /**
     * Kiểm tra định mức quota của một tính năng khi tạo mới tài nguyên (Sản phẩm, Nhân viên...).
     * Ném FeatureAccessDeniedException (HTTP 403) nếu số lượng hiện tại đã đạt hoặc vượt quá định mức của gói.
     *
     * @param businessId ID của hộ kinh doanh
     * @param featureCode Mã tính năng (PRODUCT_MANAGEMENT, EMPLOYEE_MANAGEMENT...)
     * @param currentCount Số lượng tài nguyên hiện tại
     * @param resourceName Tên hiển thị tài nguyên (VD: "sản phẩm", "nhân viên")
     */
    public void validateFeatureQuota(Long businessId, String featureCode, long currentCount, String resourceName) {
        if (businessId == null) {
            return;
        }

        EntitlementResult check = checkEntitlement(businessId, featureCode);
        if (!check.allowed()) {
            throw new com.hbdt.common.exception.FeatureAccessDeniedException(
                    check.denyReason(), featureCode, check.requiredPackage());
        }

        if (check.quotaLimit() != null && currentCount >= check.quotaLimit()) {
            String message = String.format(
                    "Gói dịch vụ hiện tại chỉ cho phép tối đa %d %s (hiện có: %d). Vui lòng nâng cấp gói để tạo thêm.",
                    check.quotaLimit(), resourceName, currentCount
            );
            throw new com.hbdt.common.exception.FeatureAccessDeniedException(
                    message, featureCode, check.requiredPackage() != null ? check.requiredPackage() : "VIP");
        }
    }

    /**
     * Lấy toàn bộ features và trạng thái entitlement cho một business.
     * Được gọi bởi EntitlementController cho frontend consume.
     */
    public List<FeatureEntitlementResponse> getEntitlementsByBusinessId(Long businessId) {
        List<Feature> allFeatures = featureRepository.findAllByStatus(FEATURE_ACTIVE);
        List<FeatureEntitlementResponse> result = new ArrayList<>();

        for (Feature feature : allFeatures) {
            EntitlementResult check = checkEntitlement(businessId, feature.getFeatureCode());
            result.add(new FeatureEntitlementResponse(
                    feature.getFeatureCode(),
                    feature.getFeatureName(),
                    feature.getDescription(),
                    check.allowed(),
                    check.quotaLimit(),
                    check.requiredPackage()
            ));
        }

        return result;
    }

    /**
     * Resolve businessId từ authenticated user.
     * - BUSINESS_OWNER → user.businessId
     * - EMPLOYEE → user.businessId (cùng business với Owner)
     * - ADMIN/MANAGER → null (không áp dụng entitlement)
     *
     * Security: Luôn lấy từ DB/SecurityContext, KHÔNG từ request body.
     */
    public Long resolveBusinessId(User user) {
        if (user == null || user.getRole() == null) {
            return null;
        }

        RoleType role = user.getRole().getName();
        if (role == RoleType.BUSINESS_OWNER || role == RoleType.EMPLOYEE) {
            return user.getBusinessId();
        }

        // Admin/Manager không bị giới hạn bởi entitlement
        return null;
    }

    /**
     * Tìm package thấp nhất có chứa feature — dùng cho thông báo nâng cấp.
     */
    private String findRequiredPackageForFeature(String featureCode) {
        List<PackageFeature> mappings = packageFeatureRepository.findAll().stream()
                .filter(pf -> pf.getFeature().getFeatureCode().equals(featureCode)
                        && Boolean.TRUE.equals(pf.getEnabled()))
                .toList();

        if (mappings.isEmpty()) {
            return "VIP";
        }

        // Trả về tên package đầu tiên có feature này
        return mappings.getFirst().getPlan().getPlanName();
    }
}
