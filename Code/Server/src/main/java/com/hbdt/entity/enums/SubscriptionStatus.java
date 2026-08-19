package com.hbdt.entity.enums;

/**
 * Trạng thái vòng đời của thuê bao (Subscription).
 */
public enum SubscriptionStatus {
    /** Chờ kích hoạt */
    PENDING,
    /** Đang hoạt động — Owner được phép truy cập features */
    ACTIVE,
    /** Đã hết hạn */
    EXPIRED,
    /** Đã bị hủy */
    CANCELLED
}
