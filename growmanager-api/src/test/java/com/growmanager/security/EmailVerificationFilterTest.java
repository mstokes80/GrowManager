package com.growmanager.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Test suite for EmailVerificationFilter.
 * Tests email verification enforcement.
 */
@ExtendWith(MockitoExtension.class)
class EmailVerificationFilterTest {

    @Mock
    private FilterChain filterChain;

    private EmailVerificationFilter emailVerificationFilter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        emailVerificationFilter = new EmailVerificationFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should allow verified user to access protected endpoint")
    void testAllowVerifiedUser() throws ServletException, IOException {
        // Setup verified user
        UserPrincipal verifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("verified@example.com")
                .role("USER")
                .emailVerified(true)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(verifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        request.setRequestURI("/api/grows");
        request.setMethod("GET");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.FORBIDDEN.value());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should block unverified user from protected endpoint")
    void testBlockUnverifiedUser() throws ServletException, IOException {
        // Setup unverified user
        UserPrincipal unverifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .role("USER")
                .emailVerified(false)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(unverifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        request.setRequestURI("/api/grows");
        request.setMethod("GET");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(response.getContentAsString()).contains("Email not verified");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Should allow unverified user to access auth endpoints")
    void testAllowUnverifiedUserToAuthEndpoints() throws ServletException, IOException {
        // Setup unverified user
        UserPrincipal unverifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .role("USER")
                .emailVerified(false)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(unverifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        // Test various auth endpoints
        String[] authEndpoints = {
                "/api/auth/verify-email",
                "/api/auth/resend-verification",
                "/api/auth/logout"
        };

        for (String endpoint : authEndpoints) {
            request = new MockHttpServletRequest();
            response = new MockHttpServletResponse();
            request.setRequestURI(endpoint);
            request.setMethod("POST");

            emailVerificationFilter.doFilterInternal(request, response, filterChain);

            assertThat(response.getStatus()).isNotEqualTo(HttpStatus.FORBIDDEN.value());
        }

        verify(filterChain, times(authEndpoints.length)).doFilter(any(), any());
    }

    @Test
    @DisplayName("Should allow unauthenticated access to public endpoints")
    void testAllowUnauthenticatedToPublicEndpoints() throws ServletException, IOException {
        // No authentication set

        String[] publicEndpoints = {
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/forgot-password",
                "/api/auth/reset-password"
        };

        for (String endpoint : publicEndpoints) {
            request = new MockHttpServletRequest();
            response = new MockHttpServletResponse();
            request.setRequestURI(endpoint);
            request.setMethod("POST");

            emailVerificationFilter.doFilterInternal(request, response, filterChain);

            assertThat(response.getStatus()).isNotEqualTo(HttpStatus.FORBIDDEN.value());
        }

        verify(filterChain, times(publicEndpoints.length)).doFilter(any(), any());
    }

    @Test
    @DisplayName("Should allow access when no authentication is present")
    void testAllowAccessWithNoAuthentication() throws ServletException, IOException {
        // No authentication in SecurityContext
        request.setRequestURI("/api/auth/login");
        request.setMethod("POST");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.FORBIDDEN.value());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should allow OPTIONS requests regardless of verification")
    void testAllowOptionsRequests() throws ServletException, IOException {
        // Setup unverified user
        UserPrincipal unverifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .role("USER")
                .emailVerified(false)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(unverifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        request.setRequestURI("/api/grows");
        request.setMethod("OPTIONS");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.FORBIDDEN.value());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should check email verified status from UserPrincipal")
    void testCheckEmailVerifiedFromPrincipal() throws ServletException, IOException {
        // Setup verified user
        UserPrincipal verifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("verified@example.com")
                .role("USER")
                .emailVerified(true)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(verifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        request.setRequestURI("/api/cultivars");
        request.setMethod("GET");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should return JSON error response for unverified user")
    void testJsonErrorResponse() throws ServletException, IOException {
        // Setup unverified user
        UserPrincipal unverifiedUser = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .role("USER")
                .emailVerified(false)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(unverifiedUser, null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
        );

        request.setRequestURI("/api/grows");
        request.setMethod("GET");

        emailVerificationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString()).contains("error");
        assertThat(response.getContentAsString()).contains("Email not verified");
    }
}