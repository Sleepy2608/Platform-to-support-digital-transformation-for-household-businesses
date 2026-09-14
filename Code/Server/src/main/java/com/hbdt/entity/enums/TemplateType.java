package com.hbdt.entity.enums;

/**
 * Defines the category/type of a financial report template.
 * Each type maps to a specific accounting structure
 * (e.g., revenue ledger, expense ledger, debt report).
 */
public enum TemplateType {
    REVENUE_LEDGER,
    EXPENSE_LEDGER,
    DEBT_REPORT,
    CASH_FLOW,
    TAX_SUMMARY,
    BALANCE_SHEET
}
