package com.hbdt.seed.repository;

import com.hbdt.seed.entity.SeedConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeedConfigRepository extends JpaRepository<SeedConfig, Long> {

    Optional<SeedConfig> findByTableName(String tableName);

    List<SeedConfig> findAllByEnabledTrueOrderBySeedOrderAsc();
}
