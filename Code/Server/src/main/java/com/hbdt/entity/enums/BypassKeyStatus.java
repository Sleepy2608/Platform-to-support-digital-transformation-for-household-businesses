package com.hbdt.entity.enums;

public enum BypassKeyStatus {
    ACTIVE("Đang hoạt động"),
    DISABLED("Tạm khóa"),
    DEPLETED("Hết lượt dùng"),
    EXPIRED("Đã hết hạn");

    private final String description;

    BypassKeyStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

