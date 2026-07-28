package com.hbdt;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class HbdtApplicationTests {

    @Test
    void contextLoads() {
        // Kiểm tra Spring context khởi động thành công
    }
}
