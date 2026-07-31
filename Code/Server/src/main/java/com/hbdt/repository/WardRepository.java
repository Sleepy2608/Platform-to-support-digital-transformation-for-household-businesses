package com.hbdt.repository;

import com.hbdt.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, String> {

    List<Ward> findByDistrictCodeOrderByNameAsc(String districtCode);
}
