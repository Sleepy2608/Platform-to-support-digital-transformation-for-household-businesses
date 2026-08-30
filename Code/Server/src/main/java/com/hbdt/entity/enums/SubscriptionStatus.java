package com.hbdt.entity.enums;

/**
 * Trạng thái vòng đời của thuê bao (Subscription).
 *
 * State transitions:
 * - PENDING / PENDING_PAYMENT: Initial state when subscription is created, awaiting payment
 * - ACTIVE: Payment successful, subscription is active
 * - EXPIRED: Subscription has passed end date
 * - CANCELLED: Owner voluntarily cancelled the subscription
 */
public enum SubscriptionStatus {
    /** Chờ kích hoạt */
    PENDING,

    /** Subscription created but awaiting payment confirmation */
    PENDING_PAYMENT,

    /** Đang hoạt động — Owner được phép truy cập features */
    ACTIVE,

    /** Đã hết hạn */
    EXPIRED,

    /** Đã bị hủy */
    CANCELLED
}
