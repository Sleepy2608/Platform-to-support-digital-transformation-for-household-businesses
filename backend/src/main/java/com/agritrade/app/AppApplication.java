package com.agritrade.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Diem khoi dong ung dung backend.
 * Kien truc: multi-tenant SaaS - moi ho kinh doanh (Owner) la mot tenant duoc
 * cach ly du lieu bang tenant_id gan tren cac bang nghiep vu.
 */
@SpringBootApplication
public class AppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppApplication.class, args);
    }
}
