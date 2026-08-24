package com.hbdt.config;

import com.hbdt.entity.TaxActivityGroup;
import com.hbdt.entity.Unit;
import com.hbdt.repository.TaxActivityGroupRepository;
import com.hbdt.repository.UnitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@Order(2)
public class CatalogReferenceDataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(CatalogReferenceDataSeeder.class);
    private static final String ACTIVE = "ACTIVE";
    private static final LocalDate TAX_RULE_EFFECTIVE_FROM = LocalDate.of(2026, 1, 1);

    private final UnitRepository unitRepository;
    private final TaxActivityGroupRepository taxActivityGroupRepository;

    public CatalogReferenceDataSeeder(UnitRepository unitRepository,
                                      TaxActivityGroupRepository taxActivityGroupRepository) {
        this.unitRepository = unitRepository;
        this.taxActivityGroupRepository = taxActivityGroupRepository;
    }

    @Override
    public void run(String... args) {
        seedProductUnits();
        seedTaxActivityGroups();
    }

    private void seedProductUnits() {
        seedUnit("SAN_PHAM", "Sản phẩm");
        seedUnit("CAI", "Cái");
        seedUnit("BAO", "Bao");
        seedUnit("KG", "Kilôgam");
        seedUnit("VIEN", "Viên");
        seedUnit("THUNG", "Thùng");
        seedUnit("HOP", "Hộp");
        seedUnit("CHAI", "Chai");
        seedUnit("LIT", "Lít");
        seedUnit("MET", "Mét");
    }

    private void seedUnit(String code, String name) {
        unitRepository.findFirstByUnitCodeIgnoreCase(code)
                .ifPresentOrElse(unit -> {
                    if (!ACTIVE.equals(unit.getStatus())) {
                        unit.setStatus(ACTIVE);
                        unitRepository.save(unit);
                    }
                }, () -> {
                    unitRepository.save(Unit.builder()
                            .unitCode(code)
                            .unitName(name)
                            .status(ACTIVE)
                            .build());
                    logger.info("Seeded product unit: {}", code);
                });
    }

    private void seedTaxActivityGroups() {
        seedTaxActivityGroup(
                "DISTRIBUTION_GOODS",
                "Phân phối, cung cấp hàng hóa",
                "1.0000",
                "0.5000"
        );
        seedTaxActivityGroup(
                "SERVICES_NO_MATERIALS",
                "Dịch vụ, xây dựng không bao thầu nguyên vật liệu",
                "5.0000",
                "2.0000"
        );
        seedTaxActivityGroup(
                "PRODUCTION_TRANSPORT",
                "Sản xuất, vận tải, dịch vụ gắn với hàng hóa",
                "3.0000",
                "1.5000"
        );
        seedTaxActivityGroup(
                "OTHER_BUSINESS",
                "Hoạt động kinh doanh khác",
                "2.0000",
                "1.0000"
        );
    }

    private void seedTaxActivityGroup(String code, String name, String vatRate, String pitRate) {
        taxActivityGroupRepository.findFirstByActivityCodeIgnoreCase(code)
                .ifPresentOrElse(group -> {
                    if (!ACTIVE.equals(group.getStatus())) {
                        group.setStatus(ACTIVE);
                        taxActivityGroupRepository.save(group);
                    }
                }, () -> {
                    taxActivityGroupRepository.save(TaxActivityGroup.builder()
                            .activityCode(code)
                            .activityName(name)
                            .vatCalculationRate(new BigDecimal(vatRate))
                            .pitCalculationRate(new BigDecimal(pitRate))
                            .effectiveFrom(TAX_RULE_EFFECTIVE_FROM)
                            .status(ACTIVE)
                            .build());
                    logger.info("Seeded tax activity group: {}", code);
                });
    }
}
