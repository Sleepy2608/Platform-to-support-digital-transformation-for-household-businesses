package com.hbdt.owner.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * DTO mô tả một gói dịch vụ trả về từ GET /api/owner/subscription/packages.
 */
@Getter
@Builder
public class PackageDto {
    private String id;            // "STANDARD" | "VIP"
    private String name;
    private String description;
    private long monthlyPrice;    // VND
    private long yearlyPrice;     // VND (= monthlyPrice * 10 — tặng 2 tháng)
    private boolean recommended;
    private List<String> features;
}
