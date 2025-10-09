package com.growmanager.controller;

import com.growmanager.dto.*;
import com.growmanager.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication endpoints.
 * Handles user registration, login, email verification, and password reset.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final int ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
    private static final int REFRESH_TOKEN_REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

    private final UserService userService;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookies;

    @Value("${app.cookie.same-site:Strict}")
    private String sameSite;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registers a new user account.
     * Sends a verification email to the provided email address.
     *
     * @param request the registration request containing email, password, and display name
     * @param response the HTTP response for setting cookies
     * @return success message with 201 CREATED status
     */
    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account and sends verification email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        logger.info("Registration request received for email: {}", request.getEmail());

        AuthResponse authResponse = userService.registerUser(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    /**
     * Verifies a user's email address using the verification token.
     *
     * @param token the email verification token from the link
     * @return success message with 200 OK status
     */
    @GetMapping("/verify-email")
    @Operation(summary = "Verify email address", description = "Verifies user email using token from verification link")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token")
    })
    public ResponseEntity<AuthResponse> verifyEmail(@RequestParam("token") String token) {
        logger.info("Email verification request received");

        AuthResponse authResponse = userService.verifyEmail(token);

        return ResponseEntity.ok(authResponse);
    }

    /**
     * Resends the email verification link.
     * Rate limited to 1 request per 5 minutes.
     *
     * @param request the resend verification request containing email
     * @return success message (always returns same message for security)
     */
    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email", description = "Resends email verification link (rate limited)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Verification email sent if email exists",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests - rate limit exceeded")
    })
    public ResponseEntity<AuthResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        logger.info("Resend verification request received for email: {}", request.getEmail());

        AuthResponse authResponse = userService.resendVerificationEmail(request);

        return ResponseEntity.ok(authResponse);
    }

    /**
     * Authenticates a user and returns JWT tokens.
     * Tokens are set as httpOnly cookies for security.
     *
     * @param request the login request containing email, password, and rememberMe flag
     * @param response the HTTP response for setting cookies
     * @return authentication response with user data and 200 OK status
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user and returns JWT tokens in httpOnly cookies")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "423", description = "Account locked due to failed attempts"),
            @ApiResponse(responseCode = "429", description = "Too many login attempts")
    })
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        logger.info("Login request received for email: {}", request.getEmail());

        AuthResponse authResponse = userService.login(request);

        // Set access token cookie
        Cookie accessTokenCookie = createCookie(
                ACCESS_TOKEN_COOKIE_NAME,
                authResponse.getAccessToken(),
                ACCESS_TOKEN_MAX_AGE
        );
        response.addCookie(accessTokenCookie);

        // Set refresh token cookie with appropriate max age
        int refreshTokenMaxAge = request.isRememberMe()
                ? REFRESH_TOKEN_REMEMBER_ME_MAX_AGE
                : REFRESH_TOKEN_MAX_AGE;

        Cookie refreshTokenCookie = createCookie(
                REFRESH_TOKEN_COOKIE_NAME,
                authResponse.getRefreshToken(),
                refreshTokenMaxAge
        );
        response.addCookie(refreshTokenCookie);

        logger.info("Login successful for user: {}", request.getEmail());

        return ResponseEntity.ok(authResponse);
    }

    /**
     * Initiates password reset process.
     * Sends password reset email if email exists in the system.
     *
     * @param request the forgot password request containing email
     * @return success message (always returns same message for security)
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Sends password reset email if user exists")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset email sent if email exists",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class)))
    })
    public ResponseEntity<AuthResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        logger.info("Forgot password request received for email: {}", request.getEmail());

        AuthResponse authResponse = userService.forgotPassword(request);

        return ResponseEntity.ok(authResponse);
    }

    /**
     * Resets user password using reset token.
     *
     * @param request the reset password request containing token and new password
     * @return success message with 200 OK status
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets user password using reset token from email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired reset token")
    })
    public ResponseEntity<AuthResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        logger.info("Password reset request received");

        AuthResponse authResponse = userService.resetPassword(request);

        return ResponseEntity.ok(authResponse);
    }

    /**
     * Creates an httpOnly cookie with secure settings.
     *
     * @param name the cookie name
     * @param value the cookie value
     * @param maxAge the max age in seconds
     * @return the configured cookie
     */
    private Cookie createCookie(String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookies);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        // Note: SameSite attribute requires Spring 6+ or manual handling
        // For Spring Boot 3.x, SameSite is set via application properties
        return cookie;
    }
}