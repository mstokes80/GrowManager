package com.growmanager.repository;

import com.growmanager.entity.Observation;
import com.growmanager.entity.Observation.ObservationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Observation entity.
 * Provides database access methods for plant observations.
 */
@Repository
public interface ObservationRepository extends JpaRepository<Observation, UUID> {

    /**
     * Find all observations for a specific plant, ordered by timestamp descending (newest first).
     *
     * @param plantId the ID of the plant
     * @return list of observations
     */
    List<Observation> findByPlantIdOrderByTimestampDesc(UUID plantId);

    /**
     * Find observations by plant ID and observation type.
     *
     * @param plantId the ID of the plant
     * @param observationType the type of observation
     * @return list of matching observations
     */
    List<Observation> findByPlantIdAndObservationType(UUID plantId, ObservationType observationType);

    /**
     * Find all observations for plants in a specific grow.
     *
     * @param growId the ID of the grow
     * @return list of observations
     */
    List<Observation> findByPlantGrowIdOrderByTimestampDesc(UUID growId);

    /**
     * Find observations for a grow within a time range.
     * Used for timeline analytics.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return list of observations within the time range
     */
    @Query("SELECT o FROM Observation o WHERE o.plant.grow.id = :growId AND o.createdAt >= :startTime AND o.createdAt <= :endTime ORDER BY o.createdAt DESC")
    List<Observation> findByGrowIdAndCreatedAtBetween(
            @Param("growId") UUID growId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Find observations with photos for a grow.
     * Used for photo timeline generation.
     *
     * @param growId the ID of the grow
     * @return list of observations that have photos
     */
    @Query("SELECT o FROM Observation o WHERE o.plant.grow.id = :growId AND o.photos IS NOT NULL AND SIZE(o.photos) > 0 ORDER BY o.createdAt DESC")
    List<Observation> findObservationsWithPhotosByGrowId(@Param("growId") UUID growId);
}