package com.hbdt.subscription.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.repository.SubscriptionPlanRepository;
import com.hbdt.subscription.dto.SubscriptionPlanRequest;
import com.hbdt.subscription.dto.SubscriptionPlanResponse;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class SubscriptionPlanService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public SubscriptionPlanService(SubscriptionPlanRepository subscriptionPlanRepository) {
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    public List<SubscriptionPlanResponse> search(String keyword, String status) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = normalizeStatusFilter(status);
        return subscriptionPlanRepository.findAll(Sort.by(Sort.Direction.ASC, "monthlyPrice")).stream()
                .filter(plan -> normalizedStatus == null || normalizedStatus.equals(plan.getStatus()))
                .filter(plan -> normalizedKeyword.isBlank()
                        || plan.getPlanCode().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                        || plan.getPlanName().toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .map(this::toResponse)
                .toList();
    }

    public List<SubscriptionPlanResponse> getPublicPlans() {
        return subscriptionPlanRepository.findAllByStatusOrderByMonthlyPriceAsc(ACTIVE).stream()
                .map(this::toResponse)
                .toList();
    }

    public SubscriptionPlanResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public SubscriptionPlanResponse create(SubscriptionPlanRequest request) {
        String code = normalizeCode(request.planCode());
        if (subscriptionPlanRepository.existsByPlanCodeIgnoreCase(code)) {
            throw new BadRequestException("Mã gói thuê bao đã tồn tại");
        }
        validatePrices(request);
        SubscriptionPlan saved = subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .planCode(code)
                .planName(request.planName().trim())
                .monthlyPrice(request.monthlyPrice())
                .annualPrice(request.annualPrice())
                .description(cleanOptional(request.description()))
                .status(normalizeStatus(request.status(), ACTIVE))
                .build());
        return toResponse(saved);
    }

    @Transactional
    public SubscriptionPlanResponse update(Long id, SubscriptionPlanRequest request) {
        SubscriptionPlan plan = find(id);
        String code = normalizeCode(request.planCode());
        if (subscriptionPlanRepository.existsByPlanCodeIgnoreCaseAndIdNot(code, id)) {
            throw new BadRequestException("Mã gói thuê bao đã tồn tại");
        }
        validatePrices(request);
        plan.setPlanCode(code);
        plan.setPlanName(request.planName().trim());
        plan.setMonthlyPrice(request.monthlyPrice());
        plan.setAnnualPrice(request.annualPrice());
        plan.setDescription(cleanOptional(request.description()));
        plan.setStatus(normalizeStatus(request.status(), plan.getStatus()));
        return toResponse(subscriptionPlanRepository.save(plan));
    }

    @Transactional
    public SubscriptionPlanResponse deactivate(Long id) {
        SubscriptionPlan plan = find(id);
        plan.setStatus(INACTIVE);
        return toResponse(subscriptionPlanRepository.save(plan));
    }

    private SubscriptionPlan find(Long id) {
        return subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói thuê bao với ID: " + id));
    }

    private void validatePrices(SubscriptionPlanRequest request) {
        if (request.monthlyPrice().signum() < 0 || request.annualPrice().signum() < 0) {
            throw new BadRequestException("Giá gói thuê bao không được âm");
        }
        if (request.annualPrice().compareTo(request.monthlyPrice()) < 0) {
            throw new BadRequestException("Giá theo năm không được thấp hơn giá theo tháng");
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return normalizeStatus(status, ACTIVE);
    }

    private String normalizeStatus(String status, String fallback) {
        if (status == null || status.isBlank()) {
            return fallback;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!ACTIVE.equals(normalized) && !INACTIVE.equals(normalized)) {
            throw new BadRequestException("Trạng thái phải là ACTIVE hoặc INACTIVE");
        }
        return normalized;
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private SubscriptionPlanResponse toResponse(SubscriptionPlan plan) {
        return new SubscriptionPlanResponse(
                plan.getId(),
                plan.getPlanCode(),
                plan.getPlanName(),
                plan.getMonthlyPrice(),
                plan.getAnnualPrice(),
                plan.getDescription(),
                plan.getStatus(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}
