package com.hbdt.seed;

import com.hbdt.seed.service.SeedService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SeedRestoreInitializer implements DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(SeedRestoreInitializer.class);

    private final SeedService seedService;

    public SeedRestoreInitializer(SeedService seedService) {
        this.seedService = seedService;
    }

    @Override
    public int order() {
        return 50;
    }

    @Override
    public void seed() {
        int n = seedService.restoreAll();
        logger.info("SeedRestoreInitializer: da seek {} cau hinh tu file.", n);
    }
}
