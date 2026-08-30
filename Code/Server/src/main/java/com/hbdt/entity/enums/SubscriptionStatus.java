package com.hbdt.entity.enums;

/**
 * Subscription status for Lifecycle:
 * PENDING_PAYMENT -> ACTIVE
 * ACTIVE -> EXPIRED
 * ACTIVE -> CANCELLED
 */
public enum SubscriptionStatus {
    PENDING_PAYMENT,
    ACTIVE,
    EXPIRED,
    CANCELLED;

    /**
     * Checks if transitioning from this status to next status is valid.
     */
    public boolean canTransitionTo(SubscriptionStatus next) {
        if (this == next) {
            return true;
        }
        switch (this) {
            case PENDING_PAYMENT:
                return next == ACTIVE;
            case ACTIVE:
                return next == EXPIRED || next == CANCELLED;
            case EXPIRED:
            case CANCELLED:
            default:
                return false;
        }
    }
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
