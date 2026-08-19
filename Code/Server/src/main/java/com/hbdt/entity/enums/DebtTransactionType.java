package com.hbdt.entity.enums;

/**
 * Loại giao dịch công nợ.
 */
public enum DebtTransactionType {
    /** Phát sinh nợ khi đơn hàng chưa trả đủ */
    DEBT_INCREASE,
    /** Khách hàng thanh toán / trả nợ */
    PAYMENT,
    /** Điều chỉnh công nợ thủ công */
    ADJUSTMENT,
    /** Hủy / đảo giao dịch */
    VOID
}
