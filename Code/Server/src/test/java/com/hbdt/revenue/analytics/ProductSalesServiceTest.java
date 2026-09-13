package com.hbdt.revenue.analytics;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.product.service.BusinessContextService;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductSalesServiceTest {
    final ProductSalesRepository repository = mock(ProductSalesRepository.class);
    final BusinessContextService business = mock(BusinessContextService.class);
    final ProductSalesService service = new ProductSalesService(repository, business);
    final LocalDate day = LocalDate.of(2026, 9, 1);

    @Test void scopesToAuthenticatedBusinessAndIncludesWholeEndDay() {
        when(business.requireBusinessId("owner")).thenReturn(5L);
        when(repository.rank(anyLong(), any(), any(), any(), anyInt())).thenReturn(List.of());
        assertTrue(service.rank("owner", day, day, ProductSalesService.Mode.BEST, 10).isEmpty());
        verify(repository).rank(5L, day.atStartOfDay(), day.plusDays(1).atStartOfDay(), ProductSalesService.Mode.BEST, 10);
    }
    @Test void rejectsInvalidRangesBeforeQuery() {
        assertThrows(BadRequestException.class, () -> service.rank("owner", day.plusDays(1), day, ProductSalesService.Mode.BEST, 10));
        assertThrows(BadRequestException.class, () -> service.rank("owner", null, day, ProductSalesService.Mode.BEST, 10));
        verifyNoInteractions(repository);
    }
    @Test void rejectsInvalidLimits() {
        for (int limit : new int[]{0, -1, 101})
            assertThrows(BadRequestException.class, () -> service.rank("owner", day, day, ProductSalesService.Mode.BEST, limit));
        verifyNoInteractions(repository);
    }
    @Test void missingBusinessDoesNotQueryData() {
        when(business.requireBusinessId("owner")).thenThrow(new BadRequestException("missing business"));
        assertThrows(BadRequestException.class, () -> service.rank("owner", day, day, ProductSalesService.Mode.BEST, 10));
        verifyNoInteractions(repository);
    }
}
