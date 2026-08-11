package com.hbdt.config;

import com.hbdt.entity.TaxActivityGroup;
import com.hbdt.entity.Unit;
import com.hbdt.repository.TaxActivityGroupRepository;
import com.hbdt.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogReferenceDataSeederTest {

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private TaxActivityGroupRepository taxActivityGroupRepository;

    private CatalogReferenceDataSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new CatalogReferenceDataSeeder(unitRepository, taxActivityGroupRepository);
    }

    @Test
    void seedsProductUnitAndFourTaxGroupsWhenReferenceDataIsMissing() {
        when(unitRepository.findFirstByUnitCodeIgnoreCase("SAN_PHAM")).thenReturn(Optional.empty());
        when(taxActivityGroupRepository.findFirstByActivityCodeIgnoreCase(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());

        seeder.run();

        ArgumentCaptor<Unit> unitCaptor = ArgumentCaptor.forClass(Unit.class);
        verify(unitRepository).save(unitCaptor.capture());
        assertThat(unitCaptor.getValue().getUnitCode()).isEqualTo("SAN_PHAM");
        assertThat(unitCaptor.getValue().getStatus()).isEqualTo("ACTIVE");

        ArgumentCaptor<TaxActivityGroup> groupCaptor = ArgumentCaptor.forClass(TaxActivityGroup.class);
        verify(taxActivityGroupRepository, times(4)).save(groupCaptor.capture());
        List<TaxActivityGroup> groups = groupCaptor.getAllValues();
        assertThat(groups).extracting(TaxActivityGroup::getActivityCode)
                .containsExactly(
                        "DISTRIBUTION_GOODS",
                        "SERVICES_NO_MATERIALS",
                        "PRODUCTION_TRANSPORT",
                        "OTHER_BUSINESS"
                );
        assertThat(groups).allSatisfy(group -> assertThat(group.getStatus()).isEqualTo("ACTIVE"));
    }
}
