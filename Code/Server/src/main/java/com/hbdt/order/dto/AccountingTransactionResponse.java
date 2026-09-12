package com.hbdt.order.dto;

import com.hbdt.entity.AccountingTransaction;
import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.AccountingTransactionType;
import com.hbdt.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO cho mot but toan ke toan -- HBDT-59.
 * Dung static factory fromEntity() de tach biet tang Entity va tang API.
 */
public record AccountingTransactionResponse(
        Long id,
        Long businessId,
        Long orderId,
        Long customerId,
        AccountingTransactionType transactionType,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal debtAmount,
        PaymentMethod paymentMethod,
        AccountingTransactionStatus status,
        Long createdBy,
        LocalDateTime createdAt
) {
    /**
     * Map tu AccountingTransaction entity sang DTO.
     * @param entity entity lay tu DB
     * @return DTO tuong ung
     */
    public static AccountingTransactionResponse fromEntity(AccountingTransaction entity) {
        return new AccountingTransactionResponse(
                entity.getId(),
                entity.getBusinessId(),
                entity.getOrderId(),
                entity.getCustomerId(),
                entity.getTransactionType(),
                entity.getTotalAmount(),
                entity.getPaidAmount(),
                entity.getDebtAmount(),
                entity.getPaymentMethod(),
                entity.getStatus(),
                entity.getCreatedBy(),
                entity.getCreatedAt()
        );
    }
}