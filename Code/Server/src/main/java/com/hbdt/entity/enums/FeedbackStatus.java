package com.hbdt.entity.enums;

public enum FeedbackStatus {
    NEW("Mới"),
    IN_PROGRESS("Đang xử lý"),
    RESOLVED("Đã giải quyết"),
    CLOSED("Đã đóng");

    private final String label;

    FeedbackStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
