package com.agritrade.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AppApplicationTests {

    @Test
    void contextLoads() {
        // Kiem tra Spring context khoi tao thanh cong voi cau hinh test (H2 in-memory)
    }
}
