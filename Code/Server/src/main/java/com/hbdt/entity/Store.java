package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Cửa hàng của hộ kinh doanh.
 * Hiện tại là 1-1 với BusinessProfile (unique constraint trên business_profile_id).
 * Thiết kế @ManyToOne để dễ mở rộng thành 1-n sau này.
 */
@Entity
@Table(name = "stores", uniqueConstraints = {
        @UniqueConstraint(name = "uq_store_business_profile", columnNames = "business_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_profile_id", nullable = false)
    private BusinessProfile businessProfile;

    @Column(name = "store_name", nullable = false, length = 255)
    private String storeName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;
}
