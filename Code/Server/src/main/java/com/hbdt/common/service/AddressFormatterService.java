package com.hbdt.common.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.entity.District;
import com.hbdt.entity.Province;
import com.hbdt.entity.Ward;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service hỗ trợ parse và định dạng chuỗi địa chỉ dễ đọc cho các báo cáo và sổ sách.
 * Định dạng: detailAddress, wardName, districtName, provinceName
 */
@Service
public class AddressFormatterService {

    private static final Logger logger = LoggerFactory.getLogger(AddressFormatterService.class);

    private final GeoReferenceStore geoReferenceStore;
    private final ObjectMapper objectMapper;

    public AddressFormatterService(GeoReferenceStore geoReferenceStore, ObjectMapper objectMapper) {
        this.geoReferenceStore = geoReferenceStore;
        this.objectMapper = objectMapper;
    }

    /**
     * Chuyển đổi chuỗi địa chỉ (dạng JSON hoặc chuỗi thông thường) thành địa chỉ dễ đọc.
     *
     * @param rawAddress Chuỗi địa chỉ lưu trong cơ sở dữ liệu.
     * @return Chuỗi địa chỉ đã định dạng dễ đọc, hoặc chuỗi gốc nếu không phải JSON.
     */
    public String formatAddress(String rawAddress) {
        if (rawAddress == null || rawAddress.isBlank()) {
            return "";
        }

        String trimmed = rawAddress.trim();
        // Kiểm tra nhanh định dạng JSON đối tượng
        if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
            return trimmed;
        }

        try {
            JsonNode root = objectMapper.readTree(trimmed);
            if (root == null || !root.isObject()) {
                return trimmed;
            }

            List<String> parts = new ArrayList<>();

            // 1. detailAddress
            String detailAddress = getText(root, "detailAddress");
            if (detailAddress != null && !detailAddress.isBlank()) {
                parts.add(detailAddress);
            }

            // 2. wardName
            String wardCode = getText(root, "wardCode");
            if (wardCode != null && !wardCode.isBlank()) {
                Ward ward = geoReferenceStore.findWard(wardCode);
                if (ward != null) {
                    String wardName = ward.getNameWithType() != null && !ward.getNameWithType().isBlank()
                            ? ward.getNameWithType()
                            : ward.getName();
                    if (wardName != null && !wardName.isBlank()) {
                        parts.add(wardName);
                    }
                }
            }

            // 3. districtName
            String districtCode = getText(root, "districtCode");
            if (districtCode != null && !districtCode.isBlank()) {
                District district = geoReferenceStore.findDistrict(districtCode);
                if (district != null) {
                    String districtName = district.getNameWithType() != null && !district.getNameWithType().isBlank()
                            ? district.getNameWithType()
                            : district.getName();
                    if (districtName != null && !districtName.isBlank()) {
                        parts.add(districtName);
                    }
                }
            }

            // 4. provinceName
            String provinceCode = getText(root, "provinceCode");
            if (provinceCode != null && !provinceCode.isBlank()) {
                Province province = geoReferenceStore.findProvince(provinceCode);
                if (province != null) {
                    String provinceName = province.getNameWithType() != null && !province.getNameWithType().isBlank()
                            ? province.getNameWithType()
                            : province.getName();
                    if (provinceName != null && !provinceName.isBlank()) {
                        parts.add(provinceName);
                    }
                }
            }

            if (parts.isEmpty()) {
                return "";
            }

            return String.join(", ", parts);
        } catch (Exception e) {
            logger.debug("Address is not a valid JSON string, using raw address: {}", trimmed);
            return trimmed;
        }
    }

    private String getText(JsonNode node, String fieldName) {
        if (node.hasNonNull(fieldName)) {
            String val = node.get(fieldName).asText();
            return val != null ? val.trim() : null;
        }
        return null;
    }
}
