package com.growmanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.growmanager.dto.AmendmentDTO;
import com.growmanager.dto.FeedingEventRequestDTO;
import com.growmanager.dto.FeedingEventResponseDTO;
import com.growmanager.entity.FeedingEvent;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.FeedingEventRepository;
import com.growmanager.repository.PlantRepository;
import com.growmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing feeding event operations.
 * Handles CRUD operations for feeding events with ownership validation.
 */
@Service
@Transactional
public class FeedingEventService {

    private static final Logger logger = LoggerFactory.getLogger(FeedingEventService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final FeedingEventRepository feedingEventRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;

    @Autowired
    public FeedingEventService(
            FeedingEventRepository feedingEventRepository,
            PlantRepository plantRepository,
            UserRepository userRepository
    ) {
        this.feedingEventRepository = feedingEventRepository;
        this.plantRepository = plantRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new feeding event for a plant.
     * Validates that the plant belongs to the current user.
     * If applyToAllPlants is true, creates duplicate events for all plants in the same grow.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @param dto the feeding event request DTO
     * @return list of created feeding event responses (single item if applyToAllPlants is false)
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    public List<FeedingEventResponseDTO> createFeedingEvent(UUID plantId, UUID userId, FeedingEventRequestDTO dto) {
        logger.info("Creating feeding event for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (user owns the plant via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create feeding event for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Parse feeding type from lowercase string to enum
        FeedingEvent.FeedingType feedingType = parseFeedingType(dto.getFeedingType());

        // Serialize amendments to JSON
        String amendmentsJson = serializeAmendments(dto.getAmendments());

        // Determine which plants to apply feeding event to
        List<Plant> targetPlants;
        if (Boolean.TRUE.equals(dto.getApplyToAllPlants())) {
            // Apply to all plants in the same grow
            targetPlants = plantRepository.findByGrowId(plant.getGrow().getId());
            logger.info("Applying feeding event to all {} plants in grow ID: {}",
                    targetPlants.size(), plant.getGrow().getId());
        } else {
            // Apply to single plant only
            targetPlants = List.of(plant);
        }

        // Create feeding events for all target plants
        List<FeedingEvent> feedingEvents = targetPlants.stream()
                .map(targetPlant -> FeedingEvent.builder()
                        .plant(targetPlant)
                        .user(user)
                        .feedingType(feedingType)
                        .amountMl(dto.getAmountMl())
                        .ecLevel(dto.getEcLevel())
                        .phLevel(dto.getPhLevel())
                        .nutrientMix(dto.getNutrientMix())
                        .notes(dto.getNotes())
                        .amendments(amendmentsJson)
                        .fedAt(dto.getFedAt() != null ? dto.getFedAt() : LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());

        // Save all feeding events
        feedingEvents = feedingEventRepository.saveAll(feedingEvents);

        logger.info("Created {} feeding event(s) successfully", feedingEvents.size());

        return feedingEvents.stream()
                .map(FeedingEventResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets a single feeding event by ID.
     * Validates that the feeding event's plant belongs to the current user.
     *
     * @param id the feeding event ID
     * @param userId the ID of the current user
     * @return the feeding event response
     * @throws ResourceNotFoundException if feeding event not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public FeedingEventResponseDTO getFeedingEventById(UUID id, UUID userId) {
        logger.info("Fetching feeding event ID: {} for user ID: {}", id, userId);

        FeedingEvent feedingEvent = feedingEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding event not found"));

        // Validate ownership (via plant's grow ownership)
        if (!feedingEvent.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access feeding event {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Feeding event not found");
        }

        return FeedingEventResponseDTO.fromEntity(feedingEvent);
    }

    /**
     * Gets all feeding events for a plant.
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @return list of feeding event responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<FeedingEventResponseDTO> getFeedingEventsByPlant(UUID plantId, UUID userId) {
        logger.info("Fetching feeding events for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access feeding events for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<FeedingEvent> feedingEvents = feedingEventRepository.findByPlantId(plantId);

        return feedingEvents.stream()
                .map(FeedingEventResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets all feeding events for a grow (across all plants).
     * Validates that the grow belongs to the current user.
     *
     * @param growId the ID of the grow
     * @param userId the ID of the current user
     * @return list of feeding event responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<FeedingEventResponseDTO> getFeedingEventsByGrow(UUID growId, UUID userId) {
        logger.info("Fetching feeding events for grow ID: {} and user ID: {}", growId, userId);

        // Validate grow ownership by checking any plant in the grow
        List<FeedingEvent> feedingEvents = feedingEventRepository.findByGrowId(growId);

        // If no events found, validate grow exists and belongs to user by checking plants
        if (feedingEvents.isEmpty()) {
            List<Plant> plants = plantRepository.findByGrowId(growId);
            if (plants.isEmpty() || !plants.get(0).getGrow().getUser().getId().equals(userId)) {
                logger.warn("User {} attempted to access feeding events for grow {} owned by different user",
                        userId, growId);
                throw new ResourceNotFoundException("Grow not found");
            }
        } else {
            // Validate ownership via first feeding event's plant
            if (!feedingEvents.get(0).getPlant().getGrow().getUser().getId().equals(userId)) {
                logger.warn("User {} attempted to access feeding events for grow {} owned by different user",
                        userId, growId);
                throw new ResourceNotFoundException("Grow not found");
            }
        }

        return feedingEvents.stream()
                .map(FeedingEventResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing feeding event.
     * Validates that the feeding event's plant belongs to the current user.
     *
     * @param id the feeding event ID
     * @param userId the ID of the current user
     * @param dto the feeding event request DTO
     * @return the updated feeding event response
     * @throws ResourceNotFoundException if feeding event not found or doesn't belong to user
     */
    public FeedingEventResponseDTO updateFeedingEvent(UUID id, UUID userId, FeedingEventRequestDTO dto) {
        logger.info("Updating feeding event ID: {} for user ID: {}", id, userId);

        FeedingEvent feedingEvent = feedingEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding event not found"));

        // Validate ownership (via plant's grow ownership)
        if (!feedingEvent.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update feeding event {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Feeding event not found");
        }

        // Update fields
        if (dto.getFeedingType() != null) {
            feedingEvent.setFeedingType(parseFeedingType(dto.getFeedingType()));
        }
        if (dto.getAmountMl() != null) {
            feedingEvent.setAmountMl(dto.getAmountMl());
        }
        if (dto.getEcLevel() != null) {
            feedingEvent.setEcLevel(dto.getEcLevel());
        }
        if (dto.getPhLevel() != null) {
            feedingEvent.setPhLevel(dto.getPhLevel());
        }
        if (dto.getNutrientMix() != null) {
            feedingEvent.setNutrientMix(dto.getNutrientMix());
        }
        if (dto.getNotes() != null) {
            feedingEvent.setNotes(dto.getNotes());
        }
        if (dto.getFedAt() != null) {
            feedingEvent.setFedAt(dto.getFedAt());
        }
        if (dto.getAmendments() != null) {
            feedingEvent.setAmendments(serializeAmendments(dto.getAmendments()));
        }

        feedingEvent = feedingEventRepository.save(feedingEvent);

        logger.info("Feeding event updated successfully: {}", id);

        return FeedingEventResponseDTO.fromEntity(feedingEvent);
    }

    /**
     * Deletes a feeding event.
     * Validates that the feeding event's plant belongs to the current user.
     *
     * @param id the feeding event ID
     * @param userId the ID of the current user
     * @throws ResourceNotFoundException if feeding event not found or doesn't belong to user
     */
    public void deleteFeedingEvent(UUID id, UUID userId) {
        logger.info("Deleting feeding event ID: {} for user ID: {}", id, userId);

        FeedingEvent feedingEvent = feedingEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding event not found"));

        // Validate ownership (via plant's grow ownership)
        if (!feedingEvent.getPlant().getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete feeding event {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Feeding event not found");
        }

        feedingEventRepository.delete(feedingEvent);

        logger.info("Feeding event deleted successfully: {}", id);
    }

    /**
     * Gets recent feeding events for a plant (last N records).
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @param limit the maximum number of results
     * @return list of recent feeding event responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<FeedingEventResponseDTO> getRecentFeedingEvents(UUID plantId, UUID userId, int limit) {
        logger.info("Fetching {} recent feeding events for plant ID: {} and user ID: {}",
                limit, plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access recent feeding events for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<FeedingEvent> feedingEvents = feedingEventRepository.findRecentByPlantId(plantId, limit);

        return feedingEvents.stream()
                .map(FeedingEventResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets feeding statistics for a plant.
     * Validates that the plant belongs to the current user.
     *
     * @param plantId the ID of the plant
     * @param userId the ID of the current user
     * @return map containing feeding statistics
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFeedingStatistics(UUID plantId, UUID userId) {
        logger.info("Fetching feeding statistics for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access feeding statistics for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        Map<String, Object> statistics = new HashMap<>();

        // Total counts by type
        long totalCount = feedingEventRepository.countByPlantId(plantId);
        long wateringCount = feedingEventRepository.countByPlantIdAndType(plantId, FeedingEvent.FeedingType.WATERING);
        long nutrientsCount = feedingEventRepository.countByPlantIdAndType(plantId, FeedingEvent.FeedingType.NUTRIENTS);
        long foliarCount = feedingEventRepository.countByPlantIdAndType(plantId, FeedingEvent.FeedingType.FOLIAR);

        statistics.put("totalCount", totalCount);
        statistics.put("wateringCount", wateringCount);
        statistics.put("nutrientsCount", nutrientsCount);
        statistics.put("foliarCount", foliarCount);

        // Total amount fed
        Double totalAmount = feedingEventRepository.calculateTotalAmountByPlantId(plantId);
        statistics.put("totalAmountMl", totalAmount != null ? BigDecimal.valueOf(totalAmount) : BigDecimal.ZERO);

        // Average EC and pH levels
        Double averageEc = feedingEventRepository.calculateAverageEcByPlantId(plantId);
        Double averagePh = feedingEventRepository.calculateAveragePhByPlantId(plantId);
        statistics.put("averageEcLevel", averageEc != null ? BigDecimal.valueOf(averageEc) : null);
        statistics.put("averagePhLevel", averagePh != null ? BigDecimal.valueOf(averagePh) : null);

        // Most recent feeding event
        FeedingEvent mostRecent = feedingEventRepository.findMostRecentByPlantId(plantId);
        if (mostRecent != null) {
            statistics.put("mostRecentFeedingEvent", FeedingEventResponseDTO.fromEntity(mostRecent));
        }

        logger.info("Feeding statistics calculated for plant ID: {}", plantId);

        return statistics;
    }

    /**
     * Parses a lowercase feeding type string to FeedingType enum.
     *
     * @param feedingTypeStr the lowercase feeding type string
     * @return the FeedingType enum
     * @throws IllegalArgumentException if the feeding type is invalid
     */
    private FeedingEvent.FeedingType parseFeedingType(String feedingTypeStr) {
        if (feedingTypeStr == null) {
            throw new IllegalArgumentException("Feeding type cannot be null");
        }

        switch (feedingTypeStr.toLowerCase()) {
            case "watering":
                return FeedingEvent.FeedingType.WATERING;
            case "nutrients":
                return FeedingEvent.FeedingType.NUTRIENTS;
            case "foliar":
                return FeedingEvent.FeedingType.FOLIAR;
            default:
                throw new IllegalArgumentException("Invalid feeding type: " + feedingTypeStr);
        }
    }

    /**
     * Serializes a list of amendments to JSON string.
     *
     * @param amendments the list of amendments
     * @return JSON string representation, or null if list is null or empty
     */
    private String serializeAmendments(List<AmendmentDTO> amendments) {
        if (amendments == null || amendments.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(amendments);
        } catch (Exception e) {
            logger.error("Failed to serialize amendments to JSON", e);
            throw new RuntimeException("Failed to serialize amendments", e);
        }
    }
}