package com.hbdt.entitlement.scheduler;

import com.hbdt.entity.Subscription;
import com.hbdt.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job chạy hàng ngày để tự động chuyển subscription hết hạn
 * từ ACTIVE → EXPIRED.
 *
 * Khi subscription EXPIRED, FeatureEntitlementService sẽ tự động
 * deny tất cả feature requests.
 */
@Component
public class SubscriptionExpiryScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionExpiryScheduler.class);

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionExpiryScheduler(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Chạy mỗi ngày lúc 00:05 AM (UTC+7).
     * Tìm và expire các subscription ACTIVE có endDate < today.
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void checkExpiredSubscriptions() {
        LocalDate today = LocalDate.now();
        List<Subscription> expiredList = subscriptionRepository
                .findAllByEndDateBeforeAndStatus(today, "ACTIVE");

        if (expiredList.isEmpty()) {
            logger.debug("No expired subscriptions found for date: {}", today);
            return;
        }

        int count = 0;
        for (Subscription subscription : expiredList) {
            subscription.setStatus("EXPIRED");
            subscriptionRepository.save(subscription);
            count++;
            logger.info("Auto-expired subscription: id={}, businessId={}, endDate={}",
                    subscription.getId(), subscription.getBusinessId(), subscription.getEndDate());
        }

        logger.info("Subscription expiry check completed. Expired {} subscription(s).", count);
    }
}
