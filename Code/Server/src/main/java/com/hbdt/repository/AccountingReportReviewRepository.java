package com.hbdt.repository;

import com.hbdt.entity.AccountingReportReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface AccountingReportReviewRepository extends JpaRepository<AccountingReportReview, Long> {
    Optional<AccountingReportReview>
    findFirstByBusinessIdAndPeriodFromAndPeriodToAndDataSignatureOrderByReviewedAtDescIdDesc(
            Long businessId,
            LocalDate periodFrom,
            LocalDate periodTo,
            String dataSignature);
}
