package com.growmanager.service;

import com.growmanager.dto.*;
import com.growmanager.entity.User;
import com.growmanager.exception.*;
import com.growmanager.repository.UserRepository;
import com.growmanager.security.JwtTokenProvider;
import com.growmanager.security.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User Service for handling user registration, authentication, and profile management.
 */
@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private static final int EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
    private static final int PASSWORD_RESET_EXPIRY_HOURS = 1;
    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final int ACCOUNT_LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RateLimiterService rateLimiterService;

    @Autowired
    public UserService(
            UserRepository userRepository,
            EmailService emailService,
            JwtTokenProvider jwtTokenProvider,
            RateLimiterService rateLimiterService
    ) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.rateLimiterService = rateLimiterService;
    }

    /**
     * Registers a new user account.
     * Validates email uniqueness, password strength, and sends verification email.
     *
     * @param request the registration request
     * @return success message
     * @throws DuplicateResourceException if email already exists
     * @throws IllegalArgumentException if passwords don't match
     */
    public AuthResponse registerUser(RegisterRequest request) {
        logger.info("Processing registration request for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new DuplicateResourceException("Email address is already registered");
        }

        if (!request.passwordsMatch()) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = User.builder()
                .email(request.getEmail())
                .displayName(request.getDisplayName())
                .role(User.Role.USER)
                .emailVerified(false)
                .failedLoginAttempts(0)
                .build();

        user.setPassword(request.getPassword());

        String verificationToken = user.generateEmailVerificationToken(EMAIL_VERIFICATION_EXPIRY_HOURS);

        user = userRepository.save(user);
        logger.info("User registered successfully with ID: {}", user.getId());

        emailService.sendVerificationEmail(user, verificationToken);

        return AuthResponse.message("Registration successful. Please check your email to verify your account.");
    }

    /**
     * Verifies a user's email address using the verification token.
     *
     * @param token the email verification token
     * @return success message
     * @throws InvalidTokenException if token is invalid or expired
     */
    public AuthResponse verifyEmail(String token) {
        logger.info("Processing email verification request");

        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired verification token"));

        if (!user.isEmailVerificationTokenValid(token)) {
            logger.warn("Email verification failed: Token expired for user: {}", user.getEmail());
            throw new InvalidTokenException("Verification token has expired. Please request a new one.");
        }

        user.clearEmailVerificationToken();
        userRepository.save(user);

        logger.info("Email verified successfully for user: {}", user.getEmail());

        return AuthResponse.message("Email verified successfully. You can now log in.");
    }

    /**
     * Resends the email verification link to the user.
     * Rate limited to 1 request per 5 minutes.
     *
     * @param request the resend verification request
     * @return success message
     */
    public AuthResponse resendVerificationEmail(ResendVerificationRequest request) {
        logger.info("Processing resend verification request for email: {}", request.getEmail());

        if (!rateLimiterService.allowEmailVerificationResend(request.getEmail())) {
            long retryAfter = 300;
            throw new RateLimitExceededException(
                    "Too many verification emails sent. Please wait before requesting another.",
                    retryAfter
            );
        }

        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                String verificationToken = user.generateEmailVerificationToken(EMAIL_VERIFICATION_EXPIRY_HOURS);
                userRepository.save(user);
                emailService.sendVerificationEmail(user, verificationToken);
                logger.info("Verification email resent to: {}", user.getEmail());
            }
        });

        return AuthResponse.message("If your email exists and is not verified, a verification link has been sent.");
    }

    /**
     * Authenticates a user and generates JWT tokens.
     * Enforces rate limiting and account lockout on failed attempts.
     *
     * @param request the login request
     * @return authentication response with tokens and user data
     * @throws BadCredentialsException if credentials are invalid
     * @throws AccountLockedException if account is locked
     * @throws EmailNotVerifiedException if email is not verified
     */
    public AuthResponse login(LoginRequest request) {
        logger.info("Processing login request for email: {}", request.getEmail());

        if (!rateLimiterService.allowLoginAttempt(request.getEmail())) {
            long retryAfter = rateLimiterService.getRemainingRateLimitTime(request.getEmail());
            throw new RateLimitExceededException(
                    "Too many login attempts. Please try again later.",
                    retryAfter
            );
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.isAccountLocked()) {
            long remainingTime = rateLimiterService.getRemainingLockoutTime(request.getEmail());
            throw new AccountLockedException(
                    "Account is temporarily locked due to too many failed login attempts. Please try again later.",
                    remainingTime
            );
        }

        if (!user.verifyPassword(request.getPassword())) {
            handleFailedLogin(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("Please verify your email address before logging in.");
        }

        user.resetFailedLoginAttempts();
        userRepository.save(user);
        rateLimiterService.resetLoginAttempts(request.getEmail());

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user, request.isRememberMe());

        UserResponse userResponse = UserResponse.fromEntity(user);

        logger.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.success(accessToken, refreshToken, userResponse);
    }

    /**
     * Refreshes an expired access token using a valid refresh token.
     *
     * @param request the refresh token request
     * @return authentication response with new tokens
     * @throws InvalidTokenException if refresh token is invalid or expired
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        logger.info("Processing token refresh request");

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            logger.warn("Token refresh failed: Invalid refresh token");
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        // Verify token type
        String tokenType = jwtTokenProvider.getTokenTypeFromToken(request.getRefreshToken());
        if (!"refresh".equals(tokenType)) {
            logger.warn("Token refresh failed: Wrong token type: {}", tokenType);
            throw new InvalidTokenException("Invalid token type. Refresh token required.");
        }

        // Get user from refresh token
        UUID userId = jwtTokenProvider.getUserIdFromToken(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user, false);

        UserResponse userResponse = UserResponse.fromEntity(user);

        logger.info("Token refreshed successfully for user: {}", user.getEmail());

        return AuthResponse.success(newAccessToken, newRefreshToken, userResponse);
    }

    /**
     * Initiates a password reset request.
     * Generates a reset token and sends email. Rate limited and always returns success message.
     *
     * @param request the forgot password request
     * @return success message
     */
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        logger.info("Processing forgot password request for email: {}", request.getEmail());

        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String resetToken = user.generatePasswordResetToken(PASSWORD_RESET_EXPIRY_HOURS);
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user, resetToken);
            logger.info("Password reset email sent to: {}", user.getEmail());
        });

        return AuthResponse.message("If your email exists in our system, a password reset link has been sent.");
    }

    /**
     * Resets a user's password using the reset token.
     *
     * @param request the reset password request
     * @return success message
     * @throws InvalidTokenException if token is invalid or expired
     */
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        logger.info("Processing password reset request");

        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));

        if (!user.isPasswordResetTokenValid(request.getToken())) {
            logger.warn("Password reset failed: Token expired for user: {}", user.getEmail());
            throw new InvalidTokenException("Reset token has expired. Please request a new one.");
        }

        if (!request.passwordsMatch()) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        user.setPassword(request.getNewPassword());
        user.clearPasswordResetToken();
        user.resetFailedLoginAttempts();
        userRepository.save(user);

        emailService.sendPasswordResetConfirmationEmail(user);

        logger.info("Password reset successfully for user: {}", user.getEmail());

        return AuthResponse.message("Password has been reset successfully. You can now log in with your new password.");
    }

    /**
     * Gets the current user's profile.
     *
     * @param userId the user ID from JWT
     * @return the user's profile
     * @throws ResourceNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserResponse.fromEntity(user);
    }

    /**
     * Updates the current user's profile.
     *
     * @param userId the user ID from JWT
     * @param request the update profile request
     * @return the updated user profile
     * @throws ResourceNotFoundException if user not found
     */
    public UserResponse updateUserProfile(UUID userId, UpdateProfileRequest request) {
        logger.info("Processing profile update request for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }

        if (request.getTimezone() != null) {
            user.setTimezone(request.getTimezone());
        }

        user = userRepository.save(user);

        logger.info("Profile updated successfully for user: {}", user.getEmail());

        return UserResponse.fromEntity(user);
    }

    /**
     * Handles failed login attempts and locks account if necessary.
     *
     * @param user the user who failed login
     */
    private void handleFailedLogin(User user) {
        user.incrementFailedLoginAttempts();

        if (user.getFailedLoginAttempts() >= MAX_FAILED_LOGIN_ATTEMPTS) {
            user.lockAccountUntil(LocalDateTime.now().plusMinutes(ACCOUNT_LOCKOUT_MINUTES));
            rateLimiterService.lockAccount(user.getEmail());
            logger.warn("Account locked for user: {} due to {} failed attempts",
                    user.getEmail(), MAX_FAILED_LOGIN_ATTEMPTS);
        }

        userRepository.save(user);
        logger.warn("Failed login attempt #{} for user: {}", user.getFailedLoginAttempts(), user.getEmail());
    }
}