package com.hbdt.revenue.analytics;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public class RevenueChartRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public RevenueChartRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record DailyRevenue(LocalDate date, BigDecimal revenue) {}

    public List<DailyRevenue> daily(Long businessId, LocalDateTime from, LocalDateTime until) {
        // Same source and ACTIVE status as RevenueLedgerRepository.calculateSummary.
        // Sum line totals, never the order total repeated on each ledger item.
        return jdbc.query("""
            SELECT DATE(confirmed_at) AS revenue_date, SUM(line_total) AS revenue
            FROM revenue_ledger_entries
            WHERE business_id = :businessId AND status = 'ACTIVE'
              AND confirmed_at >= :fromDate AND confirmed_at < :untilDate
            GROUP BY DATE(confirmed_at)
            ORDER BY revenue_date
            """, Map.of("businessId", businessId, "fromDate", from, "untilDate", until),
            (rs, row) -> new DailyRevenue(rs.getDate("revenue_date").toLocalDate(), rs.getBigDecimal("revenue")));
    }
}
