package com.hbdt.repository;

import com.hbdt.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DistrictRepository extends JpaRepository<District, String> {

    List<District> findByProvinceCodeOrderByNameAsc(String provinceCode);
}
