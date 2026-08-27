package com.hbdt.subscription.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Tạo Subscription với status PENDING_PAYMENT.
     * Validate:
     * - start_date < end_date
     */
    public Subscription createPendingPaymentSubscription(User owner, SubscriptionPlan plan, String billingCycle, LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date must not be null");
        }
        if (!startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        Subscription subscription = Subscription.builder()
                .owner(owner)
                .plan(plan)
                .billingCycle(billingCycle)
                .startDate(startDate)
                .endDate(endDate)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        return subscriptionRepository.save(subscription);
    }

    /**
     * Kích hoạt subscription sau khi thanh toán thành công.
     * Transition: PENDING_PAYMENT -> ACTIVE
     */
    public Subscription activateSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        return subscriptionRepository.save(subscription);
    }

    /**
     * Kiểm tra Subscription còn hiệu lực.
     */
    public boolean isSubscriptionValid(Subscription subscription) {
        if (subscription == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return subscription.getStatus() == SubscriptionStatus.ACTIVE
                && !subscription.getStartDate().isAfter(now)
                && (subscription.getEndDate() == null || !subscription.getEndDate().isBefore(now));
    }

    /**
     * Kiểm tra trạng thái và ném ngoại lệ nếu subscription không cho phép sử dụng dịch vụ.
     * ACTIVE -> cho phép sử dụng.
     * PENDING_PAYMENT -> giới hạn quyền / từ chối sử dụng.
     * EXPIRED -> từ chối sử dụng.
     * CANCELLED -> từ chối sử dụng.
     */
    public void validateSubscriptionUsage(Subscription subscription) {
        if (subscription == null) {
            throw new IllegalStateException("No subscription found. Service access rejected.");
        }
        if (subscription.getStatus() == SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Subscription is pending payment. Service access restricted.");
        }
        if (subscription.getStatus() == SubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Subscription has expired. Service access rejected.");
        }
        if (subscription.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new IllegalStateException("Subscription has been cancelled. Service access rejected.");
        }
        if (!isSubscriptionValid(subscription)) {
            throw new IllegalStateException("Subscription is invalid or outside active dates. Service access rejected.");
        }
    }

    /**
     * Xử lý cancellation.
     * Chỉ cho phép ACTIVE -> CANCELLED.
     */
    public Subscription cancelSubscription(Long id, String reason) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        // Enforce only ACTIVE can be cancelled
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE subscriptions can be cancelled. Current status: " + subscription.getStatus());
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason);

        return subscriptionRepository.save(subscription);
    }

    /**
     * Scheduled job kiểm tra định kỳ (chạy mỗi ngày vào lúc nửa đêm).
     * ACTIVE -> EXPIRED khi hết hạn (endDate < today).
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE);
        for (Subscription subscription : activeSubscriptions) {
            if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(now)) {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(subscription);
            }
        }
    }
}
