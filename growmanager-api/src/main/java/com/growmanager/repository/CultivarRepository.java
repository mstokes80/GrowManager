package com.growmanager.repository;

import com.growmanager.entity.Cultivar;
import com.growmanager.entity.Cultivar.CultivarType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Cultivar entity.
 * Provides database access methods for cultivar management.
 */
@Repository
public interface CultivarRepository extends JpaRepository<Cultivar, UUID> {

    /**
     * Finds all cultivars for a specific user.
     *
     * @param userId the ID of the user
     * @return a list of cultivars belonging to the user
     */
    @Query("SELECT c FROM Cultivar c WHERE c.user.id = :userId ORDER BY c.name ASC")
    List<Cultivar> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds a cultivar by user ID and name.
     * Useful for checking duplicates or finding specific cultivars.
     *
     * @param userId the ID of the user
     * @param name the cultivar name
     * @return an Optional containing the cultivar if found, empty otherwise
     */
    @Query("SELECT c FROM Cultivar c WHERE c.user.id = :userId AND c.name = :name")
    Optional<Cultivar> findByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    /**
     * Finds all cultivars of a specific type for a user.
     *
     * @param userId the ID of the user
     * @param type the cultivar type
     * @return a list of cultivars matching the criteria
     */
    @Query("SELECT c FROM Cultivar c WHERE c.user.id = :userId AND c.type = :type ORDER BY c.name ASC")
    List<Cultivar> findByUserIdAndType(@Param("userId") UUID userId, @Param("type") CultivarType type);

    /**
     * Finds cultivars by user ID and breeder name.
     *
     * @param userId the ID of the user
     * @param breeder the breeder name
     * @return a list of cultivars from the specified breeder
     */
    @Query("SELECT c FROM Cultivar c WHERE c.user.id = :userId AND c.breeder = :breeder ORDER BY c.name ASC")
    List<Cultivar> findByUserIdAndBreeder(@Param("userId") UUID userId, @Param("breeder") String breeder);

    /**
     * Searches cultivars by name (case-insensitive partial match).
     *
     * @param userId the ID of the user
     * @param namePattern the search pattern (will be wrapped in % for LIKE)
     * @return a list of cultivars matching the search
     */
    @Query("SELECT c FROM Cultivar c WHERE c.user.id = :userId AND LOWER(c.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY c.name ASC")
    List<Cultivar> searchByName(@Param("userId") UUID userId, @Param("namePattern") String namePattern);

    /**
     * Counts the number of cultivars for a user.
     *
     * @param userId the ID of the user
     * @return the count of cultivars
     */
    @Query("SELECT COUNT(c) FROM Cultivar c WHERE c.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    /**
     * Counts cultivars by type for a user.
     *
     * @param userId the ID of the user
     * @param type the cultivar type
     * @return the count of cultivars of the specified type
     */
    @Query("SELECT COUNT(c) FROM Cultivar c WHERE c.user.id = :userId AND c.type = :type")
    long countByUserIdAndType(@Param("userId") UUID userId, @Param("type") CultivarType type);

    /**
     * Checks if a cultivar with the given name exists for a user.
     *
     * @param userId the ID of the user
     * @param name the cultivar name
     * @return true if a cultivar with this name exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Cultivar c WHERE c.user.id = :userId AND c.name = :name")
    boolean existsByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    /**
     * Finds all distinct breeders for a user's cultivars.
     *
     * @param userId the ID of the user
     * @return a list of distinct breeder names
     */
    @Query("SELECT DISTINCT c.breeder FROM Cultivar c WHERE c.user.id = :userId AND c.breeder IS NOT NULL ORDER BY c.breeder ASC")
    List<String> findDistinctBreedersByUserId(@Param("userId") UUID userId);

    /**
     * Finds the most recently updated cultivars for a user.
     *
     * @param userId the ID of the user
     * @param limit the maximum number of results
     * @return a list of recently updated cultivars
     */
    @Query(value = "SELECT * FROM cultivars WHERE user_id = :userId ORDER BY updated_at DESC LIMIT :limit", nativeQuery = true)
    List<Cultivar> findRecentlyUpdated(@Param("userId") UUID userId, @Param("limit") int limit);
}
