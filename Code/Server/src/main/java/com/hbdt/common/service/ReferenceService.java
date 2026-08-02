package com.hbdt.common.service;

import com.hbdt.common.dto.DistrictDto;
import com.hbdt.common.dto.ProvinceDto;
import com.hbdt.common.dto.WardDto;
import com.hbdt.repository.DistrictRepository;
import com.hbdt.repository.ProvinceRepository;
import com.hbdt.repository.WardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReferenceService {

    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    public ReferenceService(ProvinceRepository provinceRepository,
                             DistrictRepository districtRepository,
                             WardRepository wardRepository) {
        this.provinceRepository = provinceRepository;
        this.districtRepository = districtRepository;
        this.wardRepository = wardRepository;
    }

    public List<ProvinceDto> getProvinces() {
        return provinceRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(p -> ProvinceDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .nameWithType(p.getNameWithType())
                        .divisionType(p.getDivisionType())
                        .build())
                .collect(Collectors.toList());
    }

    public List<DistrictDto> getDistricts(String provinceCode) {
        return districtRepository.findByProvinceCodeOrderByNameAsc(provinceCode).stream()
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
        return wardRepository.findByDistrictCodeOrderByNameAsc(districtCode).stream()
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
