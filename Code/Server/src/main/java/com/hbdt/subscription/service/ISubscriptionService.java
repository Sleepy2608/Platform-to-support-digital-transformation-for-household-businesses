package com.hbdt.subscription.service;

import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    com.hbdt.entity.ServiceInvoice createInvoiceForSubscription(Long subscriptionId, User owner);
}
