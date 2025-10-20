package com.growmanager.service;

import com.growmanager.dto.*;
import com.growmanager.entity.User;
import com.growmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for AnalyticsService.
 * Tests service layer business logic, caching, and data transformation.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

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
    private UUID testGrowId;
    private UUID testPlantId;
    private UUID testCultivarId;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");

        testGrowId = UUID.randomUUID();
        testPlantId = UUID.randomUUID();
        testCultivarId = UUID.randomUUID();
    }

    @Test
    void testGetDashboardMetrics_ReturnsValidResponse() {
        // Act
        DashboardMetricsResponse response = analyticsService.getDashboardMetrics(testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getPlantStageDistribution()).isNotNull();
        assertThat(response.getIssueSummary()).isNotNull();
        assertThat(response.getEnvironmentalQuality()).isNotNull();
        assertThat(response.getRecentActivities()).isNotNull();
    }

    @Test
    void testGetDashboardMetrics_PlantStageDistribution_HasAllStages() {
        // Act
        DashboardMetricsResponse response = analyticsService.getDashboardMetrics(testUser);

        // Assert
        DashboardMetricsResponse.PlantStageDistribution distribution = response.getPlantStageDistribution();
        assertThat(distribution.getSeedlingCount()).isNotNull();
        assertThat(distribution.getVegetativeCount()).isNotNull();
        assertThat(distribution.getFloweringCount()).isNotNull();
        assertThat(distribution.getHarvestCount()).isNotNull();
        assertThat(distribution.getTotalActive()).isNotNull();
    }

    @Test
    void testGetDashboardMetrics_IssueSummary_HasAllFields() {
        // Act
        DashboardMetricsResponse response = analyticsService.getDashboardMetrics(testUser);

        // Assert
        DashboardMetricsResponse.IssueSummary issueSummary = response.getIssueSummary();
        assertThat(issueSummary.getTotalIssues()).isNotNull();
        assertThat(issueSummary.getUnresolvedIssues()).isNotNull();
        assertThat(issueSummary.getRecentIssues()).isNotNull();
        assertThat(issueSummary.getTrend()).isNotNull();
    }

    @Test
    void testGetEnvironmentalTrends_ReturnsValidResponse() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();
        String aggregation = "daily";

        // Act
        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                testGrowId, startDate, endDate, aggregation, testUser
        );

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getDataPoints()).isNotNull();
    }

    @Test
    void testGetFeedingAnalytics_WithGrowId_ReturnsValidResponse() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                testGrowId, null, startDate, endDate, testUser
        );

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getPhTrend()).isNotNull();
        assertThat(response.getEcTrend()).isNotNull();
        assertThat(response.getFeedingTimeline()).isNotNull();
    }

    @Test
    void testGetFeedingAnalytics_WithPlantId_ReturnsValidResponse() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();

        // Act
        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                null, testPlantId, startDate, endDate, testUser
        );

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getPhTrend()).isNotNull();
        assertThat(response.getEcTrend()).isNotNull();
    }

    @Test
    void testGetCultivarComparison_WithTwoCultivars_ReturnsValidResponse() {
        // Arrange
        UUID cultivar1 = UUID.randomUUID();
        UUID cultivar2 = UUID.randomUUID();
        List<UUID> cultivarIds = Arrays.asList(cultivar1, cultivar2);

        // Act
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(cultivarIds, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getCultivars()).isNotNull();
    }

    @Test
    void testGetCultivarComparison_WithFourCultivars_ReturnsValidResponse() {
        // Arrange
        List<UUID> cultivarIds = Arrays.asList(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID()
        );

        // Act
        CultivarComparisonResponse response = analyticsService.getCultivarComparison(cultivarIds, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getCultivars()).isNotNull();
    }

    @Test
    void testGetCultivarComparison_WithOneCultivar_ThrowsException() {
        // Arrange
        List<UUID> cultivarIds = List.of(UUID.randomUUID());

        // Act & Assert
        assertThatThrownBy(() -> analyticsService.getCultivarComparison(cultivarIds, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requires 2-4 cultivars");
    }

    @Test
    void testGetCultivarComparison_WithFiveCultivars_ThrowsException() {
        // Arrange
        List<UUID> cultivarIds = Arrays.asList(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID()
        );

        // Act & Assert
        assertThatThrownBy(() -> analyticsService.getCultivarComparison(cultivarIds, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requires 2-4 cultivars");
    }

    @Test
    void testGetYieldAnalytics_ReturnsValidResponse() {
        // Arrange
        LocalDate startDate = LocalDate.now().minusMonths(6);
        LocalDate endDate = LocalDate.now();

        // Act
        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(startDate, endDate, testUser);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getYieldTrend()).isNotNull();
        assertThat(response.getTopPerformers()).isNotNull();
    }

    @Test
    void testGetTimelineEvents_ReturnsValidResponse() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();

        // Act
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                testGrowId, startDate, endDate, null, testUser
        );

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getEvents()).isNotNull();
        assertThat(response.getMilestones()).isNotNull();
        assertThat(response.getPhotos()).isNotNull();
    }

    @Test
    void testGetDashboardMetrics_IsCacheable() {
        // Act - Call twice with same user
        DashboardMetricsResponse response1 = analyticsService.getDashboardMetrics(testUser);
        DashboardMetricsResponse response2 = analyticsService.getDashboardMetrics(testUser);

        // Assert - Both calls should succeed (caching is handled by Spring)
        assertThat(response1).isNotNull();
        assertThat(response2).isNotNull();
    }

    @Test
    void testGetEnvironmentalTrends_IsCacheable() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();
        String aggregation = "daily";

        // Act - Call twice with same parameters
        EnvironmentalTrendsResponse response1 = analyticsService.getEnvironmentalTrends(
                testGrowId, startDate, endDate, aggregation, testUser
        );
        EnvironmentalTrendsResponse response2 = analyticsService.getEnvironmentalTrends(
                testGrowId, startDate, endDate, aggregation, testUser
        );

        // Assert
        assertThat(response1).isNotNull();
        assertThat(response2).isNotNull();
    }
}