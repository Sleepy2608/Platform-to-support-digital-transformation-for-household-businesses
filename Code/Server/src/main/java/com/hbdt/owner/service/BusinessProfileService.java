package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.BusinessProfileRequest;
import com.hbdt.owner.dto.BusinessProfileResponse;
import com.hbdt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class BusinessProfileService {

    private static final Logger logger = LoggerFactory.getLogger(BusinessProfileService.class);

    // Max 5MB cho logo/cover (khác avatar 2MB)
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp");

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final RepresentativeRepository representativeRepository;
    private final StoreRepository storeRepository;
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    public BusinessProfileService(UserRepository userRepository,
                                   BusinessProfileRepository businessProfileRepository,
                                   RepresentativeRepository representativeRepository,
                                   StoreRepository storeRepository,
                                   ProvinceRepository provinceRepository,
                                   DistrictRepository districtRepository,
                                   WardRepository wardRepository) {
        this.userRepository = userRepository;
        this.businessProfileRepository = businessProfileRepository;
        this.representativeRepository = representativeRepository;
        this.storeRepository = storeRepository;
        this.provinceRepository = provinceRepository;
        this.districtRepository = districtRepository;
        this.wardRepository = wardRepository;
    }

    // =========================================================
    // GET
    // =========================================================

    @Transactional(readOnly = true)
    public BusinessProfileResponse getProfile(String username) {
        User user = findActiveUser(username);
        BusinessProfile profile = businessProfileRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hồ sơ doanh nghiệp chưa được tạo. Vui lòng hoàn thành onboarding."));

        return toResponse(profile);
    }

    // =========================================================
    // POST — Create (upsert: nếu đã có thì update)
    // =========================================================

    public BusinessProfileResponse createOrUpdate(String username, BusinessProfileRequest request) {
        User user = findActiveUser(username);

        BusinessProfileRequest.BusinessInfoDto bizInfo = request.getBusinessInfo();
        BusinessProfileRequest.RepresentativeDto repDto = request.getRepresentative();
        BusinessProfileRequest.StoreDto storeDto = request.getStore();

        // ── Validate tax code uniqueness ──────────────────────────────────────
        Optional<BusinessProfile> existing = businessProfileRepository.findByOwnerId(user.getId());

        if (existing.isEmpty()) {
            // Create: taxCode phải chưa tồn tại trong hệ thống
            if (businessProfileRepository.existsByTaxCode(bizInfo.getTaxCode())) {
                throw new BadRequestException("Mã số thuế '" + bizInfo.getTaxCode() + "' đã được đăng ký bởi tài khoản khác");
            }
        } else {
            // Update: taxCode không được trùng với profile khác
            if (businessProfileRepository.existsByTaxCodeAndIdNot(bizInfo.getTaxCode(), existing.get().getId())) {
                throw new BadRequestException("Mã số thuế '" + bizInfo.getTaxCode() + "' đã được đăng ký bởi tài khoản khác");
            }
        }

        // ── Persist BusinessProfile ───────────────────────────────────────────
        BusinessProfile profile = existing.orElseGet(BusinessProfile::new);
        profile.setOwner(user);
        profile.setBusinessName(bizInfo.getBusinessName());
        profile.setTaxCode(bizInfo.getTaxCode());
        profile.setBusinessType(bizInfo.getBusinessType());
        profile.setProvinceCode(bizInfo.getProvinceCode());
        profile.setDistrictCode(bizInfo.getDistrictCode());
        profile.setWardCode(bizInfo.getWardCode());
        profile.setDetailAddress(bizInfo.getDetailAddress());
        profile = businessProfileRepository.save(profile);

        // Update businessId on User entity for quick FK reference
        user.setBusinessId(profile.getId());
        userRepository.save(user);

        // ── Persist Representative (upsert) ───────────────────────────────────
        Representative rep = representativeRepository
                .findByBusinessProfileId(profile.getId())
                .orElseGet(Representative::new);
        rep.setBusinessProfile(profile);
        rep.setFullName(repDto.getFullName());
        rep.setPhoneNumber(repDto.getPhoneNumber());
        rep.setEmail(repDto.getEmail());
        representativeRepository.save(rep);

        // ── Persist Store (upsert) ────────────────────────────────────────────
        Store store = storeRepository
                .findByBusinessProfileId(profile.getId())
                .orElseGet(Store::new);
        store.setBusinessProfile(profile);
        store.setStoreName(storeDto.getStoreName());
        if (storeDto.getLogoUrl() != null) store.setLogoUrl(storeDto.getLogoUrl());
        if (storeDto.getCoverImageUrl() != null) store.setCoverImageUrl(storeDto.getCoverImageUrl());
        storeRepository.save(store);

        logger.info("Business profile saved for user={}, profileId={}", username, profile.getId());
        return toResponse(profile);
    }

    // =========================================================
    // Image Upload — Logo
    // =========================================================

    public String uploadStoreLogo(String username, MultipartFile file) throws IOException {
        return saveStoreImage(username, file, "logos");
    }

    // =========================================================
    // Image Upload — Cover Image
    // =========================================================

    public String uploadStoreCoverImage(String username, MultipartFile file) throws IOException {
        return saveStoreImage(username, file, "covers");
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private String saveStoreImage(String username, MultipartFile file, String subDir) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Kích thước file vượt quá 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new BadRequestException("Chỉ chấp nhận ảnh JPG, PNG, WEBP");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }

        String fileName = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, "stores", subDir);
        Files.createDirectories(dir);
        Path target = dir.resolve(fileName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String url = "http://localhost:" + serverPort + "/uploads/stores/" + subDir + "/" + fileName;
        logger.info("Store image uploaded for user={}: {}", username, url);
        return url;
    }

    private User findActiveUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private BusinessProfileResponse toResponse(BusinessProfile profile) {
        // Lấy tên tỉnh/huyện/xã để embed vào response
        String provinceName = provinceRepository.findById(profile.getProvinceCode())
                .map(Province::getNameWithType).orElse(profile.getProvinceCode());
        String districtName = districtRepository.findById(profile.getDistrictCode())
                .map(District::getNameWithType).orElse(profile.getDistrictCode());
        String wardName = wardRepository.findById(profile.getWardCode())
                .map(Ward::getNameWithType).orElse(profile.getWardCode());

        // Representative
        BusinessProfileResponse.RepresentativeInfo repInfo = representativeRepository
                .findByBusinessProfileId(profile.getId())
                .map(r -> BusinessProfileResponse.RepresentativeInfo.builder()
                        .id(r.getId())
                        .fullName(r.getFullName())
                        .phoneNumber(r.getPhoneNumber())
                        .email(r.getEmail())
                        .build())
                .orElse(null);

        // Store
        BusinessProfileResponse.StoreInfo storeInfo = storeRepository
                .findByBusinessProfileId(profile.getId())
                .map(s -> BusinessProfileResponse.StoreInfo.builder()
                        .id(s.getId())
                        .storeName(s.getStoreName())
                        .logoUrl(s.getLogoUrl())
                        .coverImageUrl(s.getCoverImageUrl())
                        .build())
                .orElse(null);

        return BusinessProfileResponse.builder()
                .id(profile.getId())
                .ownerId(profile.getOwner().getId())
                .businessName(profile.getBusinessName())
                .taxCode(profile.getTaxCode())
                .businessType(profile.getBusinessType())
                .provinceCode(profile.getProvinceCode())
                .provinceName(provinceName)
                .districtCode(profile.getDistrictCode())
                .districtName(districtName)
                .wardCode(profile.getWardCode())
                .wardName(wardName)
                .detailAddress(profile.getDetailAddress())
                .status(profile.getStatus())
                .representative(repInfo)
                .store(storeInfo)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .nextStep("PACKAGE_SELECTION")
                .build();
    }
}
