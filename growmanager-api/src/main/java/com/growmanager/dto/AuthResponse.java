package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for authentication response.
 * Contains JWT tokens and user information after successful login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private UserResponse user;
    private String message;

    /**
     * Creates a success response with tokens and user data.
     */
    public static AuthResponse success(String accessToken, String refreshToken, UserResponse user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .build();
    }

    /**
     * Creates a message-only response (for registration, etc.).
     */
    public static AuthResponse message(String message) {
        return AuthResponse.builder()
                .message(message)
                .build();
    }
}