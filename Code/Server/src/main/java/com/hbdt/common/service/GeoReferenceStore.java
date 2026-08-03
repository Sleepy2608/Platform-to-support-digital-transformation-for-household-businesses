package com.hbdt.common.service;

import com.hbdt.entity.District;
import com.hbdt.entity.Province;
import com.hbdt.entity.Ward;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Thread-safe in-memory cache for Vietnamese administrative reference data. */
@Component
public class GeoReferenceStore {

    private final Map<String, Province> provinces = new ConcurrentHashMap<>();
    private final Map<String, District> districts = new ConcurrentHashMap<>();
    private final Map<String, Ward> wards = new ConcurrentHashMap<>();

    public boolean isEmpty() {
        return provinces.isEmpty();
    }

    public synchronized void replaceAll(Collection<Province> provinceValues,
                                        Collection<District> districtValues,
                                        Collection<Ward> wardValues) {
        provinces.clear();
        districts.clear();
        wards.clear();
        provinceValues.forEach(value -> provinces.put(value.getCode(), value));
        districtValues.forEach(value -> districts.put(value.getCode(), value));
        wardValues.forEach(value -> wards.put(value.getCode(), value));
    }

    public List<Province> getProvinces() {
        return provinces.values().stream()
                .sorted(Comparator.comparing(Province::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<District> getDistricts(String provinceCode) {
        return districts.values().stream()
                .filter(value -> value.getProvinceCode().equals(provinceCode))
                .sorted(Comparator.comparing(District::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<Ward> getWards(String districtCode) {
        return wards.values().stream()
                .filter(value -> value.getDistrictCode().equals(districtCode))
                .sorted(Comparator.comparing(Ward::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Province findProvince(String code) {
        return provinces.get(code);
    }

    public District findDistrict(String code) {
        return districts.get(code);
    }

    public Ward findWard(String code) {
        return wards.get(code);
    }
}
