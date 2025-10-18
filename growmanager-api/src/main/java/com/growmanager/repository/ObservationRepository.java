package com.growmanager.repository;

import com.growmanager.entity.Observation;
import com.growmanager.entity.Observation.ObservationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}