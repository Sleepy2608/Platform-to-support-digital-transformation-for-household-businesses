package com.hbdt.repository;

import com.hbdt.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long>, JpaSpecificationExecutor<Feedback> {

    Page<Feedback> findByBusinessId(Long businessId, Pageable pageable);

    Page<Feedback> findBySubmittedBy(Long submittedBy, Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE f.submittedBy = :submittedBy " +
           "AND (:status IS NULL OR f.status = :status) " +
           "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
           "AND (:search IS NULL OR LOWER(f.subject) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "    OR LOWER(f.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Feedback> searchMyFeedback(
            @Param("submittedBy") Long submittedBy,
            @Param("status") String status,
            @Param("feedbackType") String feedbackType,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE f.businessId = :businessId " +
           "AND (:status IS NULL OR f.status = :status) " +
           "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
           "AND (:search IS NULL OR LOWER(f.subject) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "    OR LOWER(f.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Feedback> searchFeedback(
            @Param("businessId") Long businessId,
            @Param("status") String status,
            @Param("feedbackType") String feedbackType,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE " +
           "(:status IS NULL OR f.status = :status) " +
           "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
           "AND (:search IS NULL OR LOWER(f.subject) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "    OR LOWER(f.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Feedback> searchAllFeedback(
            @Param("status") String status,
            @Param("feedbackType") String feedbackType,
            @Param("search") String search,
            Pageable pageable);

    List<Feedback> findBySubmittedByOrderByCreatedAtDesc(Long submittedBy);
}
