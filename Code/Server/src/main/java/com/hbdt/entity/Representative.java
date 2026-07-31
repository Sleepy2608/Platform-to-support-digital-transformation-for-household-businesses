package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Người đại diện pháp lý của hồ sơ doanh nghiệp.
 * Quan hệ 1-1 với BusinessProfile (thiết kế @ManyToOne để mở rộng sau).
 */
@Entity
@Table(name = "representatives", uniqueConstraints = {
        @UniqueConstraint(name = "uq_representative_profile", columnNames = "business_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Representative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_profile_id", nullable = false)
    private BusinessProfile businessProfile;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "email", nullable = false, length = 255)
    private String email;
}
