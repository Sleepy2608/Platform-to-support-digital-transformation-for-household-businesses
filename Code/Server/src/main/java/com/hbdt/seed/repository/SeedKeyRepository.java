package com.hbdt.seed.repository;

import com.hbdt.seed.entity.SeedKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeedKeyRepository extends JpaRepository<SeedKey, Long> {

    Optional<SeedKey> findTopByOrderByIdAsc();
}
