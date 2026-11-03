package com.hbdt.sepay.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.*;
import com.hbdt.sepay.dto.SepayWebhookPayload;
import com.hbdt.sepay.dto.SepayWebhookResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SepayWebhookServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PaymentHistoryRepository paymentHistoryRepository;

    @Mock
    private ServiceInvoiceRepository serviceInvoiceRepository;

    @Mock
    private SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @InjectMocks
    private SepayWebhookService sepayWebhookService;

    private static final String TEST_SECRET = "spsk_test_4hP4UGF9NSNY5Hjyt8mbVcT8P2wWEBNS";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(sepayWebhookService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(sepayWebhookService, "expectedAccountNumber", "108871728162");
    }

    @Test
    @DisplayName("Kịch bản chuẩn từ AGENTS.md: Xử lý payload HBDT SUB-TEST-123 chuyển sang ACTIVE và cộng endDate")
    void testProcessStandardAgentsMdPayloadSuccessfully() {
        // Payload đúng chuẩn từ AGENTS.md
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92704L)
                .gateway("VietinBank")
                .transactionDate("2026-10-31 10:00:00")
                .accountNumber("108871728162")
                .transferType("in")
                .transferAmount(new BigDecimal("100000"))
                .accumulated(new BigDecimal("100000"))
                .code(null)
                .content("HBDT SUB-TEST-123")
                .referenceCode("FT26123456789")
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("100000"))
                .build();

        Subscription sub = Subscription.builder()
                .id(123L)
                .userId(1L)
                .businessId(50L)
                .plan(plan)
                .billingCycle("MONTHLY")
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now())
                .build();

        when(paymentHistoryRepository.findByTransactionId("SEPAY-92704")).thenReturn(Optional.empty());
        when(subscriptionRepository.findById(123L)).thenReturn(Optional.of(sub));

        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, "Apikey " + TEST_SECRET);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(SubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(LocalDate.now().plusMonths(1), sub.getEndDate());

        verify(subscriptionRepository).save(sub);
        verify(paymentHistoryRepository).save(any(PaymentHistory.class));
        verify(subscriptionHistoryRepository).save(any(SubscriptionHistory.class));
    }

    @Test
    @DisplayName("Gia hạn subscription theo mã cú pháp HBDT RENEW 50 3")
    void testProcessRenewBusinessMonthsSuccessfully() {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92705L)
                .gateway("VietinBank")
                .transferType("in")
                .transferAmount(new BigDecimal("300000"))
                .content("HBDT RENEW 50 3")
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("100000"))
                .build();

        LocalDate initialEndDate = LocalDate.now().plusMonths(1);
        Subscription sub = Subscription.builder()
                .id(88L)
                .userId(1L)
                .businessId(50L)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .endDate(initialEndDate)
                .build();

        when(paymentHistoryRepository.findByTransactionId("SEPAY-92705")).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByBusinessIdAndStatusOrderByCreatedAtDesc(50L, SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(sub));

        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, null);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(initialEndDate.plusMonths(3), sub.getEndDate());
        verify(subscriptionRepository).save(sub);
        verify(paymentHistoryRepository).save(any(PaymentHistory.class));
    }

    @Test
    @DisplayName("Idempotency: Giao dịch đã tồn tại thì bỏ qua không gia hạn 2 lần")
    void testIdempotentDuplicateTransactionIgnored() {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92704L)
                .transferType("in")
                .content("HBDT SUB-TEST-123")
                .build();

        PaymentHistory existing = PaymentHistory.builder()
                .id(1L)
                .transactionId("SEPAY-92704")
                .status("COMPLETED")
                .build();

        when(paymentHistoryRepository.findByTransactionId("SEPAY-92704")).thenReturn(Optional.of(existing));

        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, null);

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("đã được xử lý trước đó"));
        verify(subscriptionRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Từ chối request khi header Authorization sai Secret Key")
    void testRejectInvalidAuthorizationHeader() {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92704L)
                .transferType("in")
                .content("HBDT SUB-TEST-123")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> sepayWebhookService.processWebhook(payload, "Apikey wrong_secret_key"));

        assertTrue(ex.getMessage().contains("không hợp lệ"));
    }

    @Test
    @DisplayName("Bỏ qua giao dịch tiền ra (transferType = out)")
    void testIgnoreOutgoingTransfer() {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92706L)
                .transferType("out")
                .content("HBDT refund")
                .build();

        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, null);

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Bỏ qua giao dịch tiền ra"));
        verify(subscriptionRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Bỏ qua giao dịch khi số tài khoản thụ hưởng không khớp với hệ thống")
    void testIgnoreMismatchedAccountNumber() {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92707L)
                .gateway("VietinBank")
                .accountNumber("999999999999") // Khác với 108871728162 trong setUp
                .transferType("in")
                .transferAmount(new BigDecimal("100000"))
                .content("HBDT RENEW 50 1")
                .build();

        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, null);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Bỏ qua giao dịch không đúng số tài khoản"));
        verify(subscriptionRepository, never()).findTopByBusinessIdAndStatusOrderByCreatedAtDesc(anyLong(), any());
    }
}

