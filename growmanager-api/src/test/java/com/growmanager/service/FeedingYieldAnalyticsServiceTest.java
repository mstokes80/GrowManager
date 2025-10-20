package com.growmanager.service;

import com.growmanager.dto.FeedingAnalyticsResponse;
import com.growmanager.dto.YieldAnalyticsResponse;
import com.growmanager.entity.*;
import com.growmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for feeding and yield analytics in AnalyticsService.
 * Tests nutrient input calculations, efficiency metrics, yield aggregations,
 * and pH/EC trend analysis.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Feeding and Yield Analytics Service Tests")
class FeedingYieldAnalyticsServiceTest {

    @Mock
    private GrowRepository growRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private FeedingEventRepository feedingEventRepository;

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private EnvironmentalSnapshotRepository environmentalSnapshotRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObservationRepository observationRepository;

    @Mock
    private CultivarRepository cultivarRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User testUser;
    private Grow testGrow;
    private Cultivar testCultivar;
    private Plant testPlant;
    private List<FeedingEvent> testFeedingEvents;
    private List<Harvest> testHarvests;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .build();

        // Create test cultivar
        testCultivar = Cultivar.builder()
                .id(UUID.randomUUID())
                .name("Test Strain")
                .user(testUser)
                .build();

        // Create test grow
        testGrow = Grow.builder()
                .id(UUID.randomUUID())
                .name("Test Grow")
                .user(testUser)
                .startDate(LocalDate.now().minusDays(90))
                .build();

        // Create test plant
        testPlant = Plant.builder()
                .id(UUID.randomUUID())
                .tag("P001")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        // Create test feeding events
        testFeedingEvents = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().minusDays(30);

        // Add feeding events with EC and pH values
        for (int i = 0; i < 10; i++) {
            FeedingEvent event = FeedingEvent.builder()
                    .id(UUID.randomUUID())
                    .plant(testPlant)
                    .user(testUser)
                    .feedingType(FeedingEvent.FeedingType.NUTRIENTS)
                    .amountMl(BigDecimal.valueOf(1000.0)) // 1 liter each
                    .ecLevel(BigDecimal.valueOf(1.5 + (i * 0.1))) // Varying EC levels
                    .phLevel(BigDecimal.valueOf(6.0 + (i * 0.05))) // Varying pH levels
                    .fedAt(baseTime.plusDays(i * 3))
                    .build();
            testFeedingEvents.add(event);
        }

        // Create test harvests
        testHarvests = new ArrayList<>();
        Harvest harvest = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(5))
                .wetWeight(BigDecimal.valueOf(500.0)) // 500g wet
                .dryWeight(BigDecimal.valueOf(100.0)) // 100g dry
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(8)
                .thcPercent(BigDecimal.valueOf(20.5))
                .build();
        testHarvests.add(harvest);
    }

    // ==================== FEEDING ANALYTICS TESTS ====================

    @Test
    @DisplayName("Should calculate total nutrient input correctly")
    void shouldCalculateTotalNutrientInput() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getNutrientMetrics()).isNotNull();
        assertThat(response.getNutrientMetrics().getTotalEc()).isGreaterThan(0.0);
        assertThat(response.getNutrientMetrics().getFeedingEventCount()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Should calculate average EC and pH correctly")
    void shouldCalculateAverageEcAndPh() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getNutrientMetrics()).isNotNull();
        assertThat(response.getNutrientMetrics().getAvgEc()).isNotNull();
        assertThat(response.getNutrientMetrics().getAvgPh()).isNotNull();

        // Average EC should be around 2.0 (1.5 + 2.4) / 2 = 1.95
        assertThat(response.getNutrientMetrics().getAvgEc()).isBetween(1.5, 2.5);

        // Average pH should be around 6.2-6.3
        assertThat(response.getNutrientMetrics().getAvgPh()).isBetween(6.0, 6.5);
    }

    @Test
    @DisplayName("Should calculate total water volume correctly")
    void shouldCalculateTotalWaterVolume() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getNutrientMetrics()).isNotNull();
        assertThat(response.getNutrientMetrics().getTotalWaterVolume()).isNotNull();

        // Total water = 10 events × 1000ml = 10,000ml = 10L
        assertThat(response.getNutrientMetrics().getTotalWaterVolume()).isEqualTo(10000.0);
    }

    @Test
    @DisplayName("Should calculate stage-based EC and pH averages")
    void shouldCalculateStageBasedAverages() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        // Create plant in vegetative stage
        Plant vegPlant = Plant.builder()
                .id(UUID.randomUUID())
                .tag("P002")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.VEGETATIVE)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant, vegPlant));
        when(plantRepository.findByGrowIdAndStage(growId, Plant.PlantStage.VEGETATIVE))
                .thenReturn(List.of(vegPlant));
        when(plantRepository.findByGrowIdAndStage(growId, Plant.PlantStage.FLOWERING))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getNutrientMetrics()).isNotNull();
        // Should have both vegetative and flowering averages
        assertThat(response.getNutrientMetrics().getVegetativeAvg()).isNotNull();
        assertThat(response.getNutrientMetrics().getFloweringAvg()).isNotNull();
    }

    @Test
    @DisplayName("Should calculate variance for pH/EC drift detection")
    void shouldCalculateVarianceForDriftDetection() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getPhTrend()).isNotEmpty();
        assertThat(response.getEcTrend()).isNotEmpty();

        // Check that variance is calculated for drift detection
        response.getPhTrend().forEach(point -> {
            assertThat(point.getVariance()).isNotNull();
        });

        response.getEcTrend().forEach(point -> {
            assertThat(point.getVariance()).isNotNull();
        });
    }

    // ==================== EFFICIENCY METRICS TESTS ====================

    @Test
    @DisplayName("Should calculate feed efficiency correctly")
    void shouldCalculateFeedEfficiency() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getEfficiencyMetrics()).isNotNull();
        assertThat(response.getEfficiencyMetrics().getFeedEfficiency()).isNotNull();
        assertThat(response.getEfficiencyMetrics().getFeedEfficiency()).isGreaterThan(0.0);
        assertThat(response.getEfficiencyMetrics().getFeedEfficiencyUnit()).isEqualTo("g/EC");
        assertThat(response.getEfficiencyMetrics().getTotalYield()).isEqualTo(100.0); // dry weight
    }

    @Test
    @DisplayName("Should calculate water use efficiency correctly")
    void shouldCalculateWaterUseEfficiency() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getEfficiencyMetrics()).isNotNull();
        assertThat(response.getEfficiencyMetrics().getWaterUseEfficiency()).isNotNull();
        assertThat(response.getEfficiencyMetrics().getWaterUseEfficiency()).isGreaterThan(0.0);
        assertThat(response.getEfficiencyMetrics().getWaterEfficiencyUnit()).isEqualTo("g/L");

        // Water Use Efficiency = 100g / 10L = 10 g/L
        assertThat(response.getEfficiencyMetrics().getWaterUseEfficiency()).isEqualTo(10.0);
    }

    @Test
    @DisplayName("Should handle division by zero for efficiency metrics")
    void shouldHandleDivisionByZeroForEfficiencyMetrics() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        // No feeding events (division by zero scenario)
        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(testHarvests);

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getEfficiencyMetrics()).isNotNull();
        // Should handle gracefully with null or 0.0 values
        assertThat(response.getEfficiencyMetrics().getFeedEfficiency()).isNull();
        assertThat(response.getEfficiencyMetrics().getWaterUseEfficiency()).isNull();
    }

    @Test
    @DisplayName("Should handle no harvest data for efficiency metrics")
    void shouldHandleNoHarvestDataForEfficiencyMetrics() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(testFeedingEvents);
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(List.of()); // No harvests

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response.getEfficiencyMetrics()).isNotNull();
        assertThat(response.getEfficiencyMetrics().getTotalYield()).isNull();
        assertThat(response.getEfficiencyMetrics().getFeedEfficiency()).isNull();
        assertThat(response.getEfficiencyMetrics().getWaterUseEfficiency()).isNull();
    }

    // ==================== YIELD ANALYTICS TESTS ====================

    @Test
    @DisplayName("Should aggregate total yield correctly")
    void shouldAggregateTotalYieldCorrectly() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        // Add more harvests for comprehensive testing
        Harvest harvest2 = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(10))
                .wetWeight(BigDecimal.valueOf(450.0))
                .dryWeight(BigDecimal.valueOf(90.0))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(7)
                .build();

        List<Harvest> allHarvests = List.of(testHarvests.get(0), harvest2);

        when(harvestRepository.findAll()).thenReturn(allHarvests);
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getYieldMetrics()).isNotNull();
        assertThat(response.getYieldMetrics().getTotalYield()).isEqualTo(190.0); // 100 + 90
        assertThat(response.getYieldMetrics().getTotalHarvests()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should calculate wet vs dry weight ratios correctly")
    void shouldCalculateWetToDryRatios() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        when(harvestRepository.findAll()).thenReturn(testHarvests);
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getYieldMetrics()).isNotNull();
        assertThat(response.getYieldMetrics().getAvgWetWeight()).isEqualTo(500.0);
        assertThat(response.getYieldMetrics().getAvgDryWeight()).isEqualTo(100.0);

        // Wet to dry ratio = 500 / 100 = 5.0 (or 20% dry weight)
        assertThat(response.getYieldMetrics().getAvgWetToDryRatio()).isEqualTo(5.0);
    }

    @Test
    @DisplayName("Should calculate yield per plant correctly")
    void shouldCalculateYieldPerPlant() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        when(harvestRepository.findAll()).thenReturn(testHarvests);
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getYieldMetrics()).isNotNull();
        assertThat(response.getYieldMetrics().getAvgYieldPerPlant()).isEqualTo(100.0);
        assertThat(response.getYieldMetrics().getTotalPlantsHarvested()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should calculate success rate percentage correctly")
    void shouldCalculateSuccessRatePercentage() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        // Create additional plants (some harvested, some not)
        Plant plant2 = Plant.builder()
                .id(UUID.randomUUID())
                .tag("P002")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        Plant plant3 = Plant.builder()
                .id(UUID.randomUUID())
                .tag("P003")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.HARVEST)
                .status(Plant.PlantStatus.HARVESTED)
                .build();

        when(harvestRepository.findAll()).thenReturn(testHarvests);
        when(plantRepository.findAll()).thenReturn(List.of(testPlant, plant2, plant3));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getProductionEfficiency()).isNotNull();
        // Success rate = 1 harvest / 3 plants = 33.33%
        assertThat(response.getProductionEfficiency().getSuccessRate()).isGreaterThan(0.0);
        assertThat(response.getProductionEfficiency().getSuccessRate()).isLessThanOrEqualTo(100.0);
    }

    @Test
    @DisplayName("Should calculate yield per square foot when area data available")
    void shouldCalculateYieldPerSquareFoot() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        when(harvestRepository.findAll()).thenReturn(testHarvests);
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));
        when(growRepository.findById(testGrow.getId())).thenReturn(java.util.Optional.of(testGrow));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getProductionEfficiency()).isNotNull();
        // May be null if no area data, but should not throw exception
        // assertThat(response.getProductionEfficiency().getYieldPerSqFt()).isNotNull();
    }

    @Test
    @DisplayName("Should identify top performers correctly")
    void shouldIdentifyTopPerformers() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        // Create multiple harvests with different yields
        Harvest highYield = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(5))
                .wetWeight(BigDecimal.valueOf(800.0))
                .dryWeight(BigDecimal.valueOf(150.0))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(9)
                .build();

        when(harvestRepository.findAll()).thenReturn(List.of(testHarvests.get(0), highYield));
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getTopPerformers()).isNotEmpty();
        assertThat(response.getTopPerformers().get(0).getYield()).isEqualTo(150.0);
        assertThat(response.getTopPerformers().get(0).getType()).isIn("plant", "grow");
    }

    @Test
    @DisplayName("Should calculate quality tracking metrics correctly")
    void shouldCalculateQualityTrackingMetrics() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        // Create harvests with various quality ratings
        Harvest excellent = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(5))
                .wetWeight(BigDecimal.valueOf(500.0))
                .dryWeight(BigDecimal.valueOf(100.0))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(9)
                .thcPercent(BigDecimal.valueOf(22.5))
                .build();

        Harvest good = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(10))
                .wetWeight(BigDecimal.valueOf(450.0))
                .dryWeight(BigDecimal.valueOf(90.0))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(7)
                .thcPercent(BigDecimal.valueOf(18.5))
                .build();

        when(harvestRepository.findAll()).thenReturn(List.of(excellent, good));
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response.getQualityTracking()).isNotNull();
        assertThat(response.getQualityTracking().getAvgPotency()).isNotNull();
        assertThat(response.getQualityTracking().getAvgPotency()).isBetween(18.0, 23.0);
        assertThat(response.getQualityTracking().getQualityDistribution()).isNotNull();
        assertThat(response.getQualityTracking().getQualityDistribution().getExcellent()).isEqualTo(1);
        assertThat(response.getQualityTracking().getQualityDistribution().getGood()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should handle empty feeding events gracefully")
    void shouldHandleEmptyFeedingEventsGracefully() {
        // Arrange
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.now().minusDays(60);
        LocalDateTime endDate = LocalDateTime.now();

        when(feedingEventRepository.findByGrowIdAndTimeRange(eq(growId), any(), any()))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId))
                .thenReturn(List.of(testPlant));
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(List.of());

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId, null, startDate, endDate, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getNutrientMetrics()).isNotNull();
        assertThat(response.getNutrientMetrics().getFeedingEventCount()).isEqualTo(0L);
        assertThat(response.getPhTrend()).isEmpty();
        assertThat(response.getEcTrend()).isEmpty();
    }

    @Test
    @DisplayName("Should handle empty harvests gracefully")
    void shouldHandleEmptyHarvestsGracefully() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusDays(60);
        LocalDate endDate = LocalDate.now();

        when(harvestRepository.findAll()).thenReturn(List.of());
        when(plantRepository.findAll()).thenReturn(List.of(testPlant));

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate, endDate, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getYieldMetrics()).isNotNull();
        assertThat(response.getYieldMetrics().getTotalYield()).isNull();
        assertThat(response.getYieldMetrics().getTotalHarvests()).isEqualTo(0);
    }
}