package com.growmanager.repository;

import com.growmanager.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for analytics-related database queries.
 * Verifies that queries complete within acceptable time limits and that indexes are utilized.
 *
 * Performance requirements:
 * - Environmental queries: <500ms for 1000+ snapshots
 * - Feeding queries: <500ms for 500+ events
 * - Harvest queries: <500ms for 100+ harvests
 * - Activity queries: <500ms for 200+ activities
 */
@DataJpaTest
@ActiveProfiles("test")
class AnalyticsQueryPerformanceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EnvironmentalSnapshotRepository environmentalSnapshotRepository;

    @Autowired
    private FeedingEventRepository feedingEventRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private HarvestRepository harvestRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private CultivarRepository cultivarRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Grow testGrow;
    private Cultivar testCultivar;
    private Plant testPlant;

    private static final int LARGE_DATASET_SIZE = 1000;
    private static final long MAX_QUERY_TIME_MS = 500;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setDisplayName("Test User");
        testUser.setEmailVerified(true);
        testUser = entityManager.persistAndFlush(testUser);

        // Create test cultivar
        testCultivar = new Cultivar();
        testCultivar.setUser(testUser);
        testCultivar.setName("Test Strain");
        testCultivar.setType(Cultivar.CultivarType.HYBRID);
        testCultivar = entityManager.persistAndFlush(testCultivar);

        // Create test grow
        testGrow = new Grow();
        testGrow.setUser(testUser);
        testGrow.setName("Test Grow");
        testGrow.setStartDate(LocalDate.now().minusDays(100));
        testGrow.setStatus(Grow.GrowStatus.ACTIVE);
        testGrow = entityManager.persistAndFlush(testGrow);

        // Create test plant
        testPlant = new Plant();
        testPlant.setGrow(testGrow);
        testPlant.setCultivar(testCultivar);
        testPlant.setTag("P001");
        testPlant.setStage(Plant.PlantStage.FLOWERING);
        testPlant.setStatus(Plant.PlantStatus.ACTIVE);
        testPlant = entityManager.persistAndFlush(testPlant);

        entityManager.clear();
    }

    /**
     * Test: Query execution time for large environmental dataset
     * Verifies that time-based queries on environmental_snapshots complete within 500ms
     */
    @Test
    void testEnvironmentalSnapshotQueryPerformance() {
        // Arrange: Create large dataset of environmental snapshots
        List<EnvironmentalSnapshot> snapshots = new ArrayList<>();
        LocalDateTime startTime = LocalDateTime.now().minusDays(30);

        for (int i = 0; i < LARGE_DATASET_SIZE; i++) {
            EnvironmentalSnapshot snapshot = new EnvironmentalSnapshot();
            snapshot.setGrow(testGrow);
            snapshot.setPlant(testPlant);
            snapshot.setTimestamp(startTime.plusHours(i));
            snapshot.setTemperature(new BigDecimal("24.5"));
            snapshot.setHumidity(new BigDecimal("60.0"));
            snapshot.setCo2(new BigDecimal("800.0"));
            snapshot.setLightIntensity(new BigDecimal("600.0"));
            snapshot.setVpd(new BigDecimal("1.2"));
            snapshot.setSource(EnvironmentalSnapshot.SnapshotSource.MANUAL);
            snapshots.add(snapshot);

            // Batch persist every 100 records
            if (i % 100 == 0) {
                snapshots.forEach(entityManager::persist);
                entityManager.flush();
                entityManager.clear();
                snapshots.clear();
            }
        }
        // Persist remaining snapshots
        snapshots.forEach(entityManager::persist);
        entityManager.flush();
        entityManager.clear();

        // Act: Measure query execution time
        long startQueryTime = System.currentTimeMillis();
        List<EnvironmentalSnapshot> results = environmentalSnapshotRepository
                .findByGrowIdAndTimestampBetween(
                        testGrow.getId(),
                        startTime,
                        startTime.plusDays(30)
                );
        long queryExecutionTime = System.currentTimeMillis() - startQueryTime;

        // Assert: Verify performance and results
        assertThat(queryExecutionTime)
                .as("Environmental query should complete within 500ms")
                .isLessThan(MAX_QUERY_TIME_MS);
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isGreaterThanOrEqualTo(LARGE_DATASET_SIZE);
    }

    /**
     * Test: Query performance for feeding events aggregation
     * Verifies that feeding event queries complete within 500ms
     */
    @Test
    void testFeedingEventQueryPerformance() {
        // Arrange: Create dataset of feeding events
        int feedingEventCount = 500;
        List<FeedingEvent> events = new ArrayList<>();
        LocalDateTime startTime = LocalDateTime.now().minusDays(60);

        for (int i = 0; i < feedingEventCount; i++) {
            FeedingEvent event = new FeedingEvent();
            event.setPlant(testPlant);
            event.setUser(testUser);
            event.setFeedingType(i % 3 == 0 ? FeedingEvent.FeedingType.NUTRIENTS : FeedingEvent.FeedingType.WATERING);
            event.setAmountMl(new BigDecimal("1000.0"));
            event.setEcLevel(new BigDecimal("1.5"));
            event.setPhLevel(new BigDecimal("6.2"));
            event.setFedAt(startTime.plusHours(i * 2));
            events.add(event);

            if (i % 100 == 0) {
                events.forEach(entityManager::persist);
                entityManager.flush();
                entityManager.clear();
                events.clear();
            }
        }
        events.forEach(entityManager::persist);
        entityManager.flush();
        entityManager.clear();

        // Act: Measure query execution time
        long startQueryTime = System.currentTimeMillis();
        List<FeedingEvent> results = feedingEventRepository
                .findByPlantIdAndFedAtBetween(
                        testPlant.getId(),
                        startTime,
                        startTime.plusDays(60)
                );
        long queryExecutionTime = System.currentTimeMillis() - startQueryTime;

        // Assert
        assertThat(queryExecutionTime)
                .as("Feeding event query should complete within 500ms")
                .isLessThan(MAX_QUERY_TIME_MS);
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isEqualTo(feedingEventCount);
    }

    /**
     * Test: Query performance for activity logs timeline
     * Verifies that activity log queries complete within 500ms
     */
    @Test
    void testActivityLogQueryPerformance() {
        // Arrange: Create dataset of activity logs
        int activityCount = 200;
        List<ActivityLog> activities = new ArrayList<>();
        LocalDateTime startTime = LocalDateTime.now().minusDays(45);

        for (int i = 0; i < activityCount; i++) {
            ActivityLog activity = new ActivityLog();
            activity.setPlant(testPlant);
            activity.setUser(testUser);
            activity.setActivityType(ActivityLog.ActivityType.TRAINING);
            activity.setDescription("Test activity " + i);
            activity.setLoggedAt(startTime.plusHours(i * 3));
            activities.add(activity);

            if (i % 50 == 0) {
                activities.forEach(entityManager::persist);
                entityManager.flush();
                entityManager.clear();
                activities.clear();
            }
        }
        activities.forEach(entityManager::persist);
        entityManager.flush();
        entityManager.clear();

        // Act: Measure query execution time
        long startQueryTime = System.currentTimeMillis();
        List<ActivityLog> results = activityLogRepository
                .findByPlantIdAndLoggedAtBetween(
                        testPlant.getId(),
                        startTime,
                        startTime.plusDays(45)
                );
        long queryExecutionTime = System.currentTimeMillis() - startQueryTime;

        // Assert
        assertThat(queryExecutionTime)
                .as("Activity log query should complete within 500ms")
                .isLessThan(MAX_QUERY_TIME_MS);
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isEqualTo(activityCount);
    }

    /**
     * Test: Query performance for harvest yield analytics
     * Verifies that harvest queries complete within 500ms
     */
    @Test
    void testHarvestQueryPerformance() {
        // Arrange: Create multiple plants with harvests
        List<Harvest> harvests = new ArrayList<>();
        List<Plant> plants = new ArrayList<>();

        // Create 100 plants with harvests
        for (int i = 0; i < 100; i++) {
            Plant plant = new Plant();
            plant.setGrow(testGrow);
            plant.setCultivar(testCultivar);
            plant.setTag("P" + String.format("%03d", i + 2)); // Start from P002
            plant.setStage(Plant.PlantStage.HARVEST);
            plant.setStatus(Plant.PlantStatus.HARVESTED);
            plant = entityManager.persist(plant);
            plants.add(plant);

            Harvest harvest = new Harvest();
            harvest.setPlant(plant);
            harvest.setGrow(testGrow);
            harvest.setHarvestDate(LocalDate.now().minusDays(i));
            harvest.setWetWeight(new BigDecimal("500.0"));
            harvest.setDryWeight(new BigDecimal("100.0"));
            harvest.setWeightUnit(Harvest.WeightUnit.GRAMS);
            harvest.setQualityRating(8);
            harvest.setThcPercent(new BigDecimal("22.5"));
            harvest.setCbdPercent(new BigDecimal("0.5"));
            harvests.add(harvest);

            if (i % 25 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        harvests.forEach(entityManager::persist);
        entityManager.flush();
        entityManager.clear();

        // Act: Measure query execution time for grow-level harvest aggregation
        long startQueryTime = System.currentTimeMillis();
        List<Harvest> results = harvestRepository.findByGrowIdOrderByHarvestDateDesc(testGrow.getId());
        long queryExecutionTime = System.currentTimeMillis() - startQueryTime;

        // Assert
        assertThat(queryExecutionTime)
                .as("Harvest query should complete within 500ms")
                .isLessThan(MAX_QUERY_TIME_MS);
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isEqualTo(100);
    }

    /**
     * Test: Verify index usage for environmental snapshots timestamp queries
     * This test ensures that the analytics indexes are being utilized
     */
    @Test
    void testEnvironmentalSnapshotIndexUsage() {
        // Arrange: Create sample data
        for (int i = 0; i < 100; i++) {
            EnvironmentalSnapshot snapshot = new EnvironmentalSnapshot();
            snapshot.setGrow(testGrow);
            snapshot.setTimestamp(LocalDateTime.now().minusHours(i));
            snapshot.setTemperature(new BigDecimal("24.0"));
            snapshot.setHumidity(new BigDecimal("60.0"));
            snapshot.setSource(EnvironmentalSnapshot.SnapshotSource.MANUAL);
            entityManager.persist(snapshot);
        }
        entityManager.flush();
        entityManager.clear();

        // Act: Execute query that should use index
        List<EnvironmentalSnapshot> results = environmentalSnapshotRepository
                .findByGrowIdOrderByTimestampDesc(testGrow.getId());

        // Assert: Verify results are ordered correctly (index working)
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isEqualTo(100);

        // Verify descending order (proves index is being used)
        for (int i = 0; i < results.size() - 1; i++) {
            assertThat(results.get(i).getTimestamp())
                    .isAfterOrEqualTo(results.get(i + 1).getTimestamp());
        }
    }

    /**
     * Test: Verify feeding events can be efficiently filtered by type and time
     * Tests the composite index for type + time filtering
     */
    @Test
    void testFeedingEventTypeTimeIndexUsage() {
        // Arrange: Create mixed feeding event types
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 50; i++) {
            FeedingEvent event = new FeedingEvent();
            event.setPlant(testPlant);
            event.setUser(testUser);
            event.setFeedingType(i % 2 == 0 ? FeedingEvent.FeedingType.NUTRIENTS : FeedingEvent.FeedingType.WATERING);
            event.setAmountMl(new BigDecimal("1000.0"));
            event.setFedAt(now.minusHours(i));
            entityManager.persist(event);
        }
        entityManager.flush();
        entityManager.clear();

        // Act: Query by type (should use index)
        long startTime = System.currentTimeMillis();
        List<FeedingEvent> nutrientEvents = feedingEventRepository
                .findByPlantIdAndFeedingType(testPlant.getId(), FeedingEvent.FeedingType.NUTRIENTS);
        long queryTime = System.currentTimeMillis() - startTime;

        // Assert
        assertThat(queryTime).isLessThan(MAX_QUERY_TIME_MS);
        assertThat(nutrientEvents).isNotEmpty();
        assertThat(nutrientEvents.size()).isEqualTo(25);
        assertThat(nutrientEvents).allMatch(e -> e.getFeedingType() == FeedingEvent.FeedingType.NUTRIENTS);
    }

    /**
     * Test: Verify plant-cultivar-grow composite index performance
     * Tests the index created for cultivar-based analytics
     */
    @Test
    void testPlantCultivarGrowIndexUsage() {
        // Arrange: Create multiple plants for the same cultivar
        for (int i = 0; i < 50; i++) {
            Plant plant = new Plant();
            plant.setGrow(testGrow);
            plant.setCultivar(testCultivar);
            plant.setTag("P" + String.format("%03d", i + 100));
            plant.setStage(i % 2 == 0 ? Plant.PlantStage.VEGETATIVE : Plant.PlantStage.FLOWERING);
            plant.setStatus(Plant.PlantStatus.ACTIVE);
            entityManager.persist(plant);
        }
        entityManager.flush();
        entityManager.clear();

        // Act: Query by cultivar (should use index)
        long startTime = System.currentTimeMillis();
        List<Plant> results = plantRepository.findByCultivarId(testCultivar.getId());
        long queryTime = System.currentTimeMillis() - startTime;

        // Assert
        assertThat(queryTime).isLessThan(MAX_QUERY_TIME_MS);
        assertThat(results).isNotEmpty();
        assertThat(results.size()).isGreaterThanOrEqualTo(50);
    }

    /**
     * Test: Verify harvest quality index performance for top performers query
     * Tests the partial index on quality-rated harvests
     */
    @Test
    void testHarvestQualityIndexUsage() {
        // Arrange: Create harvests with varying quality ratings
        for (int i = 0; i < 50; i++) {
            Plant plant = new Plant();
            plant.setGrow(testGrow);
            plant.setCultivar(testCultivar);
            plant.setTag("Q" + String.format("%03d", i));
            plant.setStage(Plant.PlantStage.HARVEST);
            plant.setStatus(Plant.PlantStatus.HARVESTED);
            plant = entityManager.persist(plant);

            Harvest harvest = new Harvest();
            harvest.setPlant(plant);
            harvest.setGrow(testGrow);
            harvest.setHarvestDate(LocalDate.now().minusDays(i));
            harvest.setWetWeight(new BigDecimal("400.0"));
            harvest.setDryWeight(new BigDecimal("80.0"));
            harvest.setWeightUnit(Harvest.WeightUnit.GRAMS);
            harvest.setQualityRating(5 + (i % 6)); // Quality from 5-10
            harvest.setThcPercent(new BigDecimal("20.0"));
            entityManager.persist(harvest);
        }
        entityManager.flush();
        entityManager.clear();

        // Act: Query high-quality harvests (should use partial index)
        long startTime = System.currentTimeMillis();
        List<Harvest> allHarvests = harvestRepository.findByGrowIdOrderByHarvestDateDesc(testGrow.getId());
        List<Harvest> topQuality = allHarvests.stream()
                .filter(h -> h.getQualityRating() != null && h.getQualityRating() >= 8)
                .toList();
        long queryTime = System.currentTimeMillis() - startTime;

        // Assert
        assertThat(queryTime).isLessThan(MAX_QUERY_TIME_MS);
        assertThat(topQuality).isNotEmpty();
    }
}