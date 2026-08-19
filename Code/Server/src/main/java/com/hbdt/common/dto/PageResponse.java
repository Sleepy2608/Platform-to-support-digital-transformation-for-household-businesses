package com.hbdt.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Phân trang response dùng chung cho toàn bộ API.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <T> PageResponse<T> from(Page<T> source) {
        return new PageResponse<>(
                source.getContent(),
                source.getNumber(),
                source.getSize(),
                source.getTotalElements(),
                source.getTotalPages(),
                source.isFirst(),
                source.isLast()
        );
    }
}
