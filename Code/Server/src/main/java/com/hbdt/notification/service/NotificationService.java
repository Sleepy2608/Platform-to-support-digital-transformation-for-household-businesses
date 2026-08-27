package com.hbdt.notification.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Notification;
import com.hbdt.entity.Product;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.notification.dto.NotificationResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.NotificationRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private static final Set<RoleType> LOW_STOCK_RECIPIENTS =
            Set.of(RoleType.BUSINESS_OWNER, RoleType.EMPLOYEE);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BusinessContextService businessContextService;
    private final NotificationStreamService streamService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            BusinessContextService businessContextService,
            NotificationStreamService streamService
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.businessContextService = businessContextService;
        this.streamService = streamService;
    }

    @Transactional
    public void notifyLowStock(
            Long businessId, Product product, BigDecimal quantity, BigDecimal threshold) {
        String content = "Sản phẩm %s (%s) chỉ còn %s, thấp hơn ngưỡng %s."
                .formatted(product.getProductName(), product.getProductCode(), quantity, threshold);
        notifyBusiness(businessId, "LOW_STOCK", "Cảnh báo tồn kho thấp", content);
    }

    @Transactional
    public void notifyStockRecovered(Long businessId, Product product, BigDecimal quantity) {
        String content = "Tồn kho sản phẩm %s (%s) đã trở lại mức an toàn: %s."
                .formatted(product.getProductName(), product.getProductCode(), quantity);
        notifyBusiness(businessId, "LOW_STOCK_RESOLVED", "Tồn kho đã an toàn", content);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String username, boolean unreadOnly) {
        User actor = requireActor(username);
        List<Notification> notifications = unreadOnly
                ? notificationRepository.findTop100ByBusinessIdAndUserIdAndReadFalseOrderByCreatedAtDesc(
                        actor.getBusinessId(), actor.getId())
                : notificationRepository.findTop100ByBusinessIdAndUserIdOrderByCreatedAtDesc(
                        actor.getBusinessId(), actor.getId());
        return notifications.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String username) {
        User actor = requireActor(username);
        return notificationRepository.countByBusinessIdAndUserIdAndReadFalse(
                actor.getBusinessId(), actor.getId());
    }

    @Transactional
    public NotificationResponse markRead(String username, Long notificationId) {
        User actor = requireActor(username);
        Notification notification = notificationRepository
                .findByIdAndBusinessIdAndUserId(notificationId, actor.getBusinessId(), actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    public User requireActor(String username) {
        businessContextService.requireBusinessId(username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }

    private void notifyBusiness(Long businessId, String type, String title, String content) {
        userRepository.findAllByBusinessIdAndStatus(businessId, UserStatus.ACTIVE).stream()
                .filter(user -> user.getRole() != null
                        && LOW_STOCK_RECIPIENTS.contains(user.getRole().getName()))
                .forEach(user -> saveAndPublish(user, type, title, content));
    }

    private void saveAndPublish(User user, String type, String title, String content) {
        Notification saved = notificationRepository.save(Notification.builder()
                .businessId(user.getBusinessId())
                .userId(user.getId())
                .notificationType(type)
                .title(title)
                .content(content)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
        NotificationResponse response = toResponse(saved);
        Runnable publish = () -> streamService.publish(user.getId(), response);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(), notification.getNotificationType(), notification.getTitle(),
                notification.getContent(), Boolean.TRUE.equals(notification.getRead()),
                notification.getCreatedAt(), notification.getReadAt());
    }
}
