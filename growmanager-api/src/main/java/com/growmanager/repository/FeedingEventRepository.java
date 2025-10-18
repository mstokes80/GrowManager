package com.growmanager.repository;

import com.growmanager.entity.FeedingEvent;
import com.growmanager.entity.FeedingEvent.FeedingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for FeedingEvent entity.
 * Provides database access methods for feeding event management.
 */
@Repository
public interface FeedingEventRepository extends JpaRepository<FeedingEvent, UUID> {

    /**
     * Finds all feeding events for a specific plant ordered by fed_at descending.
     *
     * @param plantId the ID of the plant
     * @return a list of feeding events for the plant
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.id = :plantId ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds feeding events for a plant by feeding type.
     *
     * @param plantId the ID of the plant
     * @param feedingType the feeding type
     * @return a list of feeding events of the specified type
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.id = :plantId AND f.feedingType = :feedingType ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByPlantIdAndType(@Param("plantId") UUID plantId, @Param("feedingType") FeedingType feedingType);

    /**
     * Finds feeding events for a plant within a time range.
     *
     * @param plantId the ID of the plant
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of feeding events within the time range
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.id = :plantId AND f.fedAt >= :startTime AND f.fedAt <= :endTime ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByPlantIdAndTimeRange(@Param("plantId") UUID plantId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Finds all feeding events for a user across all plants.
     *
     * @param userId the ID of the user
     * @return a list of feeding events created by the user
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.user.id = :userId ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds all feeding events for a grow (across all plants in the grow).
     *
     * @param growId the ID of the grow
     * @return a list of feeding events for plants in the grow
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.grow.id = :growId ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByGrowId(@Param("growId") UUID growId);

    /**
     * Finds the most recent feeding event for a plant.
     *
     * @param plantId the ID of the plant
     * @return the most recent feeding event, or null if none exist
     */
    @Query(value = "SELECT * FROM feeding_events WHERE plant_id = :plantId ORDER BY fed_at DESC LIMIT 1", nativeQuery = true)
    FeedingEvent findMostRecentByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds the most recent feeding event of a specific type for a plant.
     *
     * @param plantId the ID of the plant
     * @param feedingType the feeding type
     * @return the most recent feeding event of the specified type, or null if none exist
     */
    @Query(value = "SELECT * FROM feeding_events WHERE plant_id = :plantId AND feeding_type = :feedingType ORDER BY fed_at DESC LIMIT 1", nativeQuery = true)
    FeedingEvent findMostRecentByPlantIdAndType(@Param("plantId") UUID plantId, @Param("feedingType") String feedingType);

    /**
     * Counts feeding events for a plant.
     *
     * @param plantId the ID of the plant
     * @return the count of feeding events
     */
    @Query("SELECT COUNT(f) FROM FeedingEvent f WHERE f.plant.id = :plantId")
    long countByPlantId(@Param("plantId") UUID plantId);

    /**
     * Counts feeding events of a specific type for a plant.
     *
     * @param plantId the ID of the plant
     * @param feedingType the feeding type
     * @return the count of feeding events of the specified type
     */
    @Query("SELECT COUNT(f) FROM FeedingEvent f WHERE f.plant.id = :plantId AND f.feedingType = :feedingType")
    long countByPlantIdAndType(@Param("plantId") UUID plantId, @Param("feedingType") FeedingType feedingType);

    /**
     * Calculates the total amount fed to a plant.
     *
     * @param plantId the ID of the plant
     * @return the total amount in milliliters
     */
    @Query("SELECT COALESCE(SUM(f.amountMl), 0) FROM FeedingEvent f WHERE f.plant.id = :plantId")
    Double calculateTotalAmountByPlantId(@Param("plantId") UUID plantId);

    /**
     * Calculates the average EC level for a plant's feeding events.
     *
     * @param plantId the ID of the plant
     * @return the average EC level, or null if no data
     */
    @Query("SELECT AVG(f.ecLevel) FROM FeedingEvent f WHERE f.plant.id = :plantId AND f.ecLevel IS NOT NULL")
    Double calculateAverageEcByPlantId(@Param("plantId") UUID plantId);

    /**
     * Calculates the average pH level for a plant's feeding events.
     *
     * @param plantId the ID of the plant
     * @return the average pH level, or null if no data
     */
    @Query("SELECT AVG(f.phLevel) FROM FeedingEvent f WHERE f.plant.id = :plantId AND f.phLevel IS NOT NULL")
    Double calculateAveragePhByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds recent feeding events for a plant (last N records).
     *
     * @param plantId the ID of the plant
     * @param limit the maximum number of results
     * @return a list of recent feeding events
     */
    @Query(value = "SELECT * FROM feeding_events WHERE plant_id = :plantId ORDER BY fed_at DESC LIMIT :limit", nativeQuery = true)
    List<FeedingEvent> findRecentByPlantId(@Param("plantId") UUID plantId, @Param("limit") int limit);

    /**
     * Finds feeding events for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of feeding events within the time range
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.grow.id = :growId AND f.fedAt >= :startTime AND f.fedAt <= :endTime ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByGrowIdAndTimeRange(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Counts feeding events for a grow.
     *
     * @param growId the ID of the grow
     * @return the count of feeding events
     */
    @Query("SELECT COUNT(f) FROM FeedingEvent f WHERE f.plant.grow.id = :growId")
    long countByGrowId(@Param("growId") UUID growId);

    /**
     * Finds feeding events by feeding type across a grow.
     *
     * @param growId the ID of the grow
     * @param feedingType the feeding type
     * @return a list of feeding events of the specified type
     */
    @Query("SELECT f FROM FeedingEvent f WHERE f.plant.grow.id = :growId AND f.feedingType = :feedingType ORDER BY f.fedAt DESC")
    List<FeedingEvent> findByGrowIdAndType(@Param("growId") UUID growId, @Param("feedingType") FeedingType feedingType);
}