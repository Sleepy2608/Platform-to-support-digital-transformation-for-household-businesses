package com.hbdt.entitlement.interceptor;

import com.hbdt.common.exception.FeatureAccessDeniedException;
import com.hbdt.entitlement.annotation.RequireFeature;
import com.hbdt.entitlement.dto.EntitlementResult;
import com.hbdt.entitlement.service.FeatureEntitlementService;
import com.hbdt.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Spring HandlerInterceptor chặn request tại controller layer
 * để kiểm tra entitlement dựa trên @RequireFeature annotation.
 *
 * Flow:
 * 1. Kiểm tra method/class có @RequireFeature không → pass-through nếu không có
 * 2. Lấy User từ SecurityContext (đã xác thực JWT)
 * 3. Resolve businessId từ user (Owner hoặc Employee → cùng business)
 * 4. Gọi FeatureEntitlementService.checkEntitlement()
 * 5. Throw FeatureAccessDeniedException nếu denied → GlobalExceptionHandler → 403
 *
 * Security:
 * - KHÔNG đọc businessId, planId, featureCode từ request body/param
 * - Chỉ dùng data từ SecurityContext + DB
 * - Employee bị ràng buộc bởi Owner's subscription
 */
@Component
public class FeatureEntitlementInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(FeatureEntitlementInterceptor.class);

    private final FeatureEntitlementService featureEntitlementService;

    public FeatureEntitlementInterceptor(FeatureEntitlementService featureEntitlementService) {
        this.featureEntitlementService = featureEntitlementService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {

        // Chỉ xử lý handler method (bỏ qua static resources)
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // Tìm @RequireFeature trên method trước, rồi class
        RequireFeature annotation = handlerMethod.getMethodAnnotation(RequireFeature.class);
        if (annotation == null) {
            annotation = handlerMethod.getBeanType().getAnnotation(RequireFeature.class);
        }

        // Không có annotation → pass-through
        if (annotation == null) {
            return true;
        }

        String featureCode = annotation.value();

        // Lấy authenticated user từ SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            logger.warn("Entitlement check failed: no authenticated user for feature '{}'", featureCode);
            throw new FeatureAccessDeniedException(
                    "Vui lòng đăng nhập để sử dụng tính năng này",
                    featureCode, null);
        }

        // Resolve businessId từ user — KHÔNG từ request body
        Long businessId = featureEntitlementService.resolveBusinessId(user);

        // Admin/Manager không bị giới hạn bởi entitlement
        if (businessId == null) {
            return true;
        }

        // Kiểm tra entitlement
        EntitlementResult result = featureEntitlementService.checkEntitlement(businessId, featureCode);

        if (!result.allowed()) {
            logger.info("Feature access denied: user={}, businessId={}, feature={}, reason={}",
                    user.getUsername(), businessId, featureCode, result.denyReason());
            throw new FeatureAccessDeniedException(
                    result.denyReason(),
                    featureCode,
                    result.requiredPackage());
        }

        return true;
    }
}
