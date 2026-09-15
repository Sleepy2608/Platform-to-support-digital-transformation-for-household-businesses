package com.hbdt.revenue.analytics;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RevenueChartServiceTest {
    final RevenueChartRepository repo = mock(RevenueChartRepository.class);
    final BusinessContextService context = mock(BusinessContextService.class);
    final RevenueLedgerService ledger = mock(RevenueLedgerService.class);
    final RevenueChartService service = new RevenueChartService(repo, context, ledger);
    final LocalDate from = LocalDate.of(2026, 9, 1);
    void rows(LocalDate to, List<RevenueChartRepository.DailyRevenue> values) {
        when(context.requireBusinessId("owner")).thenReturn(7L);
        when(repo.daily(7L, from.atStartOfDay(), to.plusDays(1).atStartOfDay())).thenReturn(values);
    }
    @Test void fillsGapsAndReconcilesDecimalTotals() {
        rows(from.plusDays(2), List.of(new RevenueChartRepository.DailyRevenue(from, new BigDecimal("100.25")),
                new RevenueChartRepository.DailyRevenue(from.plusDays(2), new BigDecimal("200.50"))));
        var result = service.chart("owner", from, from.plusDays(2), RevenueChartService.GroupBy.DAY);
        assertEquals(3, result.points().size());
        assertEquals(BigDecimal.ZERO, result.points().get(1).revenue());
        assertEquals(new BigDecimal("300.75"), result.totalRevenue());
        assertTrue(result.hasData());
        verify(ledger).syncMissingConfirmedOrders(7L);
        verify(repo).daily(7L, from.atStartOfDay(), from.plusDays(3).atStartOfDay());
    }
    @Test void weeksStartOnMondayAndClipPartialPeriods() {
        var to = from.plusDays(7);
        rows(to, List.of(new RevenueChartRepository.DailyRevenue(from.plusDays(5), BigDecimal.TEN),
                new RevenueChartRepository.DailyRevenue(from.plusDays(6), BigDecimal.ONE)));
        var result = service.chart("owner", from, to, RevenueChartService.GroupBy.WEEK);
        assertEquals(2, result.points().size());
        assertEquals(from, result.points().getFirst().fromDate());
        assertEquals(LocalDate.of(2026,9,6), result.points().getFirst().toDate());
        assertEquals(BigDecimal.TEN, result.points().getFirst().revenue());
        assertEquals(to, result.points().getLast().toDate());
        assertEquals(BigDecimal.ONE, result.points().getLast().revenue());
    }
    @Test void emptyMonthsAndYearsStillHaveBuckets() {
        var to = LocalDate.of(2027,1,2); rows(to,List.of());
        var months = service.chart("owner",from,to,RevenueChartService.GroupBy.MONTH);
        assertEquals(5,months.points().size()); assertFalse(months.hasData());
        assertEquals(BigDecimal.ZERO,months.totalRevenue());
        assertEquals(2,service.chart("owner",from,to,RevenueChartService.GroupBy.YEAR).points().size());
    }
    @Test void rejectsBadRangeAndTooManyPointsBeforeQuerying() {
        assertThrows(BadRequestException.class, () -> service.chart("owner",from,from.minusDays(1),RevenueChartService.GroupBy.DAY));
        assertThrows(BadRequestException.class, () -> service.chart("owner",from,from.plusDays(366),RevenueChartService.GroupBy.DAY));
        assertThrows(BadRequestException.class, () -> service.chart("owner",from,from.plusYears(11),RevenueChartService.GroupBy.YEAR));
        verifyNoInteractions(repo,ledger,context);
    }
    @Test void deniedBusinessNeverQueriesRevenue() {
        when(context.requireBusinessId("other")).thenThrow(new BadRequestException("No business"));
        assertThrows(BadRequestException.class, () -> service.chart("other",from,from,RevenueChartService.GroupBy.DAY));
        verifyNoInteractions(repo,ledger);
    }
}
