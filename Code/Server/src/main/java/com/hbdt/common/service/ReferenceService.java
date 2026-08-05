package com.hbdt.common.service;

import com.hbdt.common.dto.DistrictDto;
import com.hbdt.common.dto.ProvinceDto;
import com.hbdt.common.dto.WardDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReferenceService {

    private final GeoReferenceStore referenceStore;

    public ReferenceService(GeoReferenceStore referenceStore) {
        this.referenceStore = referenceStore;
    }

    public List<ProvinceDto> getProvinces() {
        return referenceStore.getProvinces().stream()
                .map(p -> ProvinceDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .nameWithType(p.getNameWithType())
                        .divisionType(p.getDivisionType())
                        .build())
                .collect(Collectors.toList());
    }

    public List<DistrictDto> getDistricts(String provinceCode) {
        return referenceStore.getDistricts(provinceCode).stream()
                .map(d -> DistrictDto.builder()
                        .code(d.getCode())
                        .name(d.getName())
                        .nameWithType(d.getNameWithType())
                        .divisionType(d.getDivisionType())
                        .provinceCode(d.getProvinceCode())
                        .build())
                .collect(Collectors.toList());
    }

    public List<WardDto> getWards(String districtCode) {
        return referenceStore.getWards(districtCode).stream()
                .map(w -> WardDto.builder()
                        .code(w.getCode())
                        .name(w.getName())
                        .nameWithType(w.getNameWithType())
                        .divisionType(w.getDivisionType())
                        .districtCode(w.getDistrictCode())
                        .build())
                .collect(Collectors.toList());
    }
}
