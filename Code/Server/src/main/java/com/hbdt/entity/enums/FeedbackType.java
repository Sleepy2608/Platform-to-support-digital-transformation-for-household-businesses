package com.hbdt.entity.enums;

public enum FeedbackType {
    SUGGESTION("Góp ý"),
    BUG_REPORT("Lỗi hệ thống"),
    SUPPORT_REQUEST("Yêu cầu hỗ trợ"),
    COMPLAINT("Khiếu nại");

    private final String label;

    FeedbackType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
