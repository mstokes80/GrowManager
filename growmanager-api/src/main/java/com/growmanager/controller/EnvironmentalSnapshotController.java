package com.growmanager.controller;

import com.growmanager.dto.CreateEnvironmentalSnapshotRequest;
import com.growmanager.dto.EnvironmentalSnapshotResponse;
import com.growmanager.service.EnvironmentalSnapshotService;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for environmental snapshot management endpoints.
 * Handles CRUD operations for environmental condition measurements.
 */
@RestController
@Tag(name = "Environmental Data", description = "Environmental condition tracking endpoints")
@SecurityRequirement(name = "bearerAuth")
public class EnvironmentalSnapshotController {

    private static final Logger logger = LoggerFactory.getLogger(EnvironmentalSnapshotController.class);

    private final EnvironmentalSnapshotService snapshotService;

    @Autowired
    public EnvironmentalSnapshotController(EnvironmentalSnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }

    /**
     * Creates a new environmental snapshot for a grow.
     * Auto-calculates VPD when temperature and humidity are provided.
     *
     * @param growId the grow ID
     * @param request the create environmental snapshot request
     * @return the created snapshot with 201 CREATED status
     */
    @PostMapping("/api/grows/{growId}/environmental")
    @Operation(summary = "Create environmental snapshot for grow",
            description = "Creates a new environmental snapshot for a grow. Auto-calculates VPD when temp and humidity provided. Enforces 4-hour minimum between readings.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Environmental snapshot created successfully",
                    content = @Content(schema = @Schema(implementation = EnvironmentalSnapshotResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or minimum interval not met"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<EnvironmentalSnapshotResponse> createSnapshotForGrow(
            @PathVariable UUID growId,
            @Valid @RequestBody CreateEnvironmentalSnapshotRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create environmental snapshot for grow ID: {} and user ID: {}", growId, userId);

        EnvironmentalSnapshotResponse response = snapshotService.createSnapshotForGrow(userId, growId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Creates a new environmental snapshot for a plant.
     * Auto-calculates VPD when temperature and humidity are provided.
     *
     * @param plantId the plant ID
     * @param request the create environmental snapshot request
     * @return the created snapshot with 201 CREATED status
     */
    @PostMapping("/api/plants/{plantId}/environmental")
    @Operation(summary = "Create environmental snapshot for plant",
            description = "Creates a new environmental snapshot for a plant. Auto-calculates VPD when temp and humidity provided. Enforces 4-hour minimum between readings.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Environmental snapshot created successfully",
                    content = @Content(schema = @Schema(implementation = EnvironmentalSnapshotResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or minimum interval not met"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<EnvironmentalSnapshotResponse> createSnapshotForPlant(
            @PathVariable UUID plantId,
            @Valid @RequestBody CreateEnvironmentalSnapshotRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create environmental snapshot for plant ID: {} and user ID: {}", plantId, userId);

        EnvironmentalSnapshotResponse response = snapshotService.createSnapshotForPlant(userId, plantId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all environmental snapshots for a grow.
     * Optionally filters by date range.
     *
     * @param growId the grow ID
     * @param startDate the optional start date filter (ISO 8601 format)
     * @param endDate the optional end date filter (ISO 8601 format)
     * @return list of environmental snapshots with 200 OK status
     */
    @GetMapping("/api/grows/{growId}/environmental")
    @Operation(summary = "List environmental snapshots for grow",
            description = "Returns all environmental snapshots for a grow, optionally filtered by date range")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Environmental snapshots retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<List<EnvironmentalSnapshotResponse>> getSnapshotsByGrow(
            @PathVariable UUID growId,
            @Parameter(description = "Start date filter (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date filter (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get environmental snapshots for grow ID: {} and user ID: {}", growId, userId);

        List<EnvironmentalSnapshotResponse> snapshots = snapshotService.getSnapshotsByGrow(
                userId, growId, startDate, endDate);

        return ResponseEntity.ok(snapshots);
    }

    /**
     * Gets all environmental snapshots for a plant.
     *
     * @param plantId the plant ID
     * @return list of environmental snapshots with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/environmental")
    @Operation(summary = "List environmental snapshots for plant",
            description = "Returns all environmental snapshots for a specific plant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Environmental snapshots retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<EnvironmentalSnapshotResponse>> getSnapshotsByPlant(@PathVariable UUID plantId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get environmental snapshots for plant ID: {} and user ID: {}", plantId, userId);

        List<EnvironmentalSnapshotResponse> snapshots = snapshotService.getSnapshotsByPlant(userId, plantId);

        return ResponseEntity.ok(snapshots);
    }

    /**
     * Deletes an environmental snapshot.
     *
     * @param id the snapshot ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/api/environmental/{id}")
    @Operation(summary = "Delete environmental snapshot",
            description = "Deletes an environmental snapshot (must belong to authenticated user's grow)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Environmental snapshot deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Environmental snapshot not found")
    })
    public ResponseEntity<Void> deleteSnapshot(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete environmental snapshot ID: {} for user ID: {}", id, userId);

        snapshotService.deleteSnapshot(userId, id);

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
