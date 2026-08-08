package com.hbdt.repository;

import com.hbdt.entity.TermsConsent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TermsConsentRepository extends JpaRepository<TermsConsent, Long> {

    /** Lấy lịch sử chấp thuận của một người dùng, mới nhất trước. */
    List<TermsConsent> findByUserIdOrderByAcceptedAtDesc(Long userId);
}
