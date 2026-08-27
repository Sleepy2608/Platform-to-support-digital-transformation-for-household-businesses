package com.hbdt.config;

import com.hbdt.entity.Feature;
import com.hbdt.entity.PackageFeature;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.repository.FeatureRepository;
import com.hbdt.repository.PackageFeatureRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Seed dữ liệu mặc định cho Feature Entitlement module.
 * Chạy sau DatabaseSeeder (Order=3) để đảm bảo roles và plans đã tồn tại.
 *
 * Seed:
 * - 10 features hệ thống
 * - Mapping features vào các package hiện có (dựa trên plan_code)
 */
@Component
@Order(3)
public class FeatureEntitlementSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(FeatureEntitlementSeeder.class);

    private final FeatureRepository featureRepository;
    private final PackageFeatureRepository packageFeatureRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public FeatureEntitlementSeeder(FeatureRepository featureRepository,
                                    PackageFeatureRepository packageFeatureRepository,
                                    SubscriptionPlanRepository subscriptionPlanRepository) {
        this.featureRepository = featureRepository;
        this.packageFeatureRepository = packageFeatureRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    @Override
    public void run(String... args) {
        seedFeatures();
        seedPackageFeatureMappings();
    }

    /**
     * Seed danh sách features hệ thống.
     */
    private void seedFeatures() {
        // LinkedHashMap giữ thứ tự insert
        Map<String, String[]> features = new LinkedHashMap<>();
        // format: code → [name, description]
        features.put("PRODUCT_MANAGEMENT", new String[]{
                "Quản lý sản phẩm & danh mục",
                "Tạo, chỉnh sửa, xóa sản phẩm và danh mục hàng hóa"
        });
        features.put("EMPLOYEE_MANAGEMENT", new String[]{
                "Quản lý nhân viên",
                "Thêm, quản lý tài khoản và phân quyền nhân viên"
        });
        features.put("INVENTORY_MANAGEMENT", new String[]{
                "Quản lý kho hàng",
                "Theo dõi tồn kho, nhập kho, xuất kho"
        });
        features.put("SALES_ORDER", new String[]{
                "Quản lý đơn hàng",
                "Tạo và quản lý đơn hàng bán ra"
        });
        features.put("ACCOUNTING_BOOK", new String[]{
                "Sổ kế toán",
                "Ghi chép thu chi, sổ kế toán cơ bản"
        });
        features.put("TAX_MANAGEMENT", new String[]{
                "Quản lý thuế",
                "Khai báo, tính toán và theo dõi nghĩa vụ thuế"
        });
        features.put("AI_ASSISTANT", new String[]{
                "Trợ lý AI",
                "Hỗ trợ phân tích dữ liệu và tư vấn kinh doanh bằng AI"
        });
        features.put("REPORT_GENERATION", new String[]{
                "Tạo báo cáo",
                "Tạo và xuất báo cáo kinh doanh tùy chỉnh"
        });
        features.put("DEBT_MANAGEMENT", new String[]{
                "Quản lý công nợ",
                "Theo dõi và quản lý nợ phải thu, nợ phải trả"
        });
        features.put("CUSTOMER_MANAGEMENT", new String[]{
                "Quản lý khách hàng",
                "Lưu trữ và quản lý thông tin khách hàng"
        });

        int seeded = 0;
        for (Map.Entry<String, String[]> entry : features.entrySet()) {
            String code = entry.getKey();
            String[] meta = entry.getValue();

            if (featureRepository.findByFeatureCode(code).isEmpty()) {
                featureRepository.save(Feature.builder()
                        .featureCode(code)
                        .featureName(meta[0])
                        .description(meta[1])
                        .status("ACTIVE")
                        .build());
                seeded++;
            }
        }

        if (seeded > 0) {
            logger.info("Seeded {} feature(s)", seeded);
        }
    }

    /**
     * Seed mapping features vào các package.
     *
     * Phân bổ mặc định:
     * - Gói FREE/BASIC: PRODUCT_MANAGEMENT (50), SALES_ORDER (100), CUSTOMER_MANAGEMENT (50)
     * - Gói VIP/PREMIUM: Tất cả features, không giới hạn quota
     */
    private void seedPackageFeatureMappings() {
        List<SubscriptionPlan> plans = subscriptionPlanRepository.findAll();
        List<Feature> features = featureRepository.findAllByOrderByFeatureCodeAsc();

        if (plans.isEmpty() || features.isEmpty()) {
            logger.debug("Skipping package-feature seeding: no plans or features found");
            return;
        }

        int seeded = 0;
        for (SubscriptionPlan plan : plans) {
            String planCode = plan.getPlanCode().toUpperCase();

            for (Feature feature : features) {
                // Đã mapped → skip
                if (packageFeatureRepository.existsByPlanIdAndFeatureId(plan.getId(), feature.getId())) {
                    continue;
                }

                boolean shouldMap;
                Integer quota = null;

                if (isVipPlan(planCode)) {
                    // VIP: tất cả features, không giới hạn
                    shouldMap = true;
                } else {
                    // BASIC/FREE: chỉ 3 features cơ bản với quota giới hạn
                    shouldMap = isBasicFeature(feature.getFeatureCode());
                    if (shouldMap) {
                        quota = getBasicQuota(feature.getFeatureCode());
                    }
                }

                if (shouldMap) {
                    packageFeatureRepository.save(PackageFeature.builder()
                            .plan(plan)
                            .feature(feature)
                            .enabled(true)
                            .quotaLimit(quota)
                            .build());
                    seeded++;
                }
            }
        }

        if (seeded > 0) {
            logger.info("Seeded {} package-feature mapping(s)", seeded);
        }
    }

    private boolean isVipPlan(String planCode) {
        return planCode.contains("VIP") || planCode.contains("PREMIUM") || planCode.contains("PRO");
    }

    private boolean isBasicFeature(String featureCode) {
        return "PRODUCT_MANAGEMENT".equals(featureCode)
                || "SALES_ORDER".equals(featureCode)
                || "CUSTOMER_MANAGEMENT".equals(featureCode);
    }

    private Integer getBasicQuota(String featureCode) {
        return switch (featureCode) {
            case "PRODUCT_MANAGEMENT" -> 50;
            case "SALES_ORDER" -> 100;
            case "CUSTOMER_MANAGEMENT" -> 50;
            default -> null;
        };
    }
}
