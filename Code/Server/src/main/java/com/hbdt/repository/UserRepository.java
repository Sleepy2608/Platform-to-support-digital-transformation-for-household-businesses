package com.hbdt.repository;

import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    long countByStatus(UserStatus status);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleType")
    List<User> findByRoleType(@Param("roleType") RoleType roleType);

    // =========================================================
    // Employee queries (phạm vi theo businessId)
    // =========================================================

    @Query("SELECT u FROM User u WHERE u.businessId = :businessId AND u.role.name = :roleType ORDER BY u.createdAt DESC")
    List<User> findByBusinessIdAndRoleType(@Param("businessId") Long businessId,
                                           @Param("roleType") RoleType roleType);

    @Query("SELECT u FROM User u WHERE u.businessId = :businessId AND u.role.name = :roleType " +
            "AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY u.createdAt DESC")
    List<User> searchByBusinessIdAndRoleType(@Param("businessId") Long businessId,
                                             @Param("roleType") RoleType roleType,
                                             @Param("keyword") String keyword);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.businessId = :businessId AND u.role.name = :roleType")
    Optional<User> findByIdAndBusinessIdAndRoleType(@Param("id") Long id,
                                                    @Param("businessId") Long businessId,
                                                    @Param("roleType") RoleType roleType);
}
