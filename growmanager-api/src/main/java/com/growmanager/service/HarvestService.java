package com.growmanager.service;

import com.growmanager.dto.CreateHarvestRequest;
import com.growmanager.dto.HarvestResponse;
import com.growmanager.dto.HarvestSummaryResponse;
import com.growmanager.dto.UpdateHarvestRequest;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Harvest;
import com.growmanager.entity.Harvest.WeightUnit;
import com.growmanager.entity.Plant;
import com.growmanager.entity.Plant.PlantStage;
import com.growmanager.entity.Plant.PlantStatus;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.GrowRepository;
import com.growmanager.repository.HarvestRepository;
import com.growmanager.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing harvest records.
 */
@Service
@RequiredArgsConstructor
public class HarvestService {

    private static final Logger logger = LoggerFactory.getLogger(HarvestService.class);

    private final HarvestRepository harvestRepository;
    private final PlantRepository plantRepository;
    private final GrowRepository growRepository;

    /**
     * Create a new harvest for a plant.
     * Automatically sets the plant status to 'harvested' and stage to 'harvest'.
     *
     * @param plantId the plant ID
     * @param request the create harvest request
     * @param userId  the current user's ID
     * @return the created harvest response
     */
    @Transactional
    public HarvestResponse createHarvest(UUID plantId, CreateHarvestRequest request, UUID userId) {
        logger.debug("Creating harvest for plant: {}", plantId);

        // Fetch and validate plant ownership
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found with id: " + plantId));

        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create harvest for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Validate plant stage (must be flowering or already at harvest stage)
        if (plant.getStage() != PlantStage.FLOWERING && plant.getStage() != PlantStage.HARVEST) {
            throw new IllegalArgumentException("Plant must be in flowering or harvest stage to be harvested");
        }

        // Create harvest entity
        Harvest harvest = Harvest.builder()
                .plant(plant)
                .grow(plant.getGrow())
                .harvestDate(request.getHarvestDate() != null ? request.getHarvestDate() : LocalDate.now())
                .wetWeight(request.getWetWeight())
                .dryWeight(request.getDryWeight())
                .hashYield(request.getHashYield())
                .weightUnit(request.getWeightUnit())
                .thcPercent(request.getThcPercent())
                .cbdPercent(request.getCbdPercent())
                .terpeneProfile(request.getTerpeneProfile())
                .qualityRating(request.getQualityRating())
                .notes(request.getNotes())
                .build();

        Harvest savedHarvest = harvestRepository.save(harvest);

        // Update plant status to harvested
        plant.setStatus(PlantStatus.HARVESTED);
        plant.setStage(PlantStage.HARVEST);
        plantRepository.save(plant);

        logger.info("Created harvest with id {} for plant {}", savedHarvest.getId(), plantId);

        return HarvestResponse.fromEntity(savedHarvest);
    }

    /**
     * Get all harvests for a grow.
     *
     * @param growId the grow ID
     * @param userId the current user's ID
     * @return list of harvest responses
     */
    @Transactional(readOnly = true)
    public List<HarvestResponse> getHarvestsByGrow(UUID growId, UUID userId) {
        logger.debug("Fetching harvests for grow: {}", growId);

        // Validate grow ownership
        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found with id: " + growId));

        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access harvests for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        List<Harvest> harvests = harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId);

        return harvests.stream()
                .map(HarvestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get harvest summary with aggregate statistics for a grow.
     *
     * @param growId the grow ID
     * @param userId the current user's ID
     * @return harvest summary response
     */
    @Transactional(readOnly = true)
    public HarvestSummaryResponse getHarvestSummary(UUID growId, UUID userId) {
        logger.debug("Fetching harvest summary for grow: {}", growId);

        // Validate grow ownership
        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found with id: " + growId));

        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access harvest summary for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Get all harvests
        List<Harvest> harvests = harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId);

        // Calculate totals (defaulting to grams for calculations)
        long totalPlantsHarvested = harvestRepository.countByGrowId(growId);
        BigDecimal totalWetWeight = harvestRepository.calculateTotalWetWeight(growId, WeightUnit.GRAMS);
        BigDecimal totalDryWeight = harvestRepository.calculateTotalDryWeight(growId, WeightUnit.GRAMS);
        BigDecimal totalHashYield = harvestRepository.calculateTotalHashYield(growId);
        Double averageQuality = harvestRepository.calculateAverageQuality(growId);

        // If no harvests in grams, try ounces
        if (totalWetWeight == null) {
            totalWetWeight = harvestRepository.calculateTotalWetWeight(growId, WeightUnit.OUNCES);
        }
        if (totalDryWeight == null) {
            totalDryWeight = harvestRepository.calculateTotalDryWeight(growId, WeightUnit.OUNCES);
        }

        List<HarvestResponse> harvestResponses = harvests.stream()
                .map(HarvestResponse::fromEntity)
                .collect(Collectors.toList());

        return HarvestSummaryResponse.builder()
                .totalPlantsHarvested(totalPlantsHarvested)
                .totalWetWeight(totalWetWeight != null ? totalWetWeight : BigDecimal.ZERO)
                .totalDryWeight(totalDryWeight != null ? totalDryWeight : BigDecimal.ZERO)
                .totalHashYield(totalHashYield != null ? totalHashYield : BigDecimal.ZERO)
                .averageQuality(averageQuality != null ? averageQuality : 0.0)
                .harvests(harvestResponses)
                .build();
    }

    /**
     * Get a single harvest by ID.
     *
     * @param id     the harvest ID
     * @param userId the current user's ID
     * @return the harvest response
     */
    @Transactional(readOnly = true)
    public HarvestResponse getHarvestById(UUID id, UUID userId) {
        logger.debug("Fetching harvest: {}", id);

        Harvest harvest = harvestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with id: " + id));

        if (!harvest.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access harvest {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Harvest not found");
        }

        return HarvestResponse.fromEntity(harvest);
    }

    /**
     * Update an existing harvest.
     * Note: harvestDate and wetWeight are immutable and cannot be updated.
     *
     * @param id      the harvest ID
     * @param request the update harvest request
     * @param userId  the current user's ID
     * @return the updated harvest response
     */
    @Transactional
    public HarvestResponse updateHarvest(UUID id, UpdateHarvestRequest request, UUID userId) {
        logger.debug("Updating harvest: {}", id);

        Harvest harvest = harvestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with id: " + id));

        if (!harvest.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update harvest {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Harvest not found");
        }

        // Update mutable fields (including null to clear values)
        harvest.setDryWeight(request.getDryWeight());
        harvest.setHashYield(request.getHashYield());
        harvest.setThcPercent(request.getThcPercent());
        harvest.setCbdPercent(request.getCbdPercent());
        harvest.setTerpeneProfile(request.getTerpeneProfile());
        harvest.setQualityRating(request.getQualityRating());
        harvest.setNotes(request.getNotes());

        Harvest updatedHarvest = harvestRepository.save(harvest);

        logger.info("Updated harvest with id {}", id);

        return HarvestResponse.fromEntity(updatedHarvest);
    }

    /**
     * Delete a harvest.
     *
     * @param id     the harvest ID
     * @param userId the current user's ID
     */
    @Transactional
    public void deleteHarvest(UUID id, UUID userId) {
        logger.debug("Deleting harvest: {}", id);

        Harvest harvest = harvestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with id: " + id));

        if (!harvest.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete harvest {} owned by different user",
                    userId, id);
            throw new ResourceNotFoundException("Harvest not found");
        }

        harvestRepository.delete(harvest);

        logger.info("Deleted harvest with id {}", id);
    }
}