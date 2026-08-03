package com.hbdt.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hbdt.entity.District;
import com.hbdt.entity.Province;
import com.hbdt.entity.Ward;
import com.hbdt.repository.DistrictRepository;
import com.hbdt.repository.ProvinceRepository;
import com.hbdt.repository.WardRepository;
import com.hbdt.seed.DataSeeder;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Tải toàn bộ dữ liệu địa giới hành chính Việt Nam (Tỉnh/Huyện/Xã)
 * từ provinces.open-api.vn khi khởi động nếu bảng provinces còn trống.
 *
 * Chạy SAU DatabaseSeeder (order = 2).
 */
@Component
@RequiredArgsConstructor
public class GeoDataInitializer implements DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(GeoDataInitializer.class);
    private static final String API_URL = "https://provinces.open-api.vn/api/?depth=3";

    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    @Override
    public int order() {
        return 2;
    }

    @Override
    public void seed() {
        if (provinceRepository.count() > 0) {
            logger.info("GeoDataInitializer: Bảng provinces đã có dữ liệu, bỏ qua import.");
            return;
        }

        logger.info("GeoDataInitializer: Bắt đầu tải dữ liệu địa giới từ provinces.open-api.vn ...");
        try {
            RestTemplate restTemplate = new RestTemplate();
            ProvinceApiDto[] apiProvinces = restTemplate.getForObject(API_URL, ProvinceApiDto[].class);

            if (apiProvinces == null || apiProvinces.length == 0) {
                logger.warn("GeoDataInitializer: Không nhận được dữ liệu từ API, bỏ qua.");
                return;
            }

            List<Province> provinces = new ArrayList<>();
            List<District> districts = new ArrayList<>();
            List<Ward> wards = new ArrayList<>();

            for (ProvinceApiDto p : apiProvinces) {
                provinces.add(Province.builder()
                        .code(String.valueOf(p.code))
                        .name(p.name)
                        .nameWithType(p.nameWithType)
                        .divisionType(p.divisionType)
                        .build());

                if (p.districts != null) {
                    for (DistrictApiDto d : p.districts) {
                        districts.add(District.builder()
                                .code(String.valueOf(d.code))
                                .name(d.name)
                                .nameWithType(d.nameWithType)
                                .divisionType(d.divisionType)
                                .provinceCode(String.valueOf(p.code))
                                .build());

                        if (d.wards != null) {
                            for (WardApiDto w : d.wards) {
                                wards.add(Ward.builder()
                                        .code(String.valueOf(w.code))
                                        .name(w.name)
                                        .nameWithType(w.nameWithType)
                                        .divisionType(w.divisionType)
                                        .districtCode(String.valueOf(d.code))
                                        .build());
                            }
                        }
                    }
                }
            }

            provinceRepository.saveAll(provinces);
            districtRepository.saveAll(districts);
            wardRepository.saveAll(wards);

            logger.info("GeoDataInitializer: Import thành công — {} tỉnh, {} huyện, {} xã.",
                    provinces.size(), districts.size(), wards.size());

        } catch (Exception e) {
            logger.error("GeoDataInitializer: Lỗi khi tải dữ liệu địa giới. " +
                    "Backend vẫn hoạt động bình thường, nhưng API reference/provinces sẽ trả danh sách rỗng. " +
                    "Kiểm tra kết nối internet hoặc tải lại thủ công.", e);
        }
    }

    // ── Internal DTOs (ánh xạ response từ provinces.open-api.vn) ──────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ProvinceApiDto {
        public int code;
        public String name;
        @JsonProperty("name_with_type")
        public String nameWithType;
        @JsonProperty("division_type")
        public String divisionType;
        public List<DistrictApiDto> districts;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class DistrictApiDto {
        public int code;
        public String name;
        @JsonProperty("name_with_type")
        public String nameWithType;
        @JsonProperty("division_type")
        public String divisionType;
        public List<WardApiDto> wards;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class WardApiDto {
        public int code;
        public String name;
        @JsonProperty("name_with_type")
        public String nameWithType;
        @JsonProperty("division_type")
        public String divisionType;
    }
}
