package com.hbdt.subscription.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.repository.SubscriptionPlanRepository;
import com.hbdt.subscription.dto.SubscriptionPlanRequest;
import com.hbdt.subscription.dto.SubscriptionPlanResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionPlanServiceTest {

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    private SubscriptionPlanService subscriptionPlanService;

    @BeforeEach
    void setUp() {
        subscriptionPlanService = new SubscriptionPlanService(subscriptionPlanRepository);
    }

    @Test
    void createNormalizesCodeAndDefaultsToActive() {
        SubscriptionPlanRequest request = request(" pro ", "Gói Pro", "299000", "2990000", null);
        when(subscriptionPlanRepository.save(any(SubscriptionPlan.class))).thenAnswer(invocation -> {
            SubscriptionPlan plan = invocation.getArgument(0);
            plan.setId(3L);
            return plan;
        });

        SubscriptionPlanResponse response = subscriptionPlanService.create(request);

        assertEquals(3L, response.id());
        assertEquals("PRO", response.planCode());
        assertEquals("ACTIVE", response.status());
        assertEquals(new BigDecimal("299000"), response.monthlyPrice());
    }

    @Test
    void createRejectsDuplicatePlanCode() {
        SubscriptionPlanRequest request = request("VIP", "Gói VIP", "399000", "3990000", "ACTIVE");
        when(subscriptionPlanRepository.existsByPlanCodeIgnoreCase("VIP")).thenReturn(true);

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> subscriptionPlanService.create(request));

        assertEquals("Mã gói thuê bao đã tồn tại", error.getMessage());
        verify(subscriptionPlanRepository, never()).save(any(SubscriptionPlan.class));
    }

    @Test
    void createRejectsAnnualPriceLowerThanMonthlyPrice() {
        SubscriptionPlanRequest request = request("BAD", "Gói lỗi", "500000", "300000", "ACTIVE");

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> subscriptionPlanService.create(request));

        assertEquals("Giá theo năm không được thấp hơn giá theo tháng", error.getMessage());
        verify(subscriptionPlanRepository, never()).save(any(SubscriptionPlan.class));
    }

    @Test
    void deactivateUsesSoftDelete() {
        SubscriptionPlan plan = plan(4L, "VIP", "ACTIVE");
        when(subscriptionPlanRepository.findById(4L)).thenReturn(Optional.of(plan));
        when(subscriptionPlanRepository.save(plan)).thenReturn(plan);

        SubscriptionPlanResponse response = subscriptionPlanService.deactivate(4L);

        assertEquals("INACTIVE", response.status());
        verify(subscriptionPlanRepository).save(plan);
    }

    @Test
    void publicCatalogContainsOnlyActivePlans() {
        when(subscriptionPlanRepository.findAllByStatusOrderByMonthlyPriceAsc("ACTIVE"))
                .thenReturn(List.of(plan(1L, "STANDARD", "ACTIVE"), plan(2L, "VIP", "ACTIVE")));

        List<SubscriptionPlanResponse> result = subscriptionPlanService.getPublicPlans();

        assertEquals(2, result.size());
        assertEquals("STANDARD", result.getFirst().planCode());
    }

    private SubscriptionPlanRequest request(String code, String name, String monthly, String annual, String status) {
        return new SubscriptionPlanRequest(
                code, name, new BigDecimal(monthly), new BigDecimal(annual), "Mô tả", status);
    }

    private SubscriptionPlan plan(Long id, String code, String status) {
        return SubscriptionPlan.builder()
                .id(id)
                .planCode(code)
                .planName("Gói " + code)
                .monthlyPrice(new BigDecimal("199000"))
                .annualPrice(new BigDecimal("1990000"))
                .status(status)
                .build();
    }
}
