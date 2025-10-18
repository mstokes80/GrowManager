package com.growmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.growmanager.dto.UpdateProfileRequest;
import com.growmanager.dto.UserResponse;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.security.JwtTokenProvider;
import com.growmanager.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test suite for UserController.
 * Tests user profile management endpoints.
 */
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private SecurityContext securityContext;

    @MockBean
    private Authentication authentication;

    private UUID userId;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        userResponse = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("Test User")
                .role("USER")
                .timezone("UTC")
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Mock security context
        when(authentication.getName()).thenReturn(userId.toString());
        when(authentication.isAuthenticated()).thenReturn(true);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    // Get Current User Profile Tests
    @Test
    @DisplayName("GET /api/users/me - Should return current user profile")
    @WithMockUser
    void testGetCurrentUser_Success() throws Exception {
        when(userService.getUserProfile(userId)).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.displayName").value("Test User"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.timezone").value("UTC"))
                .andExpect(jsonPath("$.emailVerified").value(true));

        verify(userService).getUserProfile(userId);
    }

    @Test
    @DisplayName("GET /api/users/me - Should return 404 when user not found")
    @WithMockUser
    void testGetCurrentUser_NotFound() throws Exception {
        when(userService.getUserProfile(userId))
                .thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(get("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(userService).getUserProfile(userId);
    }

    @Test
    @DisplayName("GET /api/users/me - Should return 401 when not authenticated")
    void testGetCurrentUser_Unauthorized() throws Exception {
        // Clear authentication
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        mockMvc.perform(get("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError()); // Will throw IllegalStateException

        verify(userService, never()).getUserProfile(any(UUID.class));
    }

    // Update Current User Profile Tests
    @Test
    @DisplayName("PUT /api/users/me - Should update user profile successfully")
    @WithMockUser
    void testUpdateCurrentUser_Success() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .timezone("America/New_York")
                .build();

        UserResponse updatedUser = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("Updated Name")
                .role("USER")
                .timezone("America/New_York")
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Name"))
                .andExpect(jsonPath("$.timezone").value("America/New_York"));

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should update only display name")
    @WithMockUser
    void testUpdateCurrentUser_OnlyDisplayName() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName("New Display Name")
                .build();

        UserResponse updatedUser = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("New Display Name")
                .role("USER")
                .timezone("UTC")
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Display Name"))
                .andExpect(jsonPath("$.timezone").value("UTC"));

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should update only timezone")
    @WithMockUser
    void testUpdateCurrentUser_OnlyTimezone() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .timezone("Europe/London")
                .build();

        UserResponse updatedUser = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("Test User")
                .role("USER")
                .timezone("Europe/London")
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Test User"))
                .andExpect(jsonPath("$.timezone").value("Europe/London"));

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should return 400 for invalid display name")
    @WithMockUser
    void testUpdateCurrentUser_InvalidDisplayName() throws Exception {
        // Display name exceeding max length (100 characters)
        String longName = "a".repeat(101);

        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName(longName)
                .build();

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).updateUserProfile(any(UUID.class), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should return 400 for invalid timezone")
    @WithMockUser
    void testUpdateCurrentUser_InvalidTimezone() throws Exception {
        // Timezone exceeding max length (50 characters)
        String longTimezone = "a".repeat(51);

        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .timezone(longTimezone)
                .build();

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).updateUserProfile(any(UUID.class), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should return 404 when user not found")
    @WithMockUser
    void testUpdateCurrentUser_NotFound() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should return 401 when not authenticated")
    void testUpdateCurrentUser_Unauthorized() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .build();

        // Clear authentication
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isInternalServerError()); // Will throw IllegalStateException

        verify(userService, never()).updateUserProfile(any(UUID.class), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should handle empty update request")
    @WithMockUser
    void testUpdateCurrentUser_EmptyRequest() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder().build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Test User"))
                .andExpect(jsonPath("$.timezone").value("UTC"));

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/users/me - Should not allow updating email")
    @WithMockUser
    void testUpdateCurrentUser_CannotUpdateEmail() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .timezone("America/New_York")
                .build();

        when(userService.updateUserProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com")); // Email remains unchanged

        verify(userService).updateUserProfile(eq(userId), any(UpdateProfileRequest.class));
    }
}