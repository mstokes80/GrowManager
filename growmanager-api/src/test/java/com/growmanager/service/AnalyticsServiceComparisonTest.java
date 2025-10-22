package com.growmanager.service;

import com.growmanager.dto.CultivarComparisonResponse;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AnalyticsService cultivar comparison functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService - Cultivar Comparison Tests")
class AnalyticsServiceComparisonTest {

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
    private Cultivar cultivar1;
    private Cultivar cultivar2;
    private Cultivar cultivar3;
    private Grow grow1;
    private Grow grow2;
    private Plant plant1;
    private Plant plant2;
    private Plant plant3;
    private Harvest harvest1;
    private Harvest harvest2;
    private Harvest harvest3;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        cultivar1 = Cultivar.builder()
                .id(UUID.randomUUID())
                .name("Blue Dream")
                .type(Cultivar.CultivarType.HYBRID)
                .user(testUser)
                .build();

        cultivar2 = Cultivar.builder()
                .id(UUID.randomUUID())
                .name("OG Kush")
                .type(Cultivar.CultivarType.INDICA)
                .user(testUser)
                .build();

        cultivar3 = Cultivar.builder()
                .id(UUID.randomUUID())
                .name("Sour Diesel")
                .type(Cultivar.CultivarType.SATIVA)
                .user(testUser)
                .build();

        grow1 = Grow.builder()
                .id(UUID.randomUUID())
                .name("Grow 1")
                .user(testUser)
                .startDate(LocalDate.of(2024, 1, 1))
                .build();

        grow2 = Grow.builder()
                .id(UUID.randomUUID())
                .name("Grow 2")
                .user(testUser)
                .startDate(LocalDate.of(2024, 3, 1))
                .build();

        plant1 = Plant.builder()
                .id(UUID.randomUUID())
                .grow(grow1)
                .cultivar(cultivar1)
                .tag("Plant-001")
                .plantedDate(LocalDate.of(2024, 1, 5))
                .stage(Plant.PlantStage.HARVEST)
                .status(Plant.PlantStatus.HARVESTED)
                .build();

        plant2 = Plant.builder()
                .id(UUID.randomUUID())
                .grow(grow1)
                .cultivar(cultivar2)
                .tag("Plant-002")
                .plantedDate(LocalDate.of(2024, 1, 5))
                .stage(Plant.PlantStage.HARVEST)
                .status(Plant.PlantStatus.HARVESTED)
                .build();

        plant3 = Plant.builder()
                .id(UUID.randomUUID())
                .grow(grow2)
                .cultivar(cultivar3)
                .tag("Plant-003")
                .plantedDate(LocalDate.of(2024, 3, 5))
                .stage(Plant.PlantStage.HARVEST)
                .status(Plant.PlantStatus.HARVESTED)
                .build();

        harvest1 = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(plant1)
                .grow(grow1)
                .harvestDate(LocalDate.of(2024, 4, 15))
                .wetWeight(BigDecimal.valueOf(500.0))
                .dryWeight(BigDecimal.valueOf(100.0))
                .thcPercent(BigDecimal.valueOf(22.5))
                .qualityRating(9)
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();

        harvest2 = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(plant2)
                .grow(grow1)
                .harvestDate(LocalDate.of(2024, 4, 20))
                .wetWeight(BigDecimal.valueOf(450.0))
                .dryWeight(BigDecimal.valueOf(90.0))
                .thcPercent(BigDecimal.valueOf(24.0))
                .qualityRating(8)
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();

        harvest3 = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(plant3)
                .grow(grow2)
                .harvestDate(LocalDate.of(2024, 6, 10))
                .wetWeight(BigDecimal.valueOf(550.0))
                .dryWeight(BigDecimal.valueOf(110.0))
                .thcPercent(BigDecimal.valueOf(20.0))
                .qualityRating(10)
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
    }

    @Test
    @DisplayName("Should throw exception when less than 2 cultivars provided")
    void shouldThrowExceptionWhenLessThanTwoCultivars() {
        // Given
        List<UUID> cultivarIds = List.of(cultivar1.getId());

        // When & Then
        assertThatThrownBy(() -> analyticsService.getCultivarComparison(cultivarIds, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requires 2-4 cultivars");
    }

    @Test
    @DisplayName("Should throw exception when more than 4 cultivars provided")
    void shouldThrowExceptionWhenMoreThanFourCultivars() {
        // Given
        List<UUID> cultivarIds = Arrays.asList(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID()
        );

        // When & Then
        assertThatThrownBy(() -> analyticsService.getCultivarComparison(cultivarIds, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requires 2-4 cultivars");
    }

    @Test
    @DisplayName("Should compare 2 cultivars successfully")
    void shouldCompareTwoCultivarsSuccessfully() {
        // Given
        List<UUID> cultivarIds = Arrays.asList(cultivar1.getId(), cultivar2.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(cultivarRepository.findById(cultivar2.getId())).thenReturn(Optional.of(cultivar2));

        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(plantRepository.findByCultivarId(cultivar2.getId())).thenReturn(List.of(plant2));

        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));
        when(harvestRepository.findByPlantId(plant2.getId())).thenReturn(List.of(harvest2));

        when(activityLogRepository.findByPlantId(plant1.getId())).thenReturn(List.of());
        when(activityLogRepository.findByPlantId(plant2.getId())).thenReturn(List.of());

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(cultivarIds, testUser);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getCultivars()).hasSize(2);
        assertThat(response.getCultivars().get(0).getCultivarName()).isEqualTo("Blue Dream");
        assertThat(response.getCultivars().get(1).getCultivarName()).isEqualTo("OG Kush");
    }

    @Test
    @DisplayName("Should calculate performance metrics correctly")
    void shouldCalculatePerformanceMetricsCorrectly() {
        // Given
        List<UUID> cultivarIds = List.of(cultivar1.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));
        when(activityLogRepository.findByPlantId(plant1.getId())).thenReturn(List.of());
        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                Arrays.asList(cultivar1.getId(), cultivar2.getId()), testUser);

        // Then
        assertThat(response.getCultivars()).isNotEmpty();
        CultivarComparisonResponse.CultivarMetrics metrics = response.getCultivars().get(0);
        assertThat(metrics.getPerformance()).isNotNull();
        assertThat(metrics.getPerformance().getAvgYieldPerPlant()).isNotNull();
        assertThat(metrics.getPerformance().getSuccessRate()).isNotNull();
    }

    @Test
    @DisplayName("Should identify best performers across metrics")
    void shouldIdentifyBestPerformers() {
        // Given
        List<UUID> cultivarIds = Arrays.asList(cultivar1.getId(), cultivar2.getId(), cultivar3.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(cultivarRepository.findById(cultivar2.getId())).thenReturn(Optional.of(cultivar2));
        when(cultivarRepository.findById(cultivar3.getId())).thenReturn(Optional.of(cultivar3));

        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(plantRepository.findByCultivarId(cultivar2.getId())).thenReturn(List.of(plant2));
        when(plantRepository.findByCultivarId(cultivar3.getId())).thenReturn(List.of(plant3));

        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));
        when(harvestRepository.findByPlantId(plant2.getId())).thenReturn(List.of(harvest2));
        when(harvestRepository.findByPlantId(plant3.getId())).thenReturn(List.of(harvest3));

        when(activityLogRepository.findByPlantId(any(UUID.class))).thenReturn(List.of());
        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(cultivarIds, testUser);

        // Then
        assertThat(response.getBestPerformers()).isNotNull();
        assertThat(response.getBestPerformers().getHighestYield()).isNotNull();
        assertThat(response.getBestPerformers().getHighestQuality()).isNotNull();
        assertThat(response.getBestPerformers().getEasiestToGrow()).isNotNull();
        assertThat(response.getBestPerformers().getFastestGrowth()).isNotNull();
    }

    @Test
    @DisplayName("Should calculate environmental preferences for cultivars")
    void shouldCalculateEnvironmentalPreferences() {
        // Given
        List<UUID> cultivarIds = List.of(cultivar1.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));
        when(activityLogRepository.findByPlantId(plant1.getId())).thenReturn(List.of());

        // Create environmental snapshots
        EnvironmentalSnapshot snapshot1 = EnvironmentalSnapshot.builder()
                .id(UUID.randomUUID())
                .grow(grow1)
                .timestamp(LocalDateTime.of(2024, 1, 10, 12, 0))
                .temperature(BigDecimal.valueOf(24.0))
                .humidity(BigDecimal.valueOf(55.0))
                .vpd(BigDecimal.valueOf(1.2))
                .co2(BigDecimal.valueOf(1200.0))
                .lightIntensity(BigDecimal.valueOf(600))
                .build();

        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(snapshot1));

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                Arrays.asList(cultivar1.getId(), cultivar2.getId()), testUser);

        // Then
        assertThat(response.getCultivars()).isNotEmpty();
        CultivarComparisonResponse.CultivarMetrics metrics = response.getCultivars().get(0);
        assertThat(metrics.getEnvironmentalPreferences()).isNotNull();
    }

    @Test
    @DisplayName("Should handle cultivars with no harvest data")
    void shouldHandleCultivarsWithNoHarvestData() {
        // Given
        List<UUID> cultivarIds = List.of(cultivar1.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of()); // No harvests
        when(activityLogRepository.findByPlantId(plant1.getId())).thenReturn(List.of());
        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                Arrays.asList(cultivar1.getId(), cultivar2.getId()), testUser);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getCultivars()).isNotEmpty();
    }

    @Test
    @DisplayName("Should calculate ease of growth score based on issues")
    void shouldCalculateEaseOfGrowthScore() {
        // Given
        List<UUID> cultivarIds = List.of(cultivar1.getId());

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(plantRepository.findByCultivarId(cultivar1.getId())).thenReturn(List.of(plant1));
        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));

        // Create activity logs with some pest control activities (issues)
        ActivityLog pestControl = ActivityLog.builder()
                .id(UUID.randomUUID())
                .plant(plant1)
                .user(testUser)
                .activityType(ActivityLog.ActivityType.PEST_CONTROL)
                .loggedAt(LocalDateTime.of(2024, 2, 1, 10, 0))
                .notes("Spider mites treatment")
                .build();

        when(activityLogRepository.findByPlantId(plant1.getId())).thenReturn(List.of(pestControl));
        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                Arrays.asList(cultivar1.getId(), cultivar2.getId()), testUser);

        // Then
        assertThat(response.getCultivars()).isNotEmpty();
        CultivarComparisonResponse.CultivarMetrics metrics = response.getCultivars().get(0);
        assertThat(metrics.getPerformance().getEaseOfGrowthScore()).isNotNull();
        assertThat(metrics.getPerformance().getEaseOfGrowthScore()).isLessThan(100.0); // Should be reduced due to pest control
    }

    @Test
    @DisplayName("Should compare same cultivar over multiple grows")
    void shouldCompareSameCultivarOverMultipleGrows() {
        // Given
        Plant plant1SecondGrow = Plant.builder()
                .id(UUID.randomUUID())
                .grow(grow2)
                .cultivar(cultivar1) // Same cultivar as plant1
                .tag("Plant-004")
                .plantedDate(LocalDate.of(2024, 3, 5))
                .stage(Plant.PlantStage.HARVEST)
                .status(Plant.PlantStatus.HARVESTED)
                .build();

        Harvest harvest1SecondGrow = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(plant1SecondGrow)
                .grow(grow2)
                .harvestDate(LocalDate.of(2024, 6, 10))
                .wetWeight(BigDecimal.valueOf(600.0))
                .dryWeight(BigDecimal.valueOf(120.0))
                .thcPercent(BigDecimal.valueOf(23.0))
                .qualityRating(9)
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();

        when(cultivarRepository.findById(cultivar1.getId())).thenReturn(Optional.of(cultivar1));
        when(plantRepository.findByCultivarId(cultivar1.getId()))
                .thenReturn(Arrays.asList(plant1, plant1SecondGrow));
        when(harvestRepository.findByPlantId(plant1.getId())).thenReturn(List.of(harvest1));
        when(harvestRepository.findByPlantId(plant1SecondGrow.getId())).thenReturn(List.of(harvest1SecondGrow));
        when(activityLogRepository.findByPlantId(any(UUID.class))).thenReturn(List.of());
        when(environmentalSnapshotRepository.findByGrowIdAndTimestampBetween(
                any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                Arrays.asList(cultivar1.getId(), cultivar2.getId()), testUser);

        // Then
        assertThat(response.getCultivars()).isNotEmpty();
        CultivarComparisonResponse.CultivarMetrics metrics = response.getCultivars().get(0);
        assertThat(metrics.getTotalGrows()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.getTotalPlants()).isEqualTo(2);
        // Average yield should reflect both harvests
        assertThat(metrics.getPerformance().getAvgYieldPerPlant())
                .isEqualTo((100.0 + 120.0) / 2.0);
    }
}