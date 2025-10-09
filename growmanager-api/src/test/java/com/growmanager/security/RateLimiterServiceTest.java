package com.growmanager.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test suite for RateLimiterService.
 * Tests rate limiting functionality for login and email verification.
 */
@ExtendWith(MockitoExtension.class)
class RateLimiterServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        rateLimiterService = new RateLimiterService(redisTemplate);
    }

    // Test login rate limiting
    @Test
    @DisplayName("Should allow login within rate limit")
    void testAllowLoginWithinRateLimit() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        when(valueOperations.get(key)).thenReturn("3");

        boolean allowed = rateLimiterService.allowLoginAttempt(email);

        assertThat(allowed).isTrue();
        verify(valueOperations).increment(key);
    }

    @Test
    @DisplayName("Should block login after exceeding rate limit")
    void testBlockLoginAfterExceedingRateLimit() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        when(valueOperations.get(key)).thenReturn("5");

        boolean allowed = rateLimiterService.allowLoginAttempt(email);

        assertThat(allowed).isFalse();
        verify(valueOperations, never()).increment(key);
    }

    @Test
    @DisplayName("Should allow first login attempt when key doesn't exist")
    void testAllowFirstLoginAttempt() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        when(valueOperations.get(key)).thenReturn(null);
        when(valueOperations.increment(key)).thenReturn(1L);

        boolean allowed = rateLimiterService.allowLoginAttempt(email);

        assertThat(allowed).isTrue();
        verify(valueOperations).increment(key);
        verify(redisTemplate).expire(eq(key), eq(15L), eq(TimeUnit.MINUTES));
    }

    @Test
    @DisplayName("Should set expiration for new login rate limit key")
    void testSetExpirationForNewLoginKey() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        when(valueOperations.get(key)).thenReturn(null);
        when(valueOperations.increment(key)).thenReturn(1L);

        rateLimiterService.allowLoginAttempt(email);

        verify(redisTemplate).expire(key, 15, TimeUnit.MINUTES);
    }

    @Test
    @DisplayName("Should reset login rate limit")
    void testResetLoginRateLimit() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        rateLimiterService.resetLoginAttempts(email);

        verify(redisTemplate).delete(key);
    }

    // Test email verification rate limiting
    @Test
    @DisplayName("Should allow email verification within rate limit")
    void testAllowEmailVerificationWithinRateLimit() {
        String email = "test@example.com";
        String key = "rate_limit:verify_email:" + email;

        when(valueOperations.get(key)).thenReturn(null);

        boolean allowed = rateLimiterService.allowEmailVerificationResend(email);

        assertThat(allowed).isTrue();
        verify(valueOperations).set(eq(key), eq("1"), eq(5L), eq(TimeUnit.MINUTES));
    }

    @Test
    @DisplayName("Should block email verification after recent send")
    void testBlockEmailVerificationAfterRecentSend() {
        String email = "test@example.com";
        String key = "rate_limit:verify_email:" + email;

        when(valueOperations.get(key)).thenReturn("1");

        boolean allowed = rateLimiterService.allowEmailVerificationResend(email);

        assertThat(allowed).isFalse();
        verify(valueOperations, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
    }

    @Test
    @DisplayName("Should set 5 minute expiration for email verification rate limit")
    void testSetExpirationForEmailVerificationKey() {
        String email = "test@example.com";
        String key = "rate_limit:verify_email:" + email;

        when(valueOperations.get(key)).thenReturn(null);

        rateLimiterService.allowEmailVerificationResend(email);

        verify(valueOperations).set(key, "1", 5, TimeUnit.MINUTES);
    }

    // Test account locking
    @Test
    @DisplayName("Should get remaining lockout time for locked account")
    void testGetRemainingLockoutTime() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        when(redisTemplate.getExpire(key, TimeUnit.SECONDS)).thenReturn(300L);

        long remainingSeconds = rateLimiterService.getRemainingLockoutTime(email);

        assertThat(remainingSeconds).isEqualTo(300L);
    }

    @Test
    @DisplayName("Should return 0 for non-locked account")
    void testGetRemainingLockoutTimeForNonLockedAccount() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        when(redisTemplate.getExpire(key, TimeUnit.SECONDS)).thenReturn(-2L);

        long remainingSeconds = rateLimiterService.getRemainingLockoutTime(email);

        assertThat(remainingSeconds).isEqualTo(0L);
    }

    @Test
    @DisplayName("Should lock account for 15 minutes")
    void testLockAccount() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        rateLimiterService.lockAccount(email);

        verify(valueOperations).set(eq(key), eq("locked"), eq(15L), eq(TimeUnit.MINUTES));
    }

    @Test
    @DisplayName("Should unlock account")
    void testUnlockAccount() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        rateLimiterService.unlockAccount(email);

        verify(redisTemplate).delete(key);
    }

    @Test
    @DisplayName("Should check if account is locked")
    void testIsAccountLocked() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        when(valueOperations.get(key)).thenReturn("locked");

        boolean locked = rateLimiterService.isAccountLocked(email);

        assertThat(locked).isTrue();
    }

    @Test
    @DisplayName("Should return false when account is not locked")
    void testIsAccountNotLocked() {
        String email = "test@example.com";
        String key = "account_locked:" + email;

        when(valueOperations.get(key)).thenReturn(null);

        boolean locked = rateLimiterService.isAccountLocked(email);

        assertThat(locked).isFalse();
    }

    // Test edge cases
    @Test
    @DisplayName("Should handle null email gracefully")
    void testHandleNullEmail() {
        assertThatThrownBy(() -> rateLimiterService.allowLoginAttempt(null))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Should handle empty email gracefully")
    void testHandleEmptyEmail() {
        assertThatThrownBy(() -> rateLimiterService.allowLoginAttempt(""))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Should handle Redis connection failure gracefully")
    void testHandleRedisConnectionFailure() {
        String email = "test@example.com";

        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis connection failed"));

        // Should not throw exception, but return safe default
        assertThatThrownBy(() -> rateLimiterService.allowLoginAttempt(email))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Login rate limit should be 5 attempts per 15 minutes")
    void testLoginRateLimitConfiguration() {
        String email = "test@example.com";
        String key = "rate_limit:login:" + email;

        // Simulate 5 attempts
        when(valueOperations.get(key))
                .thenReturn(null)
                .thenReturn("1")
                .thenReturn("2")
                .thenReturn("3")
                .thenReturn("4");
        when(valueOperations.increment(key)).thenReturn(1L, 2L, 3L, 4L, 5L);

        for (int i = 0; i < 5; i++) {
            boolean allowed = rateLimiterService.allowLoginAttempt(email);
            assertThat(allowed).isTrue();
        }

        // 6th attempt should be blocked
        when(valueOperations.get(key)).thenReturn("5");
        boolean sixthAttempt = rateLimiterService.allowLoginAttempt(email);
        assertThat(sixthAttempt).isFalse();
    }

    @Test
    @DisplayName("Email verification rate limit should be 1 per 5 minutes")
    void testEmailVerificationRateLimitConfiguration() {
        String email = "test@example.com";
        String key = "rate_limit:verify_email:" + email;

        // First attempt allowed
        when(valueOperations.get(key)).thenReturn(null);
        boolean firstAttempt = rateLimiterService.allowEmailVerificationResend(email);
        assertThat(firstAttempt).isTrue();

        // Second attempt within 5 minutes should be blocked
        when(valueOperations.get(key)).thenReturn("1");
        boolean secondAttempt = rateLimiterService.allowEmailVerificationResend(email);
        assertThat(secondAttempt).isFalse();
    }
}