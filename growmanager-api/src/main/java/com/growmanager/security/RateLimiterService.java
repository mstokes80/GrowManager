package com.growmanager.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.concurrent.TimeUnit;

/**
 * Rate Limiter Service.
 * Implements rate limiting for login attempts and email verification using Redis.
 */
@Service
public class RateLimiterService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);

    private static final String LOGIN_RATE_LIMIT_PREFIX = "rate_limit:login:";
    private static final String EMAIL_VERIFY_RATE_LIMIT_PREFIX = "rate_limit:verify_email:";
    private static final String ACCOUNT_LOCKED_PREFIX = "account_locked:";

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long LOGIN_RATE_LIMIT_WINDOW_MINUTES = 15;
    private static final long EMAIL_VERIFY_RATE_LIMIT_WINDOW_MINUTES = 5;
    private static final long ACCOUNT_LOCKOUT_MINUTES = 15;

    private final RedisTemplate<String, String> redisTemplate;

    @Autowired
    public RateLimiterService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Checks if a login attempt is allowed for the given email.
     * Rate limit: 5 attempts per 15 minutes.
     *
     * @param email the email address
     * @return true if login attempt is allowed, false if rate limit exceeded
     * @throws IllegalArgumentException if email is null or empty
     */
    public boolean allowLoginAttempt(String email) {
        validateEmail(email);

        String key = LOGIN_RATE_LIMIT_PREFIX + email.toLowerCase();

        try {
            String attemptsStr = redisTemplate.opsForValue().get(key);
            int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                logger.warn("Login rate limit exceeded for email: {}", email);
                return false;
            }

            Long newAttempts = redisTemplate.opsForValue().increment(key);
            if (newAttempts == 1) {
                // Set expiration only for the first attempt
                redisTemplate.expire(key, LOGIN_RATE_LIMIT_WINDOW_MINUTES, TimeUnit.MINUTES);
            }

            logger.debug("Login attempt {} of {} for email: {}", newAttempts, MAX_LOGIN_ATTEMPTS, email);
            return true;

        } catch (Exception e) {
            logger.error("Error checking login rate limit for email: {}", email, e);
            throw e;
        }
    }

    /**
     * Resets the login attempt counter for the given email.
     * Called after successful login.
     *
     * @param email the email address
     */
    public void resetLoginAttempts(String email) {
        validateEmail(email);

        String key = LOGIN_RATE_LIMIT_PREFIX + email.toLowerCase();
        redisTemplate.delete(key);
        logger.debug("Reset login attempts for email: {}", email);
    }

    /**
     * Checks if email verification resend is allowed for the given email.
     * Rate limit: 1 per 5 minutes.
     *
     * @param email the email address
     * @return true if resend is allowed, false if rate limit exceeded
     * @throws IllegalArgumentException if email is null or empty
     */
    public boolean allowEmailVerificationResend(String email) {
        validateEmail(email);

        String key = EMAIL_VERIFY_RATE_LIMIT_PREFIX + email.toLowerCase();

        try {
            String exists = redisTemplate.opsForValue().get(key);

            if (exists != null) {
                logger.warn("Email verification rate limit exceeded for email: {}", email);
                return false;
            }

            redisTemplate.opsForValue().set(key, "1", EMAIL_VERIFY_RATE_LIMIT_WINDOW_MINUTES, TimeUnit.MINUTES);
            logger.debug("Email verification allowed for email: {}", email);
            return true;

        } catch (Exception e) {
            logger.error("Error checking email verification rate limit for email: {}", email, e);
            throw e;
        }
    }

    /**
     * Locks an account for 15 minutes after failed login attempts.
     *
     * @param email the email address
     */
    public void lockAccount(String email) {
        validateEmail(email);

        String key = ACCOUNT_LOCKED_PREFIX + email.toLowerCase();
        redisTemplate.opsForValue().set(key, "locked", ACCOUNT_LOCKOUT_MINUTES, TimeUnit.MINUTES);
        logger.warn("Account locked for email: {} for {} minutes", email, ACCOUNT_LOCKOUT_MINUTES);
    }

    /**
     * Unlocks an account.
     *
     * @param email the email address
     */
    public void unlockAccount(String email) {
        validateEmail(email);

        String key = ACCOUNT_LOCKED_PREFIX + email.toLowerCase();
        redisTemplate.delete(key);
        logger.info("Account unlocked for email: {}", email);
    }

    /**
     * Checks if an account is currently locked.
     *
     * @param email the email address
     * @return true if account is locked, false otherwise
     */
    public boolean isAccountLocked(String email) {
        validateEmail(email);

        String key = ACCOUNT_LOCKED_PREFIX + email.toLowerCase();
        String locked = redisTemplate.opsForValue().get(key);
        return locked != null;
    }

    /**
     * Gets the remaining lockout time in seconds.
     *
     * @param email the email address
     * @return the remaining lockout time in seconds, or 0 if not locked
     */
    public long getRemainingLockoutTime(String email) {
        validateEmail(email);

        String key = ACCOUNT_LOCKED_PREFIX + email.toLowerCase();
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);

        if (ttl != null && ttl > 0) {
            return ttl;
        }

        return 0L;
    }

    /**
     * Gets the current number of failed login attempts.
     *
     * @param email the email address
     * @return the number of failed attempts
     */
    public int getFailedLoginAttempts(String email) {
        validateEmail(email);

        String key = LOGIN_RATE_LIMIT_PREFIX + email.toLowerCase();
        String attemptsStr = redisTemplate.opsForValue().get(key);
        return attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
    }

    /**
     * Gets the remaining time until the rate limit window resets.
     *
     * @param email the email address
     * @return the remaining time in seconds, or 0 if no rate limit active
     */
    public long getRemainingRateLimitTime(String email) {
        validateEmail(email);

        String key = LOGIN_RATE_LIMIT_PREFIX + email.toLowerCase();
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);

        if (ttl != null && ttl > 0) {
            return ttl;
        }

        return 0L;
    }

    /**
     * Validates email parameter.
     *
     * @param email the email to validate
     * @throws IllegalArgumentException if email is null or empty
     */
    private void validateEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
    }
}