package com.hbdt.entity.enums;

/**
 * Subscription status enum for managing subscription lifecycle
 *
 * State transitions:
 * - PENDING_PAYMENT: Initial state when subscription is created, awaiting payment
 * - ACTIVE: Payment successful, subscription is active
 * - EXPIRED: Subscription has passed end date
 * - CANCELLED: Owner voluntarily cancelled the subscription
 */
public enum SubscriptionStatus {
    /**
     * Subscription created but awaiting payment confirmation
     */
    PENDING_PAYMENT,

    /**
     * Subscription is active and valid
     */
    ACTIVE,

    /**
     * Subscription has expired (passed end date)
     */
    EXPIRED,

    /**
     * Subscription was cancelled by owner
     */
    CANCELLED
}
