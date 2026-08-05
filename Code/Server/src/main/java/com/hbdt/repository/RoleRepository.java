package com.hbdt.repository;

import com.hbdt.entity.Role;
import com.hbdt.entity.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Tìm role theo tên. Dùng findFirst để an toàn nếu bảng roles còn dữ liệu trùng
     * (findByName sẽ ném NonUniqueResultException khi có nhiều dòng cùng tên).
     */
    Optional<Role> findFirstByName(RoleType name);
}
