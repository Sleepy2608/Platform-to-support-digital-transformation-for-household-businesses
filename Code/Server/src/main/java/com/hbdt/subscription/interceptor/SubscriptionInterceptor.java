package com.hbdt.subscription.interceptor;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.repository.UserRepository;
import com.hbdt.subscription.service.ISubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SubscriptionInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;
    private final ISubscriptionService subscriptionService;

    public SubscriptionInterceptor(UserRepository userRepository, ISubscriptionService subscriptionService) {
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                if (user.getRole() == null) {
                    throw new AccessDeniedException("Tài khoản chưa được gán vai trò.");
                }
                RoleType roleType = user.getRole().getName();
                if (roleType == RoleType.BUSINESS_OWNER) {
                    validateBusinessSubscription(user);
                } else if (roleType == RoleType.EMPLOYEE) {
                    if (user.getBusinessId() != null) {
                        validateBusinessSubscription(user);
                    } else {
                        throw new AccessDeniedException("Nhân viên chưa được liên kết với hộ kinh doanh.");
                    }
                }
            }
        }
        return true;
    }

    private void validateBusinessSubscription(User user) {
        try {
            Subscription subscription = subscriptionService.getCurrentSubscription(user);
            subscriptionService.validateSubscriptionUsage(subscription);
        } catch (ResourceNotFoundException e) {
            throw new AccessDeniedException("Hộ kinh doanh chưa đăng ký gói dịch vụ.");
        } catch (IllegalStateException e) {
            throw new AccessDeniedException("Gói dịch vụ không khả dụng: " + e.getMessage());
        }
    }
}
