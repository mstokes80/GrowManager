package com.growmanager.controller;

import com.growmanager.dto.CreateCultivarRequest;
import com.growmanager.dto.CultivarResponse;
import com.growmanager.dto.UpdateCultivarRequest;
import com.growmanager.service.CultivarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for cultivar management endpoints.
 * Handles CRUD operations for cannabis cultivars/strains.
 */
@RestController
@RequestMapping("/api/cultivars")
@Tag(name = "Cultivars", description = "Cannabis cultivar/strain management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class CultivarController {

    private static final Logger logger = LoggerFactory.getLogger(CultivarController.class);

    private final CultivarService cultivarService;

    @Autowired
    public CultivarController(CultivarService cultivarService) {
        this.cultivarService = cultivarService;
    }

    /**
     * Creates a new cultivar for the current user.
     *
     * @param request the create cultivar request
     * @return the created cultivar with 201 CREATED status
     */
    @PostMapping
    @Operation(summary = "Create new cultivar", description = "Creates a new cultivar/strain for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cultivar created successfully",
                    content = @Content(schema = @Schema(implementation = CultivarResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<CultivarResponse> createCultivar(@Valid @RequestBody CreateCultivarRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create cultivar request for user ID: {}", userId);

        CultivarResponse response = cultivarService.createCultivar(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all cultivars for the current user.
     *
     * @return list of cultivars with 200 OK status
     */
    @GetMapping
    @Operation(summary = "List all cultivars", description = "Returns all cultivars belonging to the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cultivars retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<List<CultivarResponse>> getCultivars() {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get cultivars request for user ID: {}", userId);

        List<CultivarResponse> cultivars = cultivarService.getCultivarsByUser(userId);

        return ResponseEntity.ok(cultivars);
    }

    /**
     * Gets a single cultivar by ID.
     *
     * @param id the cultivar ID
     * @return the cultivar with 200 OK status
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get cultivar by ID", description = "Returns a single cultivar by ID (must belong to authenticated user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cultivar retrieved successfully",
                    content = @Content(schema = @Schema(implementation = CultivarResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Cultivar not found")
    })
    public ResponseEntity<CultivarResponse> getCultivarById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get cultivar ID: {} for user ID: {}", id, userId);

        CultivarResponse cultivar = cultivarService.getCultivarById(userId, id);

        return ResponseEntity.ok(cultivar);
    }

    /**
     * Updates an existing cultivar.
     *
     * @param id the cultivar ID
     * @param request the update cultivar request
     * @return the updated cultivar with 200 OK status
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update cultivar", description = "Updates an existing cultivar (must belong to authenticated user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cultivar updated successfully",
                    content = @Content(schema = @Schema(implementation = CultivarResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Cultivar not found")
    })
    public ResponseEntity<CultivarResponse> updateCultivar(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCultivarRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update cultivar ID: {} for user ID: {}", id, userId);

        CultivarResponse cultivar = cultivarService.updateCultivar(userId, id, request);

        return ResponseEntity.ok(cultivar);
    }

    /**
     * Deletes a cultivar.
     * Sets cultivar_id to NULL on any linked plants.
     *
     * @param id the cultivar ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete cultivar", description = "Deletes a cultivar and clears references from plants (must belong to authenticated user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cultivar deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Cultivar not found")
    })
    public ResponseEntity<Void> deleteCultivar(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete cultivar ID: {} for user ID: {}", id, userId);

        cultivarService.deleteCultivar(userId, id);

        return ResponseEntity.noContent().build();
    }

    /**
     * Extracts the user ID from the current security context.
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
            String userIdString = authentication.getName();
            return UUID.fromString(userIdString);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to parse user ID from authentication: {}", authentication.getName());
            throw new IllegalStateException("Invalid user ID in authentication", e);
        }
    }
}
