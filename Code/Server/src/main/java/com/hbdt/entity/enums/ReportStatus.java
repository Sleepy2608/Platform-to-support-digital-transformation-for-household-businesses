package com.hbdt.entity.enums;

/**
 * Lifecycle status of a generated financial report.
 *
 * <p>Workflow: DRAFT → PENDING_REVIEW → CONFIRMED | REJECTED</p>
 *
 * <ul>
 *   <li><b>DRAFT</b> – Report has been auto-generated but not yet reviewed.</li>
 *   <li><b>PENDING_REVIEW</b> – Report has been edited or submitted for Owner review.</li>
 *   <li><b>CONFIRMED</b> – Owner has verified the data and confirmed the report.</li>
 *   <li><b>REJECTED</b> – Owner has rejected the report with a reason.</li>
 * </ul>
 */
public enum ReportStatus {
    DRAFT,
    PENDING_REVIEW,
    CONFIRMED,
    REJECTED
}
