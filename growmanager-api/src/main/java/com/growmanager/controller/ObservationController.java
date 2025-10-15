package com.growmanager.controller;

import com.growmanager.dto.CreateObservationRequest;
import com.growmanager.dto.ObservationResponse;
import com.growmanager.dto.UpdateObservationRequest;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.UserRepository;
import com.growmanager.security.UserPrincipal;
import com.growmanager.service.ObservationService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for observation operations.
 * Handles CRUD operations for plant observations with photo support.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Observations", description = "Plant observation management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ObservationController {

    private static final Logger logger = LoggerFactory.getLogger(ObservationController.class);

    private final ObservationService observationService;
    private final UserRepository userRepository;

    public ObservationController(ObservationService observationService, UserRepository userRepository) {
        this.observationService = observationService;
        this.userRepository = userRepository;
    }

    /**
     * Helper method to get the current user from the database.
     */
    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.getId()));
    }

    /**
     * Create a new observation for a plant.
     *
     * @param plantId   the plant ID
     * @param request   the observation data (JSON part)
     * @param photos    optional photo files (multipart)
     * @param principal the authenticated user
     * @return the created observation
     */
    @PostMapping(value = "/plants/{plantId}/observations", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Create observation",
            description = "Create a new observation for a plant with optional photos (max 10)"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Observation created successfully",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid request or too many photos"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Plant not found"),
            @ApiResponse(responseCode = "500", description = "Photo upload failed")
    })
    public ResponseEntity<ObservationResponse> createObservation(
            @PathVariable UUID plantId,
            @Valid @ModelAttribute CreateObservationRequest request,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Create observation request for plant {} by user {}", plantId, principal.getId());

        try {
            ObservationResponse response = observationService.createObservation(
                    plantId,
                    request,
                    photos,
                    getCurrentUser(principal)
            );

            logger.info("Created observation {} for plant {}", response.getId(), plantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            logger.error("Failed to upload photos for observation on plant {}", plantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all observations for a plant.
     *
     * @param plantId   the plant ID
     * @param principal the authenticated user
     * @return list of observations
     */
    @GetMapping("/plants/{plantId}/observations")
    @Operation(
            summary = "Get plant observations",
            description = "Get all observations for a plant, ordered by timestamp (newest first)"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Observations retrieved successfully"
            ),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Plant not found")
    })
    public ResponseEntity<List<ObservationResponse>> getObservationsByPlant(
            @PathVariable UUID plantId,
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get observations for plant {} by user {}", plantId, principal.getId());

        List<ObservationResponse> observations = observationService.getObservationsByPlant(
                plantId,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(observations);
    }

    /**
     * Get a single observation by ID.
     *
     * @param id        the observation ID
     * @param principal the authenticated user
     * @return the observation
     */
    @GetMapping("/observations/{id}")
    @Operation(
            summary = "Get observation",
            description = "Get a single observation by ID"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Observation retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))
            ),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Observation not found")
    })
    public ResponseEntity<ObservationResponse> getObservationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get observation {} by user {}", id, principal.getId());

        ObservationResponse observation = observationService.getObservationById(
                id,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(observation);
    }

    /**
     * Update an existing observation.
     *
     * @param id        the observation ID
     * @param request   the update data (JSON part)
     * @param photos    optional new photos to add (multipart)
     * @param principal the authenticated user
     * @return the updated observation
     */
    @PutMapping(value = "/observations/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Update observation",
            description = "Update an observation. Can add new photos (up to 10 total) or remove existing ones."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Observation updated successfully",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid request or photo limit exceeded"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Observation not found"),
            @ApiResponse(responseCode = "500", description = "Photo upload/deletion failed")
    })
    public ResponseEntity<ObservationResponse> updateObservation(
            @PathVariable UUID id,
            @Valid @ModelAttribute UpdateObservationRequest request,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Update observation {} by user {}", id, principal.getId());

        try {
            ObservationResponse response = observationService.updateObservation(
                    id,
                    request,
                    photos,
                    getCurrentUser(principal)
            );

            logger.info("Updated observation {}", id);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            logger.error("Failed to upload/delete photos for observation {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete an observation and all its photos.
     *
     * @param id        the observation ID
     * @param principal the authenticated user
     * @return no content
     */
    @DeleteMapping("/observations/{id}")
    @Operation(
            summary = "Delete observation",
            description = "Delete an observation and all its photos from S3"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Observation deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Observation not found")
    })
    public ResponseEntity<Void> deleteObservation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Delete observation {} by user {}", id, principal.getId());

        observationService.deleteObservation(
                id,
                getCurrentUser(principal)
        );

        logger.info("Deleted observation {}", id);
        return ResponseEntity.noContent().build();
    }
}