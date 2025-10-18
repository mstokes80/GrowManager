package com.growmanager.controller;

import com.growmanager.dto.CreateHarvestRequest;
import com.growmanager.dto.HarvestResponse;
import com.growmanager.dto.HarvestSummaryResponse;
import com.growmanager.dto.UpdateHarvestRequest;
import com.growmanager.service.HarvestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for harvest management.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Harvests", description = "Harvest management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class HarvestController {

    private static final Logger logger = LoggerFactory.getLogger(HarvestController.class);
    private final HarvestService harvestService;

    /**
     * Create a new harvest for a plant.
     *
     * @param plantId the plant ID
     * @param request the create harvest request
     * @return the created harvest response
     */
    @PostMapping("/plants/{plantId}/harvests")
    @Operation(summary = "Create a harvest", description = "Create a new harvest record for a plant")
    public ResponseEntity<HarvestResponse> createHarvest(
            @PathVariable UUID plantId,
            @Valid @RequestBody CreateHarvestRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Create harvest request for plant ID: {} and user ID: {}", plantId, userId);

        HarvestResponse response = harvestService.createHarvest(plantId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all harvests for a grow.
     *
     * @param growId the grow ID
     * @return list of harvest responses
     */
    @GetMapping("/grows/{growId}/harvests")
    @Operation(summary = "Get harvests for a grow", description = "Get all harvest records for a specific grow")
    public ResponseEntity<List<HarvestResponse>> getHarvestsByGrow(@PathVariable UUID growId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get harvests for grow ID: {} and user ID: {}", growId, userId);

        List<HarvestResponse> harvests = harvestService.getHarvestsByGrow(growId, userId);
        return ResponseEntity.ok(harvests);
    }

    /**
     * Get harvest summary with aggregate statistics for a grow.
     *
     * @param growId the grow ID
     * @return harvest summary response
     */
    @GetMapping("/grows/{growId}/harvests/summary")
    @Operation(summary = "Get harvest summary", description = "Get harvest summary with aggregate statistics for a grow")
    public ResponseEntity<HarvestSummaryResponse> getHarvestSummary(@PathVariable UUID growId) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get harvest summary for grow ID: {} and user ID: {}", growId, userId);

        HarvestSummaryResponse summary = harvestService.getHarvestSummary(growId, userId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get a single harvest by ID.
     *
     * @param id the harvest ID
     * @return the harvest response
     */
    @GetMapping("/harvests/{id}")
    @Operation(summary = "Get a harvest", description = "Get a single harvest by ID")
    public ResponseEntity<HarvestResponse> getHarvestById(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Get harvest ID: {} for user ID: {}", id, userId);

        HarvestResponse harvest = harvestService.getHarvestById(id, userId);
        return ResponseEntity.ok(harvest);
    }

    /**
     * Update an existing harvest.
     *
     * @param id      the harvest ID
     * @param request the update harvest request
     * @return the updated harvest response
     */
    @PutMapping("/harvests/{id}")
    @Operation(summary = "Update a harvest", description = "Update an existing harvest record (dry weight, potency, quality)")
    public ResponseEntity<HarvestResponse> updateHarvest(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHarvestRequest request) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Update harvest ID: {} for user ID: {}", id, userId);

        HarvestResponse updated = harvestService.updateHarvest(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a harvest.
     *
     * @param id the harvest ID
     * @return no content
     */
    @DeleteMapping("/harvests/{id}")
    @Operation(summary = "Delete a harvest", description = "Delete a harvest record")
    public ResponseEntity<Void> deleteHarvest(@PathVariable UUID id) {
        UUID userId = getUserIdFromAuthentication();
        logger.info("Delete harvest ID: {} for user ID: {}", id, userId);

        harvestService.deleteHarvest(id, userId);
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