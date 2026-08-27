package com.hbdt.subscription.service;

import com.hbdt.entity.BusinessProfile;
import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.ServiceInvoice;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.BusinessProfileRepository;
import com.hbdt.repository.PaymentHistoryRepository;
import com.hbdt.repository.ServiceInvoiceRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private BusinessProfileRepository businessProfileRepository;
    @Mock
    private PaymentHistoryRepository paymentHistoryRepository;
    @Mock
    private ServiceInvoiceRepository serviceInvoiceRepository;

    private SubscriptionService service;
    private User owner;
    private BusinessProfile business;
    private SubscriptionPlan plan;

    @BeforeEach
    void setUp() {
        service = new SubscriptionService(
                subscriptionRepository,
                businessProfileRepository,
                paymentHistoryRepository,
                serviceInvoiceRepository
        );
        owner = User.builder().id(1L).businessId(100L).username("owner1").build();
        business = BusinessProfile.builder().id(100L).businessName("Cửa hàng A").build();
        plan = SubscriptionPlan.builder()
                .id(2L)
                .planCode("VIP")
                .planName("Gói VIP")
                .monthlyPrice(new BigDecimal("100000"))
                .annualPrice(new BigDecimal("1000000"))
                .status("ACTIVE")
                .build();
    }

    @Test
    void createsPendingSubscriptionForBusiness() {
        LocalDate start = LocalDate.now();
        when(businessProfileRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(business));
        when(subscriptionRepository.existsByBusinessIdAndStatusIn(eq(100L), any())).thenReturn(false);
        when(subscriptionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription result = service.createPendingPaymentSubscription(
                owner, plan, "monthly", start, start.plusMonths(1));

        assertEquals(100L, result.getBusinessId());
        assertEquals(plan, result.getPlan());
        assertEquals("MONTHLY", result.getBillingCycle());
        assertEquals(SubscriptionStatus.PENDING_PAYMENT, result.getStatus());
    }

    @Test
    void rejectsDuplicateOpenSubscription() {
        LocalDate start = LocalDate.now();
        when(businessProfileRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(business));
        when(subscriptionRepository.existsByBusinessIdAndStatusIn(eq(100L), any())).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.createPendingPaymentSubscription(
                owner, plan, "MONTHLY", start, start.plusMonths(1)));
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void rejectsInvalidSubscriptionDatesAndBillingCycle() {
        LocalDate today = LocalDate.now();
        assertThrows(IllegalArgumentException.class, () -> service.createPendingPaymentSubscription(
                owner, plan, "MONTHLY", today, today));
        assertThrows(IllegalArgumentException.class, () -> service.createPendingPaymentSubscription(
                owner, plan, "WEEKLY", today, today.plusDays(7)));
    }

    @Test
    void activationSetsDatesFromPaymentDate() {
        Subscription subscription = pendingSubscription();
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(subscription)).thenReturn(subscription);

        service.activateSubscription(10L);

        assertEquals(SubscriptionStatus.ACTIVE, subscription.getStatus());
        assertEquals(LocalDate.now(), subscription.getStartDate());
        assertEquals(LocalDate.now().plusMonths(1), subscription.getEndDate());
    }

    @Test
    void activationRejectsInvalidTransition() {
        Subscription active = activeSubscription(100L);
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(active));
        assertThrows(IllegalStateException.class, () -> service.activateSubscription(10L));
    }

    @Test
    void validatesInclusiveEndDateAndRejectsTerminalStatuses() {
        Subscription active = activeSubscription(100L);
        active.setEndDate(LocalDate.now());
        assertTrue(service.isSubscriptionValid(active));
        assertDoesNotThrow(() -> service.validateSubscriptionUsage(active));

        Subscription expired = Subscription.builder().status(SubscriptionStatus.EXPIRED).build();
        Subscription cancelled = Subscription.builder().status(SubscriptionStatus.CANCELLED).build();
        Subscription pending = Subscription.builder().status(SubscriptionStatus.PENDING_PAYMENT).build();
        assertThrows(IllegalStateException.class, () -> service.validateSubscriptionUsage(expired));
        assertThrows(IllegalStateException.class, () -> service.validateSubscriptionUsage(cancelled));
        assertThrows(IllegalStateException.class, () -> service.validateSubscriptionUsage(pending));
    }

    @Test
    void expiresOnlyActiveSubscriptionsPastEndDate() {
        Subscription expired = activeSubscription(100L);
        expired.setEndDate(LocalDate.now().minusDays(1));
        when(subscriptionRepository.findAllByStatusAndEndDateBefore(
                SubscriptionStatus.ACTIVE, LocalDate.now())).thenReturn(List.of(expired));

        service.checkAndExpireSubscriptions();

        assertEquals(SubscriptionStatus.EXPIRED, expired.getStatus());
        verify(subscriptionRepository).saveAll(List.of(expired));
    }

    @Test
    void enforcesBusinessOwnershipWhenReadingDetail() {
        Subscription subscription = activeSubscription(200L);
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        assertThrows(AccessDeniedException.class, () -> service.getSubscriptionById(10L, owner));
    }

    @Test
    void cancelsActiveSubscriptionAndStoresReason() {
        Subscription subscription = activeSubscription(100L);
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(subscription)).thenReturn(subscription);

        Subscription result = service.cancelSubscription(10L, owner, " Không còn nhu cầu ");

        assertEquals(SubscriptionStatus.CANCELLED, result.getStatus());
        assertEquals("Không còn nhu cầu", result.getCancellationReason());
        assertNotNull(result.getCancelledAt());
    }

    @Test
    void createsOnePendingPaymentWithExactPlanPrice() {
        Subscription subscription = pendingSubscription();
        when(subscriptionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(subscription));
        when(paymentHistoryRepository.existsBySubscriptionIdAndStatus(10L, "PENDING")).thenReturn(false);
        when(paymentHistoryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentHistory payment = service.createSubscriptionPayment(
                10L, new BigDecimal("100000"), "bank_transfer");

        assertEquals(10L, payment.getSubscriptionId());
        assertEquals("PENDING", payment.getStatus());
        assertEquals("BANK_TRANSFER", payment.getPaymentMethod());
    }

    @Test
    void rejectsWrongPaymentAmountAndDuplicatePendingPayment() {
        Subscription subscription = pendingSubscription();
        when(subscriptionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(subscription));

        assertThrows(IllegalArgumentException.class, () -> service.createSubscriptionPayment(
                10L, new BigDecimal("1"), "BANK_TRANSFER"));

        when(paymentHistoryRepository.existsBySubscriptionIdAndStatus(10L, "PENDING")).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> service.createSubscriptionPayment(
                10L, new BigDecimal("100000"), "BANK_TRANSFER"));
    }

    @Test
    void successfulCallbackActivatesOnceAndCreatesInvoice() {
        Subscription subscription = pendingSubscription();
        PaymentHistory payment = PaymentHistory.builder()
                .transactionId("tx1")
                .subscriptionId(subscription.getId())
                .amount(new BigDecimal("100000"))
                .status("PENDING")
                .build();
        when(paymentHistoryRepository.findByTransactionIdForUpdate("tx1"))
                .thenReturn(Optional.of(payment));
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(subscription));
        when(serviceInvoiceRepository.existsBySubscriptionIdAndStatus(10L, "PAID")).thenReturn(false);

        service.processPaymentCallback("tx1", "SUCCESS");

        assertEquals(SubscriptionStatus.ACTIVE, subscription.getStatus());
        assertEquals("COMPLETED", payment.getStatus());
        assertNotNull(payment.getPaidAt());
        verify(serviceInvoiceRepository).save(any(ServiceInvoice.class));
    }

    @Test
    void duplicateOrFailedCallbackDoesNotActivateTwice() {
        PaymentHistory completed = PaymentHistory.builder()
                .transactionId("tx1")
                .status("COMPLETED")
                .build();
        when(paymentHistoryRepository.findByTransactionIdForUpdate("tx1"))
                .thenReturn(Optional.of(completed));
        service.processPaymentCallback("tx1", "SUCCESS");
        verifyNoInteractions(subscriptionRepository, serviceInvoiceRepository);

        Subscription pending = pendingSubscription();
        PaymentHistory failed = PaymentHistory.builder()
                .transactionId("tx2")
                .subscriptionId(pending.getId())
                .status("PENDING")
                .build();
        when(paymentHistoryRepository.findByTransactionIdForUpdate("tx2"))
                .thenReturn(Optional.of(failed));
        service.processPaymentCallback("tx2", "FAILED");
        assertEquals("FAILED", failed.getStatus());
        assertEquals(SubscriptionStatus.PENDING_PAYMENT, pending.getStatus());
    }

    private Subscription pendingSubscription() {
        return Subscription.builder()
                .id(10L)
                .businessId(business.getId())
                .plan(plan)
                .billingCycle("MONTHLY")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();
    }

    private Subscription activeSubscription(Long businessId) {
        return Subscription.builder()
                .id(10L)
                .businessId(businessId)
                .plan(plan)
                .billingCycle("MONTHLY")
                .startDate(LocalDate.now().minusDays(1))
                .endDate(LocalDate.now().plusDays(1))
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }
}
