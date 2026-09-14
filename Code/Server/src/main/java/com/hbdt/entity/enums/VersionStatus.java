package com.hbdt.entity.enums;

/**
 * Lifecycle status of an individual report template version.
 *
 * <ul>
 *   <li>{@code DRAFT}: Scheduled for future activation (effectiveFrom > today).</li>
 *   <li>{@code ACTIVE}: Currently in-use version for financial report generation.</li>
 *   <li>{@code SUPERSEDED}: Replaced by a subsequent active version.</li>
 *   <li>{@code ARCHIVED}: Archived historical version preserved for audit integrity.</li>
 * </ul>
 */
public enum VersionStatus {
    DRAFT,
    ACTIVE,
    SUPERSEDED,
    ARCHIVED
}
