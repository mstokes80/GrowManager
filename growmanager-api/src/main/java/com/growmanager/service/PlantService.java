package com.growmanager.service;

import com.growmanager.dto.CreatePlantRequest;
import com.growmanager.dto.PlantResponse;
import com.growmanager.dto.UpdatePlantRequest;
import com.growmanager.entity.Cultivar;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.exception.DuplicateResourceException;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.CultivarRepository;
import com.growmanager.repository.GrowRepository;
import com.growmanager.repository.PlantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing plant operations.
 * Handles CRUD operations for plants with ownership validation via grow ownership.
 */
@Service
@Transactional
public class PlantService {

    private static final Logger logger = LoggerFactory.getLogger(PlantService.class);

    private final PlantRepository plantRepository;
    private final GrowRepository growRepository;
    private final CultivarRepository cultivarRepository;

    @Autowired
    public PlantService(
            PlantRepository plantRepository,
            GrowRepository growRepository,
            CultivarRepository cultivarRepository
    ) {
        this.plantRepository = plantRepository;
        this.growRepository = growRepository;
        this.cultivarRepository = cultivarRepository;
    }

    /**
     * Creates a new plant for a grow.
     * Auto-generates plant tag if not provided (e.g., "Plant 1", "Plant 2").
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param request the create plant request
     * @return the created plant response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     * @throws DuplicateResourceException if plant tag already exists in grow
     */
    public PlantResponse createPlant(UUID userId, UUID growId, CreatePlantRequest request) {
        logger.info("Creating plant for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership (user owns the grow)
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create plant for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Generate tag if not provided
        String plantTag = request.getTag();
        if (plantTag == null || plantTag.trim().isEmpty()) {
            plantTag = generatePlantTag(growId);
            logger.info("Auto-generated plant tag: {}", plantTag);
        }

        // Check for duplicate tag in this grow
        if (plantRepository.existsByGrowIdAndTag(growId, plantTag)) {
            throw new DuplicateResourceException("A plant with tag '" + plantTag + "' already exists in this grow");
        }

        // Get cultivar if provided
        Cultivar cultivar = null;
        if (request.getCultivarId() != null) {
            cultivar = cultivarRepository.findById(request.getCultivarId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found"));

            // Validate cultivar belongs to user
            if (!cultivar.getUser().getId().equals(userId)) {
                logger.warn("User {} attempted to use cultivar {} owned by different user",
                        userId, request.getCultivarId());
                throw new ResourceNotFoundException("Cultivar not found");
            }
        }

        Plant.PlantBuilder plantBuilder = Plant.builder()
                .grow(grow)
                .cultivar(cultivar)
                .tag(plantTag)
                .plantedDate(request.getPlantedDate())
                .notes(request.getNotes());

        // Set stage if provided, otherwise default will be set in @PrePersist
        if (request.getStage() != null) {
            plantBuilder.stage(request.getStage());
        }

        // Set status if provided, otherwise default will be set in @PrePersist
        if (request.getStatus() != null) {
            plantBuilder.status(request.getStatus());
        }

        Plant plant = plantBuilder.build();

        plant = plantRepository.save(plant);

        logger.info("Plant created successfully with ID: {} and tag: {}", plant.getId(), plant.getTag());

        return PlantResponse.fromEntity(plant);
    }

    /**
     * Gets all plants for a user across all grows.
     *
     * @param userId the ID of the current user
     * @return list of all user's plant responses
     */
    @Transactional(readOnly = true)
    public List<PlantResponse> getAllUserPlants(UUID userId) {
        logger.info("Fetching all plants for user ID: {}", userId);

        List<Plant> plants = plantRepository.findByUserId(userId);

        return plants.stream()
                .map(PlantResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets all plants for a grow.
     * Validates that the grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @return list of plant responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<PlantResponse> getPlantsByGrow(UUID userId, UUID growId) {
        logger.info("Fetching plants for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access plants for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        List<Plant> plants = plantRepository.findByGrowId(growId);

        return plants.stream()
                .map(PlantResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets a single plant by ID.
     * Validates that the plant's grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant
     * @return the plant response
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public PlantResponse getPlantById(UUID userId, UUID plantId) {
        logger.info("Fetching plant ID: {} for user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        return PlantResponse.fromEntity(plant);
    }

    /**
     * Updates an existing plant.
     * Validates that the plant's grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant to update
     * @param request the update plant request
     * @return the updated plant response
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     * @throws DuplicateResourceException if new tag already exists in grow
     */
    public PlantResponse updatePlant(UUID userId, UUID plantId, UpdatePlantRequest request) {
        logger.info("Updating plant ID: {} for user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Check for duplicate tag if tag is being changed
        if (request.getTag() != null && !request.getTag().equals(plant.getTag())) {
            if (plantRepository.existsByGrowIdAndTag(plant.getGrow().getId(), request.getTag())) {
                throw new DuplicateResourceException("A plant with tag '" + request.getTag() + "' already exists in this grow");
            }
            plant.setTag(request.getTag());
        }

        // Update cultivar if provided
        if (request.getCultivarId() != null) {
            Cultivar cultivar = cultivarRepository.findById(request.getCultivarId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found"));

            // Validate cultivar belongs to user
            if (!cultivar.getUser().getId().equals(userId)) {
                logger.warn("User {} attempted to use cultivar {} owned by different user",
                        userId, request.getCultivarId());
                throw new ResourceNotFoundException("Cultivar not found");
            }
            plant.setCultivar(cultivar);
        }

        // Update other fields if provided
        if (request.getStage() != null) {
            plant.setStage(request.getStage());
        }
        if (request.getStatus() != null) {
            plant.setStatus(request.getStatus());
        }
        if (request.getPlantedDate() != null) {
            plant.setPlantedDate(request.getPlantedDate());
        }
        if (request.getNotes() != null) {
            plant.setNotes(request.getNotes());
        }

        plant = plantRepository.save(plant);

        logger.info("Plant updated successfully: {}", plantId);

        return PlantResponse.fromEntity(plant);
    }

    /**
     * Deletes a plant.
     * Validates that the plant's grow belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant to delete
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    public void deletePlant(UUID userId, UUID plantId) {
        logger.info("Deleting plant ID: {} for user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        plantRepository.delete(plant);

        logger.info("Plant deleted successfully: {}", plantId);
    }

    /**
     * Generates a unique plant tag for a grow.
     * Format: "Plant 1", "Plant 2", etc.
     *
     * @param growId the ID of the grow
     * @return the generated plant tag
     */
    private String generatePlantTag(UUID growId) {
        long plantCount = plantRepository.countByGrowId(growId);
        int nextNumber = (int) plantCount + 1;

        String tag = "Plant " + nextNumber;

        // Ensure uniqueness (in case plants were deleted)
        while (plantRepository.existsByGrowIdAndTag(growId, tag)) {
            nextNumber++;
            tag = "Plant " + nextNumber;
        }

        return tag;
    }
}
