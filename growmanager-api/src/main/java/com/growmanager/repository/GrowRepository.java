package com.growmanager.repository;

import com.growmanager.entity.Grow;
import com.growmanager.entity.Grow.GrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Grow entity.
 * Provides database access methods for grow management.
 */
@Repository
public interface GrowRepository extends JpaRepository<Grow, UUID> {

    /**
     * Finds all grows for a specific user ordered by sortOrder.
     *
     * @param userId the ID of the user
     * @return a list of grows belonging to the user
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId ORDER BY g.sortOrder ASC")
    List<Grow> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds grows by user ID and status.
     *
     * @param userId the ID of the user
     * @param status the grow status
     * @return a list of grows matching the criteria
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.status = :status ORDER BY g.startDate DESC")
    List<Grow> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") GrowStatus status);

    /**
     * Finds all active grows for a user (not completed).
     *
     * @param userId the ID of the user
     * @return a list of active grows
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.status != 'COMPLETED' ORDER BY g.startDate DESC")
    List<Grow> findActiveGrowsByUserId(@Param("userId") UUID userId);

    /**
     * Finds a grow by user ID and name.
     *
     * @param userId the ID of the user
     * @param name the grow name
     * @return an Optional containing the grow if found, empty otherwise
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.name = :name")
    Optional<Grow> findByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    /**
     * Searches grows by name (case-insensitive partial match).
     *
     * @param userId the ID of the user
     * @param namePattern the search pattern
     * @return a list of grows matching the search
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND LOWER(g.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY g.startDate DESC")
    List<Grow> searchByName(@Param("userId") UUID userId, @Param("namePattern") String namePattern);

    /**
     * Finds grows within a date range.
     *
     * @param userId the ID of the user
     * @param startDate the range start date
     * @param endDate the range end date
     * @return a list of grows within the date range
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.startDate >= :startDate AND g.startDate <= :endDate ORDER BY g.startDate DESC")
    List<Grow> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Counts the number of grows for a user.
     *
     * @param userId the ID of the user
     * @return the count of grows
     */
    @Query("SELECT COUNT(g) FROM Grow g WHERE g.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    /**
     * Counts grows by status for a user.
     *
     * @param userId the ID of the user
     * @param status the grow status
     * @return the count of grows with the specified status
     */
    @Query("SELECT COUNT(g) FROM Grow g WHERE g.user.id = :userId AND g.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") GrowStatus status);

    /**
     * Checks if a grow with the given name exists for a user.
     *
     * @param userId the ID of the user
     * @param name the grow name
     * @return true if a grow with this name exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END FROM Grow g WHERE g.user.id = :userId AND g.name = :name")
    boolean existsByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    /**
     * Finds the most recently updated grows for a user.
     *
     * @param userId the ID of the user
     * @return a list of recently updated grows
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId ORDER BY g.updatedAt DESC")
    List<Grow> findRecentlyUpdated(@Param("userId") UUID userId);

    /**
     * Finds grows by environment type.
     *
     * @param userId the ID of the user
     * @param environmentType the environment type
     * @return a list of grows with the specified environment type
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.environmentType = :environmentType ORDER BY g.startDate DESC")
    List<Grow> findByUserIdAndEnvironmentType(@Param("userId") UUID userId, @Param("environmentType") Grow.EnvironmentType environmentType);

    /**
     * Finds grows that are currently in flowering stage.
     *
     * @param userId the ID of the user
     * @return a list of grows in flowering stage
     */
    @Query("SELECT g FROM Grow g WHERE g.user.id = :userId AND g.status = 'FLOWERING' ORDER BY g.startDate DESC")
    List<Grow> findFloweringGrows(@Param("userId") UUID userId);
}
