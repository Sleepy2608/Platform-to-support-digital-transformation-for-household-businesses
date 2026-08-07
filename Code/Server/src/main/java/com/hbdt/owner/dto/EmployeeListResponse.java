package com.hbdt.owner.dto;

import lombok.*;

import java.util.List;

/**
 * Response DTO cho danh sách nhân viên có phân trang (HBDT-14).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeListResponse {

    private List<EmployeeResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}
