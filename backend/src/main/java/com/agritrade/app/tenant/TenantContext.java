package com.agritrade.app.tenant;

/**
 * Luu tenant_id (id cua ho kinh doanh/Owner) hien tai cho request dang xu ly.
 * Duoc set boi TenantFilter sau khi giai ma JWT, va duoc doc boi
 * repository/service de tu dong loc du lieu theo tenant, tranh truy cap cheo cua hang.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
