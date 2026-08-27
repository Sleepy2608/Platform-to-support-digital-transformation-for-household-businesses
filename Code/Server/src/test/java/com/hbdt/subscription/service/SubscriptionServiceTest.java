package com.hbdt.subscription.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    private SubscriptionService subscriptionService;

    private User testUser;
    private SubscriptionPlan testPlan;

    @BeforeEach
    void setUp() {
        subscriptionService = new SubscriptionService(subscriptionRepository);

        testUser = User.builder()
                .id(1L)
                .username("owner1")
                .fullName("Owner One")
                .build();

        testPlan = SubscriptionPlan.builder()
                .id(1L)
                .planCode("VIP")
                .planName("Gói VIP")
                .build();
    }

    @Test
    void createPendingPaymentSubscriptionSavesSuccessfully() {
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.plusMonths(1);

        Subscription subscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .plan(testPlan)
                .billingCycle("MONTHLY")
                .startDate(start)
                .endDate(end)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(subscription);

        Subscription result = subscriptionService.createPendingPaymentSubscription(testUser, testPlan, "MONTHLY", start, end);

        assertNotNull(result);
        assertEquals(SubscriptionStatus.PENDING_PAYMENT, result.getStatus());
        assertEquals(start, result.getStartDate());
        assertEquals(end, result.getEndDate());
        verify(subscriptionRepository).save(any(Subscription.class));
    }

    @Test
    void createPendingPaymentSubscriptionRejectsInvalidDates() {
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.minusDays(1); // Invalid: start >= end

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            subscriptionService.createPendingPaymentSubscription(testUser, testPlan, "MONTHLY", start, end);
        });

        assertEquals("Start date must be before end date", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void activateSubscriptionSuccessfullyTransitionsPendingToActive() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .plan(testPlan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription activated = subscriptionService.activateSubscription(10L);

        assertEquals(SubscriptionStatus.ACTIVE, activated.getStatus());
        verify(subscriptionRepository).save(subscription);
    }

    @Test
    void cancelSubscriptionSuccessfullyTransitionsActiveToCancelled() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .plan(testPlan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription cancelled = subscriptionService.cancelSubscription(10L, "User requested cancellation");

        assertEquals(SubscriptionStatus.CANCELLED, cancelled.getStatus());
        assertNotNull(cancelled.getCancelledAt());
        assertEquals("User requested cancellation", cancelled.getCancellationReason());
        verify(subscriptionRepository).save(subscription);
    }

    @Test
    void cancelSubscriptionRejectsNonActive() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            subscriptionService.cancelSubscription(10L, "Hủy");
        });

        assertTrue(exception.getMessage().contains("Only ACTIVE subscriptions can be cancelled"));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    void invalidTransitionThrowsException() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        // PENDING_PAYMENT -> CANCELLED is invalid (only PENDING_PAYMENT -> ACTIVE is allowed)
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            subscription.setStatus(SubscriptionStatus.CANCELLED);
        });

        assertTrue(exception.getMessage().contains("is not allowed"));
    }

    @Test
    void checkAndExpireSubscriptionsTransitionsExpiredActiveToExpired() {
        Subscription expiredSubscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .plan(testPlan)
                .startDate(LocalDateTime.now().minusMonths(2))
                .endDate(LocalDateTime.now().minusDays(1)) // Expired
                .status(SubscriptionStatus.ACTIVE)
                .build();

        Subscription stillActiveSubscription = Subscription.builder()
                .id(11L)
                .owner(testUser)
                .plan(testPlan)
                .startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().plusDays(5)) // Not expired
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(expiredSubscription, stillActiveSubscription));

        subscriptionService.checkAndExpireSubscriptions();

        assertEquals(SubscriptionStatus.EXPIRED, expiredSubscription.getStatus());
        assertEquals(SubscriptionStatus.ACTIVE, stillActiveSubscription.getStatus());
        verify(subscriptionRepository).save(expiredSubscription);
        verify(subscriptionRepository, never()).save(stillActiveSubscription);
    }

    @Test
    void validateSubscriptionUsageRejectsExpiredAndCancelled() {
        Subscription expired = Subscription.builder()
                .status(SubscriptionStatus.EXPIRED)
                .build();

        Subscription cancelled = Subscription.builder()
                .status(SubscriptionStatus.CANCELLED)
                .build();

        Subscription pending = Subscription.builder()
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        assertThrows(IllegalStateException.class, () -> subscriptionService.validateSubscriptionUsage(expired));
        assertThrows(IllegalStateException.class, () -> subscriptionService.validateSubscriptionUsage(cancelled));
        assertThrows(IllegalStateException.class, () -> subscriptionService.validateSubscriptionUsage(pending));
    }

    @Test
    void validateSubscriptionUsageAllowsActiveValid() {
        Subscription active = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .build();

        assertDoesNotThrow(() -> subscriptionService.validateSubscriptionUsage(active));
    }
}
