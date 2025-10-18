package com.growmanager.service;

import com.growmanager.dto.ActivityLogRequestDTO;
import com.growmanager.dto.ActivityLogResponseDTO;
import com.growmanager.entity.ActivityLog;
import com.growmanager.entity.ActivityLog.ActivityType;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.ActivityLogRepository;
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
 * Service for managing activity log operations.
 * Handles CRUD operations for plant training and maintenance activities with ownership validation.
 */
@Service
@Transactional
public class ActivityLogService {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogService.class);

    private final ActivityLogRepository activityLogRepository;
    private final PlantRepository plantRepository;
    private final GrowRepository growRepository;
    private final UserRepository userRepository;

    @Autowired
    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            PlantRepository plantRepository,
            GrowRepository growRepository,
            UserRepository userRepository
    ) {
        this.activityLogRepository = activityLogRepository;
        this.plantRepository = plantRepository;
        this.growRepository = growRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new activity log for a plant.
     * Validates that the plant belongs to the user before creating the log.
     * If applyToAllPlants is true, creates duplicate activity logs for all plants in the same grow.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @param dto the activity log request DTO
     * @return list of created activity log responses (single item if applyToAllPlants is false)
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     * @throws IllegalArgumentException if activity type is invalid
     */
    public List<ActivityLogResponseDTO> createActivityLog(UUID plantId, UUID userId, ActivityLogRequestDTO dto) {
        logger.info("Creating activity log for plant ID: {} and user ID: {}", plantId, userId);

        // Verify plant exists and belongs to user
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create activity log for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Validate and parse activity type
        ActivityType activityType = parseActivityType(dto.getActivityType());

        // Get user entity
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Determine which plants to apply activity log to
        List<Plant> targetPlants;
        if (Boolean.TRUE.equals(dto.getApplyToAllPlants())) {
            // Apply to all plants in the same grow
            targetPlants = plantRepository.findByGrowId(plant.getGrow().getId());
            logger.info("Applying activity log to all {} plants in grow ID: {}",
                    targetPlants.size(), plant.getGrow().getId());
        } else {
            // Apply to single plant only
            targetPlants = List.of(plant);
        }

        // Create activity logs for all target plants
        List<ActivityLog> activityLogs = targetPlants.stream()
                .map(targetPlant -> ActivityLog.builder()
                        .plant(targetPlant)
                        .user(user)
                        .activityType(activityType)
                        .description(dto.getDescription())
                        .notes(dto.getNotes())
                        .loggedAt(dto.getLoggedAt())
                        .build())
                .collect(Collectors.toList());

        // Save all activity logs
        activityLogs = activityLogRepository.saveAll(activityLogs);

        logger.info("Created {} activity log(s) successfully", activityLogs.size());

        return activityLogs.stream()
                .map(ActivityLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets a single activity log by ID.
     * Validates that the activity log's plant belongs to the current user.
     *
     * @param id the ID of the activity log
     * @param userId the ID of the current user
     * @return the activity log response
     * @throws ResourceNotFoundException if activity log not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public ActivityLogResponseDTO getActivityLogById(UUID id, UUID userId) {
        logger.info("Fetching activity log ID: {} for user ID: {}", id, userId);

        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity log not found"));

        // Validate ownership (via plant's grow ownership)
        if (!activityLog.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access activity log {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Activity log not found");
        }

        return ActivityLogResponseDTO.fromEntity(activityLog);
    }

    /**
     * Gets all activity logs for a specific plant.
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @return list of activity log responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getActivityLogsByPlant(UUID plantId, UUID userId) {
        logger.info("Fetching activity logs for plant ID: {} and user ID: {}", plantId, userId);

        // Verify plant exists and belongs to user
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access activity logs for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<ActivityLog> activityLogs = activityLogRepository.findByPlantId(plantId);

        return activityLogs.stream()
                .map(ActivityLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets all activity logs for a specific grow (across all plants in the grow).
     * Validates that the grow belongs to the current user.
     *
     * @param growId the ID of the grow
     * @param userId the ID of the current user
     * @return list of activity log responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getActivityLogsByGrow(UUID growId, UUID userId) {
        logger.info("Fetching activity logs for grow ID: {} and user ID: {}", growId, userId);

        // Verify grow exists and belongs to user
        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access activity logs for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        List<ActivityLog> activityLogs = activityLogRepository.findByGrowId(growId);

        return activityLogs.stream()
                .map(ActivityLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing activity log.
     * Validates that the activity log's plant belongs to the current user.
     *
     * @param id the ID of the activity log to update
     * @param userId the ID of the current user
     * @param dto the update activity log request
     * @return the updated activity log response
     * @throws ResourceNotFoundException if activity log not found or doesn't belong to user
     * @throws IllegalArgumentException if activity type is invalid
     */
    public ActivityLogResponseDTO updateActivityLog(UUID id, UUID userId, ActivityLogRequestDTO dto) {
        logger.info("Updating activity log ID: {} for user ID: {}", id, userId);

        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity log not found"));

        // Validate ownership (via plant's grow ownership)
        if (!activityLog.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update activity log {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Activity log not found");
        }

        // Update fields
        if (dto.getActivityType() != null) {
            ActivityType activityType = parseActivityType(dto.getActivityType());
            activityLog.setActivityType(activityType);
        }
        if (dto.getDescription() != null) {
            activityLog.setDescription(dto.getDescription());
        }
        if (dto.getNotes() != null) {
            activityLog.setNotes(dto.getNotes());
        }
        if (dto.getLoggedAt() != null) {
            activityLog.setLoggedAt(dto.getLoggedAt());
        }

        activityLog = activityLogRepository.save(activityLog);

        logger.info("Activity log updated successfully: {}", id);

        return ActivityLogResponseDTO.fromEntity(activityLog);
    }

    /**
     * Deletes an activity log.
     * Validates that the activity log's plant belongs to the current user.
     *
     * @param id the ID of the activity log to delete
     * @param userId the ID of the current user
     * @throws ResourceNotFoundException if activity log not found or doesn't belong to user
     */
    public void deleteActivityLog(UUID id, UUID userId) {
        logger.info("Deleting activity log ID: {} for user ID: {}", id, userId);

        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity log not found"));

        // Validate ownership (via plant's grow ownership)
        if (!activityLog.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete activity log {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Activity log not found");
        }

        activityLogRepository.delete(activityLog);

        logger.info("Activity log deleted successfully: {}", id);
    }

    /**
     * Gets the most recent activity logs for a plant.
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param limit the maximum number of results to return
     * @param userId the ID of the current user
     * @return list of recent activity log responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getRecentActivityLogs(UUID plantId, int limit, UUID userId) {
        logger.info("Fetching {} recent activity logs for plant ID: {} and user ID: {}",
                limit, plantId, userId);

        // Verify plant exists and belongs to user
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access recent activity logs for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<ActivityLog> activityLogs = activityLogRepository.findRecentByPlantId(plantId, limit);

        return activityLogs.stream()
                .map(ActivityLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets activity logs of a specific type for a plant.
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param activityTypeStr the activity type as a string
     * @param userId the ID of the current user
     * @return list of activity log responses of the specified type
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     * @throws IllegalArgumentException if activity type is invalid
     */
    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getActivityLogsByType(
            UUID plantId, String activityTypeStr, UUID userId) {
        logger.info("Fetching activity logs of type {} for plant ID: {} and user ID: {}",
                activityTypeStr, plantId, userId);

        // Verify plant exists and belongs to user
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access activity logs for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Validate and parse activity type
        ActivityType activityType = parseActivityType(activityTypeStr);

        List<ActivityLog> activityLogs = activityLogRepository.findByPlantIdAndType(plantId, activityType);

        return activityLogs.stream()
                .map(ActivityLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Parses and validates an activity type string.
     * Accepts both lowercase (JSON format) and uppercase (enum format) values.
     *
     * @param activityTypeStr the activity type string
     * @return the parsed ActivityType enum
     * @throws IllegalArgumentException if the activity type is invalid
     */
    private ActivityType parseActivityType(String activityTypeStr) {
        if (activityTypeStr == null || activityTypeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Activity type cannot be null or empty");
        }

        String normalized = activityTypeStr.trim().toUpperCase();

        try {
            return ActivityType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid activity type: {}", activityTypeStr);
            throw new IllegalArgumentException(
                    "Invalid activity type. Must be one of: training, pruning, defoliation, transplant, pest_control, other");
        }
    }
}