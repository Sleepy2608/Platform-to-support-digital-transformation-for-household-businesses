package com.hbdt.owner.service;

import com.hbdt.entity.Coupon;
import com.hbdt.entity.CouponCheckout;
import com.hbdt.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponCheckoutServiceTest {
    private static final String REFERENCE = "HBDTCP0123456789ABCDEF";
    private static final BigDecimal EXPECTED_AMOUNT = new BigDecimal("75000");

    @Mock private CouponCheckoutRepository checkoutRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private UserRepository userRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionPlanRepository planRepository;
    @Mock private PaymentHistoryRepository paymentHistoryRepository;
    @Mock private OwnerService ownerService;
    @InjectMocks private CouponCheckoutService service;

    @Test
    void activatesOnlyAfterExactPaymentAndDoesNotActivateAgain() {
        Coupon coupon = Coupon.builder().id(1L).build();
        CouponCheckout checkout = CouponCheckout.builder()
                .finalAmount(EXPECTED_AMOUNT).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(checkoutRepository.findCouponId(REFERENCE)).thenReturn(Optional.of(1L));
        when(couponRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(coupon));
        when(checkoutRepository.findByReferenceForUpdate(REFERENCE)).thenReturn(Optional.of(checkout));

        assertFalse(service.confirm(REFERENCE, new BigDecimal("74999"), "underpaid"));
        assertNull(checkout.getPaidAt());
        verifyNoInteractions(ownerService);

        assertTrue(service.confirm(REFERENCE, EXPECTED_AMOUNT, "paid"));
        assertNotNull(checkout.getPaidAt());
        assertFalse(service.confirm(REFERENCE, EXPECTED_AMOUNT, "second-transfer"));
        verify(ownerService).completeCouponCheckout(checkout, coupon, "paid");
        verifyNoMoreInteractions(ownerService);
    }
}
