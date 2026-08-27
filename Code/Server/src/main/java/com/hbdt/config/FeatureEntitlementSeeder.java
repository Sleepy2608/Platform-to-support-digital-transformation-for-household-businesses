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
 * Khởi tạo dữ liệu mặc định cho Feature Entitlement.
 * Chạy sau DatabaseSeeder (Order=3) để đồng bộ gói và phân quyền tính năng.
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
     * Khởi tạo danh mục 10 tính năng cốt lõi của hệ thống.
     */
    private void seedFeatures() {
        Map<String, String[]> features = new LinkedHashMap<>();
        features.put("PRODUCT_MANAGEMENT", new String[]{"Quản lý sản phẩm & danh mục", "Tạo, chỉnh sửa, xóa sản phẩm và danh mục"});
        features.put("EMPLOYEE_MANAGEMENT", new String[]{"Quản lý nhân viên", "Thêm, quản lý tài khoản và phân quyền nhân viên"});
        features.put("INVENTORY_MANAGEMENT", new String[]{"Quản lý kho hàng", "Theo dõi tồn kho, nhập kho, xuất kho"});
        features.put("SALES_ORDER", new String[]{"Quản lý đơn hàng", "Tạo và quản lý đơn hàng bán ra"});
        features.put("ACCOUNTING_BOOK", new String[]{"Sổ kế toán", "Ghi chép thu chi, sổ kế toán Thông tư 88/2021"});
        features.put("TAX_MANAGEMENT", new String[]{"Quản lý thuế", "Khai báo, tính toán và theo dõi nghĩa vụ thuế"});
        features.put("AI_ASSISTANT", new String[]{"Trợ lý AI", "Hỗ trợ phân tích dữ liệu và tự động hóa bằng AI"});
        features.put("REPORT_GENERATION", new String[]{"Tạo báo cáo", "Tạo và xuất báo cáo doanh thu, kinh doanh"});
        features.put("DEBT_MANAGEMENT", new String[]{"Quản lý công nợ", "Theo dõi và quản lý công nợ phải thu, phải trả"});
        features.put("CUSTOMER_MANAGEMENT", new String[]{"Quản lý khách hàng", "Lưu trữ và quản lý thông tin khách hàng"});

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
            logger.info("Đã khởi tạo {} tính năng hệ thống", seeded);
        }
    }

    /**
     * Khởi tạo ma trận phân quyền tính năng chuẩn theo bậc giá tiền:
     * - FREE (0đ): SP (≤20), Đơn (≤50), KH (≤20)
     * - BASIC (99k): SP (≤100), Đơn (≤300), KH (≤100), Báo cáo (∞)
     * - STANDARD (199k): Bán hàng (∞), Kho (∞), Công nợ (∞), Kế toán TT88 (∞), Báo cáo (∞), Nhân viên (≤3)
     * - PREMIUM (299k): Đầy đủ tính năng + Thuế (∞) + Marketing (∞) + AI (∞) + Nhân viên (≤10)
     * - VIP (499k): Trọn gói không giới hạn tất cả tính năng, Nhân viên (∞)
     */
    private void seedPackageFeatureMappings() {
        List<SubscriptionPlan> plans = subscriptionPlanRepository.findAll();
        List<Feature> features = featureRepository.findAllByOrderByFeatureCodeAsc();

        if (plans.isEmpty() || features.isEmpty()) {
            return;
        }

        int seeded = 0;
        for (SubscriptionPlan plan : plans) {
            String planCode = plan.getPlanCode().toUpperCase();

            for (Feature feature : features) {
                String code = feature.getFeatureCode();
                boolean shouldMap = false;
                Integer quota = null;

                if (planCode.contains("VIP")) {
                    // Gói VIP (499k): Toàn bộ 10 tính năng không giới hạn
                    shouldMap = true;
                    quota = null;
                } else if (planCode.contains("PREMIUM") || planCode.contains("CAO CẤP") || planCode.contains("PRO")) {
                    // Gói Cao Cấp (299k): Mở Full tính năng gồm Thuế, AI, Marketing; Nhân viên tối đa 10
                    shouldMap = true;
                    if ("EMPLOYEE_MANAGEMENT".equals(code)) {
                        quota = 10;
                    }
                } else if (planCode.contains("STANDARD")) {
                    // Gói Standard (199k): Kho, Công nợ, Kế toán TT88, Bán hàng và tối đa 3 nhân viên
                    shouldMap = switch (code) {
                        case "PRODUCT_MANAGEMENT", "SALES_ORDER", "CUSTOMER_MANAGEMENT",
                             "INVENTORY_MANAGEMENT", "DEBT_MANAGEMENT", "ACCOUNTING_BOOK",
                             "REPORT_GENERATION" -> true;
                        case "EMPLOYEE_MANAGEMENT" -> {
                            quota = 3;
                            yield true;
                        }
                        default -> false; // AI, Thuế dành riêng cho gói cao hơn
                    };
                } else if (planCode.contains("BASIC") || planCode.contains("CƠ BẢN")) {
                    // Gói Cơ Bản (99k): Bán hàng cơ bản + Báo cáo doanh thu
                    shouldMap = switch (code) {
                        case "PRODUCT_MANAGEMENT" -> { quota = 100; yield true; }
                        case "SALES_ORDER" -> { quota = 300; yield true; }
                        case "CUSTOMER_MANAGEMENT" -> { quota = 100; yield true; }
                        case "REPORT_GENERATION" -> true;
                        default -> false;
                    };
                } else {
                    // Gói Miễn Phí (FREE - 0đ): Dùng thử với hạn mức nhỏ
                    shouldMap = switch (code) {
                        case "PRODUCT_MANAGEMENT" -> { quota = 20; yield true; }
                        case "SALES_ORDER" -> { quota = 50; yield true; }
                        case "CUSTOMER_MANAGEMENT" -> { quota = 20; yield true; }
                        default -> false;
                    };
                }

                Optional<PackageFeature> existing = packageFeatureRepository.findByPlanIdAndFeatureId(plan.getId(), feature.getId());

                if (shouldMap) {
                    PackageFeature pf = existing.orElseGet(() -> PackageFeature.builder()
                            .plan(plan)
                            .feature(feature)
                            .build());
                    pf.setEnabled(true);
                    pf.setQuotaLimit(quota);
                    packageFeatureRepository.save(pf);
                    seeded++;
                } else {
                    // Nếu không thuộc gói này nhưng trước đó đã lưu trong DB -> xóa bỏ để đồng bộ đúng
                    existing.ifPresent(packageFeatureRepository::delete);
                }
            }
        }

        if (seeded > 0) {
            logger.info("Đã khởi tạo {} cấu hình mapping gói - tính năng theo chuẩn giá tiền", seeded);
        }
    }
}
