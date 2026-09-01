package com.hbdt.entitlement.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.repository.SubscriptionPlanRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Xử lý các sự kiện vòng đời thuê bao (Subscription Lifecycle).
 * Đồng bộ quyền khi có sự kiện thay đổi:
 * - Đăng ký mới → tạo subscription PENDING
 * - Kích hoạt → chuyển ACTIVE, cấp quyền
 * - Hết hạn → chuyển EXPIRED, khóa quyền
 * - Hủy → chuyển CANCELLED, khóa quyền
 * - Nâng/hạ cấp → tạo subscription mới với plan mới
 */
@Service
@Transactional
public class SubscriptionLifecycleService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionLifecycleService.class);

    private static final String PENDING = "PENDING";
    private static final String ACTIVE = "ACTIVE";
    private static final String EXPIRED = "EXPIRED";
    private static final String CANCELLED = "CANCELLED";

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public SubscriptionLifecycleService(SubscriptionRepository subscriptionRepository,
                                         SubscriptionPlanRepository subscriptionPlanRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    /**
     * Đăng ký mới — tạo subscription với status PENDING.
     */
    public Subscription createSubscription(Long businessId, Long planId, String billingCycle) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói thuê bao với ID: " + planId));

        // Deactivate subscription hiện tại (nếu có)
        deactivateCurrentSubscription(businessId);

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = "ANNUAL".equalsIgnoreCase(billingCycle)
                ? startDate.plusYears(1)
                : startDate.plusMonths(1);

        Subscription subscription = Subscription.builder()
                .businessId(businessId)
                .plan(plan)
                .billingCycle(billingCycle.toUpperCase())
                .startDate(startDate)
                .endDate(endDate)
                .status(PENDING)
                .build();

        Subscription saved = subscriptionRepository.save(subscription);
        logger.info("Created subscription: id={}, businessId={}, planId={}, status={}",
                saved.getId(), businessId, planId, PENDING);
        return saved;
    }

    /**
     * Kích hoạt subscription — cấp quyền features ngay lập tức.
     */
    public Subscription activateSubscription(Long subscriptionId) {
        Subscription subscription = findSubscription(subscriptionId);

        if (ACTIVE.equals(subscription.getStatus())) {
            throw new BadRequestException("Thuê bao đã được kích hoạt");
        }

        subscription.setStatus(ACTIVE);
        Subscription saved = subscriptionRepository.save(subscription);
        logger.info("Activated subscription: id={}, businessId={}, plan={}",
                subscriptionId, subscription.getBusinessId(), subscription.getPlan().getPlanCode());
        return saved;
    }

    /**
     * Khóa subscription do hết hạn — revoke features ngay lập tức.
     */
    public Subscription expireSubscription(Long subscriptionId) {
        Subscription subscription = findSubscription(subscriptionId);

        subscription.setStatus(EXPIRED);
        Subscription saved = subscriptionRepository.save(subscription);
        logger.info("Expired subscription: id={}, businessId={}",
                subscriptionId, subscription.getBusinessId());
        return saved;
    }

    /**
     * Hủy subscription — revoke features ngay lập tức.
     */
    public Subscription cancelSubscription(Long subscriptionId) {
        Subscription subscription = findSubscription(subscriptionId);

        if (CANCELLED.equals(subscription.getStatus())) {
            throw new BadRequestException("Thuê bao đã bị hủy trước đó");
        }

        subscription.setStatus(CANCELLED);
        Subscription saved = subscriptionRepository.save(subscription);
        logger.info("Cancelled subscription: id={}, businessId={}",
                subscriptionId, subscription.getBusinessId());
        return saved;
    }

    /**
     * Nâng cấp/Hạ cấp package — tạo subscription mới với plan mới.
     * Subscription cũ sẽ bị deactivate.
     */
    public Subscription changePackage(Long businessId, Long newPlanId, String billingCycle) {
        SubscriptionPlan newPlan = subscriptionPlanRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói thuê bao với ID: " + newPlanId));

        // Kiểm tra không đổi sang cùng plan
        subscriptionRepository.findTopByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, ACTIVE)
                .ifPresent(current -> {
                    if (current.getPlan().getId().equals(newPlanId)) {
                        throw new BadRequestException("Hộ kinh doanh đã đang sử dụng gói này");
                    }
                });

        // Deactivate subscription hiện tại
        deactivateCurrentSubscription(businessId);

        // Tạo subscription mới — ACTIVE ngay
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = "ANNUAL".equalsIgnoreCase(billingCycle)
                ? startDate.plusYears(1)
                : startDate.plusMonths(1);

        Subscription newSubscription = Subscription.builder()
                .businessId(businessId)
                .plan(newPlan)
                .billingCycle(billingCycle.toUpperCase())
                .startDate(startDate)
                .endDate(endDate)
                .status(ACTIVE)
                .build();

        Subscription saved = subscriptionRepository.save(newSubscription);
        logger.info("Changed package: businessId={}, newPlan={}, status=ACTIVE",
                businessId, newPlan.getPlanCode());
        return saved;
    }

    /**
     * Deactivate tất cả subscription ACTIVE/PENDING hiện tại của business.
     */
    private void deactivateCurrentSubscription(Long businessId) {
        List<Subscription> activeSubscriptions = subscriptionRepository
                .findAllByBusinessIdOrderByCreatedAtDesc(businessId);

        for (Subscription sub : activeSubscriptions) {
            if (ACTIVE.equals(sub.getStatus()) || PENDING.equals(sub.getStatus())) {
                sub.setStatus(CANCELLED);
                subscriptionRepository.save(sub);
                logger.info("Deactivated old subscription: id={}, businessId={}", sub.getId(), businessId);
            }
        }
    }

    private Subscription findSubscription(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuê bao với ID: " + id));
    }
}
