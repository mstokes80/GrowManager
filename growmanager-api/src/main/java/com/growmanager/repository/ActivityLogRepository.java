package com.growmanager.repository;

import com.growmanager.entity.ActivityLog;
import com.growmanager.entity.ActivityLog.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for ActivityLog entity.
 * Provides database access methods for activity log management.
 */
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    /**
     * Finds all activity logs for a specific plant ordered by logged_at descending.
     *
     * @param plantId the ID of the plant
     * @return a list of activity logs for the plant
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds activity logs for a plant by activity type.
     *
     * @param plantId the ID of the plant
     * @param activityType the activity type
     * @return a list of activity logs of the specified type
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType = :activityType ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByPlantIdAndType(@Param("plantId") UUID plantId, @Param("activityType") ActivityType activityType);

    /**
     * Finds activity logs for a plant within a time range.
     * Optimized for analytics queries using timestamp indexes.
     *
     * @param plantId the ID of the plant
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of activity logs within the time range
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.loggedAt >= :startTime AND a.loggedAt <= :endTime ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByPlantIdAndLoggedAtBetween(@Param("plantId") UUID plantId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Finds activity logs for a plant within a time range.
     *
     * @param plantId the ID of the plant
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of activity logs within the time range
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.loggedAt >= :startTime AND a.loggedAt <= :endTime ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByPlantIdAndTimeRange(@Param("plantId") UUID plantId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Finds all activity logs for a user across all plants.
     *
     * @param userId the ID of the user
     * @return a list of activity logs created by the user
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds all activity logs for a grow (across all plants in the grow).
     *
     * @param growId the ID of the grow
     * @return a list of activity logs for plants in the grow
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.grow.id = :growId ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByGrowId(@Param("growId") UUID growId);

    /**
     * Finds the most recent activity log for a plant.
     *
     * @param plantId the ID of the plant
     * @return the most recent activity log, or null if none exist
     */
    @Query(value = "SELECT * FROM activity_logs WHERE plant_id = :plantId ORDER BY logged_at DESC LIMIT 1", nativeQuery = true)
    ActivityLog findMostRecentByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds the most recent activity log of a specific type for a plant.
     *
     * @param plantId the ID of the plant
     * @param activityType the activity type
     * @return the most recent activity log of the specified type, or null if none exist
     */
    @Query(value = "SELECT * FROM activity_logs WHERE plant_id = :plantId AND activity_type = :activityType ORDER BY logged_at DESC LIMIT 1", nativeQuery = true)
    ActivityLog findMostRecentByPlantIdAndType(@Param("plantId") UUID plantId, @Param("activityType") String activityType);

    /**
     * Counts activity logs for a plant.
     *
     * @param plantId the ID of the plant
     * @return the count of activity logs
     */
    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.plant.id = :plantId")
    long countByPlantId(@Param("plantId") UUID plantId);

    /**
     * Counts activity logs of a specific type for a plant.
     *
     * @param plantId the ID of the plant
     * @param activityType the activity type
     * @return the count of activity logs of the specified type
     */
    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType = :activityType")
    long countByPlantIdAndType(@Param("plantId") UUID plantId, @Param("activityType") ActivityType activityType);

    /**
     * Finds recent activity logs for a plant (last N records).
     *
     * @param plantId the ID of the plant
     * @param limit the maximum number of results
     * @return a list of recent activity logs
     */
    @Query(value = "SELECT * FROM activity_logs WHERE plant_id = :plantId ORDER BY logged_at DESC LIMIT :limit", nativeQuery = true)
    List<ActivityLog> findRecentByPlantId(@Param("plantId") UUID plantId, @Param("limit") int limit);

    /**
     * Finds activity logs for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of activity logs within the time range
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.grow.id = :growId AND a.loggedAt >= :startTime AND a.loggedAt <= :endTime ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByGrowIdAndTimeRange(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Counts activity logs for a grow.
     *
     * @param growId the ID of the grow
     * @return the count of activity logs
     */
    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.plant.grow.id = :growId")
    long countByGrowId(@Param("growId") UUID growId);

    /**
     * Finds activity logs by activity type across a grow.
     *
     * @param growId the ID of the grow
     * @param activityType the activity type
     * @return a list of activity logs of the specified type
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.grow.id = :growId AND a.activityType = :activityType ORDER BY a.loggedAt DESC")
    List<ActivityLog> findByGrowIdAndType(@Param("growId") UUID growId, @Param("activityType") ActivityType activityType);

    /**
     * Finds all transplant activities for a plant.
     *
     * @param plantId the ID of the plant
     * @return a list of transplant activity logs
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType = 'TRANSPLANT' ORDER BY a.loggedAt DESC")
    List<ActivityLog> findTransplantsByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds all pest control activities for a plant.
     *
     * @param plantId the ID of the plant
     * @return a list of pest control activity logs
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType = 'PEST_CONTROL' ORDER BY a.loggedAt DESC")
    List<ActivityLog> findPestControlByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds all structure-affecting activities (training, pruning, defoliation) for a plant.
     *
     * @param plantId the ID of the plant
     * @return a list of structure-affecting activity logs
     */
    @Query("SELECT a FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType IN ('TRAINING', 'PRUNING', 'DEFOLIATION') ORDER BY a.loggedAt DESC")
    List<ActivityLog> findStructureActivitiesByPlantId(@Param("plantId") UUID plantId);

    /**
     * Counts transplant activities for a plant.
     *
     * @param plantId the ID of the plant
     * @return the count of transplant activities
     */
    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.plant.id = :plantId AND a.activityType = 'TRANSPLANT'")
    long countTransplantsByPlantId(@Param("plantId") UUID plantId);
}