package com.hbdt.common.exception;

import lombok.Getter;

/**
 * Exception khi Owner/Employee không có quyền truy cập feature
 * do không nằm trong gói thuê bao hiện tại.
 *
 * Được throw bởi FeatureEntitlementInterceptor → catch bởi GlobalExceptionHandler
 * → trả HTTP 403 Forbidden với mã lỗi FEATURE_NOT_ENTITLED.
 */
@Getter
public class FeatureAccessDeniedException extends RuntimeException {

    private final String featureCode;
    private final String requiredPackage;
    private final String errorCode;

    public FeatureAccessDeniedException(String message, String featureCode, String requiredPackage) {
        super(message);
        this.featureCode = featureCode;
        this.requiredPackage = requiredPackage;
        this.errorCode = "FEATURE_NOT_ENTITLED";
    }
}
