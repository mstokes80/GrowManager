package com.growmanager.repository;

import com.growmanager.entity.EnvironmentalSnapshot;
import com.growmanager.entity.EnvironmentalSnapshot.SnapshotSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for EnvironmentalSnapshot entity.
 * Provides database access methods for environmental data management.
 */
@Repository
public interface EnvironmentalSnapshotRepository extends JpaRepository<EnvironmentalSnapshot, UUID> {

    /**
     * Finds all environmental snapshots for a specific grow ordered by timestamp descending.
     *
     * @param growId the ID of the grow
     * @return a list of environmental snapshots for the grow
     */
    @Query("SELECT e FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId ORDER BY e.timestamp DESC")
    List<EnvironmentalSnapshot> findByGrowId(@Param("growId") UUID growId);

    /**
     * Finds environmental snapshots for a specific plant.
     *
     * @param plantId the ID of the plant
     * @return a list of environmental snapshots for the plant
     */
    @Query("SELECT e FROM EnvironmentalSnapshot e WHERE e.plant.id = :plantId ORDER BY e.timestamp DESC")
    List<EnvironmentalSnapshot> findByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds environmental snapshots for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return a list of environmental snapshots within the time range
     */
    @Query("SELECT e FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.timestamp >= :startTime AND e.timestamp <= :endTime ORDER BY e.timestamp DESC")
    List<EnvironmentalSnapshot> findByGrowIdAndTimeRange(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Finds environmental snapshots by source type.
     *
     * @param growId the ID of the grow
     * @param source the snapshot source
     * @return a list of environmental snapshots from the specified source
     */
    @Query("SELECT e FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.source = :source ORDER BY e.timestamp DESC")
    List<EnvironmentalSnapshot> findByGrowIdAndSource(@Param("growId") UUID growId, @Param("source") SnapshotSource source);

    /**
     * Finds the most recent environmental snapshot for a grow.
     *
     * @param growId the ID of the grow
     * @return the most recent environmental snapshot, or null if none exist
     */
    @Query(value = "SELECT * FROM environmental_snapshots WHERE grow_id = :growId ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    EnvironmentalSnapshot findMostRecentByGrowId(@Param("growId") UUID growId);

    /**
     * Finds the most recent environmental snapshot for a plant.
     *
     * @param plantId the ID of the plant
     * @return the most recent environmental snapshot, or null if none exist
     */
    @Query(value = "SELECT * FROM environmental_snapshots WHERE plant_id = :plantId ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    EnvironmentalSnapshot findMostRecentByPlantId(@Param("plantId") UUID plantId);

    /**
     * Calculates average temperature for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return the average temperature, or null if no data
     */
    @Query("SELECT AVG(e.temperature) FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.timestamp >= :startTime AND e.timestamp <= :endTime AND e.temperature IS NOT NULL")
    Double calculateAverageTemperature(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Calculates average humidity for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return the average humidity, or null if no data
     */
    @Query("SELECT AVG(e.humidity) FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.timestamp >= :startTime AND e.timestamp <= :endTime AND e.humidity IS NOT NULL")
    Double calculateAverageHumidity(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Calculates average VPD for a grow within a time range.
     *
     * @param growId the ID of the grow
     * @param startTime the range start time
     * @param endTime the range end time
     * @return the average VPD, or null if no data
     */
    @Query("SELECT AVG(e.vpd) FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.timestamp >= :startTime AND e.timestamp <= :endTime AND e.vpd IS NOT NULL")
    Double calculateAverageVpd(@Param("growId") UUID growId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Counts environmental snapshots for a grow.
     *
     * @param growId the ID of the grow
     * @return the count of environmental snapshots
     */
    @Query("SELECT COUNT(e) FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId")
    long countByGrowId(@Param("growId") UUID growId);

    /**
     * Counts environmental snapshots for a plant.
     *
     * @param plantId the ID of the plant
     * @return the count of environmental snapshots
     */
    @Query("SELECT COUNT(e) FROM EnvironmentalSnapshot e WHERE e.plant.id = :plantId")
    long countByPlantId(@Param("plantId") UUID plantId);

    /**
     * Finds environmental snapshots for a user across all grows.
     *
     * @param userId the ID of the user
     * @return a list of environmental snapshots
     */
    @Query("SELECT e FROM EnvironmentalSnapshot e WHERE e.grow.user.id = :userId ORDER BY e.timestamp DESC")
    List<EnvironmentalSnapshot> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds recent environmental snapshots for a grow (last N records).
     *
     * @param growId the ID of the grow
     * @param limit the maximum number of results
     * @return a list of recent environmental snapshots
     */
    @Query(value = "SELECT * FROM environmental_snapshots WHERE grow_id = :growId ORDER BY timestamp DESC LIMIT :limit", nativeQuery = true)
    List<EnvironmentalSnapshot> findRecentByGrowId(@Param("growId") UUID growId, @Param("limit") int limit);

    /**
     * Deletes environmental snapshots older than a specified date.
     *
     * @param growId the ID of the grow
     * @param beforeDate the cutoff date
     * @return the number of records deleted
     */
    @Query("DELETE FROM EnvironmentalSnapshot e WHERE e.grow.id = :growId AND e.timestamp < :beforeDate")
    int deleteByGrowIdAndTimestampBefore(@Param("growId") UUID growId, @Param("beforeDate") LocalDateTime beforeDate);
}
