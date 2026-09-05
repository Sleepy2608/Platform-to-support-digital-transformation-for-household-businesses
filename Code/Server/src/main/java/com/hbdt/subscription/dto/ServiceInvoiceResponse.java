package com.hbdt.subscription.dto;

import com.hbdt.entity.ServiceInvoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInvoiceResponse {
    private Long id;
    private String invoiceCode;
    private Long subscriptionId;
    private Long planId;
    private String planName;
    private Integer duration;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ServiceInvoiceResponse fromEntity(ServiceInvoice invoice) {
        if (invoice == null) {
            return null;
        }
        return ServiceInvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceCode(invoice.getInvoiceCode())
                .subscriptionId(invoice.getSubscription() != null ? invoice.getSubscription().getId() : null)
                .planId(invoice.getPlan() != null ? invoice.getPlan().getId() : null)
                .planName(invoice.getPlan() != null ? invoice.getPlan().getPlanName() : null)
                .duration(invoice.getDuration())
                .unitPrice(invoice.getUnitPrice())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
