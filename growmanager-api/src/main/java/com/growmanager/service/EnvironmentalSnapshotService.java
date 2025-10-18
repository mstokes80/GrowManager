package com.growmanager.service;

import com.growmanager.dto.CreateEnvironmentalSnapshotRequest;
import com.growmanager.dto.EnvironmentalSnapshotResponse;
import com.growmanager.entity.EnvironmentalSnapshot;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.EnvironmentalSnapshotRepository;
import com.growmanager.repository.GrowRepository;
import com.growmanager.repository.PlantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing environmental snapshot operations.
 * Handles CRUD operations for environmental data with ownership validation.
 */
@Service
@Transactional
public class EnvironmentalSnapshotService {

    private static final Logger logger = LoggerFactory.getLogger(EnvironmentalSnapshotService.class);
    private static final long MINIMUM_INTERVAL_HOURS = 4;

    private final EnvironmentalSnapshotRepository snapshotRepository;
    private final GrowRepository growRepository;
    private final PlantRepository plantRepository;

    @Autowired
    public EnvironmentalSnapshotService(
            EnvironmentalSnapshotRepository snapshotRepository,
            GrowRepository growRepository,
            PlantRepository plantRepository
    ) {
        this.snapshotRepository = snapshotRepository;
        this.growRepository = growRepository;
        this.plantRepository = plantRepository;
    }

    /**
     * Creates a new environmental snapshot for a grow.
     * Auto-calculates VPD when temperature and humidity are provided.
     * Enforces minimum 4-hour interval between readings for the same grow.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param request the create environmental snapshot request
     * @return the created environmental snapshot response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     * @throws IllegalStateException if minimum interval not met
     */
    public EnvironmentalSnapshotResponse createSnapshotForGrow(
            UUID userId,
            UUID growId,
            CreateEnvironmentalSnapshotRequest request) {
        logger.info("Creating environmental snapshot for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create snapshot for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Enforce minimum interval (4 hours)
        enforceMinimumInterval(growId, null, request.getTimestamp());

        EnvironmentalSnapshot snapshot = buildSnapshot(grow, null, request);
        snapshot = snapshotRepository.save(snapshot);

        logger.info("Environmental snapshot created successfully for grow: {}", growId);

        return EnvironmentalSnapshotResponse.fromEntity(snapshot);
    }

    /**
     * Creates a new environmental snapshot for a plant.
     * Auto-calculates VPD when temperature and humidity are provided.
     * Enforces minimum 4-hour interval between readings for the same plant.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant
     * @param request the create environmental snapshot request
     * @return the created environmental snapshot response
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     * @throws IllegalStateException if minimum interval not met
     */
    public EnvironmentalSnapshotResponse createSnapshotForPlant(
            UUID userId,
            UUID plantId,
            CreateEnvironmentalSnapshotRequest request) {
        logger.info("Creating environmental snapshot for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create snapshot for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Enforce minimum interval (4 hours)
        enforceMinimumInterval(plant.getGrow().getId(), plantId, request.getTimestamp());

        EnvironmentalSnapshot snapshot = buildSnapshot(plant.getGrow(), plant, request);
        snapshot = snapshotRepository.save(snapshot);

        logger.info("Environmental snapshot created successfully for plant: {}", plantId);

        return EnvironmentalSnapshotResponse.fromEntity(snapshot);
    }

    /**
     * Gets all environmental snapshots for a grow.
     * Optionally filters by date range.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param startDate the optional start date filter
     * @param endDate the optional end date filter
     * @return list of environmental snapshot responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<EnvironmentalSnapshotResponse> getSnapshotsByGrow(
            UUID userId,
            UUID growId,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        logger.info("Fetching environmental snapshots for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access snapshots for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        List<EnvironmentalSnapshot> snapshots;
        if (startDate != null && endDate != null) {
            snapshots = snapshotRepository.findByGrowIdAndTimeRange(growId, startDate, endDate);
        } else {
            snapshots = snapshotRepository.findByGrowId(growId);
        }

        return snapshots.stream()
                .map(EnvironmentalSnapshotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets all environmental snapshots for a plant.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant
     * @return list of environmental snapshot responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<EnvironmentalSnapshotResponse> getSnapshotsByPlant(UUID userId, UUID plantId) {
        logger.info("Fetching environmental snapshots for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access snapshots for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<EnvironmentalSnapshot> snapshots = snapshotRepository.findByPlantId(plantId);

        return snapshots.stream()
                .map(EnvironmentalSnapshotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Deletes an environmental snapshot.
     *
     * @param userId the ID of the current user
     * @param snapshotId the ID of the snapshot to delete
     * @throws ResourceNotFoundException if snapshot not found or doesn't belong to user
     */
    public void deleteSnapshot(UUID userId, UUID snapshotId) {
        logger.info("Deleting environmental snapshot ID: {} for user ID: {}", snapshotId, userId);

        EnvironmentalSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Environmental snapshot not found"));

        // Validate ownership (via grow ownership)
        if (!snapshot.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete snapshot {} owned by different user",
                    userId, snapshotId);
            throw new ResourceNotFoundException("Environmental snapshot not found");
        }

        snapshotRepository.delete(snapshot);

        logger.info("Environmental snapshot deleted successfully: {}", snapshotId);
    }

    /**
     * Builds an environmental snapshot entity from the request.
     *
     * @param grow the grow
     * @param plant the plant (nullable)
     * @param request the create request
     * @return the environmental snapshot entity
     */
    private EnvironmentalSnapshot buildSnapshot(
            Grow grow,
            Plant plant,
            CreateEnvironmentalSnapshotRequest request) {

        LocalDateTime timestamp = request.getTimestamp() != null
                ? request.getTimestamp()
                : LocalDateTime.now();

        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(grow)
                .plant(plant)
                .timestamp(timestamp)
                .temperature(request.getTemperature())
                .humidity(request.getHumidity())
                .co2(request.getCo2())
                .lightIntensity(request.getLightIntensity())
                .notes(request.getNotes())
                .build();

        // Auto-calculate VPD if temperature and humidity are provided
        if (request.getTemperature() != null && request.getHumidity() != null) {
            snapshot.autoCalculateVpd();
        }

        return snapshot;
    }

    /**
     * Enforces minimum 4-hour interval between environmental readings.
     *
     * @param growId the grow ID
     * @param plantId the plant ID (nullable)
     * @param newTimestamp the timestamp of the new reading
     * @throws IllegalStateException if minimum interval not met
     */
    private void enforceMinimumInterval(UUID growId, UUID plantId, LocalDateTime newTimestamp) {
        LocalDateTime timestamp = newTimestamp != null ? newTimestamp : LocalDateTime.now();

        EnvironmentalSnapshot mostRecent;
        if (plantId != null) {
            mostRecent = snapshotRepository.findMostRecentByPlantId(plantId);
        } else {
            mostRecent = snapshotRepository.findMostRecentByGrowId(growId);
        }

        if (mostRecent != null) {
            LocalDateTime minimumAllowedTime = mostRecent.getTimestamp()
                    .plusHours(MINIMUM_INTERVAL_HOURS);

            if (timestamp.isBefore(minimumAllowedTime)) {
                logger.warn("Attempted to create snapshot before minimum interval. Last reading: {}, New reading: {}",
                        mostRecent.getTimestamp(), timestamp);
                throw new IllegalStateException(
                        "Minimum 4-hour interval required between environmental readings. " +
                        "Last reading was at " + mostRecent.getTimestamp()
                );
            }
        }
    }
}
