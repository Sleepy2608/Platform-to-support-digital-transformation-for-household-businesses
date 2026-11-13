package com.hbdt.entity.enums;

public enum CouponStatus {
    ACTIVE("Đang hoạt động"),
    DISABLED("Tạm khóa"),
    DEPLETED("Hết lượt dùng"),
    EXPIRED("Đã hết hạn");

    private final String description;

    CouponStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

