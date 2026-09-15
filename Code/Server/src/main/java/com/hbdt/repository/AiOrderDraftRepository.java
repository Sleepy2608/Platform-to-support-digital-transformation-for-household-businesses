package com.hbdt.repository;

import com.hbdt.entity.AiOrderDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiOrderDraftRepository extends JpaRepository<AiOrderDraft, Long> {
    List<AiOrderDraft> findTop50ByBusinessIdAndStatusOrderByCreatedAtDesc(Long businessId, String status);
    Optional<AiOrderDraft> findByIdAndBusinessId(Long id, Long businessId);
}
