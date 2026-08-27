package com.hbdt.subscription.service;

import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.ServiceInvoice;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.PaymentHistoryRepository;
import com.hbdt.repository.ServiceInvoiceRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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

    @Mock
    private PaymentHistoryRepository paymentHistoryRepository;

    @Mock
    private ServiceInvoiceRepository serviceInvoiceRepository;

    private SubscriptionService subscriptionService;

    private User testUser;
    private SubscriptionPlan testPlan;

    @BeforeEach
    void setUp() {
        subscriptionService = new SubscriptionService(subscriptionRepository, paymentHistoryRepository, serviceInvoiceRepository);

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

    @Test
    void createSubscriptionPaymentSuccessfullyCreatesPendingPayment() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(paymentHistoryRepository.save(any(PaymentHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentHistory payment = subscriptionService.createSubscriptionPayment(10L, BigDecimal.valueOf(100), "BANK_TRANSFER");

        assertNotNull(payment);
        assertEquals("PENDING", payment.getStatus());
        assertEquals(BigDecimal.valueOf(100), payment.getAmount());
        assertEquals(10L, payment.getSubscriptionId());
        verify(paymentHistoryRepository).save(any(PaymentHistory.class));
    }

    @Test
    void createSubscriptionPaymentRejectsNonPending() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            subscriptionService.createSubscriptionPayment(10L, BigDecimal.valueOf(100), "BANK_TRANSFER");
        });

        assertTrue(exception.getMessage().contains("Only PENDING_PAYMENT subscriptions can be paid"));
        verify(paymentHistoryRepository, never()).save(any(PaymentHistory.class));
    }

    @Test
    void processPaymentCallbackSuccessTransitionsToActive() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .billingCycle("MONTHLY")
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        PaymentHistory paymentHistory = PaymentHistory.builder()
                .id(5L)
                .transactionId("tx1")
                .subscriptionId(10L)
                .amount(BigDecimal.valueOf(100))
                .status("PENDING")
                .build();

        when(paymentHistoryRepository.findByTransactionId("tx1")).thenReturn(Optional.of(paymentHistory));
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentHistoryRepository.save(any(PaymentHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(serviceInvoiceRepository.save(any(ServiceInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        subscriptionService.processPaymentCallback("tx1", "SUCCESS");

        assertEquals(SubscriptionStatus.ACTIVE, subscription.getStatus());
        assertEquals("COMPLETED", paymentHistory.getStatus());
        assertNotNull(paymentHistory.getPaidAt());
        assertNotNull(subscription.getStartDate());
        assertNotNull(subscription.getEndDate());
        verify(subscriptionRepository).save(subscription);
        verify(paymentHistoryRepository).save(paymentHistory);
        verify(serviceInvoiceRepository).save(any(ServiceInvoice.class));
    }

    @Test
    void processPaymentCallbackFailedDoesNotTransition() {
        Subscription subscription = Subscription.builder()
                .id(10L)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        PaymentHistory paymentHistory = PaymentHistory.builder()
                .id(5L)
                .transactionId("tx1")
                .subscriptionId(10L)
                .amount(BigDecimal.valueOf(100))
                .status("PENDING")
                .build();

        when(paymentHistoryRepository.findByTransactionId("tx1")).thenReturn(Optional.of(paymentHistory));
        when(paymentHistoryRepository.save(any(PaymentHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        subscriptionService.processPaymentCallback("tx1", "FAILED");

        assertEquals(SubscriptionStatus.PENDING_PAYMENT, subscription.getStatus());
        assertEquals("FAILED", paymentHistory.getStatus());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
        verify(serviceInvoiceRepository, never()).save(any(ServiceInvoice.class));
    }

    @Test
    void processPaymentCallbackDuplicateProtection() {
        PaymentHistory paymentHistory = PaymentHistory.builder()
                .id(5L)
                .transactionId("tx1")
                .subscriptionId(10L)
                .amount(BigDecimal.valueOf(100))
                .status("COMPLETED")
                .build();

        when(paymentHistoryRepository.findByTransactionId("tx1")).thenReturn(Optional.of(paymentHistory));

        subscriptionService.processPaymentCallback("tx1", "SUCCESS");

        verify(paymentHistoryRepository, never()).save(any(PaymentHistory.class));
        verify(subscriptionRepository, never()).findById(anyLong());
        verify(serviceInvoiceRepository, never()).save(any(ServiceInvoice.class));
    }
}
