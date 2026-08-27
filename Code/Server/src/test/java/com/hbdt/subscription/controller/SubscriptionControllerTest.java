package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.UserRepository;
import com.hbdt.subscription.dto.CancelSubscriptionRequest;
import com.hbdt.subscription.dto.SubscriptionResponse;
import com.hbdt.subscription.service.ISubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionControllerTest {

    @Mock
    private ISubscriptionService subscriptionService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SubscriptionController subscriptionController;

    private User testUser;
    private Subscription testSubscription;

    // Real Authentication objects – avoid Mockito ByteBuddy inline-mock issues on Java 25
    private Authentication owner1Auth;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("owner1")
                .build();

        testSubscription = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        // UsernamePasswordAuthenticationToken implements Authentication without needing mocking
        owner1Auth = new UsernamePasswordAuthenticationToken("owner1", null, Collections.emptyList());
    }

    @Test
    void getCurrentSubscriptionReturnsSuccessfully() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.getCurrentSubscription(testUser)).thenReturn(testSubscription);

        ResponseEntity<ApiResponse<SubscriptionResponse>> response =
                subscriptionController.getCurrentSubscription(owner1Auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Lấy subscription hiện tại thành công", response.getBody().getMessage());
        assertEquals(10L, response.getBody().getData().getId());
    }

    @Test
    void getSubscriptionDetailReturnsSuccessfully() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.getSubscriptionById(10L, testUser)).thenReturn(testSubscription);

        ResponseEntity<ApiResponse<SubscriptionResponse>> response =
                subscriptionController.getSubscriptionDetail(10L, owner1Auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(10L, response.getBody().getData().getId());
    }

    @Test
    void getSubscriptionDetailRejectsOtherOwner() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.getSubscriptionById(10L, testUser))
                .thenThrow(new AccessDeniedException("You do not own this subscription"));

        assertThrows(AccessDeniedException.class, () ->
                subscriptionController.getSubscriptionDetail(10L, owner1Auth));
    }

    @Test
    void getSubscriptionStatusReturnsActiveString() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.getSubscriptionById(10L, testUser)).thenReturn(testSubscription);

        ResponseEntity<ApiResponse<String>> response =
                subscriptionController.getSubscriptionStatus(10L, owner1Auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ACTIVE", response.getBody().getData());
    }

    @Test
    void cancelSubscriptionPostSuccessfully() {
        CancelSubscriptionRequest request = new CancelSubscriptionRequest("User requested cancellation");
        Subscription cancelledSub = Subscription.builder()
                .id(10L)
                .owner(testUser)
                .status(SubscriptionStatus.CANCELLED)
                .cancellationReason("User requested cancellation")
                .build();

        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.cancelSubscription(10L, testUser, "User requested cancellation"))
                .thenReturn(cancelledSub);

        ResponseEntity<ApiResponse<SubscriptionResponse>> response =
                subscriptionController.cancelSubscriptionPost(10L, request, owner1Auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("CANCELLED", response.getBody().getData().getStatus());
        assertEquals("User requested cancellation", response.getBody().getData().getCancellationReason());
    }

    @Test
    void cancelSubscriptionRejectsNonActiveStatus() {
        CancelSubscriptionRequest request = new CancelSubscriptionRequest("Some reason");

        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(testUser));
        when(subscriptionService.cancelSubscription(10L, testUser, "Some reason"))
                .thenThrow(new IllegalStateException("Only ACTIVE subscriptions can be cancelled."));

        assertThrows(IllegalStateException.class, () ->
                subscriptionController.cancelSubscriptionPost(10L, request, owner1Auth));
    }
}
