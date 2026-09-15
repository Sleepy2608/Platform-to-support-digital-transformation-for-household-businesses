package com.hbdt.accounting.dto;

public record FilledTemplateColumnResponse(
        String key,
        String label,
        String type,
        boolean required
) {
}
