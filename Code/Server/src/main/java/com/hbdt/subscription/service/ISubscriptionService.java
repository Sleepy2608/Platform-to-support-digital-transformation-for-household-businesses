package com.hbdt.subscription.service;

import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.hbdt.entity.ServiceInvoice;
import com.hbdt.subscription.dto.ServiceInvoiceResponse;

public interface ISubscriptionService {

    Subscription createPendingPaymentSubscription(User owner, SubscriptionPlan plan, String billingCycle,
                                                   LocalDate startDate,
                                                   LocalDate endDate);

    Subscription activateSubscription(Long id);

    PaymentHistory createSubscriptionPayment(Long subscriptionId, BigDecimal amount, String paymentMethod);

    void processPaymentCallback(String transactionId, String paymentStatus);

    boolean isSubscriptionValid(Subscription subscription);

    void validateSubscriptionUsage(Subscription subscription);

    Subscription getCurrentSubscription(User owner);

    Subscription getSubscriptionById(Long id, User owner);

    Subscription cancelSubscription(Long id, User owner, String reason);

    void checkAndExpireSubscriptions();

    ServiceInvoice createInvoiceForSubscription(Long subscriptionId, User owner);

    List<ServiceInvoiceResponse> getOwnerInvoiceHistory(User owner, String status, LocalDate fromDate, LocalDate toDate);

    ServiceInvoiceResponse getOwnerInvoiceDetail(Long invoiceId, User owner);
}
