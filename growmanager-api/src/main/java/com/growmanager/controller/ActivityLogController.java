package com.growmanager.controller;

import com.growmanager.dto.ActivityLogRequestDTO;
import com.growmanager.dto.ActivityLogResponseDTO;
import com.growmanager.service.ActivityLogService;
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
 * REST Controller for activity log management endpoints.
 * Handles CRUD operations for plant training and maintenance activities.
 */
@RestController
@Tag(name = "Activity Logs", description = "Plant activity log management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ActivityLogController {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogController.class);

    private final ActivityLogService activityLogService;

    @Autowired
    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    /**
     * Creates a new activity log for a plant.
     * If applyToAllPlants is true in the request, creates activity logs for all plants in the grow.
     *
     * @param plantId the plant ID
     * @param request the activity log request
     * @return list of created activity logs with 201 CREATED status
     */
    @PostMapping("/api/plants/{plantId}/activity-logs")
    @Operation(summary = "Create activity log",
            description = "Creates a new activity log for a plant (training, pruning, defoliation, transplant, pest control, etc.). If applyToAllPlants is true, creates activity logs for all plants in the same grow.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Activity log(s) created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or activity type"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<ActivityLogResponseDTO>> createActivityLog(
            @PathVariable UUID plantId,
            @Valid @RequestBody ActivityLogRequestDTO request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create activity log request for plant ID: {} and user ID: {} (applyToAll: {})",
                plantId, userId, request.getApplyToAllPlants());

        List<ActivityLogResponseDTO> response = activityLogService.createActivityLog(plantId, userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all activity logs for a plant.
     *
     * @param plantId the plant ID
     * @return list of activity logs with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/activity-logs")
    @Operation(summary = "List activity logs for plant",
            description = "Returns all activity logs for a specific plant, ordered by logged_at descending")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<ActivityLogResponseDTO>> getActivityLogsByPlant(@PathVariable UUID plantId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get activity logs request for plant ID: {} and user ID: {}", plantId, userId);

        List<ActivityLogResponseDTO> activityLogs = activityLogService.getActivityLogsByPlant(plantId, userId);

        return ResponseEntity.ok(activityLogs);
    }

    /**
     * Gets a single activity log by ID.
     *
     * @param id the activity log ID
     * @return the activity log with 200 OK status
     */
    @GetMapping("/api/activity-logs/{id}")
    @Operation(summary = "Get activity log by ID",
            description = "Returns a single activity log by ID (must belong to authenticated user's plant)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity log retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ActivityLogResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the activity log"),
            @ApiResponse(responseCode = "404", description = "Activity log not found")
    })
    public ResponseEntity<ActivityLogResponseDTO> getActivityLogById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get activity log ID: {} for user ID: {}", id, userId);

        ActivityLogResponseDTO activityLog = activityLogService.getActivityLogById(id, userId);

        return ResponseEntity.ok(activityLog);
    }

    /**
     * Updates an existing activity log.
     *
     * @param id the activity log ID
     * @param request the update activity log request
     * @return the updated activity log with 200 OK status
     */
    @PutMapping("/api/activity-logs/{id}")
    @Operation(summary = "Update activity log",
            description = "Updates an existing activity log (must belong to authenticated user's plant)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity log updated successfully",
                    content = @Content(schema = @Schema(implementation = ActivityLogResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or activity type"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the activity log"),
            @ApiResponse(responseCode = "404", description = "Activity log not found")
    })
    public ResponseEntity<ActivityLogResponseDTO> updateActivityLog(
            @PathVariable UUID id,
            @Valid @RequestBody ActivityLogRequestDTO request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update activity log ID: {} for user ID: {}", id, userId);

        ActivityLogResponseDTO activityLog = activityLogService.updateActivityLog(id, userId, request);

        return ResponseEntity.ok(activityLog);
    }

    /**
     * Deletes an activity log.
     *
     * @param id the activity log ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/api/activity-logs/{id}")
    @Operation(summary = "Delete activity log",
            description = "Deletes an activity log (must belong to authenticated user's plant)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Activity log deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the activity log"),
            @ApiResponse(responseCode = "404", description = "Activity log not found")
    })
    public ResponseEntity<Void> deleteActivityLog(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete activity log ID: {} for user ID: {}", id, userId);

        activityLogService.deleteActivityLog(id, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Gets recent activity logs for a plant.
     *
     * @param plantId the plant ID
     * @param limit the maximum number of results (default 10)
     * @return list of recent activity logs with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/activity-logs/recent")
    @Operation(summary = "Get recent activity logs",
            description = "Returns the most recent activity logs for a plant, limited by the specified count")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recent activity logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<ActivityLogResponseDTO>> getRecentActivityLogs(
            @PathVariable UUID plantId,
            @RequestParam(defaultValue = "10") int limit) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get {} recent activity logs for plant ID: {} and user ID: {}", limit, plantId, userId);

        List<ActivityLogResponseDTO> activityLogs = activityLogService.getRecentActivityLogs(plantId, limit, userId);

        return ResponseEntity.ok(activityLogs);
    }

    /**
     * Gets all activity logs for a grow (across all plants).
     *
     * @param growId the grow ID
     * @return list of activity logs with 200 OK status
     */
    @GetMapping("/api/grows/{growId}/activity-logs")
    @Operation(summary = "List activity logs for grow",
            description = "Returns all activity logs across all plants in a grow, ordered by logged_at descending")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the grow"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<List<ActivityLogResponseDTO>> getActivityLogsByGrow(@PathVariable UUID growId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get activity logs for grow ID: {} and user ID: {}", growId, userId);

        List<ActivityLogResponseDTO> activityLogs = activityLogService.getActivityLogsByGrow(growId, userId);

        return ResponseEntity.ok(activityLogs);
    }

    /**
     * Gets activity logs of a specific type for a plant.
     *
     * @param plantId the plant ID
     * @param activityType the activity type (training, pruning, defoliation, transplant, pest_control, other)
     * @return list of activity logs of the specified type with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/activity-logs/type/{activityType}")
    @Operation(summary = "Get activity logs by type",
            description = "Returns all activity logs of a specific type for a plant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity logs retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid activity type"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<ActivityLogResponseDTO>> getActivityLogsByType(
            @PathVariable UUID plantId,
            @PathVariable String activityType) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get activity logs of type {} for plant ID: {} and user ID: {}",
                activityType, plantId, userId);

        List<ActivityLogResponseDTO> activityLogs =
                activityLogService.getActivityLogsByType(plantId, activityType, userId);

        return ResponseEntity.ok(activityLogs);
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