package com.hbdt.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.DistrictDto;
import com.hbdt.common.dto.ProvinceDto;
import com.hbdt.common.dto.WardDto;
import com.hbdt.common.service.ReferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller cung cấp dữ liệu tham chiếu địa giới hành chính.
 * Endpoints này là PUBLIC — không yêu cầu xác thực.
 */
@RestController
@RequestMapping("/api/reference")
public class ReferenceController {

    private final ReferenceService referenceService;

    public ReferenceController(ReferenceService referenceService) {
        this.referenceService = referenceService;
    }

    /**
     * GET /api/reference/provinces
     * Trả về danh sách 63 tỉnh/thành phố Việt Nam.
     */
    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<ProvinceDto>>> getProvinces() {
        List<ProvinceDto> provinces = referenceService.getProvinces();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tỉnh/thành thành công", provinces));
    }

    /**
     * GET /api/reference/districts?provinceCode=01
     * Trả về danh sách quận/huyện theo mã tỉnh.
     */
    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<DistrictDto>>> getDistricts(
            @RequestParam String provinceCode) {
        List<DistrictDto> districts = referenceService.getDistricts(provinceCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quận/huyện thành công", districts));
    }

    /**
     * GET /api/reference/wards?districtCode=001
     * Trả về danh sách xã/phường/thị trấn theo mã huyện.
     */
    @GetMapping("/wards")
    public ResponseEntity<ApiResponse<List<WardDto>>> getWards(
            @RequestParam String districtCode) {
        List<WardDto> wards = referenceService.getWards(districtCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách xã/phường thành công", wards));
    }
}
