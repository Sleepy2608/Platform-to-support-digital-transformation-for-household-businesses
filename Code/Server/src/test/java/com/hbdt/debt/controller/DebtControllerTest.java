package com.hbdt.debt.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.debt.service.DebtBookkeepingService;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.DebtTransactionStatus;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DebtControllerTest {

    @Mock private DebtBookkeepingService debtBookkeepingService;
    @Mock private DebtTransactionRepository debtTransactionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private DebtController debtController;

    private Authentication auth;
    private final Long businessId = 5L;

    @BeforeEach
    void setUp() {
        auth = new UsernamePasswordAuthenticationToken("owner", "pass", Collections.emptyList());
        User user = User.builder().id(1L).businessId(businessId).username("owner").build();
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("getCustomerBalance returns debt balance from SSOT")
    void getCustomerBalance_success() {
        when(debtBookkeepingService.calculateCustomerDebt(10L, businessId))
                .thenReturn(new BigDecimal("350000.00"));

        ResponseEntity<ApiResponse<BigDecimal>> response = debtController.getCustomerBalance(auth, 10L);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualByComparingTo("350000.00");
    }

    @Test
    @DisplayName("getCustomerTransactions returns paginated active transactions")
    void getCustomerTransactions_success() {
        DebtTransaction tx = DebtTransaction.builder()
                .id(1L)
                .transactionCode("DT-001")
                .customerId(10L)
                .businessId(businessId)
                .amount(new BigDecimal("100000.00"))
                .transactionType("PAYMENT")
                .status(DebtTransactionStatus.ACTIVE)
                .build();
        PageImpl<DebtTransaction> page = new PageImpl<>(List.of(tx), PageRequest.of(0, 20), 1);

        when(debtTransactionRepository.findByCustomerIdAndBusinessIdAndStatus(
                eq(10L), eq(businessId), eq(DebtTransactionStatus.ACTIVE), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<PageResponse<DebtTransaction>>> response =
                debtController.getCustomerTransactions(auth, 10L, 0, 20);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().content()).hasSize(1);
    }

    @Test
    @DisplayName("getOrderTransactions returns transactions for order")
    void getOrderTransactions_success() {
        DebtTransaction tx = DebtTransaction.builder()
                .id(2L)
                .transactionCode("DT-002")
                .salesOrderId(100L)
                .businessId(businessId)
                .amount(new BigDecimal("50000.00"))
                .status(DebtTransactionStatus.ACTIVE)
                .build();

        when(debtTransactionRepository.findBySalesOrderIdAndBusinessIdAndStatus(
                100L, businessId, DebtTransactionStatus.ACTIVE))
                .thenReturn(List.of(tx));

        ResponseEntity<ApiResponse<List<DebtTransaction>>> response =
                debtController.getOrderTransactions(auth, 100L);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).hasSize(1);
    }
}
