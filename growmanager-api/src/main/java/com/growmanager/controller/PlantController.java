package com.growmanager.controller;

import com.growmanager.dto.CreatePlantRequest;
import com.growmanager.dto.PlantResponse;
import com.growmanager.dto.UpdatePlantRequest;
import com.growmanager.service.PlantService;
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
 * REST Controller for plant management endpoints.
 * Handles CRUD operations for individual plants within grows.
 */
@RestController
@Tag(name = "Plants", description = "Plant management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PlantController {

    private static final Logger logger = LoggerFactory.getLogger(PlantController.class);

    private final PlantService plantService;

    @Autowired
    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    /**
     * Creates a new plant for a grow.
     * Auto-generates plant tag if not provided.
     *
     * @param growId the grow ID
     * @param request the create plant request
     * @return the created plant with 201 CREATED status
     */
    @PostMapping("/api/grows/{growId}/plants")
    @Operation(summary = "Create new plant", description = "Creates a new plant for a grow. Auto-generates tag (e.g., 'Plant 1') if not provided.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Plant created successfully",
                    content = @Content(schema = @Schema(implementation = PlantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found"),
            @ApiResponse(responseCode = "409", description = "Plant tag already exists in grow")
    })
    public ResponseEntity<PlantResponse> createPlant(
            @PathVariable UUID growId,
            @Valid @RequestBody CreatePlantRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create plant request for grow ID: {} and user ID: {}", growId, userId);

        PlantResponse response = plantService.createPlant(userId, growId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Gets all plants for the authenticated user across all grows.
     *
     * @return list of all user's plants with 200 OK status
     */
    @GetMapping("/api/plants")
    @Operation(summary = "List all user plants", description = "Returns all plants for the authenticated user across all grows")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plants retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<List<PlantResponse>> getAllUserPlants() {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get all plants request for user ID: {}", userId);

        List<PlantResponse> plants = plantService.getAllUserPlants(userId);

        return ResponseEntity.ok(plants);
    }

    /**
     * Gets all plants for a grow.
     *
     * @param growId the grow ID
     * @return list of plants with 200 OK status
     */
    @GetMapping("/api/grows/{growId}/plants")
    @Operation(summary = "List plants for grow", description = "Returns all plants for a specific grow")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plants retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<List<PlantResponse>> getPlantsByGrow(@PathVariable UUID growId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get plants request for grow ID: {} and user ID: {}", growId, userId);

        List<PlantResponse> plants = plantService.getPlantsByGrow(userId, growId);

        return ResponseEntity.ok(plants);
    }

    /**
     * Gets a single plant by ID.
     *
     * @param id the plant ID
     * @return the plant with 200 OK status
     */
    @GetMapping("/api/plants/{id}")
    @Operation(summary = "Get plant by ID", description = "Returns a single plant by ID (must belong to authenticated user's grow)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plant retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PlantResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<PlantResponse> getPlantById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get plant ID: {} for user ID: {}", id, userId);

        PlantResponse plant = plantService.getPlantById(userId, id);

        return ResponseEntity.ok(plant);
    }

    /**
     * Updates an existing plant.
     *
     * @param id the plant ID
     * @param request the update plant request
     * @return the updated plant with 200 OK status
     */
    @PutMapping("/api/plants/{id}")
    @Operation(summary = "Update plant", description = "Updates an existing plant (must belong to authenticated user's grow)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plant updated successfully",
                    content = @Content(schema = @Schema(implementation = PlantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Plant not found"),
            @ApiResponse(responseCode = "409", description = "Plant tag already exists in grow")
    })
    public ResponseEntity<PlantResponse> updatePlant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePlantRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update plant ID: {} for user ID: {}", id, userId);

        PlantResponse plant = plantService.updatePlant(userId, id, request);

        return ResponseEntity.ok(plant);
    }

    /**
     * Deletes a plant.
     *
     * @param id the plant ID
     * @return 204 NO CONTENT status
     */
    @DeleteMapping("/api/plants/{id}")
    @Operation(summary = "Delete plant", description = "Deletes a plant (must belong to authenticated user's grow)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Plant deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "403", description = "Email not verified"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<Void> deletePlant(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete plant ID: {} for user ID: {}", id, userId);

        plantService.deletePlant(userId, id);

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
