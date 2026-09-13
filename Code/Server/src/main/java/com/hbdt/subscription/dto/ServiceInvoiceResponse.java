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
    private String ownerUsername;
    private String ownerFullName;
    private Long businessId;

    public static ServiceInvoiceResponse fromEntity(ServiceInvoice invoice) {
        return fromEntity(invoice, invoice != null ? invoice.getUser() : null);
    }

    public static ServiceInvoiceResponse fromEntity(ServiceInvoice invoice, com.hbdt.entity.User owner) {
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
                .updatedAt(invoice.getCreatedAt())
                .ownerUsername(owner != null ? owner.getUsername() : null)
                .ownerFullName(owner != null ? owner.getFullName() : null)
                .businessId(invoice.getSubscription() != null ? invoice.getSubscription().getBusinessId() : null)
                .build();
    }
}
