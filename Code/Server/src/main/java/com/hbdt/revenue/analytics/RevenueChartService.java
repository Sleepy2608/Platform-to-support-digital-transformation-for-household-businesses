package com.hbdt.revenue.analytics;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class RevenueChartService {
    public enum GroupBy { DAY, WEEK, MONTH, YEAR }
    public record Point(LocalDate fromDate, LocalDate toDate, BigDecimal revenue) {}
    public record Response(LocalDate fromDate, LocalDate toDate, GroupBy groupBy,
                           BigDecimal totalRevenue, boolean hasData, List<Point> points) {}
    private final RevenueChartRepository repository;
    private final BusinessContextService businessContext;
    private final RevenueLedgerService ledger;
    public RevenueChartService(RevenueChartRepository repository, BusinessContextService businessContext,
                               RevenueLedgerService ledger) {
        this.repository = repository; this.businessContext = businessContext; this.ledger = ledger;
    }

    @Transactional
    public Response chart(String username, LocalDate from, LocalDate to, GroupBy groupBy) {
        if (from == null || to == null || groupBy == null || from.isAfter(to))
            throw new BadRequestException("Khoảng ngày không hợp lệ");
        if (from.getYear() < 1900 || to.getYear() > 9998 || ChronoUnit.DAYS.between(from, to) > 3660)
            throw new BadRequestException("Khoảng thời gian tối đa 10 năm, từ năm 1900");
        var buckets = new LinkedHashMap<LocalDate, BigDecimal>();
        for (LocalDate date = start(from, groupBy); !date.isAfter(to); date = next(date, groupBy)) {
            buckets.put(date, BigDecimal.ZERO);
            if (buckets.size() > 366)
                throw new BadRequestException("Tối đa 366 mốc thời gian. Hãy chọn nhóm tuần, tháng hoặc năm");
        }
        Long businessId = businessContext.requireBusinessId(username);
        ledger.syncMissingConfirmedOrders(businessId);
        var rows = repository.daily(businessId, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        for (var row : rows) buckets.merge(start(row.date(), groupBy), row.revenue(), BigDecimal::add);
        var points = buckets.entrySet().stream().map(e -> new Point(
            e.getKey().isBefore(from) ? from : e.getKey(),
            next(e.getKey(), groupBy).minusDays(1).isAfter(to) ? to : next(e.getKey(), groupBy).minusDays(1),
            e.getValue())).toList();
        return new Response(from, to, groupBy,
            points.stream().map(Point::revenue).reduce(BigDecimal.ZERO, BigDecimal::add), !rows.isEmpty(), points);
    }
    private LocalDate start(LocalDate date, GroupBy groupBy) {
        return switch (groupBy) {
            case DAY -> date;
            case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> date.withDayOfMonth(1);
            case YEAR -> date.withDayOfYear(1);
        };
    }
    private LocalDate next(LocalDate date, GroupBy groupBy) {
        return switch (groupBy) {
            case DAY -> date.plusDays(1); case WEEK -> date.plusWeeks(1);
            case MONTH -> date.plusMonths(1); case YEAR -> date.plusYears(1);
        };
    }
}
