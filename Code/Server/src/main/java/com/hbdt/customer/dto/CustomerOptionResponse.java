package com.hbdt.customer.dto;

public record CustomerOptionResponse(
        Long id,
        String customerCode,
        String customerName,
        String phone
) {
}
