package com.hbdt.owner.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.GeoReferenceStore;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entity.BusinessProfile;
import com.hbdt.entity.District;
import com.hbdt.entity.Province;
import com.hbdt.entity.User;
import com.hbdt.entity.Ward;
import com.hbdt.entity.enums.BusinessType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.BusinessProfileRequest;
import com.hbdt.owner.dto.BusinessProfileResponse;
import com.hbdt.repository.BusinessProfileRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class BusinessProfileService {

    private static final Logger logger = LoggerFactory.getLogger(BusinessProfileService.class);
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp");

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final GeoReferenceStore referenceStore;
    private final ObjectMapper objectMapper;
    private final ImageStorageService imageStorageService;

    public BusinessProfileService(UserRepository userRepository,
                                  BusinessProfileRepository businessProfileRepository,
                                  GeoReferenceStore referenceStore,
                                  ObjectMapper objectMapper,
                                  ImageStorageService imageStorageService) {
        this.userRepository = userRepository;
        this.businessProfileRepository = businessProfileRepository;
        this.referenceStore = referenceStore;
        this.objectMapper = objectMapper;
        this.imageStorageService = imageStorageService;
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getProfile(String username) {
        User user = findActiveUser(username);
        BusinessProfile profile = findBusinessForUser(user);
        return toResponse(profile, user);
    }

    public BusinessProfileResponse createOrUpdate(String username, BusinessProfileRequest request) {
        User user = findActiveUser(username);
        BusinessProfileRequest.BusinessInfoDto businessInfo = request.getBusinessInfo();
        BusinessProfileRequest.RepresentativeDto representative = request.getRepresentative();
        BusinessProfileRequest.StoreDto store = request.getStore();

        Optional<BusinessProfile> existing = user.getBusinessId() == null
                ? Optional.empty()
                : businessProfileRepository.findById(user.getBusinessId());

        if (existing.isEmpty()) {
            if (businessProfileRepository.existsByTaxCode(businessInfo.getTaxCode())) {
                throw new BadRequestException("Mã số thuế đã được đăng ký bởi tài khoản khác");
            }
        } else if (businessProfileRepository.existsByTaxCodeAndIdNot(
                businessInfo.getTaxCode(), existing.get().getId())) {
            throw new BadRequestException("Mã số thuế đã được đăng ký bởi tài khoản khác");
        }

        BusinessProfile profile = existing.orElseGet(BusinessProfile::new);
        if (profile.getBusinessCode() == null) {
            profile.setBusinessCode(newBusinessCode());
        }
        profile.setBusinessName(businessInfo.getBusinessName());
        profile.setTaxCode(businessInfo.getTaxCode());
        profile.setOwnerName(representative.getFullName());
        profile.setPhone(representative.getPhoneNumber());
        profile.setAddress(encodeAddress(new AddressPayload(
                businessInfo.getBusinessType(),
                businessInfo.getProvinceCode(),
                businessInfo.getDistrictCode(),
                businessInfo.getWardCode(),
                businessInfo.getDetailAddress(),
                representative.getEmail(),
                store.getStoreName())));

        if (store.getLogoUrl() != null && !store.getLogoUrl().isBlank()) {
            profile.setLogoObjectKey(normalizeObjectKey(store.getLogoUrl()));
        }
        if (store.getCoverImageUrl() != null && !store.getCoverImageUrl().isBlank()) {
            profile.setCoverImageObjectKey(normalizeObjectKey(store.getCoverImageUrl()));
        }

        profile = businessProfileRepository.save(profile);
        if (!profile.getId().equals(user.getBusinessId())) {
            user.setBusinessId(profile.getId());
            userRepository.save(user);
        }

        logger.info("Canonical business profile saved for user={}, businessId={}", username, profile.getId());
        return toResponse(profile, user);
    }

    public String uploadStoreLogo(String username, MultipartFile file) throws IOException {
        return saveBusinessImage(username, file, "logo");
    }

    public String uploadStoreCoverImage(String username, MultipartFile file) throws IOException {
        return saveBusinessImage(username, file, "cover");
    }

    private String saveBusinessImage(String username, MultipartFile file, String imageType) throws IOException {
        validateImage(file);
        User user = findActiveUser(username);
        BusinessProfile profile = findBusinessForUser(user);

        String directory = "businesses/" + profile.getId() + "/" + imageType;
        ImageStorageService.StoredImage storedImage = imageStorageService.store(
                file, directory, MAX_IMAGE_SIZE, ALLOWED_MIME);

        if ("logo".equals(imageType)) {
            profile.setLogoObjectKey(storedImage.objectKey());
            profile.setLogoSha256(storedImage.sha256());
            profile.setLogoContentType(storedImage.contentType());
            profile.setLogoSize(storedImage.size());
        } else {
            profile.setCoverImageObjectKey(storedImage.objectKey());
            profile.setCoverImageSha256(storedImage.sha256());
            profile.setCoverImageContentType(storedImage.contentType());
            profile.setCoverImageSize(storedImage.size());
        }
        businessProfileRepository.save(profile);
        return imageStorageService.toPublicUrl(storedImage.objectKey());
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Kích thước file vượt quá 5MB");
        }
        if (file.getContentType() == null || !ALLOWED_MIME.contains(file.getContentType())) {
            throw new BadRequestException("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }
    }

    private User findActiveUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private BusinessProfile findBusinessForUser(User user) {
        if (user.getBusinessId() == null) {
            throw new ResourceNotFoundException("Hồ sơ doanh nghiệp chưa được tạo");
        }
        return businessProfileRepository.findById(user.getBusinessId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hộ kinh doanh"));
    }

    private BusinessProfileResponse toResponse(BusinessProfile profile, User owner) {
        AddressPayload payload = decodeAddress(profile.getAddress());
        String provinceName = nameOf(referenceStore.findProvince(payload.provinceCode()), payload.provinceCode());
        String districtName = nameOf(referenceStore.findDistrict(payload.districtCode()), payload.districtCode());
        String wardName = nameOf(referenceStore.findWard(payload.wardCode()), payload.wardCode());

        return BusinessProfileResponse.builder()
                .id(profile.getId())
                .ownerId(owner.getId())
                .businessName(profile.getBusinessName())
                .taxCode(profile.getTaxCode())
                .businessType(payload.businessType())
                .provinceCode(payload.provinceCode())
                .provinceName(provinceName)
                .districtCode(payload.districtCode())
                .districtName(districtName)
                .wardCode(payload.wardCode())
                .wardName(wardName)
                .detailAddress(payload.detailAddress())
                .status(profile.getStatus())
                .representative(BusinessProfileResponse.RepresentativeInfo.builder()
                        .id(profile.getId())
                        .fullName(profile.getOwnerName())
                        .phoneNumber(profile.getPhone())
                        .email(payload.representativeEmail() == null
                                ? owner.getEmail() : payload.representativeEmail())
                        .build())
                .store(BusinessProfileResponse.StoreInfo.builder()
                        .id(profile.getId())
                        .storeName(payload.storeName() == null
                                ? profile.getBusinessName() : payload.storeName())
                        .logoUrl(toPublicUrl(profile.getLogoObjectKey()))
                        .coverImageUrl(toPublicUrl(profile.getCoverImageObjectKey()))
                        .build())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .nextStep("PACKAGE_SELECTION")
                .build();
    }

    private String nameOf(Object value, String fallback) {
        if (value instanceof Province province) {
            return province.getNameWithType();
        }
        if (value instanceof District district) {
            return district.getNameWithType();
        }
        if (value instanceof Ward ward) {
            return ward.getNameWithType();
        }
        return fallback;
    }

    private String encodeAddress(AddressPayload payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            if (json.length() > 500) {
                throw new BadRequestException("Thông tin địa chỉ vượt quá 500 ký tự");
            }
            return json;
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Không thể lưu thông tin địa chỉ");
        }
    }

    private AddressPayload decodeAddress(String address) {
        if (address == null || address.isBlank()) {
            return AddressPayload.empty();
        }
        try {
            return objectMapper.readValue(address, AddressPayload.class);
        } catch (JsonProcessingException exception) {
            return new AddressPayload(null, null, null, null, address, null, null);
        }
    }

    private String normalizeObjectKey(String value) {
        return imageStorageService.normalizeObjectKey(value);
    }

    private String toPublicUrl(String objectKey) {
        return imageStorageService.toPublicUrl(objectKey);
    }

    private String newBusinessCode() {
        return "HB-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26).toUpperCase();
    }

    private record AddressPayload(
            BusinessType businessType,
            String provinceCode,
            String districtCode,
            String wardCode,
            String detailAddress,
            String representativeEmail,
            String storeName) {
        private static AddressPayload empty() {
            return new AddressPayload(null, null, null, null, null, null, null);
        }
    }
}
