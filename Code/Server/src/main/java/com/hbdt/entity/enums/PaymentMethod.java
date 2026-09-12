package com.hbdt.entity.enums;

/**
 * Phương thức thanh toán.
 * <p>
 * HBDT-59: bổ sung {@code DEBT} để hỗ trợ ghi nhận giao dịch mua chịu
 * trong module Automatic Sales Bookkeeping.
 * </p>
 */
public enum PaymentMethod {
    /** Tiền mặt */
    CASH,
    /** Chuyển khoản ngân hàng */
    BANK_TRANSFER,
    /** Mua chịu / công nợ */
    DEBT
}
