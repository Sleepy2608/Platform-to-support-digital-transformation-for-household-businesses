package com.hbdt.entity;

import com.hbdt.entity.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "role_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Role role;

    @Column(name = "username", unique = true, nullable = false, length = 100)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "national_id", length = 20)
    private String nationalId;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Transient
    private String avatarUrl;

    @Transient
    private LocalDateTime subscriptionExpiresAt;

    @Transient
    private String packageType;

    @Transient
    private LocalDateTime deletedAt;

    // ===== Employee profile fields (HBDT-114) =====

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "national_id", length = 20)
    private String nationalId;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    // ===== Audit =====

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = UserStatus.ACTIVE;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ===== UserDetails implementation =====

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return Collections.emptySet();
        }
        return Set.of(new SimpleGrantedAuthority("ROLE_" + role.getName().name()));
    }

    /**
     * Compatibility view for API responses that expose roles as an array.
     * The canonical schema stores exactly one role through users.role_id.
     */
    public Set<Role> getRoles() {
        return role == null ? Collections.emptySet() : Set.of(role);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // DEACTIVATED = soft-deleted, PENDING_VERIFICATION still allowed to proceed
        return status == UserStatus.ACTIVE || status == UserStatus.PENDING_VERIFICATION;
    }
}
