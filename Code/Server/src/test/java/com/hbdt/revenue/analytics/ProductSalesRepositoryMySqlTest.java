package com.hbdt.revenue.analytics;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.sql.DriverManager;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

/** Optional real-MySQL check. Connection-local temporary tables never change application data. */
@EnabledIfEnvironmentVariable(named = "HBDT_TEST_MYSQL_URL", matches = ".+")
class ProductSalesRepositoryMySqlTest {
    SingleConnectionDataSource dataSource;
    ProductSalesRepository repository;
    final LocalDateTime from = LocalDateTime.of(2026, 9, 1, 0, 0);
    final LocalDateTime until = from.plusDays(1);

    @BeforeEach void setup() throws Exception {
        dataSource = new SingleConnectionDataSource(DriverManager.getConnection(
                System.getenv("HBDT_TEST_MYSQL_URL"), System.getenv("HBDT_TEST_MYSQL_USER"),
                System.getenv("HBDT_TEST_MYSQL_PASSWORD")), true);
        var jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("CREATE TEMPORARY TABLE products(id BIGINT, business_id BIGINT, base_unit_id BIGINT, product_code VARCHAR(50), product_name VARCHAR(255), status VARCHAR(20), created_at DATETIME)");
        jdbc.execute("CREATE TEMPORARY TABLE units(id BIGINT, unit_name VARCHAR(50))");
        jdbc.execute("CREATE TEMPORARY TABLE sales_orders(id BIGINT, business_id BIGINT, status VARCHAR(20), confirmed_at DATETIME(6), created_at DATETIME(6))");
        jdbc.execute("CREATE TEMPORARY TABLE sales_order_items(product_id BIGINT, sales_order_id BIGINT, base_quantity DECIMAL(18,3))");
        jdbc.update("INSERT INTO units VALUES (1,'Chai')");
        jdbc.update("""
            INSERT INTO products VALUES
            (1,5,1,'P1','One','ACTIVE','2026-08-01'),
            (2,5,1,'P2','Two','ACTIVE','2026-08-01'),
            (3,5,1,'P3','Zero','ACTIVE','2026-08-01'),
            (4,5,1,'P4','Future','ACTIVE','2026-09-02'),
            (5,9,1,'P5','Other business','ACTIVE','2026-08-01'),
            (6,5,1,'P6','Inactive zero','INACTIVE','2026-08-01'),
            (7,5,1,'P7','Inactive sold','INACTIVE','2026-08-01')
            """);
        jdbc.update("""
            INSERT INTO sales_orders VALUES
            (1,5,'CONFIRMED','2026-09-01 00:00:00','2026-08-31'),
            (2,5,'CANCEL_REQUESTED','2026-09-01 23:59:59.999999','2026-09-01'),
            (3,5,'CANCELLED','2026-09-01','2026-09-01'),
            (4,5,'DRAFT','2026-09-01','2026-09-01'),
            (5,5,'CONFIRMED','2026-09-02','2026-09-01'),
            (6,9,'CONFIRMED','2026-09-01','2026-09-01'),
            (7,5,'CONFIRMED',NULL,'2026-09-01')
            """);
        jdbc.update("INSERT INTO sales_order_items VALUES (1,1,12),(1,1,2),(1,2,3),(1,3,100),(1,4,100),(1,5,100),(1,6,100),(2,7,0.5),(5,6,100),(7,1,2)");
        repository = new ProductSalesRepository(new NamedParameterJdbcTemplate(dataSource));
    }
    @AfterEach void cleanup() { if (dataSource != null) dataSource.destroy(); }

    @Test void aggregatesBaseQuantityAndDistinctOrdersWithinDayAndBusiness() {
        var rows = repository.rank(5L, from, until, ProductSalesService.Mode.BEST, 10);
        assertEquals(3, rows.size());
        assertEquals(1L, rows.getFirst().productId());
        assertEquals(0, rows.getFirst().quantitySold().compareTo(new java.math.BigDecimal("17")));
        assertEquals(2, rows.getFirst().orderCount());
        assertEquals("Chai", rows.getFirst().unitName());
    }
    @Test void slowIncludesPositiveSalesOnlyAndSupportsLimit() {
        var rows = repository.rank(5L, from, until, ProductSalesService.Mode.SLOW, 1);
        assertEquals(1, rows.size());
        assertEquals(2L, rows.getFirst().productId());
    }
    @Test void unsoldExcludesInactiveFutureAndOtherBusinessProducts() {
        var rows = repository.rank(5L, from, until, ProductSalesService.Mode.UNSOLD, 10);
        assertEquals(1, rows.size());
        assertEquals(3L, rows.getFirst().productId());
    }
    @Test void emptyBusinessReturnsEmptyList() {
        assertTrue(repository.rank(99L, from, until, ProductSalesService.Mode.BEST, 10).isEmpty());
    }
}
