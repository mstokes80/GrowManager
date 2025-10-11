package com.growmanager.controller;

import com.growmanager.dto.CreateGrowRequest;
import com.growmanager.dto.GrowResponse;
import com.growmanager.dto.UpdateGrowRequest;
import com.growmanager.entity.Grow.GrowStatus;
import com.growmanager.service.GrowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
 * REST Controller for grow management endpoints.
 * Handles CRUD operations for cultivation cycles/grows.
 */
@RestController
@RequestMapping("/api/grows")
@Tag(name = "Grows", description = "Grow cycle management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class GrowController {

    private static final Logger logger = LoggerFactory.getLogger(GrowController.class);

    private final GrowService growService;

    @Autowired
    public GrowController(GrowService growService) {
        this.growService = growService;
    }

    /**
     * Creates a new grow for the current user.
     *
     * @param request the create grow request
     * @return the created grow with 201 CREATED status
     */
    @PostMapping
    @Operation(summary = "Create new grow", description = "Creates a new cultivation cycle/grow for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Grow created successfully",
                    content = @Content(schema = @Schema(implementation = GrowResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<GrowResponse> createGrow(@Valid @RequestBody CreateGrowRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create grow request for user ID: {}", userId);

        GrowResponse response = growService.createGrow(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all grows for the current user.
     * Can optionally filter by status.
     *
     * @param status the optional status filter
     * @return list of grows with 200 OK status
     */
    @GetMapping
    @Operation(summary = "List all grows", description = "Returns all grows belonging to the authenticated user, optionally filtered by status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grows retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<List<GrowResponse>> getGrows(
            @Parameter(description = "Filter by grow status")
            @RequestParam(required = false) GrowStatus status) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get grows request for user ID: {} with status: {}", userId, status);

        List<GrowResponse> grows = growService.getGrowsByUser(userId, status);

        return ResponseEntity.ok(grows);
    }

    /**
     * Gets a single grow by ID with plant count.
     *
     * @param id the grow ID
     * @return the grow with 200 OK status
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get grow by ID", description = "Returns a single grow by ID with plant count (must belong to authenticated user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grow retrieved successfully",
                    content = @Content(schema = @Schema(implementation = GrowResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<GrowResponse> getGrowById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get grow ID: {} for user ID: {}", id, userId);

        GrowResponse grow = growService.getGrowById(userId, id);

        return ResponseEntity.ok(grow);
    }

    /**
     * Updates an existing grow.
     * Note: start_date cannot be updated.
     *
     * @param id the grow ID
     * @param request the update grow request
     * @return the updated grow with 200 OK status
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update grow", description = "Updates an existing grow (must belong to authenticated user). Note: start_date cannot be updated.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grow updated successfully",
                    content = @Content(schema = @Schema(implementation = GrowResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<GrowResponse> updateGrow(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGrowRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update grow ID: {} for user ID: {}", id, userId);

        GrowResponse grow = growService.updateGrow(userId, id, request);

        return ResponseEntity.ok(grow);
    }

    /**
     * Archives a grow by setting its status to COMPLETED.
     *
     * @param id the grow ID
     * @return the archived grow with 200 OK status
     */
    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive grow", description = "Archives a grow by setting its status to COMPLETED")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grow archived successfully",
                    content = @Content(schema = @Schema(implementation = GrowResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<GrowResponse> archiveGrow(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Archive grow ID: {} for user ID: {}", id, userId);

        GrowResponse grow = growService.archiveGrow(userId, id);

        return ResponseEntity.ok(grow);
    }

    /**
     * Unarchives a grow by setting its status back to ACTIVE.
     *
     * @param id the grow ID
     * @return the unarchived grow with 200 OK status
     */
    @PostMapping("/{id}/unarchive")
    @Operation(summary = "Unarchive grow", description = "Restores an archived grow by setting its status to ACTIVE")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grow unarchived successfully",
                    content = @Content(schema = @Schema(implementation = GrowResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<GrowResponse> unarchiveGrow(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Unarchive grow ID: {} for user ID: {}", id, userId);

        GrowResponse grow = growService.unarchiveGrow(userId, id);

        return ResponseEntity.ok(grow);
    }

    /**
     * Deletes a grow and all associated plants.
     *
     * @param id the grow ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete grow", description = "Deletes a grow and all associated plants (must belong to authenticated user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Grow deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<Void> deleteGrow(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete grow ID: {} for user ID: {}", id, userId);

        growService.deleteGrow(userId, id);

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

        Object principal = authentication.getPrincipal();
        if (principal instanceof com.growmanager.security.UserPrincipal) {
            return ((com.growmanager.security.UserPrincipal) principal).getId();
        }

        logger.error("Invalid principal type in authentication: {}", principal.getClass().getName());
        throw new IllegalStateException("Invalid authentication principal type");
    }
}
