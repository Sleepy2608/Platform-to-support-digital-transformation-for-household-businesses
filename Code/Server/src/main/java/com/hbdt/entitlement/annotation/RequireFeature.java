package com.hbdt.entitlement.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu controller method/class yêu cầu Owner phải có quyền sử dụng feature
 * trong gói thuê bao hiện tại.
 *
 * Ví dụ:
 * <pre>
 * {@literal @}RequireFeature("EMPLOYEE_MANAGEMENT")
 * {@literal @}GetMapping("/employees")
 * public ResponseEntity<?> listEmployees() { ... }
 * </pre>
 *
 * Interceptor sẽ check entitlement trước khi request đến controller method.
 * Nếu không có quyền → trả 403 Forbidden với mã lỗi FEATURE_NOT_ENTITLED.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireFeature {
    /**
     * Mã feature cần kiểm tra (ví dụ: "PRODUCT_MANAGEMENT", "AI_ASSISTANT").
     */
    String value();
}
