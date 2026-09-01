package com.hbdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;

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

    // ===== Employee Management queries (HBDT-14) =====

    /** Danh sách nhân viên thuộc cửa hàng, có tìm kiếm theo tên/username */
    @Query("""
        SELECT u FROM User u
        WHERE u.businessId = :businessId
          AND u.role.name = :roleType
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:status IS NULL OR u.status = :status)
        ORDER BY u.createdAt DESC
        """)
    Page<User> findEmployeesByBusiness(
            @Param("businessId") Long businessId,
            @Param("roleType") RoleType roleType,
            @Param("keyword") String keyword,
            @Param("status") UserStatus status,
            Pageable pageable);

    /** Tìm nhân viên theo id và businessId để validate quyền */
    Optional<User> findByIdAndBusinessIdAndRole_Name(Long id, Long businessId, RoleType roleType);

    /** Kiểm tra username đã tồn tại trong cùng business chưa */
    boolean existsByUsernameAndBusinessId(String username, Long businessId);

    /** Đếm nhân viên đang ACTIVE của một business */
    long countByBusinessIdAndRole_NameAndStatus(Long businessId, RoleType roleType, UserStatus status);

    /** Đếm tổng số nhân viên của một business */
    long countByBusinessIdAndRole_Name(Long businessId, RoleType roleType);

    List<User> findAllByBusinessIdAndStatus(Long businessId, UserStatus status);
}
