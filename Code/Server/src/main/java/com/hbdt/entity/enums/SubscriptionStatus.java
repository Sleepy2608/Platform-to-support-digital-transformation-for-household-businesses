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
}
