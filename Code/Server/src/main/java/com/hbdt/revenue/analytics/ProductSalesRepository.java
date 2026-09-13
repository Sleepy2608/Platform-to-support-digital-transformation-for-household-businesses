package com.hbdt.revenue.analytics;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public class ProductSalesRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public ProductSalesRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<ProductSalesRow> rank(Long businessId, LocalDateTime from, LocalDateTime until,
            ProductSalesService.Mode mode, int limit) {
        // Aggregate within the tenant before joining products, including zero-sale products.
        String sql = """
            SELECT p.id, p.product_code, p.product_name, u.unit_name, p.status,
                   COALESCE(s.quantity_sold, 0) AS quantity_sold,
                   COALESCE(s.order_count, 0) AS order_count
            FROM products p
            LEFT JOIN units u ON u.id = p.base_unit_id
            LEFT JOIN (
                SELECT i.product_id, SUM(i.base_quantity) AS quantity_sold,
                       COUNT(DISTINCT o.id) AS order_count
                FROM sales_order_items i JOIN sales_orders o ON o.id = i.sales_order_id
                WHERE o.business_id = :businessId
                  AND o.status IN ('CONFIRMED', 'CANCEL_REQUESTED')
                  AND COALESCE(o.confirmed_at, o.created_at) >= :fromTime
                  AND COALESCE(o.confirmed_at, o.created_at) < :untilTime
                GROUP BY i.product_id
            ) s ON s.product_id = p.id
            WHERE p.business_id = :businessId AND p.created_at < :untilTime
            """;
        sql += mode == ProductSalesService.Mode.UNSOLD
                ? " AND COALESCE(s.quantity_sold, 0) = 0 AND p.status = 'ACTIVE'"
                : " AND s.quantity_sold > 0";
        sql += " ORDER BY quantity_sold " + (mode == ProductSalesService.Mode.BEST ? "DESC" : "ASC")
                + ", p.id ASC LIMIT :limit";
        return jdbc.query(sql, Map.of("businessId", businessId, "fromTime", from,
                "untilTime", until, "limit", limit), (rs, n) -> new ProductSalesRow(
                rs.getLong("id"), rs.getString("product_code"), rs.getString("product_name"),
                rs.getString("unit_name"), rs.getString("status"), rs.getBigDecimal("quantity_sold"),
                rs.getLong("order_count")));
    }
}
