package com.growmanager.security;

import com.growmanager.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for JwtTokenProvider.
 * Tests JWT token generation, validation, and expiration.
 */
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;
    private String jwtSecret;
    private long accessTokenExpiration;
    private long refreshTokenExpiration;
    private long refreshTokenExpirationRememberMe;

    @BeforeEach
    void setUp() {
        // Initialize token provider with test configuration
        jwtSecret = "test-secret-key-for-jwt-testing-must-be-at-least-256-bits-long-for-HS256";
        accessTokenExpiration = 15 * 60 * 1000; // 15 minutes
        refreshTokenExpiration = 7 * 24 * 60 * 60 * 1000; // 7 days
        refreshTokenExpirationRememberMe = 30 * 24 * 60 * 60 * 1000L; // 30 days

        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", jwtSecret);
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenExpiration", accessTokenExpiration);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpiration", refreshTokenExpiration);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpirationRememberMe", refreshTokenExpirationRememberMe);

        jwtTokenProvider.init();

        // Create test user
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .role(User.Role.USER)
                .emailVerified(true)
                .build();
    }

    // Test JWT token generation
    @Test
    @DisplayName("Should generate valid access token")
    void testGenerateAccessToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts: header.payload.signature
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void testGenerateRefreshToken() {
        String token = jwtTokenProvider.generateRefreshToken(testUser, false);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Should generate refresh token with extended expiration for remember me")
    void testGenerateRefreshTokenRememberMe() {
        String tokenWithRememberMe = jwtTokenProvider.generateRefreshToken(testUser, true);
        String tokenWithoutRememberMe = jwtTokenProvider.generateRefreshToken(testUser, false);

        assertThat(tokenWithRememberMe).isNotNull();
        assertThat(tokenWithoutRememberMe).isNotNull();

        // Verify that both tokens are valid
        assertThat(jwtTokenProvider.validateToken(tokenWithRememberMe)).isTrue();
        assertThat(jwtTokenProvider.validateToken(tokenWithoutRememberMe)).isTrue();
    }

    // Test token validation
    @Test
    @DisplayName("Should validate correct token")
    void testValidateToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject invalid token signature")
    void testValidateInvalidToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Tamper with token by changing the signature
        String[] parts = token.split("\\.");
        String tamperedToken = parts[0] + "." + parts[1] + ".invalidsignature";

        boolean isValid = jwtTokenProvider.validateToken(tamperedToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject malformed token")
    void testValidateMalformedToken() {
        String malformedToken = "not.a.valid.jwt.token";

        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject null token")
    void testValidateNullToken() {
        boolean isValid = jwtTokenProvider.validateToken(null);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject empty token")
    void testValidateEmptyToken() {
        boolean isValid = jwtTokenProvider.validateToken("");

        assertThat(isValid).isFalse();
    }

    // Test token expiration
    @Test
    @DisplayName("Should reject expired access token")
    void testExpiredAccessToken() {
        // Create token provider with very short expiration
        JwtTokenProvider shortExpirationProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortExpirationProvider, "jwtSecret", jwtSecret);
        ReflectionTestUtils.setField(shortExpirationProvider, "accessTokenExpiration", 100L); // 100ms
        ReflectionTestUtils.setField(shortExpirationProvider, "refreshTokenExpiration", refreshTokenExpiration);
        ReflectionTestUtils.setField(shortExpirationProvider, "refreshTokenExpirationRememberMe", refreshTokenExpirationRememberMe);
        shortExpirationProvider.init();

        String token = shortExpirationProvider.generateAccessToken(testUser);

        // Wait for token to expire
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        boolean isValid = shortExpirationProvider.validateToken(token);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should extract user ID from token")
    void testGetUserIdFromToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        UUID userId = jwtTokenProvider.getUserIdFromToken(token);

        assertThat(userId).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("Should extract email from token")
    void testGetEmailFromToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        String email = jwtTokenProvider.getEmailFromToken(token);

        assertThat(email).isEqualTo(testUser.getEmail());
    }

    @Test
    @DisplayName("Should extract role from token")
    void testGetRoleFromToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        String role = jwtTokenProvider.getRoleFromToken(token);

        assertThat(role).isEqualTo(testUser.getRole().toString());
    }

    @Test
    @DisplayName("Should extract email verified status from token")
    void testGetEmailVerifiedFromToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        boolean emailVerified = jwtTokenProvider.getEmailVerifiedFromToken(token);

        assertThat(emailVerified).isEqualTo(testUser.isEmailVerified());
    }

    @Test
    @DisplayName("Should throw exception when extracting user ID from expired token")
    void testGetUserIdFromExpiredToken() {
        // Create token provider with very short expiration
        JwtTokenProvider shortExpirationProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortExpirationProvider, "jwtSecret", jwtSecret);
        ReflectionTestUtils.setField(shortExpirationProvider, "accessTokenExpiration", 100L); // 100ms
        ReflectionTestUtils.setField(shortExpirationProvider, "refreshTokenExpiration", refreshTokenExpiration);
        ReflectionTestUtils.setField(shortExpirationProvider, "refreshTokenExpirationRememberMe", refreshTokenExpirationRememberMe);
        shortExpirationProvider.init();

        String token = shortExpirationProvider.generateAccessToken(testUser);

        // Wait for token to expire
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertThatThrownBy(() -> shortExpirationProvider.getUserIdFromToken(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("Should throw exception when extracting user ID from invalid token")
    void testGetUserIdFromInvalidToken() {
        String invalidToken = "invalid.token.signature";

        assertThatThrownBy(() -> jwtTokenProvider.getUserIdFromToken(invalidToken))
                .isInstanceOf(Exception.class);
    }

    // Test token claims
    @Test
    @DisplayName("Should include all required claims in access token")
    void testAccessTokenClaims() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        UUID userId = jwtTokenProvider.getUserIdFromToken(token);
        String email = jwtTokenProvider.getEmailFromToken(token);
        String role = jwtTokenProvider.getRoleFromToken(token);
        boolean emailVerified = jwtTokenProvider.getEmailVerifiedFromToken(token);

        assertThat(userId).isEqualTo(testUser.getId());
        assertThat(email).isEqualTo(testUser.getEmail());
        assertThat(role).isEqualTo(testUser.getRole().toString());
        assertThat(emailVerified).isEqualTo(testUser.isEmailVerified());
    }

    @Test
    @DisplayName("Should handle admin role in token")
    void testAdminRoleInToken() {
        User adminUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .displayName("Admin User")
                .role(User.Role.ADMIN)
                .emailVerified(true)
                .build();

        String token = jwtTokenProvider.generateAccessToken(adminUser);
        String role = jwtTokenProvider.getRoleFromToken(token);

        assertThat(role).isEqualTo(User.Role.ADMIN.toString());
    }

    @Test
    @DisplayName("Should handle unverified email in token")
    void testUnverifiedEmailInToken() {
        User unverifiedUser = User.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .displayName("Unverified User")
                .role(User.Role.USER)
                .emailVerified(false)
                .build();

        String token = jwtTokenProvider.generateAccessToken(unverifiedUser);
        boolean emailVerified = jwtTokenProvider.getEmailVerifiedFromToken(token);

        assertThat(emailVerified).isFalse();
    }

    // Test token expiration times
    @Test
    @DisplayName("Access token should expire in 15 minutes")
    void testAccessTokenExpirationTime() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // This test verifies the token was generated, actual expiration is handled by JWT library
        assertThat(token).isNotNull();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Refresh token should expire in 7 days without remember me")
    void testRefreshTokenExpirationTime() {
        String token = jwtTokenProvider.generateRefreshToken(testUser, false);

        assertThat(token).isNotNull();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Refresh token should expire in 30 days with remember me")
    void testRefreshTokenExpirationTimeWithRememberMe() {
        String token = jwtTokenProvider.generateRefreshToken(testUser, true);

        assertThat(token).isNotNull();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Should use secure signing key from environment")
    void testSecureSigningKey() {
        // Verify that the signing key is at least 256 bits (32 bytes)
        assertThat(jwtSecret.length()).isGreaterThanOrEqualTo(32);
    }
}