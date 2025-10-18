package com.growmanager.repository;

import com.growmanager.entity.Plant;
import com.growmanager.entity.Plant.PlantStage;
import com.growmanager.entity.Plant.PlantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Plant entity.
 * Provides database access methods for plant management.
 */
@Repository
public interface PlantRepository extends JpaRepository<Plant, UUID> {

    /**
     * Finds all plants for a specific grow ordered by sortOrder.
     *
     * @param growId the ID of the grow
     * @return a list of plants in the grow
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId ORDER BY p.sortOrder ASC")
    List<Plant> findByGrowId(@Param("growId") UUID growId);

    /**
     * Finds a plant by grow ID and tag.
     *
     * @param growId the ID of the grow
     * @param tag the plant tag
     * @return an Optional containing the plant if found, empty otherwise
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId AND p.tag = :tag")
    Optional<Plant> findByGrowIdAndTag(@Param("growId") UUID growId, @Param("tag") String tag);

    /**
     * Finds plants by grow ID and stage.
     *
     * @param growId the ID of the grow
     * @param stage the plant stage
     * @return a list of plants in the specified stage
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId AND p.stage = :stage ORDER BY p.tag ASC")
    List<Plant> findByGrowIdAndStage(@Param("growId") UUID growId, @Param("stage") PlantStage stage);

    /**
     * Finds plants by grow ID and status.
     *
     * @param growId the ID of the grow
     * @param status the plant status
     * @return a list of plants with the specified status
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId AND p.status = :status ORDER BY p.tag ASC")
    List<Plant> findByGrowIdAndStatus(@Param("growId") UUID growId, @Param("status") PlantStatus status);

    /**
     * Finds all active plants in a grow.
     *
     * @param growId the ID of the grow
     * @return a list of active plants
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId AND p.status = 'ACTIVE' ORDER BY p.tag ASC")
    List<Plant> findActiveByGrowId(@Param("growId") UUID growId);

    /**
     * Finds plants by cultivar ID.
     *
     * @param cultivarId the ID of the cultivar
     * @return a list of plants of this cultivar
     */
    @Query("SELECT p FROM Plant p WHERE p.cultivar.id = :cultivarId ORDER BY p.grow.startDate DESC, p.tag ASC")
    List<Plant> findByCultivarId(@Param("cultivarId") UUID cultivarId);

    /**
     * Counts plants for a specific cultivar.
     *
     * @param cultivarId the ID of the cultivar
     * @return the count of plants with this cultivar
     */
    @Query("SELECT COUNT(p) FROM Plant p WHERE p.cultivar.id = :cultivarId")
    long countByCultivarId(@Param("cultivarId") UUID cultivarId);

    /**
     * Clears the cultivar reference (sets to NULL) for all plants with the given cultivar.
     * Used when deleting a cultivar to maintain referential integrity.
     *
     * @param cultivarId the ID of the cultivar to clear
     */
    @Modifying
    @Query("UPDATE Plant p SET p.cultivar = NULL WHERE p.cultivar.id = :cultivarId")
    void clearCultivarReference(@Param("cultivarId") UUID cultivarId);

    /**
     * Finds plants for a specific user (across all grows).
     *
     * @param userId the ID of the user
     * @return a list of plants belonging to the user
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.user.id = :userId ORDER BY p.grow.startDate DESC, p.tag ASC")
    List<Plant> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds active plants for a user across all grows.
     *
     * @param userId the ID of the user
     * @return a list of active plants
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.user.id = :userId AND p.status = 'ACTIVE' ORDER BY p.grow.startDate DESC, p.tag ASC")
    List<Plant> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Counts plants in a grow.
     *
     * @param growId the ID of the grow
     * @return the count of plants
     */
    @Query("SELECT COUNT(p) FROM Plant p WHERE p.grow.id = :growId")
    long countByGrowId(@Param("growId") UUID growId);

    /**
     * Counts active plants in a grow.
     *
     * @param growId the ID of the grow
     * @return the count of active plants
     */
    @Query("SELECT COUNT(p) FROM Plant p WHERE p.grow.id = :growId AND p.status = 'ACTIVE'")
    long countActiveByGrowId(@Param("growId") UUID growId);

    /**
     * Counts plants by stage in a grow.
     *
     * @param growId the ID of the grow
     * @param stage the plant stage
     * @return the count of plants in the specified stage
     */
    @Query("SELECT COUNT(p) FROM Plant p WHERE p.grow.id = :growId AND p.stage = :stage")
    long countByGrowIdAndStage(@Param("growId") UUID growId, @Param("stage") PlantStage stage);

    /**
     * Checks if a plant with the given tag exists in a grow.
     *
     * @param growId the ID of the grow
     * @param tag the plant tag
     * @return true if a plant with this tag exists in the grow, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Plant p WHERE p.grow.id = :growId AND p.tag = :tag")
    boolean existsByGrowIdAndTag(@Param("growId") UUID growId, @Param("tag") String tag);

    /**
     * Finds plants by stage across all grows for a user.
     *
     * @param userId the ID of the user
     * @param stage the plant stage
     * @return a list of plants in the specified stage
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.user.id = :userId AND p.stage = :stage ORDER BY p.grow.startDate DESC, p.tag ASC")
    List<Plant> findByUserIdAndStage(@Param("userId") UUID userId, @Param("stage") PlantStage stage);

    /**
     * Finds the most recently updated plants for a grow.
     *
     * @param growId the ID of the grow
     * @return a list of recently updated plants
     */
    @Query("SELECT p FROM Plant p WHERE p.grow.id = :growId ORDER BY p.updatedAt DESC")
    List<Plant> findRecentlyUpdatedByGrowId(@Param("growId") UUID growId);
}
