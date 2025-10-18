package com.growmanager.controller;

import com.growmanager.dto.FeedingEventRequestDTO;
import com.growmanager.dto.FeedingEventResponseDTO;
import com.growmanager.service.FeedingEventService;
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
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for feeding event management endpoints.
 * Handles CRUD operations for feeding and watering events.
 */
@RestController
@Tag(name = "Feeding Events", description = "Feeding and watering event management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class FeedingEventController {

    private static final Logger logger = LoggerFactory.getLogger(FeedingEventController.class);

    private final FeedingEventService feedingEventService;

    @Autowired
    public FeedingEventController(FeedingEventService feedingEventService) {
        this.feedingEventService = feedingEventService;
    }

    /**
     * Creates a new feeding event for a plant.
     * If applyToAllPlants is true in the request, creates events for all plants in the grow.
     *
     * @param plantId the plant ID
     * @param request the feeding event request
     * @return list of created feeding events with 201 CREATED status
     */
    @PostMapping("/api/plants/{plantId}/feeding-events")
    @Operation(summary = "Create feeding event",
               description = "Creates a new feeding event for a plant. If applyToAllPlants is true, creates events for all plants in the same grow.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Feeding event(s) created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<FeedingEventResponseDTO>> createFeedingEvent(
            @PathVariable UUID plantId,
            @Valid @RequestBody FeedingEventRequestDTO request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create feeding event request for plant ID: {} and user ID: {} (applyToAll: {})",
                plantId, userId, request.getApplyToAllPlants());

        List<FeedingEventResponseDTO> response = feedingEventService.createFeedingEvent(plantId, userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all feeding events for a plant.
     *
     * @param plantId the plant ID
     * @return list of feeding events with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/feeding-events")
    @Operation(summary = "List feeding events for plant", description = "Returns all feeding events for a specific plant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feeding events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<FeedingEventResponseDTO>> getFeedingEventsByPlant(@PathVariable UUID plantId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get feeding events request for plant ID: {} and user ID: {}", plantId, userId);

        List<FeedingEventResponseDTO> feedingEvents = feedingEventService.getFeedingEventsByPlant(plantId, userId);

        return ResponseEntity.ok(feedingEvents);
    }

    /**
     * Gets a single feeding event by ID.
     *
     * @param id the feeding event ID
     * @return the feeding event with 200 OK status
     */
    @GetMapping("/api/feeding-events/{id}")
    @Operation(summary = "Get feeding event by ID", description = "Returns a single feeding event by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feeding event retrieved successfully",
                    content = @Content(schema = @Schema(implementation = FeedingEventResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the feeding event"),
            @ApiResponse(responseCode = "404", description = "Feeding event not found")
    })
    public ResponseEntity<FeedingEventResponseDTO> getFeedingEventById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get feeding event ID: {} for user ID: {}", id, userId);

        FeedingEventResponseDTO feedingEvent = feedingEventService.getFeedingEventById(id, userId);

        return ResponseEntity.ok(feedingEvent);
    }

    /**
     * Updates an existing feeding event.
     *
     * @param id the feeding event ID
     * @param request the feeding event update request
     * @return the updated feeding event with 200 OK status
     */
    @PutMapping("/api/feeding-events/{id}")
    @Operation(summary = "Update feeding event", description = "Updates an existing feeding event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feeding event updated successfully",
                    content = @Content(schema = @Schema(implementation = FeedingEventResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the feeding event"),
            @ApiResponse(responseCode = "404", description = "Feeding event not found")
    })
    public ResponseEntity<FeedingEventResponseDTO> updateFeedingEvent(
            @PathVariable UUID id,
            @Valid @RequestBody FeedingEventRequestDTO request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update feeding event ID: {} for user ID: {}", id, userId);

        FeedingEventResponseDTO feedingEvent = feedingEventService.updateFeedingEvent(id, userId, request);

        return ResponseEntity.ok(feedingEvent);
    }

    /**
     * Deletes a feeding event.
     *
     * @param id the feeding event ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/api/feeding-events/{id}")
    @Operation(summary = "Delete feeding event", description = "Deletes a feeding event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Feeding event deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the feeding event"),
            @ApiResponse(responseCode = "404", description = "Feeding event not found")
    })
    public ResponseEntity<Void> deleteFeedingEvent(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete feeding event ID: {} for user ID: {}", id, userId);

        feedingEventService.deleteFeedingEvent(id, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Gets recent feeding events for a plant (last N records).
     *
     * @param plantId the plant ID
     * @param limit the maximum number of results (default: 10)
     * @return list of recent feeding events with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/feeding-events/recent")
    @Operation(summary = "Get recent feeding events", description = "Returns the most recent feeding events for a plant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recent feeding events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<FeedingEventResponseDTO>> getRecentFeedingEvents(
            @PathVariable UUID plantId,
            @RequestParam(defaultValue = "10") int limit) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get {} recent feeding events for plant ID: {} and user ID: {}",
                limit, plantId, userId);

        List<FeedingEventResponseDTO> feedingEvents = feedingEventService.getRecentFeedingEvents(plantId, userId, limit);

        return ResponseEntity.ok(feedingEvents);
    }

    /**
     * Gets feeding statistics for a plant.
     *
     * @param plantId the plant ID
     * @return feeding statistics with 200 OK status
     */
    @GetMapping("/api/plants/{plantId}/feeding-events/stats")
    @Operation(summary = "Get feeding statistics", description = "Returns feeding statistics for a plant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feeding statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the plant"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<Map<String, Object>> getFeedingStatistics(@PathVariable UUID plantId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get feeding statistics for plant ID: {} and user ID: {}", plantId, userId);

        Map<String, Object> statistics = feedingEventService.getFeedingStatistics(plantId, userId);

        return ResponseEntity.ok(statistics);
    }

    /**
     * Gets all feeding events for a grow (across all plants).
     *
     * @param growId the grow ID
     * @return list of feeding events with 200 OK status
     */
    @GetMapping("/api/grows/{growId}/feeding-events")
    @Operation(summary = "List feeding events for grow", description = "Returns all feeding events for a specific grow")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feeding events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - user does not own the grow"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<List<FeedingEventResponseDTO>> getFeedingEventsByGrow(@PathVariable UUID growId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get feeding events request for grow ID: {} and user ID: {}", growId, userId);

        List<FeedingEventResponseDTO> feedingEvents = feedingEventService.getFeedingEventsByGrow(growId, userId);

        return ResponseEntity.ok(feedingEvents);
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