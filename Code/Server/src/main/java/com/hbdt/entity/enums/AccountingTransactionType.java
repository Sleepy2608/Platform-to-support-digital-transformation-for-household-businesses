package com.hbdt.entity.enums;

/**
 * Loai giao dich ke toan -- dung cho module HBDT-59 Automatic Sales Bookkeeping.
 * <p>
 * Enum nay doc lap voi DebtTransactionType (quan ly cong no).
 * AccountingTransactionType mo ta ban chat kinh te cua but toan.
 * </p>
 */
public enum AccountingTransactionType {

    /** Ghi nhan doanh thu khi don hang duoc xac nhan */
    SALE,

    /** Ghi nhan khoan thanh toan / tra no cua khach hang */
    PAYMENT,

    /** Dao but toan doanh thu khi don hang bi tra ve */
    RETURN
}