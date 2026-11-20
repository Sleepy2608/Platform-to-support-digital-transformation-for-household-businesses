package com.hbdt.consent.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.consent.dto.ConsentRequest;
import com.hbdt.entity.TermsConsent;
import com.hbdt.entity.User;
import com.hbdt.repository.TermsConsentRepository;
import com.hbdt.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TermsConsentServiceTest {

    private TermsConsentRepository consentRepository;
    private UserRepository userRepository;
    private TermsConsentService consentService;

    @BeforeEach
    void setUp() {
        consentRepository = mock(TermsConsentRepository.class);
        userRepository = mock(UserRepository.class);
        consentService = new TermsConsentService(consentRepository, userRepository);
    }

    @Test
    void recordConsent_Success_SavesTermsConsentWithClientIp() {
        User user = User.builder().id(1L).username("owner1").build();
        ConsentRequest request = new ConsentRequest(
                "v1.0", "v1.0", true, true, true, true, true, true
        );

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("203.0.113.195, 198.51.100.1");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0 Chrome/120.0");

        consentService.recordConsent(user, request, httpRequest);

        ArgumentCaptor<TermsConsent> captor = ArgumentCaptor.forClass(TermsConsent.class);
        verify(consentRepository).save(captor.capture());

        TermsConsent saved = captor.getValue();
        assertEquals(user, saved.getUser());
        assertEquals("v1.0", saved.getTermsVersion());
        assertEquals("v1.0", saved.getPrivacyVersion());
        assertTrue(saved.isTermsAccepted());
        assertTrue(saved.isPrivacyAccepted());
        assertTrue(saved.isDataProcessingAccepted());
        assertTrue(saved.isCircular88Accepted());
        assertTrue(saved.isInfoAccurateConfirmed());
        assertTrue(saved.isInaccuracyUnderstood());
        assertEquals("203.0.113.195", saved.getIpAddress());
        assertEquals("Mozilla/5.0 Chrome/120.0", saved.getUserAgent());
    }

    @Test
    void recordConsent_FallbackToRemoteAddr_WhenNoForwardedHeader() {
        User user = User.builder().id(2L).username("owner2").build();
        ConsentRequest request = new ConsentRequest(
                "v1.1", "v1.1", true, true, true, true, true, true
        );

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        consentService.recordConsent(user, request, httpRequest);

        ArgumentCaptor<TermsConsent> captor = ArgumentCaptor.forClass(TermsConsent.class);
        verify(consentRepository).save(captor.capture());
        assertEquals("127.0.0.1", captor.getValue().getIpAddress());
    }

    @Test
    void recordConsent_NullConsentRequest_ThrowsBadRequestException() {
        User user = User.builder().id(1L).build();
        assertThrows(BadRequestException.class, () -> consentService.recordConsent(user, null, null));
        verifyNoInteractions(consentRepository);
    }

    @Test
    void recordConsent_MissingAnyConsentFlag_ThrowsBadRequestException() {
        User user = User.builder().id(1L).build();
        ConsentRequest incomplete = new ConsentRequest(
                "v1.0", "v1.0", true, false, true, true, true, true
        );

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> consentService.recordConsent(user, incomplete, null));
        assertTrue(ex.getMessage().contains("Bạn phải đồng ý với Điều khoản sử dụng"));
        verifyNoInteractions(consentRepository);
    }

    @Test
    void getConsentHistory_UserExists_ReturnsMappedHistory() {
        User user = User.builder().id(5L).username("testuser").build();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        TermsConsent c1 = TermsConsent.builder()
                .id(101L)
                .termsVersion("v1.0")
                .privacyVersion("v1.0")
                .termsAccepted(true)
                .privacyAccepted(true)
                .dataProcessingAccepted(true)
                .circular88Accepted(true)
                .infoAccurateConfirmed(true)
                .inaccuracyUnderstood(true)
                .acceptedAt(LocalDateTime.now())
                .build();

        when(consentRepository.findByUserIdOrderByAcceptedAtDesc(5L)).thenReturn(List.of(c1));

        var history = consentService.getConsentHistory("testuser");

        assertEquals(1, history.size());
        assertEquals(101L, history.get(0).getId());
        assertEquals("v1.0", history.get(0).getTermsVersion());
    }

    @Test
    void getConsentHistory_UserNotFound_ThrowsResourceNotFoundException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> consentService.getConsentHistory("unknown"));
        verifyNoInteractions(consentRepository);
    }
}

