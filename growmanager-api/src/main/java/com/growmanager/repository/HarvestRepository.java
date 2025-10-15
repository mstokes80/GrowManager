package com.growmanager.repository;

import com.growmanager.entity.Harvest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Repository interface for Harvest entity.
 * Provides data access methods for harvest records.
 */
@Repository
public interface HarvestRepository extends JpaRepository<Harvest, UUID> {

    /**
     * Find all harvests for a specific plant.
     *
     * @param plantId the plant ID
     * @return list of harvests for the plant
     */
    List<Harvest> findByPlantId(UUID plantId);

    /**
     * Find all harvests for a specific grow, ordered by harvest date descending.
     *
     * @param growId the grow ID
     * @return list of harvests for the grow, most recent first
     */
    List<Harvest> findByGrowIdOrderByHarvestDateDesc(UUID growId);

    /**
     * Calculate total wet weight for a grow.
     *
     * @param growId the grow ID
     * @param weightUnit the weight unit to filter by
     * @return total wet weight, or null if no harvests
     */
    @Query("SELECT SUM(h.wetWeight) FROM Harvest h WHERE h.grow.id = :growId AND h.weightUnit = :weightUnit")
    BigDecimal calculateTotalWetWeight(@Param("growId") UUID growId,
                                       @Param("weightUnit") Harvest.WeightUnit weightUnit);

    /**
     * Calculate total dry weight for a grow.
     *
     * @param growId the grow ID
     * @param weightUnit the weight unit to filter by
     * @return total dry weight, or null if no harvests with dry weight
     */
    @Query("SELECT SUM(h.dryWeight) FROM Harvest h WHERE h.grow.id = :growId " +
           "AND h.weightUnit = :weightUnit AND h.dryWeight IS NOT NULL")
    BigDecimal calculateTotalDryWeight(@Param("growId") UUID growId,
                                       @Param("weightUnit") Harvest.WeightUnit weightUnit);

    /**
     * Calculate average quality rating for a grow.
     *
     * @param growId the grow ID
     * @return average quality rating, or null if no quality ratings
     */
    @Query("SELECT AVG(h.qualityRating) FROM Harvest h WHERE h.grow.id = :growId " +
           "AND h.qualityRating IS NOT NULL")
    Double calculateAverageQuality(@Param("growId") UUID growId);

    /**
     * Count total plants harvested for a grow.
     *
     * @param growId the grow ID
     * @return number of harvests (plants harvested)
     */
    long countByGrowId(UUID growId);
}