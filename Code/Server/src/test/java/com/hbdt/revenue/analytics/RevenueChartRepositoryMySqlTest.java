package com.hbdt.revenue.analytics;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.sql.DriverManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="HBDT_TEST_MYSQL_URL",matches=".+")
class RevenueChartRepositoryMySqlTest {
    SingleConnectionDataSource ds;
    RevenueChartRepository repo;
    @BeforeEach void setup() throws Exception {
        ds=new SingleConnectionDataSource(DriverManager.getConnection(System.getenv("HBDT_TEST_MYSQL_URL"),
                System.getenv("HBDT_TEST_MYSQL_USER"),System.getenv("HBDT_TEST_MYSQL_PASSWORD")),true);
        var jdbc=new JdbcTemplate(ds);
        jdbc.execute("CREATE TEMPORARY TABLE revenue_ledger_entries(business_id BIGINT, confirmed_at DATETIME(6), line_total DECIMAL(18,2), status VARCHAR(20))");
        jdbc.update("""
            INSERT INTO revenue_ledger_entries VALUES
            (7,'2026-09-01 00:00:00',100.25,'ACTIVE'),
            (7,'2026-09-01 23:59:59.999999',200.50,'ACTIVE'),
            (7,'2026-09-02 00:00:00',900,'ACTIVE'),
            (7,'2026-09-01 12:00:00',800,'CANCELLED'),
            (8,'2026-09-01 12:00:00',700,'ACTIVE')
            """);
        repo=new RevenueChartRepository(new NamedParameterJdbcTemplate(ds));
    }
    @AfterEach void cleanup(){if(ds!=null)ds.destroy();}
    @Test void sumsOnlyActiveBusinessRowsWithinInclusiveDay() {
        var day=LocalDate.of(2026,9,1);
        var rows=repo.daily(7L,day.atStartOfDay(),day.plusDays(1).atStartOfDay());
        assertEquals(1,rows.size());assertEquals(day,rows.getFirst().date());
        assertEquals(new BigDecimal("300.75"),rows.getFirst().revenue());
        assertTrue(repo.daily(99L,day.atStartOfDay(),day.plusDays(1).atStartOfDay()).isEmpty());
    }
}
