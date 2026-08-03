package com.hbdt.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class SeedRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SeedRunner.class);

    private final List<DataSeeder> seeders;

    public SeedRunner(List<DataSeeder> seeders) {
        this.seeders = seeders;
    }

    @Override
    public void run(String... args) {
        List<DataSeeder> ordered = seeders.stream()
                .sorted(Comparator.comparingInt(DataSeeder::order))
                .toList();

        logger.info("SeedRunner: tim thay {} seeder, bat dau chay.", ordered.size());

        for (DataSeeder seeder : ordered) {
            try {
                seeder.seed();
                logger.info("SeedRunner: da chay xong seeder [{}] (order={}).", seeder.name(), seeder.order());
            } catch (Exception e) {
                logger.error("SeedRunner: seeder [{}] loi, bo qua va chay tiep. {}", seeder.name(), e.getMessage(), e);
            }
        }

        logger.info("SeedRunner: hoan tat seed du lieu.");
    }
}
