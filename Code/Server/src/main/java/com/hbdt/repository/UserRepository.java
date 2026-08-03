package com.hbdt.repository;

import com.hbdt.entity.User;
import com.hbdt.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hbdt.entity.enums.RoleType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
