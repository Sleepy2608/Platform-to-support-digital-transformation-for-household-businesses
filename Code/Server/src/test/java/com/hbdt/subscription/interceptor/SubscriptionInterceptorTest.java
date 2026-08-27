package com.hbdt.subscription.interceptor;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Role;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.UserRepository;
import com.hbdt.subscription.service.ISubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionInterceptorTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ISubscriptionService subscriptionService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private SubscriptionInterceptor interceptor;

    private User owner;
    private User employee;
    private User admin;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().name(RoleType.BUSINESS_OWNER).build();
        Role employeeRole = Role.builder().name(RoleType.EMPLOYEE).build();
        Role adminRole = Role.builder().name(RoleType.ADMIN).build();

        owner = User.builder()
                .id(1L)
                .username("owner1")
                .role(ownerRole)
                .businessId(100L)
                .build();

        employee = User.builder()
                .id(2L)
                .username("employee1")
                .role(employeeRole)
                .businessId(100L)
                .build();

        admin = User.builder()
                .id(3L)
                .username("admin1")
                .role(adminRole)
                .build();

        subscription = Subscription.builder()
                .id(50L)
                .owner(owner)
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void preHandleAllowsNonAuthenticatedUser() throws Exception {
        SecurityContextHolder.clearContext();

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);
        verifyNoInteractions(userRepository, subscriptionService);
    }

    @Test
    void preHandleAllowsAdminUser() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("admin1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void preHandleAllowsActiveOwnerSubscription() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("owner1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));
        when(subscriptionService.getCurrentSubscription(owner)).thenReturn(subscription);

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);
        verify(subscriptionService).validateSubscriptionUsage(subscription);
    }

    @Test
    void preHandleRejectsExpiredOwnerSubscription() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("owner1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));
        when(subscriptionService.getCurrentSubscription(owner)).thenReturn(subscription);
        doThrow(new IllegalStateException("Subscription has expired."))
                .when(subscriptionService).validateSubscriptionUsage(subscription);

        assertThrows(AccessDeniedException.class, () ->
                interceptor.preHandle(request, response, new Object()));
    }

    @Test
    void preHandleRejectsNoSubscriptionForOwner() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("owner1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));
        when(subscriptionService.getCurrentSubscription(owner))
                .thenThrow(new ResourceNotFoundException("No subscription found"));

        assertThrows(AccessDeniedException.class, () ->
                interceptor.preHandle(request, response, new Object()));
    }

    @Test
    void preHandleAllowsEmployeeIfOwnerSubscriptionIsActive() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("employee1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(employee));
        when(userRepository.findFirstByBusinessIdAndRole_Name(100L, RoleType.BUSINESS_OWNER)).thenReturn(Optional.of(owner));
        when(subscriptionService.getCurrentSubscription(owner)).thenReturn(subscription);

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);
        verify(subscriptionService).validateSubscriptionUsage(subscription);
    }

    @Test
    void preHandleRejectsEmployeeIfOwnerSubscriptionIsExpired() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("employee1", null, Collections.emptyList());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(employee));
        when(userRepository.findFirstByBusinessIdAndRole_Name(100L, RoleType.BUSINESS_OWNER)).thenReturn(Optional.of(owner));
        when(subscriptionService.getCurrentSubscription(owner)).thenReturn(subscription);
        doThrow(new IllegalStateException("Subscription has expired."))
                .when(subscriptionService).validateSubscriptionUsage(subscription);

        assertThrows(AccessDeniedException.class, () ->
                interceptor.preHandle(request, response, new Object()));
    }
}
