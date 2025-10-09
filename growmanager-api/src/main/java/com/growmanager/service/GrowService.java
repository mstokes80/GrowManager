package com.growmanager.service;

import com.growmanager.dto.CreateGrowRequest;
import com.growmanager.dto.GrowResponse;
import com.growmanager.dto.UpdateGrowRequest;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Grow.GrowStatus;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.GrowRepository;
import com.growmanager.repository.PlantRepository;
import com.growmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing grow operations.
 * Handles CRUD operations for grows with ownership validation.
 */
@Service
@Transactional
public class GrowService {

    private static final Logger logger = LoggerFactory.getLogger(GrowService.class);

    private final GrowRepository growRepository;
    private final UserRepository userRepository;
    private final PlantRepository plantRepository;

    @Autowired
    public GrowService(
            GrowRepository growRepository,
            UserRepository userRepository,
            PlantRepository plantRepository
    ) {
        this.growRepository = growRepository;
        this.userRepository = userRepository;
        this.plantRepository = plantRepository;
    }

    /**
     * Creates a new grow for the current user.
     *
     * @param userId the ID of the current user
     * @param request the create grow request
     * @return the created grow response
     * @throws ResourceNotFoundException if user not found
     */
    public GrowResponse createGrow(UUID userId, CreateGrowRequest request) {
        logger.info("Creating grow for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Grow grow = Grow.builder()
                .user(user)
                .name(request.getName())
                .startDate(request.getStartDate())
                .environmentType(request.getEnvironmentType())
                .notes(request.getNotes())
                .status(GrowStatus.PLANNING)
                .build();

        grow = growRepository.save(grow);

        logger.info("Grow created successfully with ID: {}", grow.getId());

        return GrowResponse.fromEntity(grow);
    }

    /**
     * Gets all grows for the current user.
     * Can optionally filter by status.
     *
     * @param userId the ID of the current user
     * @param status the optional status filter
     * @return list of grow responses
     */
    @Transactional(readOnly = true)
    public List<GrowResponse> getGrowsByUser(UUID userId, GrowStatus status) {
        logger.info("Fetching grows for user ID: {} with status filter: {}", userId, status);

        List<Grow> grows;
        if (status != null) {
            grows = growRepository.findByUserIdAndStatus(userId, status);
        } else {
            grows = growRepository.findByUserId(userId);
        }

        return grows.stream()
                .map(GrowResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets a single grow by ID with plant count.
     * Validates that the grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @return the grow response with plant count
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public GrowResponse getGrowById(UUID userId, UUID growId) {
        logger.info("Fetching grow ID: {} for user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Get plant count for this grow
        long plantCount = plantRepository.countByGrowId(growId);

        return GrowResponse.fromEntityWithPlantCount(grow, plantCount);
    }

    /**
     * Updates an existing grow.
     * Validates that the grow belongs to the current user.
     * Note: start_date cannot be updated.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow to update
     * @param request the update grow request
     * @return the updated grow response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    public GrowResponse updateGrow(UUID userId, UUID growId, UpdateGrowRequest request) {
        logger.info("Updating grow ID: {} for user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Update fields if provided (except start_date)
        if (request.getName() != null) {
            grow.setName(request.getName());
        }
        if (request.getEndDate() != null) {
            grow.setEndDate(request.getEndDate());
        }
        if (request.getStatus() != null) {
            grow.setStatus(request.getStatus());
        }
        if (request.getEnvironmentType() != null) {
            grow.setEnvironmentType(request.getEnvironmentType());
        }
        if (request.getNotes() != null) {
            grow.setNotes(request.getNotes());
        }

        grow = growRepository.save(grow);

        logger.info("Grow updated successfully: {}", growId);

        return GrowResponse.fromEntity(grow);
    }

    /**
     * Archives a grow by setting its status to COMPLETED.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow to archive
     * @return the archived grow response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    public GrowResponse archiveGrow(UUID userId, UUID growId) {
        logger.info("Archiving grow ID: {} for user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to archive grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        grow.setStatus(GrowStatus.COMPLETED);
        if (grow.getEndDate() == null) {
            grow.setEndDate(java.time.LocalDate.now());
        }

        grow = growRepository.save(grow);

        logger.info("Grow archived successfully: {}", growId);

        return GrowResponse.fromEntity(grow);
    }

    /**
     * Unarchives a grow by setting its status back to ACTIVE.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow to unarchive
     * @return the unarchived grow response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    public GrowResponse unarchiveGrow(UUID userId, UUID growId) {
        logger.info("Unarchiving grow ID: {} for user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to unarchive grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        grow.setStatus(GrowStatus.ACTIVE);
        grow.setEndDate(null);

        grow = growRepository.save(grow);

        logger.info("Grow unarchived successfully: {}", growId);

        return GrowResponse.fromEntity(grow);
    }

    /**
     * Deletes a grow and all associated plants.
     * Validates that the grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow to delete
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    public void deleteGrow(UUID userId, UUID growId) {
        logger.info("Deleting grow ID: {} for user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Check plant count for logging
        long plantCount = plantRepository.countByGrowId(growId);
        if (plantCount > 0) {
            logger.info("Deleting grow {} with {} plants. Plants will be deleted via cascade.",
                    growId, plantCount);
        }

        growRepository.delete(grow);

        logger.info("Grow deleted successfully: {}", growId);
    }
}
