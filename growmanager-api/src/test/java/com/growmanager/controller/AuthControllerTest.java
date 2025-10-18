package com.growmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.growmanager.dto.*;
import com.growmanager.exception.*;
import com.growmanager.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test suite for AuthController.
 * Tests authentication endpoints including registration, login, verification, and password reset.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private RegisterRequest validRegisterRequest;
    private LoginRequest validLoginRequest;
    private AuthResponse authResponse;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        validRegisterRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Password123")
                .confirmPassword("Password123")
                .displayName("Test User")
                .build();

        validLoginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("Password123")
                .rememberMe(false)
                .build();

        userResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .role("USER")
                .timezone("UTC")
                .emailVerified(true)
                .build();

        authResponse = AuthResponse.success(
                "accessToken123",
                "refreshToken456",
                userResponse
        );
    }

    // Registration Tests
    @Test
    @DisplayName("POST /api/auth/register - Should register user successfully")
    void testRegisterUser_Success() throws Exception {
        AuthResponse successResponse = AuthResponse.message("Registration successful. Please check your email to verify your account.");
        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful. Please check your email to verify your account."));

        verify(userService).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register - Should return 409 when email already exists")
    void testRegisterUser_EmailAlreadyExists() throws Exception {
        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Email address is already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isConflict());

        verify(userService).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register - Should return 400 for invalid email")
    void testRegisterUser_InvalidEmail() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("invalid-email")
                .password("Password123")
                .confirmPassword("Password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register - Should return 400 for weak password")
    void testRegisterUser_WeakPassword() throws Exception {
        RegisterRequest weakPasswordRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("weak")
                .confirmPassword("weak")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPasswordRequest)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register - Should return 400 when passwords don't match")
    void testRegisterUser_PasswordsMismatch() throws Exception {
        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Passwords do not match"));

        RegisterRequest mismatchRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Password123")
                .confirmPassword("DifferentPassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mismatchRequest)))
                .andExpect(status().isBadRequest());
    }

    // Email Verification Tests
    @Test
    @DisplayName("GET /api/auth/verify-email - Should verify email successfully")
    void testVerifyEmail_Success() throws Exception {
        String token = "valid-verification-token";
        AuthResponse successResponse = AuthResponse.message("Email verified successfully. You can now log in.");
        when(userService.verifyEmail(token)).thenReturn(successResponse);

        mockMvc.perform(get("/api/auth/verify-email")
                        .param("token", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully. You can now log in."));

        verify(userService).verifyEmail(token);
    }

    @Test
    @DisplayName("GET /api/auth/verify-email - Should return 400 for invalid token")
    void testVerifyEmail_InvalidToken() throws Exception {
        String token = "invalid-token";
        when(userService.verifyEmail(token))
                .thenThrow(new InvalidTokenException("Invalid or expired verification token"));

        mockMvc.perform(get("/api/auth/verify-email")
                        .param("token", token))
                .andExpect(status().isBadRequest());

        verify(userService).verifyEmail(token);
    }

    // Resend Verification Tests
    @Test
    @DisplayName("POST /api/auth/resend-verification - Should resend verification email")
    void testResendVerification_Success() throws Exception {
        ResendVerificationRequest request = ResendVerificationRequest.builder()
                .email("test@example.com")
                .build();

        AuthResponse successResponse = AuthResponse.message("If your email exists and is not verified, a verification link has been sent.");
        when(userService.resendVerificationEmail(any(ResendVerificationRequest.class))).thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/resend-verification")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(userService).resendVerificationEmail(any(ResendVerificationRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/resend-verification - Should return 429 when rate limited")
    void testResendVerification_RateLimited() throws Exception {
        ResendVerificationRequest request = ResendVerificationRequest.builder()
                .email("test@example.com")
                .build();

        when(userService.resendVerificationEmail(any(ResendVerificationRequest.class)))
                .thenThrow(new RateLimitExceededException("Too many verification emails sent. Please wait before requesting another.", 300));

        mockMvc.perform(post("/api/auth/resend-verification")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());

        verify(userService).resendVerificationEmail(any(ResendVerificationRequest.class));
    }

    // Login Tests
    @Test
    @DisplayName("POST /api/auth/login - Should login successfully and set cookies")
    void testLogin_Success() throws Exception {
        when(userService.login(any(LoginRequest.class))).thenReturn(authResponse);

        var result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("accessToken123"))
                .andExpect(jsonPath("$.refreshToken").value("refreshToken456"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andReturn();

        // Verify cookies are set
        Cookie[] cookies = result.getResponse().getCookies();
        assertThat(cookies).hasSizeGreaterThanOrEqualTo(2);

        boolean hasAccessToken = false;
        boolean hasRefreshToken = false;
        for (Cookie cookie : cookies) {
            if ("accessToken".equals(cookie.getName())) {
                hasAccessToken = true;
                assertThat(cookie.getValue()).isEqualTo("accessToken123");
                assertThat(cookie.isHttpOnly()).isTrue();
            }
            if ("refreshToken".equals(cookie.getName())) {
                hasRefreshToken = true;
                assertThat(cookie.getValue()).isEqualTo("refreshToken456");
                assertThat(cookie.isHttpOnly()).isTrue();
            }
        }

        assertThat(hasAccessToken).isTrue();
        assertThat(hasRefreshToken).isTrue();

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login - Should return 401 for invalid credentials")
    void testLogin_InvalidCredentials() throws Exception {
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isUnauthorized());

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login - Should return 403 for unverified email")
    void testLogin_UnverifiedEmail() throws Exception {
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new EmailNotVerifiedException("Please verify your email address before logging in."));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isForbidden());

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login - Should return 423 for locked account")
    void testLogin_AccountLocked() throws Exception {
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new AccountLockedException("Account is temporarily locked due to too many failed login attempts. Please try again later.", 900));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isLocked());

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login - Should return 429 for rate limit exceeded")
    void testLogin_RateLimitExceeded() throws Exception {
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new RateLimitExceededException("Too many login attempts. Please try again later.", 600));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isTooManyRequests());

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login - Should extend refresh token expiry with rememberMe")
    void testLogin_RememberMe() throws Exception {
        LoginRequest rememberMeRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("Password123")
                .rememberMe(true)
                .build();

        when(userService.login(any(LoginRequest.class))).thenReturn(authResponse);

        var result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rememberMeRequest)))
                .andExpect(status().isOk())
                .andReturn();

        // Verify refresh token has extended max age
        Cookie[] cookies = result.getResponse().getCookies();
        for (Cookie cookie : cookies) {
            if ("refreshToken".equals(cookie.getName())) {
                assertThat(cookie.getMaxAge()).isEqualTo(30 * 24 * 60 * 60); // 30 days
            }
        }

        verify(userService).login(any(LoginRequest.class));
    }

    // Forgot Password Tests
    @Test
    @DisplayName("POST /api/auth/forgot-password - Should send password reset email")
    void testForgotPassword_Success() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        AuthResponse successResponse = AuthResponse.message("If your email exists in our system, a password reset link has been sent.");
        when(userService.forgotPassword(any(ForgotPasswordRequest.class))).thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(userService).forgotPassword(any(ForgotPasswordRequest.class));
    }

    // Reset Password Tests
    @Test
    @DisplayName("POST /api/auth/reset-password - Should reset password successfully")
    void testResetPassword_Success() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("valid-reset-token")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        AuthResponse successResponse = AuthResponse.message("Password has been reset successfully. You can now log in with your new password.");
        when(userService.resetPassword(any(ResetPasswordRequest.class))).thenReturn(successResponse);

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been reset successfully. You can now log in with your new password."));

        verify(userService).resetPassword(any(ResetPasswordRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password - Should return 400 for invalid token")
    void testResetPassword_InvalidToken() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("invalid-token")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        when(userService.resetPassword(any(ResetPasswordRequest.class)))
                .thenThrow(new InvalidTokenException("Invalid or expired reset token"));

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(userService).resetPassword(any(ResetPasswordRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password - Should return 400 for weak password")
    void testResetPassword_WeakPassword() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("valid-token")
                .newPassword("weak")
                .confirmPassword("weak")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).resetPassword(any(ResetPasswordRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password - Should return 400 when passwords don't match")
    void testResetPassword_PasswordsMismatch() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("valid-token")
                .newPassword("NewPassword123")
                .confirmPassword("DifferentPassword123")
                .build();

        when(userService.resetPassword(any(ResetPasswordRequest.class)))
                .thenThrow(new IllegalArgumentException("Passwords do not match"));

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}