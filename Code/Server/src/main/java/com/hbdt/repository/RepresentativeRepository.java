package com.hbdt.repository;

import com.hbdt.entity.Representative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RepresentativeRepository extends JpaRepository<Representative, Long> {

    Optional<Representative> findByBusinessProfileId(Long businessProfileId);
}
