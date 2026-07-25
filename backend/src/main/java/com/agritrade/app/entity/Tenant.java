package com.agritrade.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Ho kinh doanh (khach hang nen tang). Moi Tenant tuong ung mot cua hang doc lap,
 * du lieu nghiep vu (san pham, don hang, khach hang...) duoc gan tenant_id de cach ly.
 */
@Getter
@Setter
@Entity
@Table(name = "tenants")
public class Tenant extends BaseEntity {

    @Column(name = "business_name", nullable = false, length = 255)
    private String businessName;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "representative_name", length = 255)
    private String representativeName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
