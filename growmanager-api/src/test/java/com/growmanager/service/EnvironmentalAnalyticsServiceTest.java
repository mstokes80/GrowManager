package com.growmanager.service;

import com.growmanager.dto.EnvironmentalTrendsResponse;
import com.growmanager.entity.*;
import com.growmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for environmental analytics calculations in AnalyticsService.
 * Tests aggregation logic, VPD calculations, and statistical calculations.
 */
@ExtendWith(MockitoExtension.class)
class EnvironmentalAnalyticsServiceTest {

    @Mock
    private GrowRepository growRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private EnvironmentalSnapshotRepository environmentalSnapshotRepository;

    @Mock
    private FeedingEventRepository feedingEventRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObservationRepository observationRepository;

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private CultivarRepository cultivarRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User testUser;
    private Grow testGrow;
    private Plant testPlant;
    private List<EnvironmentalSnapshot> testSnapshots;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .build();

        // Create test grow
        testGrow = Grow.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Test Grow")
                .startDate(LocalDate.now().minusDays(30))
                .status(Grow.GrowStatus.ACTIVE)
                .build();

        // Create test plant
        testPlant = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .tag("Plant-001")
                .stage(Plant.PlantStage.VEGETATIVE)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        // Create test environmental snapshots
        testSnapshots = new ArrayList<>();
    }

    @Test
    void testGetEnvironmentalTrends_DailyAggregation() {
        // Given: 7 days of environmental data with hourly snapshots
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        createTestSnapshots(startDate, endDate, 168); // 7 days * 24 hours

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        when(plantRepository.findByGrowIdAndStage(eq(testGrow.getId()), any(Plant.PlantStage.class)))
                .thenReturn(List.of(testPlant));

        // When: Getting daily aggregated trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should have 7 daily data points
        assertThat(response).isNotNull();
        assertThat(response.getDataPoints()).hasSize(7);

        // Verify each data point has aggregated values
        response.getDataPoints().forEach(dataPoint -> {
            assertThat(dataPoint.getTimestamp()).isNotNull();
            assertThat(dataPoint.getTemperature()).isNotNull();
            assertThat(dataPoint.getHumidity()).isNotNull();
            assertThat(dataPoint.getVpd()).isNotNull();
            assertThat(dataPoint.getAggregationLevel()).isEqualTo("daily");
        });
    }

    @Test
    void testGetEnvironmentalTrends_WeeklyAggregation() {
        // Given: 4 weeks of environmental data
        LocalDateTime startDate = LocalDateTime.now().minusDays(28);
        LocalDateTime endDate = LocalDateTime.now();

        createTestSnapshots(startDate, endDate, 672); // 28 days * 24 hours

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting weekly aggregated trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "weekly", testUser);

        // Then: Should have 4 weekly data points
        assertThat(response).isNotNull();
        assertThat(response.getDataPoints()).hasSizeBetween(4, 5); // May span partial weeks
    }

    @Test
    void testGetEnvironmentalTrends_MonthlyAggregation() {
        // Given: 3 months of environmental data
        LocalDateTime startDate = LocalDateTime.now().minusDays(90);
        LocalDateTime endDate = LocalDateTime.now();

        createTestSnapshots(startDate, endDate, 2160); // 90 days * 24 hours

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting monthly aggregated trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "monthly", testUser);

        // Then: Should have 3 monthly data points
        assertThat(response).isNotNull();
        assertThat(response.getDataPoints()).hasSizeBetween(3, 4); // May span partial months
    }

    @Test
    void testGetEnvironmentalTrends_StatisticalSummary() {
        // Given: Environmental data with known min, max, and average values
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        // Create snapshots with specific temperature values: 20, 22, 24, 26, 28
        testSnapshots.add(createSnapshot(startDate.plusHours(1), 20.0, 60.0));
        testSnapshots.add(createSnapshot(startDate.plusHours(2), 22.0, 60.0));
        testSnapshots.add(createSnapshot(startDate.plusHours(3), 24.0, 60.0));
        testSnapshots.add(createSnapshot(startDate.plusHours(4), 26.0, 60.0));
        testSnapshots.add(createSnapshot(startDate.plusHours(5), 28.0, 60.0));

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Statistical summary should be correct
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getTemperature()).isNotNull();
        assertThat(response.getSummary().getTemperature().getMin()).isEqualTo(20.0);
        assertThat(response.getSummary().getTemperature().getMax()).isEqualTo(28.0);
        assertThat(response.getSummary().getTemperature().getAverage()).isEqualTo(24.0);

        // Variance = sum((x - mean)^2) / n
        // = ((20-24)^2 + (22-24)^2 + (24-24)^2 + (26-24)^2 + (28-24)^2) / 5
        // = (16 + 4 + 0 + 4 + 16) / 5 = 40 / 5 = 8.0
        assertThat(response.getSummary().getTemperature().getVariance()).isEqualTo(8.0, within(0.01));

        // Standard deviation = sqrt(variance) = sqrt(8.0) = 2.83
        assertThat(response.getSummary().getTemperature().getStandardDeviation()).isEqualTo(2.83, within(0.01));
    }

    @Test
    void testGetEnvironmentalTrends_VPDCalculation() {
        // Given: Snapshots with known temperature and humidity
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now();

        // Temperature: 25°C, Humidity: 60%
        // Expected VPD ≈ 1.27 kPa
        testSnapshots.add(createSnapshot(startDate.plusHours(1), 25.0, 60.0));

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: VPD should be calculated correctly
        assertThat(response.getDataPoints()).isNotEmpty();
        EnvironmentalTrendsResponse.DataPoint dataPoint = response.getDataPoints().get(0);

        // VPD formula: SVP × (1 - RH/100)
        // where SVP = 0.6108 × exp(17.27 × T / (T + 237.3))
        // SVP at 25°C = 0.6108 × exp(17.27 × 25 / (25 + 237.3)) = 3.17 kPa
        // VPD = 3.17 × (1 - 60/100) = 3.17 × 0.4 = 1.27 kPa
        assertThat(dataPoint.getVpd()).isNotNull();
        assertThat(dataPoint.getVpd()).isEqualTo(1.27, within(0.1)); // Allow 0.1 kPa tolerance
    }

    @Test
    void testGetEnvironmentalTrends_VPDCalculation_EdgeCases() {
        // Given: Snapshots with null values
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now();

        // Create snapshot with null temperature (VPD should be null)
        EnvironmentalSnapshot snapshot1 = createSnapshot(startDate.plusHours(1), null, 60.0);
        testSnapshots.add(snapshot1);

        // Create snapshot with null humidity (VPD should be null)
        EnvironmentalSnapshot snapshot2 = createSnapshot(startDate.plusHours(2), 25.0, null);
        testSnapshots.add(snapshot2);

        // Create snapshot with both null (VPD should be null)
        EnvironmentalSnapshot snapshot3 = createSnapshot(startDate.plusHours(3), null, null);
        testSnapshots.add(snapshot3);

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should handle null values gracefully
        assertThat(response.getDataPoints()).isNotEmpty();

        // VPD should be null when temperature or humidity is missing
        // (Implementation should handle this gracefully)
    }

    @Test
    void testGetEnvironmentalTrends_MinMaxCalculation() {
        // Given: Daily data with varying temperatures
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now();

        // Create hourly snapshots for one day with varying temperatures
        for (int hour = 0; hour < 24; hour++) {
            double temp = 20.0 + (Math.sin(hour * Math.PI / 12) * 5); // Oscillates between 15-25°C
            testSnapshots.add(createSnapshot(startDate.plusHours(hour), temp, 60.0));
        }

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting daily aggregated trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should have correct min and max values
        assertThat(response.getDataPoints()).isNotEmpty();
        EnvironmentalTrendsResponse.DataPoint dataPoint = response.getDataPoints().get(0);

        assertThat(dataPoint.getTemperatureMin()).isNotNull();
        assertThat(dataPoint.getTemperatureMax()).isNotNull();
        assertThat(dataPoint.getTemperatureMin()).isLessThan(dataPoint.getTemperatureMax());
        assertThat(dataPoint.getTemperature()).isBetween(dataPoint.getTemperatureMin(), dataPoint.getTemperatureMax());
    }

    @Test
    void testGetEnvironmentalTrends_StageComparison() {
        // Given: Plants in different growth stages with different environmental data
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();

        // Create vegetative plant
        Plant vegPlant = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .tag("Veg-001")
                .stage(Plant.PlantStage.VEGETATIVE)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        // Create flowering plant
        Plant flowerPlant = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .tag("Flower-001")
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        // Create snapshots for both stages
        createTestSnapshots(startDate, endDate, 100);

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        when(plantRepository.findByGrowIdAndStage(testGrow.getId(), Plant.PlantStage.VEGETATIVE))
                .thenReturn(List.of(vegPlant));

        when(plantRepository.findByGrowIdAndStage(testGrow.getId(), Plant.PlantStage.FLOWERING))
                .thenReturn(List.of(flowerPlant));

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should have stage comparison data
        assertThat(response.getStageComparison()).isNotNull();
        assertThat(response.getStageComparison().getVegetative()).isNotNull();
        assertThat(response.getStageComparison().getFlowering()).isNotNull();

        // Verify stage averages are populated
        EnvironmentalTrendsResponse.StageAverages vegAverages = response.getStageComparison().getVegetative();
        assertThat(vegAverages.getAvgTemperature()).isNotNull();
        assertThat(vegAverages.getAvgHumidity()).isNotNull();
        assertThat(vegAverages.getAvgVpd()).isNotNull();

        EnvironmentalTrendsResponse.StageAverages flowerAverages = response.getStageComparison().getFlowering();
        assertThat(flowerAverages.getAvgTemperature()).isNotNull();
        assertThat(flowerAverages.getAvgHumidity()).isNotNull();
        assertThat(flowerAverages.getAvgVpd()).isNotNull();
    }

    @Test
    void testGetEnvironmentalTrends_StabilityScore() {
        // Given: Environmental data with varying stability
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        // Create very stable temperature data (low variance)
        for (int i = 0; i < 50; i++) {
            testSnapshots.add(createSnapshot(startDate.plusHours(i), 24.0, 60.0));
        }

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Stability score should be high (close to 100)
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getStabilityScore()).isNotNull();
        assertThat(response.getSummary().getStabilityScore()).isGreaterThan(90.0);
    }

    @Test
    void testGetEnvironmentalTrends_DaysOutOfRange() {
        // Given: Environmental data with some out-of-range values
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        // Create snapshots: 3 days in range, 4 days out of range
        // Optimal temp range: 20-26°C
        testSnapshots.add(createSnapshot(startDate.plusDays(1), 22.0, 60.0)); // In range
        testSnapshots.add(createSnapshot(startDate.plusDays(2), 24.0, 60.0)); // In range
        testSnapshots.add(createSnapshot(startDate.plusDays(3), 25.0, 60.0)); // In range
        testSnapshots.add(createSnapshot(startDate.plusDays(4), 30.0, 60.0)); // Out of range
        testSnapshots.add(createSnapshot(startDate.plusDays(5), 32.0, 60.0)); // Out of range
        testSnapshots.add(createSnapshot(startDate.plusDays(6), 18.0, 60.0)); // Out of range
        testSnapshots.add(createSnapshot(startDate.plusDays(7), 15.0, 60.0)); // Out of range

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should identify days out of optimal range
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getDaysOutOfRange()).isNotNull();
        assertThat(response.getSummary().getDaysOutOfRange()).isEqualTo(4);
    }

    @Test
    void testGetEnvironmentalTrends_OptimalRangeIndicators() {
        // When: Getting environmental trends
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        createTestSnapshots(startDate, endDate, 50);

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(testSnapshots);

        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should include optimal range information
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getTemperature().getOptimalRange()).isNotNull();
        assertThat(response.getSummary().getHumidity().getOptimalRange()).isNotNull();
        assertThat(response.getSummary().getVpd().getOptimalRange()).isNotNull();

        // Verify optimal ranges are industry-standard values
        EnvironmentalTrendsResponse.OptimalRange tempRange =
                response.getSummary().getTemperature().getOptimalRange();
        assertThat(tempRange.getMin()).isEqualTo(20.0);
        assertThat(tempRange.getMax()).isEqualTo(26.0);
        assertThat(tempRange.getUnit()).isEqualTo("°C");
    }

    @Test
    void testGetEnvironmentalTrends_EmptyData() {
        // Given: No environmental snapshots
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When: Getting environmental trends
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should return empty response gracefully
        assertThat(response).isNotNull();
        assertThat(response.getDataPoints()).isEmpty();
        assertThat(response.getSummary()).isNull();
    }

    @Test
    void testGetEnvironmentalTrends_TimeRangeFiltering() {
        // Given: Environmental data spanning 30 days
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();

        createTestSnapshots(startDate.minusDays(10), endDate.plusDays(10), 960); // More data outside range

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                eq(testGrow.getId()), eq(startDate), eq(endDate)))
                .thenReturn(testSnapshots.subList(240, 720)); // Only return data within range

        // When: Getting environmental trends for specific date range
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrow.getId(), startDate, endDate, "daily", testUser);

        // Then: Should only include data within the specified range
        assertThat(response.getDataPoints()).isNotEmpty();
        response.getDataPoints().forEach(dataPoint -> {
            assertThat(dataPoint.getTimestamp()).isAfterOrEqualTo(startDate);
            assertThat(dataPoint.getTimestamp()).isBeforeOrEqualTo(endDate);
        });
    }

    /**
     * Helper method to create test snapshots with varying environmental data.
     */
    private void createTestSnapshots(LocalDateTime startDate, LocalDateTime endDate, int count) {
        testSnapshots.clear();
        long hoursBetween = java.time.Duration.between(startDate, endDate).toHours();
        long hoursPerSnapshot = hoursBetween / count;

        for (int i = 0; i < count; i++) {
            LocalDateTime timestamp = startDate.plusHours(i * hoursPerSnapshot);
            double temperature = 22.0 + (Math.random() * 4); // 22-26°C
            double humidity = 55.0 + (Math.random() * 10); // 55-65%
            testSnapshots.add(createSnapshot(timestamp, temperature, humidity));
        }
    }

    /**
     * Helper method to create a single environmental snapshot.
     */
    private EnvironmentalSnapshot createSnapshot(LocalDateTime timestamp, Double temperature, Double humidity) {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .timestamp(timestamp)
                .source(EnvironmentalSnapshot.SnapshotSource.MANUAL)
                .build();

        if (temperature != null) {
            snapshot.setTemperature(BigDecimal.valueOf(temperature));
        }
        if (humidity != null) {
            snapshot.setHumidity(BigDecimal.valueOf(humidity));
        }

        // Auto-calculate VPD if both values present
        if (temperature != null && humidity != null) {
            snapshot.autoCalculateVpd();
        }

        return snapshot;
    }
}