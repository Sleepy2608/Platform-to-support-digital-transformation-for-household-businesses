package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.common.service.OtpService;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.OtpType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.*;
import com.hbdt.repository.SubscriptionPlanRepository;
import com.hbdt.repository.SubscriptionRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class OwnerService {

    private static final Logger logger = LoggerFactory.getLogger(OwnerService.class);

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final ImageStorageService imageStorageService;

    public OwnerService(UserRepository userRepository,
                        SubscriptionRepository subscriptionRepository,
                        SubscriptionPlanRepository subscriptionPlanRepository,
                        PasswordEncoder passwordEncoder,
                        OtpService otpService,
                        ImageStorageService imageStorageService) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.imageStorageService = imageStorageService;
    }

    // =========================================================
    // Profile
    // =========================================================

    @Transactional(readOnly = true)
    public OwnerProfileResponse getProfile(String username) {
        User user = findActiveUser(username);
        return toProfileResponse(user);
    }

    public OwnerProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = findActiveUser(username);
        user.setFullName(request.getFullName());
        return toProfileResponse(userRepository.save(user));
    }

    // =========================================================
    // Avatar Upload
    // =========================================================

    public String uploadAvatar(String username, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BadRequestException("Kích thước file vượt quá 2MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new BadRequestException("Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF");
        }

        User user = findActiveUser(username);
        ImageStorageService.StoredImage storedImage = imageStorageService.store(
                file, "avatars/" + user.getId(), MAX_AVATAR_SIZE, ALLOWED_MIME);
        user.setAvatarObjectKey(storedImage.objectKey());
        user.setAvatarSha256(storedImage.sha256());
        user.setAvatarContentType(storedImage.contentType());
        user.setAvatarSize(storedImage.size());
        userRepository.save(user);

        logger.info("Avatar uploaded for user={}, sha256={}", username, storedImage.sha256());
        return imageStorageService.toPublicUrl(storedImage.objectKey());
    }

    // =========================================================
    // Password
    // =========================================================

    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Password changed for user={}", username);
    }

    // =========================================================
    // Change Email (OTP flow)
    // =========================================================

    public void initiateEmailChange(String username, ChangeEmailRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByEmail(request.getNewEmail())) {
            throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
        }

        // Store pending email in a temp mechanism — we use OTP target as the new email
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_EMAIL, request.getNewEmail());
        logger.info("Email change OTP sent for user={} -> {}", username, request.getNewEmail());
    }

    public void confirmEmailChange(String username, String newEmail, VerifyOtpRequest request) {
        User user = findActiveUser(username);

        // Verify OTP sent to newEmail
        otpService.verify(newEmail, OtpType.CHANGE_EMAIL, request.getOtp());

        user.setEmail(newEmail);
        userRepository.save(user);
        logger.info("Email changed for user={} to {}", username, newEmail);
    }

    // =========================================================
    // Change Phone (OTP flow — dev: logs to console)
    // =========================================================

    public void initiatePhoneChange(String username, ChangePhoneRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw new BadRequestException("Số điện thoại này đã được sử dụng");
        }

        // In dev-mode, OTP is logged by MailService. Target = phone number.
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_PHONE, request.getNewPhone());
        logger.info("Phone change OTP sent for user={} -> {}", username, request.getNewPhone());
    }

    public void confirmPhoneChange(String username, String newPhone, VerifyOtpRequest request) {
        User user = findActiveUser(username);

        otpService.verify(newPhone, OtpType.CHANGE_PHONE, request.getOtp());

        user.setPhone(newPhone);
        userRepository.save(user);
        logger.info("Phone changed for user={} to {}", username, newPhone);
    }

    // =========================================================
    // Account Status Management
    // =========================================================

    public void lockAccount(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        logger.info("Account locked: {}", username);
    }

    public void unlockAccount(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản không ở trạng thái bị khóa");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        logger.info("Account unlocked: {}", username);
    }

    public void deactivateAccount(String username, DeactivateAccountRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu không đúng. Không thể hủy tài khoản.");
        }

        user.setStatus(UserStatus.DEACTIVATED);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
        logger.info("Account deactivated (soft-delete): {}", username);
    }

    // =========================================================
    // Subscription
    // =========================================================

    public OwnerProfileResponse renewSubscription(String username, int months) {
        if (months < 1 || months > 24) {
            throw new BadRequestException("Số tháng gia hạn phải từ 1-24");
        }
        User user = findActiveUser(username);
        Subscription subscription = findActiveSubscription(user);
        LocalDate today = LocalDate.now();
        LocalDate baseDate = subscription.getEndDate() != null
                && subscription.getEndDate().isAfter(today)
                ? subscription.getEndDate()
                : today;

        subscription.setEndDate(baseDate.plusMonths(months));
        subscriptionRepository.save(subscription);
        return toProfileResponse(user);
    }

    public OwnerProfileResponse selectPackage(String username, String packageType, String billingCycle) {
        if (packageType == null || packageType.isBlank()) {
            throw new BadRequestException("Mã gói thuê bao không được để trống");
        }
        if (!"MONTHLY".equals(billingCycle) && !"YEARLY".equals(billingCycle)) {
            throw new BadRequestException("Chu kỳ thanh toán không hợp lệ. Chỉ chấp nhận MONTHLY hoặc YEARLY.");
        }
        User user = findActiveUser(username);
        if (user.getBusinessId() == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }

        SubscriptionPlan plan = findActivePlan(packageType);
        LocalDate today = LocalDate.now();
        Subscription subscription = subscriptionRepository
                .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(user.getBusinessId(), "ACTIVE")
                .orElseGet(() -> Subscription.builder()
                        .businessId(user.getBusinessId())
                        .startDate(today)
                        .status("ACTIVE")
                        .build());

        LocalDate baseDate = subscription.getEndDate() != null
                && subscription.getEndDate().isAfter(today)
                ? subscription.getEndDate()
                : today;
        subscription.setPlan(plan);
        subscription.setBillingCycle(billingCycle);
        subscription.setEndDate(baseDate.plusMonths("YEARLY".equals(billingCycle) ? 12 : 1));
        subscriptionRepository.save(subscription);

        return toProfileResponse(user);
    }

    // =========================================================
    // Available Packages
    // =========================================================

    public List<PackageDto> getAvailablePackages() {
        return subscriptionPlanRepository.findAllByStatusOrderByMonthlyPriceAsc("ACTIVE").stream()
                .map(plan -> PackageDto.builder()
                        .id(plan.getPlanCode())
                        .name(plan.getPlanName())
                        .description(plan.getDescription())
                        .monthlyPrice(plan.getMonthlyPrice().longValue())
                        .yearlyPrice(plan.getAnnualPrice().longValue())
                        .recommended("VIP".equalsIgnoreCase(plan.getPlanCode()))
                        .features(featuresFor(plan.getPlanCode()))
                        .build())
                .toList();
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findActiveUser(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
    }

    private Subscription findActiveSubscription(User user) {
        if (user.getBusinessId() == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }
        return subscriptionRepository
                .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(user.getBusinessId(), "ACTIVE")
                .orElseThrow(() -> new BadRequestException("Chưa có gói dịch vụ đang hoạt động"));
    }

    private SubscriptionPlan findActivePlan(String packageType) {
        return subscriptionPlanRepository
                .findByPlanCodeIgnoreCaseAndStatus(packageType.trim(), "ACTIVE")
                .orElseThrow(() -> new BadRequestException("Gói thuê bao không tồn tại hoặc đã bị vô hiệu hóa"));
    }

    private List<String> featuresFor(String planCode) {
        if ("VIP".equalsIgnoreCase(planCode)) {
            return List.of(
                    "Tất cả tính năng gói Standard",
                    "Trợ lý AI đọc đơn giọng nói / tin nhắn",
                    "Tự động hóa báo cáo thuế trọn gói",
                    "Không giới hạn nhân viên"
            );
        }
        if ("STANDARD".equalsIgnoreCase(planCode)) {
            return List.of(
                    "Quản lý tồn kho & công nợ",
                    "Lập sổ kế toán TT 88/2021",
                    "Tối đa 3 tài khoản nhân viên"
            );
        }
        return List.of("Các tính năng theo cấu hình của gói");
    }

    private OwnerProfileResponse toProfileResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());
        Subscription subscription = user.getBusinessId() == null
                ? null
                : subscriptionRepository
                        .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(user.getBusinessId(), "ACTIVE")
                        .orElse(null);
        LocalDateTime subscriptionExpiresAt = subscription == null || subscription.getEndDate() == null
                ? null
                : subscription.getEndDate().atTime(23, 59, 59);
        String packageType = subscription == null ? null : subscription.getPlan().getPlanCode();

        return OwnerProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(imageStorageService.toPublicUrl(user.getAvatarObjectKey()))
                .status(user.getStatus())
                .businessId(user.getBusinessId())
                .subscriptionExpiresAt(subscriptionExpiresAt)
                .packageType(packageType)
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
