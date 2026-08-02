package com.hbdt.repository;

import com.hbdt.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findByBusinessProfileId(Long businessProfileId);
}
