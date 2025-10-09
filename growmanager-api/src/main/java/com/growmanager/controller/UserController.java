package com.growmanager.controller;

import com.growmanager.dto.UpdateProfileRequest;
import com.growmanager.dto.UserResponse;
import com.growmanager.security.JwtTokenProvider;
import com.growmanager.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for user profile management endpoints.
 * Handles retrieving and updating user profile information.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "User profile management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Retrieves the current authenticated user's profile.
     *
     * @param request the HTTP request containing JWT token
     * @return the user's profile with 200 OK status
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the authenticated user's profile information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get profile request for user ID: {}", userId);

        UserResponse userResponse = userService.getUserProfile(userId);

        return ResponseEntity.ok(userResponse);
    }

    /**
     * Updates the current authenticated user's profile.
     * Only display name and timezone can be updated.
     *
     * @param updateRequest the update profile request containing new values
     * @param request the HTTP request containing JWT token
     * @return the updated user profile with 200 OK status
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates the authenticated user's profile (display name and timezone)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> updateCurrentUser(
            @Valid @RequestBody UpdateProfileRequest updateRequest,
            HttpServletRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update profile request for user ID: {}", userId);

        UserResponse userResponse = userService.updateUserProfile(userId, updateRequest);

        logger.info("Profile updated successfully for user ID: {}", userId);

        return ResponseEntity.ok(userResponse);
    }

    /**
     * Extracts the user ID from the current security context.
     * The user ID is set by the JwtAuthenticationFilter after validating the token.
     *
     * @return the authenticated user's UUID
     * @throws IllegalStateException if authentication is not available
     */
    private UUID getUserIdFromAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            logger.error("No authentication found in security context");
            throw new IllegalStateException("User is not authenticated");
        }

        try {
            // The authentication principal is set to the user ID by JwtAuthenticationFilter
            String userIdString = authentication.getName();
            return UUID.fromString(userIdString);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to parse user ID from authentication: {}", authentication.getName());
            throw new IllegalStateException("Invalid user ID in authentication", e);
        }
    }
}