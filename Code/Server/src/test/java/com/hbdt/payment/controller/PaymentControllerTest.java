package com.hbdt.payment.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.payment.dto.CreatePaymentRequest;
import com.hbdt.payment.dto.CustomerDebtSummaryResponse;
import com.hbdt.payment.dto.OrderPaymentSummaryResponse;
import com.hbdt.payment.dto.PaymentResponse;
import com.hbdt.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private PaymentService paymentService;
    @InjectMocks private PaymentController paymentController;

    private Authentication ownerAuth;
    private final Long orderId = 100L;
    private final Long customerId = 22L;

    @BeforeEach
    void setUp() {
        ownerAuth = new UsernamePasswordAuthenticationToken("owner", null, Collections.emptyList());
    }

    private PaymentResponse dummyResponse(Long id) {
        return new PaymentResponse(id, "PAY-001", orderId, "SO-001",
                customerId, "Nguyen Van An", new BigDecimal("75000"), "CASH",
                null, null, "PAYMENT", "ACTIVE",
                new BigDecimal("75000"), BigDecimal.ZERO, "PAID",
                BigDecimal.ZERO, LocalDateTime.now(), "owner", LocalDateTime.now());
    }

    private CreatePaymentRequest dummyReq(BigDecimal amount) {
        return new CreatePaymentRequest(orderId, customerId, null, amount, "CASH", null, null, null);
    }

    @Test
    @DisplayName("createPayment success returns 201")
    void createPayment_success() {
        PaymentResponse pr = dummyResponse(1L);
        CreatePaymentRequest req = dummyReq(new BigDecimal("75000"));
        when(paymentService.createPayment("owner", req)).thenReturn(pr);
        ResponseEntity<ApiResponse<PaymentResponse>> resp = paymentController.createPayment(ownerAuth, req);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resp.getBody().getData().amount()).isEqualByComparingTo("75000");
        assertThat(resp.getBody().getData().customerName()).isEqualTo("Nguyen Van An");
    }

    @Test
    @DisplayName("createPayment order not in business throws ResourceNotFoundException")
    void createPayment_orderNotInBusiness_throws() {
        CreatePaymentRequest req = dummyReq(new BigDecimal("50000"));
        when(paymentService.createPayment("owner", req))
                .thenThrow(new ResourceNotFoundException("order not found"));
        assertThatThrownBy(() -> paymentController.createPayment(ownerAuth, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createPayment amount exceeds debtAmount throws")
    void createPayment_amountExceedsDebt_throws() {
        CreatePaymentRequest req = dummyReq(new BigDecimal("9999999"));
        when(paymentService.createPayment("owner", req))
                .thenThrow(new IllegalArgumentException("so tien vuot qua no"));
        assertThatThrownBy(() -> paymentController.createPayment(ownerAuth, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createPayment cancelled order throws")
    void createPayment_cancelledOrder_throws() {
        CreatePaymentRequest req = dummyReq(new BigDecimal("50000"));
        when(paymentService.createPayment("owner", req))
                .thenThrow(new IllegalArgumentException("CONFIRMED"));
        assertThatThrownBy(() -> paymentController.createPayment(ownerAuth, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CONFIRMED");
    }

    @Test
    @DisplayName("createPayment customer not in business throws")
    void createPayment_customerNotInBusiness_throws() {
        CreatePaymentRequest req = dummyReq(new BigDecimal("50000"));
        when(paymentService.createPayment("owner", req))
                .thenThrow(new ResourceNotFoundException("khach hang khong con hoat dong"));
        assertThatThrownBy(() -> paymentController.createPayment(ownerAuth, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getOrderPayments success returns list")
    void getOrderPayments_success() {
        when(paymentService.getOrderPayments("owner", orderId)).thenReturn(List.of(dummyResponse(1L)));
        ResponseEntity<ApiResponse<List<PaymentResponse>>> resp = paymentController.getOrderPayments(ownerAuth, orderId);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData()).hasSize(1);
    }

    @Test
    @DisplayName("getOrderPayments not found throws")
    void getOrderPayments_notFound_throws() {
        when(paymentService.getOrderPayments("owner", orderId))
                .thenThrow(new IllegalArgumentException("don hang khong tim thay"));
        assertThatThrownBy(() -> paymentController.getOrderPayments(ownerAuth, orderId))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getOrderPayments empty list")
    void getOrderPayments_empty() {
        when(paymentService.getOrderPayments("owner", orderId)).thenReturn(Collections.emptyList());
        ResponseEntity<ApiResponse<List<PaymentResponse>>> resp = paymentController.getOrderPayments(ownerAuth, orderId);
        assertThat(resp.getBody().getData()).isEmpty();
    }

    @Test
    @DisplayName("getOrderPaymentSummary success")
    void getOrderPaymentSummary_success() {
        OrderPaymentSummaryResponse summary = new OrderPaymentSummaryResponse(
                orderId, "SO-001", customerId, "Nguyen Van An",
                new BigDecimal("300000"), new BigDecimal("300000"), BigDecimal.ZERO, "PAID", 1);
        when(paymentService.getOrderPaymentSummary("owner", orderId)).thenReturn(summary);
        ResponseEntity<ApiResponse<OrderPaymentSummaryResponse>> resp = paymentController.getOrderPaymentSummary(ownerAuth, orderId);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().paymentStatus()).isEqualTo("PAID");
        assertThat(resp.getBody().getData().remainingAmount()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("getCustomerPaymentHistory success")
    void getCustomerPaymentHistory_success() {
        PageResponse<PaymentResponse> page = new PageResponse<>(List.of(dummyResponse(1L)), 0, 20, 1L, 1, true, true);
        when(paymentService.getCustomerPaymentHistory("owner", customerId, 0, 20)).thenReturn(page);
        ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> resp =
                paymentController.getCustomerPaymentHistory(ownerAuth, customerId, 0, 20);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().content()).hasSize(1);
    }

    @Test
    @DisplayName("getCustomerPaymentHistory wrong business throws")
    void getCustomerPaymentHistory_wrongBusiness_throws() {
        when(paymentService.getCustomerPaymentHistory("owner", customerId, 0, 20))
                .thenThrow(new ResourceNotFoundException("khach hang khong thuoc cua hang"));
        assertThatThrownBy(() -> paymentController.getCustomerPaymentHistory(ownerAuth, customerId, 0, 20))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getCustomerPaymentHistory size > 100 throws")
    void getCustomerPaymentHistory_sizeExceedsMax_throws() {
        when(paymentService.getCustomerPaymentHistory("owner", customerId, 0, 200))
                .thenThrow(new IllegalArgumentException("size phai trong khoang 1-100"));
        assertThatThrownBy(() -> paymentController.getCustomerPaymentHistory(ownerAuth, customerId, 0, 200))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getCustomerDebtSummary success with totalVoid")
    void getCustomerDebtSummary_success() {
        CustomerDebtSummaryResponse summary = new CustomerDebtSummaryResponse(
                customerId, "KH-001", "Nguyen Van An",
                new BigDecimal("500000"), new BigDecimal("200000"),
                new BigDecimal("150000"), new BigDecimal("150000"));
        when(paymentService.getCustomerDebtSummary("owner", customerId)).thenReturn(summary);
        ResponseEntity<ApiResponse<CustomerDebtSummaryResponse>> resp = paymentController.getCustomerDebtSummary(ownerAuth, customerId);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().totalVoid()).isEqualByComparingTo("150000");
        assertThat(resp.getBody().getData().currentBalance()).isEqualByComparingTo("150000");
    }

    @Test
    @DisplayName("getCustomerDebtSummary wrong business throws")
    void getCustomerDebtSummary_wrongBusiness_throws() {
        when(paymentService.getCustomerDebtSummary("owner", customerId))
                .thenThrow(new ResourceNotFoundException("khach hang khong thuoc cua hang"));
        assertThatThrownBy(() -> paymentController.getCustomerDebtSummary(ownerAuth, customerId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getCustomerDebtSummary unauthorized throws AccessDeniedException")
    void getCustomerDebtSummary_noAuth_throws() {
        Authentication attackerAuth = new UsernamePasswordAuthenticationToken("attacker", null, Collections.emptyList());
        when(paymentService.getCustomerDebtSummary("attacker", customerId))
                .thenThrow(new AccessDeniedException("Access Denied"));
        assertThatThrownBy(() -> paymentController.getCustomerDebtSummary(attackerAuth, customerId))
                .isInstanceOf(AccessDeniedException.class);
    }
}
